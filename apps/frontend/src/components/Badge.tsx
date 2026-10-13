import { ComponentProps, ReactNode } from "react";

// Color tones: [container, dot].
const TONES = {
  danger: [
    "bg-destructive-50 text-destructive-700 border-destructive-200/60 dark:bg-destructive-950/40 dark:text-destructive-300 dark:border-destructive-900/50",
    "bg-destructive-500",
  ],
  warning: [
    "bg-warning-50 text-warning-700 border-warning-200/60 dark:bg-warning-950/40 dark:text-warning-300 dark:border-warning-900/50",
    "bg-warning-500",
  ],
  info: ["bg-brand-50 text-brand-700 border-brand-200/60 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900/50", "bg-brand-500"],
  brand: ["bg-brand-50 text-brand-700 border-brand-200/60 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800/60", "bg-brand-500"],
  success: [
    "bg-success-50 text-success-700 border-success-200/60 dark:bg-success-950/40 dark:text-success-300 dark:border-success-900/50",
    "bg-success-500",
  ],
  platform: [
    "bg-platform-50 text-platform-700 border-platform-200/60 dark:bg-platform-950/50 dark:text-platform-300 dark:border-platform-800/60",
    "bg-platform-500",
  ],
  neutral: ["bg-zinc-100 text-zinc-700 border-zinc-200/60 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60", "bg-zinc-400"],
  strong: ["bg-zinc-100 text-zinc-800 border-zinc-200/60 dark:bg-zinc-800/80 dark:text-zinc-200 dark:border-zinc-700/60", "bg-zinc-400"],
  outline: ["bg-transparent text-zinc-600 border-zinc-200 dark:text-zinc-400 dark:border-zinc-700/60", "bg-zinc-400"],
  muted: ["bg-zinc-100 text-zinc-600 border-zinc-200/60 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700/60", "bg-zinc-400"],
  faded: ["bg-zinc-100 text-zinc-500 border-zinc-200/60 dark:bg-zinc-800/60 dark:text-zinc-500 dark:border-zinc-700/60", "bg-zinc-500"],
} as const;

// Variant names follow the DB enums (any case): priorities, task statuses, roles, account and invitation statuses.
const VARIANTS = {
  urgent: "danger", high: "warning", medium: "info", low: "neutral",
  todo: "neutral", in_progress: "info", done: "success",
  oa: "brand", org_admin: "brand", member: "strong", viewer: "outline",
  sa: "platform", system_admin: "platform", admin: "platform",
  active: "success", pending_verification: "warning", suspended: "danger", deleted: "faded",
  pending: "warning", accepted: "success", declined: "muted", revoked: "danger",
  brand: "brand", primary: "brand", secondary: "strong", success: "success", warning: "warning", danger: "danger", neutral: "neutral",
} satisfies Record<string, keyof typeof TONES>;

export type BadgeVariant = keyof typeof VARIANTS | Uppercase<keyof typeof VARIANTS>;

export interface BadgeProps extends ComponentProps<"span"> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  icon?: ReactNode;
}

export function Badge({ variant = "neutral", size = "sm", dot = false, icon, children, className = "", ...props }: BadgeProps) {
  const key = variant.toLowerCase() as keyof typeof VARIANTS;
  const [container, dotColor] = TONES[VARIANTS[key] ?? "neutral"];
  return (
    <span
      className={`inline-flex items-center w-fit font-sans border rounded-none select-none font-medium ${container} ${
        size === "sm" ? "text-[11px] px-2.5 py-0.5 gap-1" : "text-xs px-3 py-1 gap-1.5"
      } ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 shrink-0 ${dotColor} ${key === "urgent" ? "animate-pulse" : ""}`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
