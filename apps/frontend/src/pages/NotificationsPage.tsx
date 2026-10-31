import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { notificationsApi, NotificationPage } from "../api/notifications";
import { Alert, Button, Card, EmptyState, IconButton, Loading, PageHeader, Pager, Tabs, useToast } from "../components";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { describeNotification } from "./notifications/notificationText";
import { timeAgo } from "../lib/format";

const PAGE_SIZE = 20;
type Filter = "all" | "unread";

// /notifications: All / Unread, 20 per page, mark read, mark all read, delete (soft).
// Rendered inside the workspace shell, or the admin shell for a System Admin.
export function NotificationsInbox() {
  const { user } = useAuth();
  const toast = useToast();
  const { unreadCount, version, open, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NotificationPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const next = await notificationsApi.list({ filter, page, pageSize: PAGE_SIZE });
      // A delete can empty the last page: step back.
      if (next.notifications.length === 0 && page > 1) {
        setPage(page - 1);
        return;
      }
      setData(next);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  // Refetch on filter/page change and whenever the inbox changes (new notification, another tab).
  useEffect(() => {
    load();
  }, [load, version]);

  const act = async (action: Promise<unknown>, failure: string) => {
    try {
      await action;
      load();
    } catch (err) {
      toast.error(failure, (err as Error).message);
    }
  };

  const items = data?.notifications ?? [];

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Changes to your account, organization, projects and tasks."
        actions={
          <Button variant="outline" size="sm" leftIcon={<Check className="w-3.5 h-3.5" />} disabled={!unreadCount} onClick={markAllRead}>
            Mark all read
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: "all", label: "All" },
          { id: "unread", label: "Unread", count: unreadCount },
        ]}
        activeTab={filter}
        onChange={(id) => {
          setFilter(id as Filter);
          setPage(1);
        }}
      />

      {error && <Alert variant="error">{error}</Alert>}
      {loading && <Loading label="Loading notifications" className="py-12" />}

      {!loading && data && items.length === 0 && (
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
          description={filter === "unread" ? "You're all caught up." : "When something changes in your work, it shows up here."}
        />
      )}

      {!loading && items.length > 0 && (
        <Card padding="none">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {items.map((n) => {
              const { text, detail } = describeNotification(n, user?.id);
              return (
                <li key={n.id} className="flex items-start gap-3 p-4 sm:px-5 hover:bg-zinc-50 dark:hover:bg-dark-elevated transition-colors">
                  <span aria-label={n.read ? undefined : "Unread"} className={`mt-2 w-1.5 h-1.5 shrink-0 ${n.read ? "bg-transparent" : "bg-brand-600"}`} />
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className="flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <span className={`block text-sm ${n.read ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-950 dark:text-white font-medium"}`}>{text}</span>
                    {detail && <span className="block text-sm text-zinc-500 dark:text-zinc-400 truncate">{detail}</span>}
                    <span className="block text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{timeAgo(n.createdAt)}</span>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && <IconButton label="Mark read" icon={<Check className="w-4 h-4" />} onClick={() => act(notificationsApi.markRead(n.id), "Couldn't mark it read")} />}
                    <IconButton label="Delete" tone="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => act(notificationsApi.remove(n.id), "Couldn't delete the notification")} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {data && <Pager page={page} total={data.total} pageSize={data.pageSize} noun="notifications" onPage={setPage} />}
    </>
  );
}