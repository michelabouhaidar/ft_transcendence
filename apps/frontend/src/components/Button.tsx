import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost" | "outline" | "link" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  uppercase?: boolean;
  inverted?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-xs focus-visible:ring-brand-500",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700/80 focus-visible:ring-zinc-400",
  destructive:
    "bg-destructive-600 text-white hover:bg-destructive-700 active:bg-destructive-800 shadow-xs focus-visible:ring-destructive-500",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:active:bg-zinc-800 focus-visible:ring-zinc-400",
  outline:
    "bg-transparent text-zinc-900 border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 active:bg-zinc-100 dark:text-zinc-100 dark:border-zinc-700/80 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800 focus-visible:ring-brand-500",
  // Text-only actions inside sentences, alerts and form footers.
  link:
    "bg-transparent text-brand-600 hover:text-brand-500 hover:underline underline-offset-2 dark:text-brand-400 focus-visible:ring-brand-500",
  quiet:
    "bg-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 focus-visible:ring-zinc-400",
};

const TEXT_VARIANTS: ButtonVariant[] = ["link", "quiet"];

const invertedVariantStyles: Partial<Record<ButtonVariant, string>> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 shadow-xs focus-visible:ring-brand-400",
  secondary:
    "bg-white/10 text-white hover:bg-white/20 active:bg-white/30 border border-white/20 focus-visible:ring-white",
  destructive:
    "bg-destructive-600 text-white hover:bg-destructive-500 active:bg-destructive-700 shadow-xs focus-visible:ring-destructive-400",
  ghost:
    "bg-transparent text-zinc-200 hover:text-white hover:bg-white/10 active:bg-white/20 focus-visible:ring-white",
  outline:
    "bg-transparent text-white border border-white/30 hover:border-brand-400 hover:text-white hover:bg-white/10 active:bg-white/20 focus-visible:ring-brand-400",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 font-medium font-sans",
  md: "px-4 py-2 text-sm font-medium font-sans gap-2",
  lg: "px-5 py-2.5 text-base font-semibold font-sans gap-2.5",
};

// Text variants keep the type scale but drop the box padding.
const textSizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs gap-1 font-medium font-sans",
  md: "text-sm gap-1.5 font-medium font-sans",
  lg: "text-base gap-2 font-semibold font-sans",
};

const iconSizes: Record<ButtonSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      uppercase = false,
      inverted = false,
      disabled,
      children,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const computedVariantStyle =
      inverted && invertedVariantStyles[variant]
        ? invertedVariantStyles[variant]
        : variantStyles[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`inline-flex items-center justify-center font-sans rounded-none transition-all duration-150 select-none
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-dark-bg
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
          ${uppercase ? "uppercase tracking-wider font-semibold" : "tracking-normal"}
          ${fullWidth ? "w-full" : ""}
          ${computedVariantStyle}
          ${TEXT_VARIANTS.includes(variant) ? textSizeStyles[size] : sizeStyles[size]}
          ${className}`}
        {...props}
      >
        {isLoading ? (
          <Spinner
            size={size === "lg" ? "md" : "sm"}
            variant={inverted || variant === "primary" || variant === "destructive" ? "white" : "current"}
            className="shrink-0"
          />
        ) : (
          leftIcon && <span className={`shrink-0 ${iconSizes[size]}`}>{leftIcon}</span>
        )}

        <span>{children}</span>

        {!isLoading && rightIcon && (
          <span className={`shrink-0 ${iconSizes[size]}`}>{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
