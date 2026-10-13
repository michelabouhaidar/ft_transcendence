import { ComponentProps, ReactNode } from "react";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost" | "outline" | "link" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-xs focus-visible:ring-brand-500",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700/80 focus-visible:ring-zinc-400",
  destructive: "bg-destructive-600 text-white hover:bg-destructive-700 active:bg-destructive-800 shadow-xs focus-visible:ring-destructive-500",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:active:bg-zinc-800 focus-visible:ring-zinc-400",
  outline:
    "bg-transparent text-zinc-900 border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 active:bg-zinc-100 dark:text-zinc-100 dark:border-zinc-700/80 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800 focus-visible:ring-brand-500",
  // Text-only actions inside sentences, alerts and form footers: no box padding.
  link: "bg-transparent text-brand-600 hover:text-brand-500 hover:underline underline-offset-2 dark:text-brand-400 focus-visible:ring-brand-500",
  quiet: "bg-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 focus-visible:ring-zinc-400",
};

const sizeStyles: Record<ButtonSize, { box: string; text: string; icon: string }> = {
  sm: { box: "px-3 py-1.5 text-xs gap-1.5 font-medium", text: "text-xs gap-1 font-medium", icon: "h-3.5 w-3.5" },
  md: { box: "px-4 py-2 text-sm gap-2 font-medium", text: "text-sm gap-1.5 font-medium", icon: "h-4 w-4" },
  lg: { box: "px-5 py-2.5 text-base gap-2.5 font-semibold", text: "text-base gap-2 font-semibold", icon: "h-5 w-5" },
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const s = sizeStyles[size];
  const isText = variant === "link" || variant === "quiet";
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`inline-flex items-center justify-center font-sans rounded-none transition-all duration-150 select-none tracking-normal
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-dark-bg
        disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
        ${fullWidth ? "w-full" : ""} ${variantStyles[variant]} ${isText ? s.text : s.box} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Spinner size={size === "lg" ? "md" : "sm"} variant={variant === "primary" || variant === "destructive" ? "white" : "current"} className="shrink-0" />
      ) : (
        leftIcon && <span className={`shrink-0 ${s.icon}`}>{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className={`shrink-0 ${s.icon}`}>{rightIcon}</span>}
    </button>
  );
}
