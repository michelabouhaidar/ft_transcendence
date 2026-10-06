import { SVGAttributes } from "react";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerVariant = "brand" | "white" | "muted" | "current";

export interface SpinnerProps extends SVGAttributes<SVGSVGElement> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
  xl: "h-10 w-10",
};

const variantStyles: Record<SpinnerVariant, string> = {
  brand: "text-brand-600",
  white: "text-white",
  muted: "text-zinc-400 dark:text-zinc-500",
  current: "text-current",
};

export function Spinner({
  size = "md",
  variant = "brand",
  label = "Loading...",
  className = "",
  ...props
}: SpinnerProps) {
  return (
    <svg
      role="status"
      aria-label={label}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-spin ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
      <title>{label}</title>
    </svg>
  );
}
