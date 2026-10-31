import { useCallback, useEffect, useState } from "react";
import { UserCheck } from "lucide-react";
import { usersApi, FriendsResponse, FriendItem, PresenceUpdate } from "../api/users";
import { useOnReconnect, useSocketEvent } from "../context/RealtimeContext";
import { Alert, Card, EmptyState, Loading, PageHeader, Tabs } from "../components";
import { PersonLink } from "./workspace/PersonLink";
import { AppLayout } from "./AppLayout";
import { FriendButton } from "./workspace/FriendButton";

type Tab = "friends" | "incoming" | "outgoing";

const EMPTY: Record<Tab, { title: string; description: string }> = {
  friends: { title: "No friends yet", description: "Find colleagues in the Members directory and send a request." },
  incoming: { title: "No incoming requests", description: "Requests from colleagues show up here." },
  outgoing: { title: "No outgoing requests", description: "Requests you've sent and that are still waiting show up here." },
};

// /friends: friends, incoming and outgoing requests.
export function FriendsPage() {
  const [tab, setTab] = useState<Tab>("friends");
  const [data, setData] = useState<FriendsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData(await usersApi.getFriends());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // presence is live; a new or answered request (notification) reloads the lists.
  useSocketEvent<PresenceUpdate>("presence:update", (p) => {
    setData((d) =>
      d && {
        ...d,
        friends: d.friends.map((f) => (f.user.id === p.userId ? { ...f, presence: { status: p.status, lastSeenAt: p.lastSeenAt } } : f)),
      }
    );
  });
  useSocketEvent("notification:new", load);
  // Requests sent, accepted, declined, cancelled or removed by either side.
  useSocketEvent("friendship:updated", load);
  useOnReconnect(load);

  const items: FriendItem[] = data ? data[tab] : [];
  const tabs = [
    { id: "friends", label: "Friends", count: data?.friends.length },
    { id: "incoming", label: "Incoming", count: data?.incoming.length },
    { id: "outgoing", label: "Outgoing", count: data?.outgoing.length },
  ];

  return (
    <AppLayout>
      <PageHeader title="Friends" subtitle="Colleagues from your organization." />

      <Tabs tabs={tabs} activeTab={tab} onChange={(id) => setTab(id as Tab)} />

      {error && <Alert variant="error">{error}</Alert>}
      {loading && <Loading label="Loading friends" className="py-12" />}

      {!loading && data && items.length === 0 && <EmptyState icon={<UserCheck className="w-6 h-6" />} {...EMPTY[tab]} />}

      {!loading && items.length > 0 && (
        <Card padding="none">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {items.map((f) => {
              const name = `${f.user.firstName} ${f.user.lastName}`;
              const state = tab === "friends" ? "FRIENDS" : tab === "incoming" ? "INCOMING" : "OUTGOING";
              return (
                <li key={f.friendshipId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-dark-elevated transition-colors">
                  <PersonLink id={f.user.id} name={name} avatarPath={f.user.avatarPath} status={f.presence?.status} subtitle={f.user.jobTitle || "No job title"} />
                  <FriendButton userId={f.user.id} name={name} state={state} friendshipId={f.friendshipId} onChanged={load} />
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </AppLayout>
  );
}
