import { ComponentProps } from "react";

export interface CardProps extends ComponentProps<"div"> {
  variant?: "default" | "elevated" | "interactive";
  /** Inner spacing. Use this instead of padding classes, which can't override the default. */
  padding?: "none" | "sm" | "md" | "lg";
}

const PADDING = { none: "", sm: "p-3", md: "p-5 sm:p-6", lg: "p-8" };

const VARIANTS = {
  default: "bg-white dark:bg-dark-card border border-zinc-200/80 dark:border-zinc-800/80 transition-all duration-150",
  elevated: "bg-white dark:bg-dark-elevated border border-zinc-200/70 dark:border-zinc-800/80 shadow-md transition-all duration-150",
  interactive:
    "bg-white dark:bg-dark-card border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-150 cursor-pointer",
};

export function Card({ variant = "default", padding = "md", className = "", ...props }: CardProps) {
  return <div className={`${PADDING[padding]} relative overflow-hidden rounded-none ${VARIANTS[variant]} ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`flex flex-col items-start space-y-1.5 pb-4 border-b border-zinc-100 dark:border-zinc-800/60 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: ComponentProps<"h3">) {
  return <h3 className={`text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white font-sans ${className}`} {...props} />;
}

export function CardDescription({ className = "", ...props }: ComponentProps<"p">) {
  return <p className={`text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`py-4 ${className}`} {...props} />;
}

export function CardFooter({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between gap-4 ${className}`} {...props} />;
}
