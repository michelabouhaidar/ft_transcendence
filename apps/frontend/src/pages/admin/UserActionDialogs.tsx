import { useEffect, useState } from "react";
import { authApi, AdminUserDetail, OrgRole } from "../../api/auth";
import { Alert, Checkbox, ConfirmDialog, FormDialog, Input, Loading, Modal, Select, Textarea, useToast } from "../../components";
import { useAsync } from "../../lib/hooks";
import { ConsequenceList, Consequence, ROLE_LABELS, blockedReason } from "./adminUi";
import { plural } from "../../lib/format";

export type UserAction = "edit" | "suspend" | "reactivate" | "delete";

export interface UserActionRequest {
  action: UserAction;
  userId: string;
}

interface UserActionDialogsProps {
  request: UserActionRequest | null;
  onClose: () => void;
  // Called after a successful action so the caller can refetch.
  onDone: (action: UserAction) => void;
}

const TITLES: Record<UserAction, string> = {
  edit: "Edit user",
  suspend: "Suspend account",
  reactivate: "Reactivate account",
  delete: "Delete account",
};

// Every action loads the user's detail first, so guards and counts in the dialog are fresh even when opened from a list row.
export function UserActionDialogs({ request, onClose, onDone }: UserActionDialogsProps) {
  const toast = useToast();
  const [user, setUser] = useState<AdminUserDetail | null>(null);

  useEffect(() => {
    if (!request) {
      setUser(null);
      return;
    }
    let cancelled = false;
    setUser(null);
    authApi
      .adminGetUser(request.userId)
      .then((res) => !cancelled && setUser(res.user))
      .catch((err: Error) => {
        if (cancelled) return;
        toast.error("Couldn't load this user", err.message);
        onClose();
      });
    return () => {
      cancelled = true;
    };
  }, [request]);

  if (!request) return null;

  if (!user) {
    return (
      <Modal isOpen onClose={onClose} title={TITLES[request.action]} maxWidth="md">
        <Loading label="Loading user" className="py-8" />
      </Modal>
    );
  }

  // Runs the action, then toasts the outcome; a failure keeps the dialog open.
  const act = (action: UserAction, call: Promise<unknown>, success: [string, string], failure: string) =>
    call.then(
      () => {
        toast.success(...success);
        onDone(action);
      },
      (err: Error) => {
        toast.error(failure, err.message);
        throw err;
      }
    );

  if (request.action === "edit") {
    return <EditUserDialog user={user} onClose={onClose} onSaved={() => onDone("edit")} />;
  }

  if (request.action === "suspend") {
    return (
      <SuspendDialog
        user={user}
        onClose={onClose}
        onConfirm={(reason) =>
          act("suspend", authApi.adminSuspendUser(user.id, reason || undefined), ["Account suspended", `${user.fullName} was signed out everywhere.`], "Couldn't suspend this account")
        }
      />
    );
  }

  if (request.action === "reactivate") {
    return (
      <ConfirmDialog
        isOpen
        onClose={onClose}
        variant="primary"
        title="Reactivate account"
        description={`${user.fullName} will be able to sign in again.`}
        confirmLabel="Reactivate account"
        onConfirm={() =>
          act("reactivate", authApi.adminReactivateUser(user.id), ["Account reactivated", `${user.fullName} can sign in again.`], "Couldn't reactivate this account")
        }
      >
        <ConsequenceList
          items={[
            { kind: "notify", text: `An email tells ${user.email} they can sign in again` },
            {
              kind: "keep",
              text: user.organization
                ? `${ROLE_LABELS[user.role]} in ${user.organization.name}, unchanged`
                : "Their role, unchanged",
            },
          ]}
        />
      </ConfirmDialog>
    );
  }

  return (
    <DeleteDialog
      user={user}
      onClose={onClose}
      onConfirm={() =>
        act("delete", authApi.adminDeleteUser(user.id, user.email), ["Account deleted", "Personal data was erased. Their work now shows as Deleted user."], "Couldn't delete this account")
      }
    />
  );
}

function SuspendDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: AdminUserDetail;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const blocked = blockedReason(user, "suspend");

  return (
    <ConfirmDialog
      isOpen
      onClose={onClose}
      variant="warning"
      title="Suspend account"
      description={`${user.fullName} (${user.email}) won't be able to use Trenno until you reactivate the account.`}
      confirmLabel="Suspend account"
      confirmDisabled={Boolean(blocked)}
      onConfirm={() => onConfirm(reason.trim())}
    >
      {blocked ? (
        <Alert variant="warning" title="This account can't be suspended">
          {blocked}
        </Alert>
      ) : (
        <div className="space-y-4">
          <ConsequenceList
            items={[
              { kind: "change", text: "Signed out on every device now; open boards disconnect" },
              { kind: "change", text: "Can't sign in until reactivated" },
              { kind: "notify", text: `An email tells ${user.email} the account is suspended, with your reason if you add one` },
              {
                kind: "keep",
                text: user.organization
                  ? `Membership in ${user.organization.name}, projects and tasks`
                  : "Their profile and history",
              },
            ]}
          />
          <Textarea
            label="Reason (optional, included in the email)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Repeated sign-ins from an unknown location"
          />
        </div>
      )}
    </ConfirmDialog>
  );
}

function DeleteDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: AdminUserDetail;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const blocked = blockedReason(user, "delete");
  const { tasksAssigned, tasksCreated, comments, friendships } = user.counts;

  const items: Consequence[] = [
    { kind: "change", text: "Name, email, avatar, bio, password and 2FA are erased; the email can sign up again" },
    { kind: "change", text: "Signed out on every device now" },
  ];
  if (user.organization) items.push({ kind: "change", text: `Membership in ${user.organization.name} ends` });
  if (tasksAssigned > 0) items.push({ kind: "change", text: `${plural(tasksAssigned, "assigned task")} become unassigned` });
  if (friendships > 0) items.push({ kind: "change", text: `${plural(friendships, "friendship")} end` });
  items.push({ kind: "notify", text: `A deletion notice goes to ${user.email} before the data is erased` });
  if (tasksCreated + comments > 0) {
    items.push({
      kind: "keep",
      text: `${plural(tasksCreated, "task")} and ${plural(comments, "comment")} they wrote, shown as “Deleted user”`,
    });
  }

  return (
    <ConfirmDialog
      isOpen
      onClose={onClose}
      variant="danger"
      title="Delete account"
      description={`This anonymizes ${user.fullName}'s account. It can't be undone.`}
      confirmLabel="Delete account"
      typedConfirmationText={blocked ? undefined : user.email}
      confirmDisabled={Boolean(blocked)}
      onConfirm={onConfirm}
    >
      {blocked ? (
        <Alert variant="warning" title="This account can't be deleted">
          {blocked}
        </Alert>
      ) : (
        <ConsequenceList items={items} />
      )}
    </ConfirmDialog>
  );
}

const ORG_ROLE_OPTIONS: Array<{ value: OrgRole; label: string; description: string }> = [
  { value: "OA", label: "Org Admin", description: "Manages members, invitations and every project" },
  { value: "MEMBER", label: "Member", description: "Creates and edits tasks in projects they can access" },
  { value: "VIEWER", label: "Viewer", description: "Read-only in projects they can access" },
];

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUserDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [isSA, setIsSA] = useState(user.isSystemAdmin);
  const [orgRole, setOrgRole] = useState<OrgRole | null>(user.orgRole);
  const { busy: saving, error, setError, run } = useAsync();

  const org = user.organization;
  const grantingSA = isSA && !user.isSystemAdmin;

  // Mirrors the backend rules so blocked changes are explained up front.
  const saLockReason = user.isSystemAdmin
    ? user.guards.isSelf
      ? "You can't remove your own System Admin role."
      : user.guards.lastSa
      ? "Last active System Admin. Grant the role to someone else first."
      : null
    : user.guards.lastOa
    ? `Last Org Admin of ${org?.name}. Appoint another Org Admin before making them a System Admin.`
    : null;
  const roleLockReason = user.guards.lastOa
    ? `Last Org Admin of ${org?.name}. Appoint another Org Admin before changing this role.`
    : grantingSA
    ? "Their membership ends when they become a System Admin."
    : null;

  const becomingViewer = orgRole === "VIEWER" && user.orgRole !== "VIEWER";

  const handleSubmit = async () => {
    const payload: Parameters<typeof authApi.adminUpdateUser>[1] = {};
    if (firstName.trim() !== user.firstName) payload.firstName = firstName.trim();
    if (lastName.trim() !== user.lastName) payload.lastName = lastName.trim();
    if (jobTitle.trim() !== (user.jobTitle ?? "")) payload.jobTitle = jobTitle.trim() || null;
    if (bio.trim() !== (user.bio ?? "")) payload.bio = bio.trim() || null;
    if (isSA !== user.isSystemAdmin) payload.isSystemAdmin = isSA;
    if (orgRole && orgRole !== user.orgRole && !grantingSA) payload.orgRole = orgRole;
    if (Object.keys(payload).length === 0) return onClose();

    const res = await run(() => authApi.adminUpdateUser(user.id, payload));
    if (res) {
      toast.success("Changes saved", res.unassignedTasks ? `${plural(res.unassignedTasks, "task")} unassigned.` : `${user.fullName} was notified by email.`);
      onSaved();
    }
  };

  return (
    <FormDialog
      isOpen
      onClose={onClose}
      title="Edit user"
      description={user.email}
      maxWidth="lg"
      className="space-y-6"
      onSubmit={handleSubmit}
      submitLabel="Save changes"
      busy={saving}
      error={error}
      onDismissError={() => setError(null)}
    >

        <fieldset className="space-y-4">
          <legend className="text-sm font-bold text-zinc-900 dark:text-white pb-1">Profile</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required maxLength={50} />
            <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required maxLength={50} />
          </div>
          <Input label="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} maxLength={100} placeholder="Product designer" />
          <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={3} />
        </fieldset>

        <div className="pt-5 border-t border-zinc-100 dark:border-dark-border">
          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-zinc-900 dark:text-white pb-1">Access</legend>

            {org && orgRole && (
              <div className="space-y-2">
                <Select
                  label={`Role in ${org.name}`}
                  value={orgRole}
                  onChange={(v) => setOrgRole(v as OrgRole)}
                  options={ORG_ROLE_OPTIONS}
                  disabled={Boolean(roleLockReason)}
                  helperText={roleLockReason ?? undefined}
                />
                {becomingViewer && !grantingSA && user.counts.tasksAssigned > 0 && (
                  <Alert variant="warning">
                    {plural(user.counts.tasksAssigned, "task")} assigned to {user.firstName} will be unassigned. Viewers can't be assignees.
                  </Alert>
                )}
              </div>
            )}

            <Checkbox
              variant="card"
              checked={isSA}
              disabled={Boolean(saLockReason)}
              onChange={(e) => setIsSA(e.target.checked)}
              label="System Admin"
              description={saLockReason ?? "Manages every user and organization on Trenno."}
            />

            {grantingSA && org && (
              <Alert variant="warning">
                {user.firstName} will leave {org.name}. System Admins don't belong to an organization, and their assigned tasks there become unassigned.
              </Alert>
            )}
          </fieldset>
        </div>

    </FormDialog>
  );
}
