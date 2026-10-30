import { useEffect, useState } from "react";
import { authApi, OrgRole } from "../../api/auth";
import { FormDialog, Input, Select, useToast } from "../../components";
import { useAsync } from "../../lib/hooks";

const ROLE_OPTIONS: Array<{ value: OrgRole; label: string; description: string }> = [
  { value: "MEMBER", label: "Member", description: "Creates and edits tasks in projects they can access" },
  { value: "VIEWER", label: "Viewer", description: "Read-only in projects they can access" },
  { value: "OA", label: "Org Admin", description: "Manages members, invitations and every project" },
];

interface InviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
  /** Only a System Admin may invite an Org Admin. */
  canInviteOrgAdmin: boolean;
  onInvited: () => void;
}

// Invite someone by email. They get a single-use link valid 7 days.
export function InviteDialog({ isOpen, onClose, orgId, orgName, canInviteOrgAdmin, onInvited }: InviteDialogProps) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("MEMBER");
  const { busy, error, setError, run } = useAsync();

  useEffect(() => {
    if (!isOpen) return;
    setEmail("");
    setRole("MEMBER");
    setError(null);
  }, [isOpen]);

  const submit = async () => {
    const res = await run(() => authApi.inviteToOrg(orgId, { email: email.trim().toLowerCase(), role }));
    if (res) {
      toast.success("Invitation sent", res.message);
      onInvited();
      onClose();
    }
  };

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Invite to ${orgName}`}
      description="They get an email with a link that works once and expires in 7 days."
      onSubmit={submit}
      submitLabel="Send invitation"
      busy={busy}
      error={error}
      onDismissError={() => setError(null)}
    >
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required autoFocus disabled={busy} />
      <Select
        label="Role"
        value={role}
        onChange={(v) => setRole(v as OrgRole)}
        options={ROLE_OPTIONS.filter((o) => o.value !== "OA" || canInviteOrgAdmin)}
        disabled={busy}
      />
    </FormDialog>
  );
}
