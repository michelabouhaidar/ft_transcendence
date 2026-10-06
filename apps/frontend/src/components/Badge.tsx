import { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant =
  // Priority Tiers (DB Schema: TaskPriority)
  | "urgent" | "high" | "medium" | "low"
  | "URGENT" | "HIGH" | "MEDIUM" | "LOW"

  // Task Statuses (DB Schema: TaskStatus)
  | "todo" | "in_progress" | "done"
  | "TODO" | "IN_PROGRESS" | "DONE"

  // Organization Roles (DB Schema: OrgRole)
  | "oa" | "org_admin" | "member" | "viewer"
  | "OA" | "ORG_ADMIN" | "MEMBER" | "VIEWER"

  // Platform System Role (DB Schema: User.isSystemAdmin)
  | "sa" | "system_admin" | "admin"
  | "SA" | "SYSTEM_ADMIN"

  // Account Statuses (DB Schema: AccountStatus)
  | "pending_verification" | "active" | "suspended" | "deleted"
  | "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DELETED"

  // Invitation Statuses (DB Schema: InvitationStatus)
  | "pending" | "accepted" | "declined" | "revoked"
  | "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED"

  // Semantic Feedback & States
  | "brand" | "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
}

const baseStyles: Record<string, { container: string; dot: string }> = {
  // Priority tiers (DB Schema: TaskPriority)
  urgent: {
    container:
      "bg-destructive-50 text-destructive-700 border-destructive-200/60 dark:bg-destructive-950/40 dark:text-destructive-300 dark:border-destructive-900/50",
    dot: "bg-destructive-500 animate-pulse",
  },
  high: {
    container:
      "bg-warning-50 text-warning-700 border-warning-200/60 dark:bg-warning-950/40 dark:text-warning-300 dark:border-warning-900/50",
    dot: "bg-warning-500",
  },
  medium: {
    container:
      "bg-brand-50 text-brand-700 border-brand-200/60 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900/50",
    dot: "bg-brand-500",
  },
  low: {
    container:
      "bg-zinc-100 text-zinc-700 border-zinc-200/60 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60",
    dot: "bg-zinc-400",
  },

  // Task statuses (DB Schema: TaskStatus)
  todo: {
    container:
      "bg-zinc-100 text-zinc-700 border-zinc-200/60 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60",
    dot: "bg-zinc-400",
  },
  in_progress: {
    container:
      "bg-brand-50 text-brand-700 border-brand-200/60 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900/50",
    dot: "bg-brand-500",
  },
  done: {
    container:
      "bg-success-50 text-success-700 border-success-200/60 dark:bg-success-950/40 dark:text-success-300 dark:border-success-900/50",
    dot: "bg-success-500",
  },

  // Organization Roles (DB Schema: OrgRole: OA, MEMBER, VIEWER)
  oa: {
    container:
      "bg-brand-50 text-brand-700 border-brand-200/60 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800/60",
    dot: "bg-brand-500",
  },
  org_admin: {
    container:
      "bg-brand-50 text-brand-700 border-brand-200/60 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800/60",
    dot: "bg-brand-500",
  },
  member: {
    container:
      "bg-zinc-100 text-zinc-800 border-zinc-200/60 dark:bg-zinc-800/80 dark:text-zinc-200 dark:border-zinc-700/60",
    dot: "bg-zinc-400",
  },
  viewer: {
    container:
      "bg-transparent text-zinc-600 border-zinc-200 dark:text-zinc-400 dark:border-zinc-700/60",
    dot: "bg-zinc-400",
  },

  // Platform System Role (DB Schema: User.isSystemAdmin)
  sa: {
    container:
      "bg-platform-50 text-platform-700 border-platform-200/60 dark:bg-platform-950/50 dark:text-platform-300 dark:border-platform-800/60",
    dot: "bg-platform-500",
  },
  system_admin: {
    container:
      "bg-platform-50 text-platform-700 border-platform-200/60 dark:bg-platform-950/50 dark:text-platform-300 dark:border-platform-800/60",
    dot: "bg-platform-500",
  },
  admin: {
    container:
      "bg-platform-50 text-platform-700 border-platform-200/60 dark:bg-platform-950/50 dark:text-platform-300 dark:border-platform-800/60",
    dot: "bg-platform-500",
  },

  // Account Statuses (DB Schema: AccountStatus)
  active: {
    container:
      "bg-success-50 text-success-700 border-success-200/60 dark:bg-success-950/40 dark:text-success-300 dark:border-success-900/50",
    dot: "bg-success-500",
  },
  pending_verification: {
    container:
      "bg-warning-50 text-warning-700 border-warning-200/60 dark:bg-warning-950/40 dark:text-warning-300 dark:border-warning-900/50",
    dot: "bg-warning-500",
  },
  suspended: {
    container:
      "bg-destructive-50 text-destructive-700 border-destructive-200/60 dark:bg-destructive-950/40 dark:text-destructive-300 dark:border-destructive-900/50",
    dot: "bg-destructive-500",
  },
  deleted: {
    container:
      "bg-zinc-100 text-zinc-500 border-zinc-200/60 dark:bg-zinc-800/60 dark:text-zinc-500 dark:border-zinc-700/60",
    dot: "bg-zinc-500",
  },

  // Invitation Statuses (DB Schema: InvitationStatus)
  pending: {
    container:
      "bg-warning-50 text-warning-700 border-warning-200/60 dark:bg-warning-950/40 dark:text-warning-300 dark:border-warning-900/50",
    dot: "bg-warning-500",
  },
  accepted: {
    container:
      "bg-success-50 text-success-700 border-success-200/60 dark:bg-success-950/40 dark:text-success-300 dark:border-success-900/50",
    dot: "bg-success-500",
  },
  declined: {
    container:
      "bg-zinc-100 text-zinc-600 border-zinc-200/60 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700/60",
    dot: "bg-zinc-400",
  },
  revoked: {
    container:
      "bg-destructive-50 text-destructive-700 border-destructive-200/60 dark:bg-destructive-950/40 dark:text-destructive-300 dark:border-destructive-900/50",
    dot: "bg-destructive-500",
  },

  // Semantic Feedback & States
  brand: {
    container:
      "bg-brand-50 text-brand-700 border-brand-200/60 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800/60",
    dot: "bg-brand-500",
  },
  primary: {
    container:
      "bg-brand-50 text-brand-700 border-brand-200/60 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800/60",
    dot: "bg-brand-500",
  },
  secondary: {
    container:
      "bg-zinc-100 text-zinc-800 border-zinc-200/60 dark:bg-zinc-800/80 dark:text-zinc-200 dark:border-zinc-700/60",
    dot: "bg-zinc-400",
  },
  success: {
    container:
      "bg-success-50 text-success-700 border-success-200/60 dark:bg-success-950/40 dark:text-success-300 dark:border-success-900/50",
    dot: "bg-success-500",
  },
  warning: {
    container:
      "bg-warning-50 text-warning-700 border-warning-200/60 dark:bg-warning-950/40 dark:text-warning-300 dark:border-warning-900/50",
    dot: "bg-warning-500",
  },
  danger: {
    container:
      "bg-destructive-50 text-destructive-700 border-destructive-200/60 dark:bg-destructive-950/40 dark:text-destructive-300 dark:border-destructive-900/50",
    dot: "bg-destructive-500",
  },
  neutral: {
    container:
      "bg-zinc-100 text-zinc-700 border-zinc-200/60 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60",
    dot: "bg-zinc-400",
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-[11px] px-2.5 py-0.5 gap-1 font-medium",
  md: "text-xs px-3 py-1 gap-1.5 font-medium",
};

export function Badge({
  variant = "neutral",
  size = "sm",
  dot = false,
  icon,
  children,
  className = "",
  ...props
}: BadgeProps) {
  const normalizedKey = String(variant).toLowerCase();
  const style = baseStyles[normalizedKey] || baseStyles.neutral;
  const { container, dot: dotColor } = style;

  return (
    <span
      className={`inline-flex items-center w-fit font-sans border rounded-none select-none ${container} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 shrink-0 ${dotColor}`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
