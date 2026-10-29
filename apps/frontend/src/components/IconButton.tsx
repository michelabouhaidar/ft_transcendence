import { ComponentProps, ReactNode } from "react";

export interface IconButtonProps extends Omit<ComponentProps<"button">, "aria-label" | "title"> {
  label: string;
  icon: ReactNode;
  tone?: "neutral" | "danger";
  size?: "sm" | "md";
  // When set, the button is disabled and the reason is why it can’t be used right now
  disabledReason?: string | null;
}

const toneStyles = {
  neutral: "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-dark-elevated",
  danger:
    "text-zinc-500 dark:text-zinc-400 hover:text-destructive-600 dark:hover:text-destructive-400 hover:bg-destructive-50 dark:hover:bg-destructive-950/30",
};

// Icon-only action (close, copy, menu, row actions). Always carries a label.
export function IconButton({ label, icon, tone = "neutral", size = "md", disabledReason, disabled, className = "", type = "button", onClick, ...props }: IconButtonProps) {
  const isDisabled = Boolean(disabled || disabledReason);
  return (
    <button
      type={type}
      aria-label={disabledReason ? `${label} (${disabledReason})` : label}
      title={disabledReason || label}
      aria-disabled={isDisabled}
      onClick={(e) => (isDisabled ? e.preventDefault() : onClick?.(e))}
      className={`inline-flex items-center justify-center shrink-0 rounded-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        size === "sm" ? "p-1" : "p-1.5"
      } ${isDisabled ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed" : `${toneStyles[tone]} cursor-pointer`} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
