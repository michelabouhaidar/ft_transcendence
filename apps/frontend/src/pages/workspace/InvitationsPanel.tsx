import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, RotateCw, Trash2, UserPlus } from "lucide-react";
import { authApi, InvitationState, OrgInvitation } from "../../api/auth";
import { Button, ConfirmDialog, EmptyState, IconButton, LoadError, Loading, Spinner, Tabs, useToast } from "../../components";
import { formatDate } from "../../lib/format";
import { InviteDialog } from "./InviteDialog";
import { useOnReconnect, useSocketEvents } from "../../context/RealtimeContext";

interface InvitationsPanelProps {
  orgId: string;
  orgName: string;
  /** Only a System Admin may invite an Org Admin (INV-01). */
  canInviteOrgAdmin: boolean;
  /** Called after any change (invite, resend, revoke), e.g. to refresh counts. */
  onChange?: () => void;
}

const STATUS_ORDER: InvitationState[] = ["PENDING", "EXPIRED", "ACCEPTED", "DECLINED", "REVOKED"];
const STATUS_LABELS: Record<InvitationState, string> = {
  PENDING: "Pending",
  EXPIRED: "Expired",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  REVOKED: "Revoked",
};
const ROLE_LABELS: Record<OrgInvitation["role"], string> = { OA: "Org Admin", MEMBER: "Member", VIEWER: "Viewer" };

// INV-04: list, resend and revoke an organization's invitations, and invite
// new people. Used by Org Admins (Invitations tab of /org/members) and System Admins (admin org page).
export function InvitationsPanel({ orgId, orgName, canInviteOrgAdmin, onChange }: InvitationsPanelProps) {
  const toast = useToast();
  const [invitations, setInvitations] = useState<OrgInvitation[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | InvitationState>("PENDING");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<OrgInvitation | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authApi.getOrgInvitations(orgId);
      setInvitations(res.invitations);
      setLoadError(null);
    } catch (err) {
      setLoadError((err as Error).message);
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  // Accepted or declined elsewhere (the admins are notified) → the list follows.
  useSocketEvents(["notification:new", "member:updated"], load);
  useOnReconnect(load);

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<InvitationState, number>;
    for (const inv of invitations ?? []) c[inv.status]++;
    return c;
  }, [invitations]);

  const visible = (invitations ?? []).filter((inv) => filter === "ALL" || inv.status === filter);

  // Resend or revoke, then reload; a failed revoke keeps its dialog open.
  const act = async (call: Promise<{ message: string }>, success: string, failure: string, rethrow = false) => {
    try {
      toast.success(success, (await call).message);
      load();
      onChange?.();
    } catch (err) {
      toast.error(failure, (err as Error).message);
      if (rethrow) throw err;
    }
  };

  const resend = async (inv: OrgInvitation) => {
    setResendingId(inv.id);
    await act(authApi.resendInvitation(inv.id), "Invitation resent", "Couldn't resend the invitation");
    setResendingId(null);
  };

  const revoke = () => (revokeTarget ? act(authApi.revokeInvitation(revokeTarget.id), "Invitation revoked", "Couldn't revoke the invitation", true) : undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="overflow-x-auto max-w-full">
          <Tabs
          className="w-max"
          variant="segmented"
          size="sm"
          activeTab={filter}
          onChange={(id) => setFilter(id as "ALL" | InvitationState)}
          tabs={[
            { id: "ALL", label: "All", count: invitations?.length },
            ...STATUS_ORDER.map((s) => ({ id: s, label: STATUS_LABELS[s], count: invitations ? counts[s] : undefined })),
          ]}
        />
      </div>
        <Button size="sm" onClick={() => setInviteOpen(true)} leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
          Invite people
        </Button>
      </div>

      {loadError && <LoadError what="invitations" message={loadError} onRetry={load} />}

      {!invitations && !loadError ? (
        <Loading label="Loading invitations" className="py-20" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Mail className="w-6 h-6" />}
          title={filter === "ALL" ? "No invitations yet" : `No ${STATUS_LABELS[filter].toLowerCase()} invitations`}
          description={
            filter === "ALL" || filter === "PENDING"
              ? "Invite teammates by email. They'll get a link to join this organization."
              : "Nothing in this list right now."
          }
          action={filter === "ALL" || filter === "PENDING" ? { label: "Invite people", onClick: () => setInviteOpen(true) } : undefined}
        />
      ) : (
        <div className="border border-zinc-200 dark:border-dark-border bg-white dark:bg-dark-card">
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-dark-border text-xs text-zinc-500 dark:text-zinc-400">
                  <th scope="col" className="py-2.5 px-4 font-medium">Email</th>
                  <th scope="col" className="py-2.5 px-4 font-medium">Role</th>
                  <th scope="col" className="py-2.5 px-4 font-medium">Invited by</th>
                  <th scope="col" className="py-2.5 px-4 font-medium">Status</th>
                  <th scope="col" className="py-2.5 px-4 font-medium">Expires</th>
                  <th scope="col" className="py-2.5 px-4 font-medium text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-dark-border">
                {visible.map((inv) => {
                  const open = inv.status === "PENDING" || inv.status === "EXPIRED";
                  return (
                    <tr key={inv.id}>
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white break-all">{inv.email}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{ROLE_LABELS[inv.role]}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">{inv.invitedByName}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{STATUS_LABELS[inv.status]}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                        {open ? formatDate(inv.expiresAt) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {open && (
                          <div className="flex items-center justify-end gap-0.5">
                            <IconButton
                              label={`Resend invitation to ${inv.email}`}
                              icon={resendingId === inv.id ? <Spinner size="sm" variant="current" /> : <RotateCw className="w-4 h-4" />}
                              onClick={() => resend(inv)}
                              disabled={resendingId !== null}
                            />
                            {inv.status === "PENDING" && (
                              <IconButton
                                label={`Revoke invitation to ${inv.email}`}
                                tone="danger"
                                icon={<Trash2 className="w-4 h-4" />}
                                onClick={() => setRevokeTarget(inv)}
                              />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InviteDialog
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        orgId={orgId}
        orgName={orgName}
        canInviteOrgAdmin={canInviteOrgAdmin}
        onInvited={() => {
          load();
          onChange?.();
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        onConfirm={revoke}
        variant="danger"
        title="Revoke invitation"
        description={`The link sent to ${revokeTarget?.email ?? ""} will stop working. You can invite them again later.`}
        confirmLabel="Revoke invitation"
      />
    </div>
  );
}