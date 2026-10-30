import { useCallback, useEffect, useState } from "react";
import { LogOut, Search, UserMinus, Users } from "lucide-react";
import { authApi } from "../api/auth";
import { usersApi, DirectoryMember, DirectoryResponse, PresenceUpdate } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { Alert, Button, Card, ConfirmDialog, EmptyState, Input, Loading, PageHeader, Pager, Select, Tabs, UserRoleBadge, useToast } from "../components";
import { InvitationsPanel } from "./workspace/InvitationsPanel";
import { PersonLink } from "./workspace/PersonLink";
import { useDebounced } from "../lib/hooks";
import { AppLayout } from "./AppLayout";
import { useApp } from "../context/AppContext";
import { useOnReconnect, useSocketEvent } from "../context/RealtimeContext";
import { FriendButton } from "./workspace/FriendButton";
import { ConsequenceList } from "./admin/adminUi";
import { plural } from "../lib/format";

const PAGE_SIZE = 20;

// /org/members: member directory for every role.
// /org/invitations: the same page on its Invitations tab (Org Admins only).
export function MembersPage({ tab = "members" }: { tab?: "members" | "invitations" }) {
  const toast = useToast();
  const { navigate } = useApp();
  const { user, organization, role, refreshUser } = useAuth();
  const isOA = role === "OA";
  const showInvitations = isOA && tab === "invitations";
  // A pending role change to Viewer or a removal waits for confirmation, with the task count.
  const [pending, setPending] = useState<{ kind: "viewer" | "remove"; member: DirectoryMember; assignedTasks: number } | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query.trim(), 250);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<DirectoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => setPage(1), [debounced]);

  const load = useCallback(async () => {
    try {
      setData(await usersApi.listMembers({ q: debounced, page, pageSize: PAGE_SIZE }));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [debounced, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Joins, role changes and removals show up live.
  useSocketEvent("member:updated", load);
  // Friend buttons follow requests and answers made elsewhere.
  useSocketEvent("friendship:updated", load);
  // Friends' online dots are live.
  useSocketEvent<PresenceUpdate>("presence:update", (u) =>
    setData((d) =>
      d && {
        ...d,
        members: d.members.map((m) => (m.userId === u.userId && m.presence ? { ...m, presence: { status: u.status, lastSeenAt: u.lastSeenAt } } : m)),
      }
    )
  );
  useOnReconnect(load);

  const askFirst = async (kind: "viewer" | "remove", member: DirectoryMember) => {
    if (!organization) return;
    try {
      const { assignedTasks } = await authApi.getMemberImpact(organization.id, member.userId);
      setPending({ kind, member, assignedTasks });
    } catch (err) {
      toast.error("Couldn't check this member", (err as Error).message);
    }
  };

  // Runs an organization change, toasts the result and reloads; a failure keeps the dialog open.
  const act = async (call: (orgId: string) => Promise<unknown>, success: [string, string], failure: string, after = load) => {
    if (!organization) return;
    try {
      await call(organization.id);
      toast.success(...success);
      await after();
    } catch (err) {
      toast.error(failure, (err as Error).message);
      throw err;
    }
  };

  const changeRole = (m: DirectoryMember, next: "MEMBER" | "VIEWER") =>
    act(
      (orgId) => authApi.changeMemberRole(orgId, m.userId, next),
      ["Role updated", `${m.firstName} ${m.lastName} is now a ${next === "VIEWER" ? "Viewer" : "Member"}.`],
      "Couldn't change the role"
    );

  const removeMember = (m: DirectoryMember) =>
    act((orgId) => authApi.removeMember(orgId, m.userId), ["Member removed", `${m.firstName} ${m.lastName} was removed and notified by email.`], "Couldn't remove this member");

  const leave = () =>
    act((orgId) => authApi.leaveOrg(orgId), ["You left the organization", organization?.name ?? ""], "Couldn't leave", async () => {
      await refreshUser();
      navigate("/onboarding");
    });

  const lastOA = isOA && (data?.orgAdminCount ?? 2) <= 1;

  return (
    <AppLayout>
      <div>
        <PageHeader
          title="Members"
          subtitle={
            showInvitations
              ? `People invited to ${organization?.name}. Links work once and expire after 7 days; resending sends a new link.`
              : `People in ${organization?.name}.`
          }
        />
        {isOA && (
          <Tabs
            className="mt-4"
            activeTab={showInvitations ? "invitations" : "members"}
            onChange={(id) => navigate(id === "invitations" ? "/org/invitations" : "/org/members")}
            tabs={[
              { id: "members", label: "Members" },
              { id: "invitations", label: "Invitations" },
            ]}
          />
        )}
        {!showInvitations && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" leftIcon={<LogOut className="w-3.5 h-3.5" />} disabled={lastOA} onClick={() => setLeaveOpen(true)}>
              Leave organization
            </Button>
            {lastOA && <span className="text-xs text-zinc-500 dark:text-zinc-400">You're the last Org Admin. Appoint another one before leaving.</span>}
          </div>
        )}
      </div>

      {showInvitations && organization && <InvitationsPanel orgId={organization.id} orgName={organization.name} canInviteOrgAdmin={false} />}

      {!showInvitations && (
        <>
          <div className="max-w-md">
            <Input
              aria-label="Search members"
              placeholder="Search by name or job title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {loading && <Loading label="Loading members" className="py-12" />}

          {!loading && data && data.members.length === 0 && (
            <EmptyState icon={<Users className="w-6 h-6" />} title="No members found" description={debounced ? "Try a different name or job title." : "This organization has no members yet."} />
          )}

          {!loading && data && data.members.length > 0 && (
            <Card padding="none">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {data.members.map((m) => {
                  const name = `${m.firstName} ${m.lastName}`;
                  const isMe = m.userId === user?.id;
                  return (
                    <li key={m.userId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-dark-elevated transition-colors">
                      <PersonLink id={m.userId} name={name} avatarPath={m.avatarPath} status={m.presence?.status} subtitle={m.jobTitle || "No job title"} you={isMe} />
                      <div className="flex items-center gap-4">
                        {isOA && !isMe && m.role !== "OA" ? (
                          <div className="w-32">
                            <Select
                              value={m.role}
                              onChange={(v) => (v === "VIEWER" ? askFirst("viewer", m) : changeRole(m, "MEMBER"))}
                              options={[
                                { value: "MEMBER", label: "Member" },
                                { value: "VIEWER", label: "Viewer" },
                              ]}
                            />
                          </div>
                        ) : (
                          <UserRoleBadge role={m.role} />
                        )}
                        {isOA && !isMe && m.role !== "OA" && (
                          <Button variant="ghost" size="sm" leftIcon={<UserMinus className="w-3.5 h-3.5" />} onClick={() => askFirst("remove", m)}>
                            Remove
                          </Button>
                        )}
                        {!isMe && <FriendButton userId={m.userId} name={name} state={m.friendship.state} friendshipId={m.friendship.id} onChanged={load} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {data && <Pager page={page} total={data.total} pageSize={data.pageSize} noun="members" onPage={setPage} />}
        </>
      )}

      <ConfirmDialog
        isOpen={pending?.kind === "viewer"}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (pending) await changeRole(pending.member, "VIEWER");
          setPending(null);
        }}
        variant="warning"
        title="Make this person a Viewer?"
        description={pending ? `${pending.member.firstName} ${pending.member.lastName} will only be able to read the projects they have access to.` : ""}
        confirmLabel="Make Viewer"
      >
        {pending && (
          <ConsequenceList
            items={[
              { kind: "change", text: pending.assignedTasks > 0 ? `${plural(pending.assignedTasks, "assigned task")} become unassigned` : "They have no assigned tasks to unassign" },
              { kind: "notify", text: "They get an email about the change" },
            ]}
          />
        )}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={pending?.kind === "remove"}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (pending) await removeMember(pending.member);
          setPending(null);
        }}
        variant="danger"
        title="Remove this member?"
        description={pending ? `${pending.member.firstName} ${pending.member.lastName} will lose access to ${organization?.name}.` : ""}
        confirmLabel="Remove member"
      >
        {pending && (
          <ConsequenceList
            items={[
              { kind: "change", text: "Their project access is revoked and their friendships in this organization end" },
              { kind: "change", text: pending.assignedTasks > 0 ? `${plural(pending.assignedTasks, "assigned task")} become unassigned` : "They have no assigned tasks to unassign" },
              { kind: "notify", text: "They get an email saying they were removed" },
              { kind: "keep", text: "The tasks and comments they created, and their account" },
            ]}
          />
        )}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={async () => {
          await leave();
          setLeaveOpen(false);
        }}
        variant="danger"
        title="Leave this organization?"
        description={`You'll lose access to ${organization?.name}. You can join another organization or create a new one afterwards.`}
        confirmLabel="Leave organization"
      >
        <ConsequenceList
          items={[
            { kind: "change", text: "Your project access is revoked, your assigned tasks become unassigned and your friendships here end" },
            { kind: "keep", text: "The tasks and comments you created, and your account" },
          ]}
        />
      </ConfirmDialog>
    </AppLayout>
  );
}