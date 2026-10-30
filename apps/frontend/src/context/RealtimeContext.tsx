import { ReactNode, createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { notifySessionExpired } from "../api/http";
import { Spinner } from "../components";

type Status = "idle" | "connected" | "reconnecting";

interface RealtimeContextType {
  socket: Socket | null;
  status: Status;
  // Counts successful connections; It’s used by useOnReconnect.
  connections: number;
}

const RealtimeContext = createContext<RealtimeContextType>({ socket: null, status: "idle", connections: 0 });

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const userId = user?.id;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [connections, setConnections] = useState(0);
  const refreshRef = useRef(refreshUser);
  refreshRef.current = refreshUser;

  useEffect(() => {
    if (!userId) return;
    const s = io({ path: "/socket.io", withCredentials: true });
    let wasConnected = false;
    s.on("connect", () => {
      wasConnected = true;
      setStatus("connected");
      setConnections((n) => n + 1);
    });
    s.on("disconnect", (reason) => {
      // The server closing it means the session ended; that's not a network problem.
      if (reason === "io server disconnect" || reason === "io client disconnect") setStatus("idle");
      else if (wasConnected) setStatus("reconnecting");
    });
    s.on("connect_error", () => {
      // Socket.IO has given up and stops retrying and the API's 401 signs the user out.
      if (!s.active) setStatus("idle");
      else if (wasConnected) setStatus("reconnecting");
    });
    s.on("session:revoked", () => notifySessionExpired());
    // Role, organization or project access changed (ex: admin suspended you, or you changed your pswd on another device).
    const reloadMe = () => refreshRef.current();
    s.on("me:updated", reloadMe);
    s.on("org:updated", reloadMe);
    s.on("org:deleted", reloadMe);
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
      setStatus("idle");
    };
  }, [userId]);

  return (
    <RealtimeContext.Provider value={{ socket, status, connections }}>
      {children}
      {status === "reconnecting" && (
        <div
          role="status"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-3.5 py-2 text-xs font-medium border shadow-lg bg-white dark:bg-dark-card border-warning-500/40 text-warning-700 dark:text-warning-300"
        >
          <Spinner size="sm" label="Reconnecting" />
          Reconnecting… Changes from others will appear once the connection is back.
        </div>
      )}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

// Subscribes to server events for as long as the component is mounted.
// The handler can change between renders without resubscribing.
export function useSocketEvents<T = unknown>(events: string[], handler: (payload: T, event: string) => void) {
  const { socket } = useRealtime();
  const ref = useRef(handler);
  ref.current = handler;
  const key = events.join("|");
  useEffect(() => {
    if (!socket) return;
    const subs = key.split("|").map((event) => {
      const fn = (payload: T) => ref.current(payload, event);
      socket.on(event, fn);
      return [event, fn] as const;
    });
    return () => {
      for (const [event, fn] of subs) socket.off(event, fn);
    };
  }, [socket, key]);
}

export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  useSocketEvents<T>([event], handler);
}

// after a reconnect (not the first connect), stale data must be refetched.
export function useOnReconnect(callback: () => void) {
  const { connections } = useRealtime();
  const seen = useRef(connections);
  const ref = useRef(callback);
  ref.current = callback;
  useEffect(() => {
    if (connections > seen.current && seen.current > 0) ref.current();
    seen.current = connections;
  }, [connections]);
}
