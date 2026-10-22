import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppNotification, notificationsApi } from "../api/notifications";
import { useAuth } from "./AuthContext";
import { useApp } from "./AppContext";
import { useOnReconnect, useSocketEvent } from "./RealtimeContext";
import { useToast } from "../components";
import { GONE_MESSAGE } from "../pages/notifications/notificationText";

// Unread count and the latest 10 for the bell, kept live over Socket.IO. 
// The server pushes `notification:new` for a new row and `notification:sync` when read state changes in another tab.

const BELL_SIZE = 10;

interface NotificationsContextType {
  unreadCount: number;
  latest: AppNotification[];
  // Bumps whenever the inbox changed, so an open /notifications page can refetch.
  version: number;
  refresh: () => Promise<void>;
  // Marks read, then opens the resource or says it's gone.
  open: (n: AppNotification) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { navigate } = useApp();
  const toast = useToast();
  const userId = user?.id;
  const [unreadCount, setUnreadCount] = useState(0);
  const [latest, setLatest] = useState<AppNotification[]>([]);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const page = await notificationsApi.list({ pageSize: BELL_SIZE });
      setLatest(page.notifications);
      setUnreadCount(page.unreadCount);
      setVersion((v) => v + 1);
    } catch {
      // Offline or signed out; the next event or focus retries.
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLatest([]);
      setUnreadCount(0);
      return;
    }
    refresh();
  }, [userId, refresh]);

  // The server pushes to this user's room (shared socket, RealtimeContext).
  useSocketEvent("notification:new", refresh);
  useSocketEvent("notification:sync", refresh);
  useOnReconnect(refresh);

  const open = useCallback(
    async (n: AppNotification) => {
      try {
        const target = await notificationsApi.markRead(n.id);
        setUnreadCount(target.unreadCount);
        setLatest((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        if (target.gone) toast.error("Can't open this notification", GONE_MESSAGE);
        else if (target.path) navigate(target.path);
      } catch (err) {
        toast.error("Couldn't open the notification", (err as Error).message);
      }
    },
    [toast, navigate]
  );

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      setUnreadCount(0);
      setLatest((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch (err) {
      toast.error("Couldn't mark notifications read", (err as Error).message);
    }
  }, [toast]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, latest, version, refresh, open, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationsProvider");
  return context;
}
