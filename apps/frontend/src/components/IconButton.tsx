import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";

export type IconButtonTone = "neutral" | "danger";
export type IconButtonSize = "sm" | "md";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "title"> {
  /** Accessible name; also shown as the tooltip. */
  label: string;
  icon: ReactNode;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  /** When set, the button is disabled and this reason becomes its tooltip and accessible description. */
  disabledReason?: string | null;
}

const toneStyles: Record<IconButtonTone, string> = {
  neutral:
    "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-dark-elevated",
  danger:
    "text-zinc-500 dark:text-zinc-400 hover:text-destructive-600 dark:hover:text-destructive-400 hover:bg-destructive-50 dark:hover:bg-destructive-950/30",
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: "p-1",
  md: "p-1.5",
};

// Icon-only action (close, copy, menu, row actions). Always carries a label.
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, tone = "neutral", size = "md", disabledReason, disabled, className = "", type = "button", onClick, ...props }, ref) => {
    const isDisabled = Boolean(disabled || disabledReason);
    return (
      <button
        ref={ref}
        type={type}
        aria-label={disabledReason ? `${label} (${disabledReason})` : label}
        title={disabledReason || label}
        aria-disabled={isDisabled}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        className={`inline-flex items-center justify-center shrink-0 rounded-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${sizeStyles[size]} ${
          isDisabled ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed" : `${toneStyles[tone]} cursor-pointer`
        } ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
