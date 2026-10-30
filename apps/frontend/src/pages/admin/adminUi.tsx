import { ReactNode } from "react";
import { CircleMinus, Mail, CircleCheck } from "lucide-react";
import { AccountStatus, AdminUserListItem, OrgRole } from "../../api/auth";
import { Badge, IconButton } from "../../components";

export const STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: "Active",
  PENDING_VERIFICATION: "Pending verification",
  SUSPENDED: "Suspended",
  DELETED: "Deleted",
};

export const ROLE_LABELS: Record<"SA" | OrgRole | "U", string> = {
  SA: "System Admin",
  OA: "Org Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
  U: "No organization",
};

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return (
    <Badge variant={status} dot>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: "SA" | OrgRole }) {
  return <Badge variant={role}>{ROLE_LABELS[role]}</Badge>;
}

type Guarded = Pick<AdminUserListItem, "guards" | "status" | "organization">;

// Why the backend would refuse a suspend or delete.
// Null means the action is allowed.
export function blockedReason(user: Guarded, action: "suspend" | "delete"): string | null {
  if (user.guards.isSelf) {
    return action === "suspend" ? "You can't suspend your own account." : "You can't delete your own account here.";
  }
  if (user.guards.lastSa) return "Last active System Admin. Grant the role to someone else first.";
  if (user.guards.lastOa) {
    return `Last Org Admin of ${user.organization?.name ?? "their organization"}. Appoint another Org Admin first.`;
  }
  return null;
}

export interface Consequence {
  kind: "change" | "notify" | "keep";
  text: ReactNode;
}

const KIND_STYLES = {
  change: { icon: CircleMinus, color: "text-destructive-600 dark:text-destructive-400" },
  notify: { icon: Mail, color: "text-brand-600 dark:text-brand-400" },
  keep: { icon: CircleCheck, color: "text-zinc-400 dark:text-zinc-500" },
} as const;

// The ledger shown inside every destructive dialog: what changes, who is told, and what is kept. 
// Counts come from the backend so the SA sees the real blast radius before confirming.
export function ConsequenceList({ items }: { items: Consequence[] }) {
  const groups: Array<{ title: string; items: Consequence[] }> = [
    { title: "What happens", items: items.filter((i) => i.kind !== "keep") },
    { title: "What stays", items: items.filter((i) => i.kind === "keep") },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="border border-zinc-200 dark:border-dark-border divide-y divide-zinc-200 dark:divide-dark-border">
      {groups.map((group) => (
        <div key={group.title} className="px-4 py-3">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{group.title}</p>
          <ul className="space-y-1.5">
            {group.items.map((item, i) => {
              const { icon: Icon, color } = KIND_STYLES[item.kind];
              return (
                <li key={i} className="flex items-start gap-2.5 text-[13px] leading-snug text-zinc-700 dark:text-zinc-300">
                  <Icon className={`w-4 h-4 mt-px shrink-0 ${color}`} aria-hidden="true" />
                  <span>{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

// Label/value rows for detail pages.
export function DefinitionList({ rows }: { rows: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="divide-y divide-zinc-100 dark:divide-dark-border">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[8rem_1fr] gap-3 py-2.5 text-sm">
          <dt className="text-zinc-500 dark:text-zinc-400">{row.label}</dt>
          <dd className="text-zinc-900 dark:text-zinc-100 min-w-0 break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">{children}</h2>
      {aside && <div className="text-xs text-zinc-500 dark:text-zinc-400">{aside}</div>}
    </div>
  );
}

// Row action: an IconButton that doesn't trigger the row's own click.
export function RowAction({
  label,
  icon,
  onClick,
  disabledReason,
  tone = "neutral",
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabledReason?: string | null;
  tone?: "neutral" | "danger";
}) {
  return (
    <IconButton
      label={label}
      icon={icon}
      tone={tone}
      disabledReason={disabledReason}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    />
  );
}
