import { HTMLAttributes, forwardRef } from "react";

export type CardVariant = "default" | "elevated" | "interactive" | "outline";

export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Inner spacing. Use this instead of padding classes, which can't override the default. */
  padding?: CardPadding;
}

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-5 sm:p-6",
  lg: "p-8",
};

const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-white dark:bg-dark-card border border-zinc-200/80 dark:border-zinc-800/80 rounded-none shadow-xs transition-colors",
  elevated:
    "bg-white dark:bg-dark-elevated border border-zinc-200/70 dark:border-zinc-800/80 shadow-md rounded-none transition-colors",
  interactive:
    "bg-white dark:bg-dark-card border border-zinc-200/80 dark:border-zinc-800/80 rounded-none shadow-xs hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-150 cursor-pointer",
  outline:
    "bg-transparent border border-zinc-200/80 dark:border-zinc-800 rounded-none transition-colors",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${paddingStyles[padding]} relative overflow-hidden ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col items-start space-y-1.5 pb-4 border-b border-zinc-100 dark:border-zinc-800/60 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = "", children, ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white font-sans ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className = "", children, ...props }, ref) => (
    <p
      ref={ref}
      className={`text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  )
);
CardDescription.displayName = "CardDescription";

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={`py-4 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";
