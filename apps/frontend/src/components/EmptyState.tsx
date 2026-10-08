import { ReactNode } from "react";
import { FolderKanban } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  children,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-dark-card border border-dashed border-zinc-300 dark:border-zinc-800 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-none bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 mb-4 border border-brand-200/80 dark:border-brand-900/60">
        {icon || <FolderKanban className="h-6 w-6" />}
      </div>

      <h4 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
        {title}
      </h4>

      <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm font-sans leading-relaxed">
        {description}
      </p>

      {action && (
        <div className="mt-5">
          <Button
            variant="primary"
            size="sm"
            onClick={action.onClick}
            leftIcon={action.icon}
          >
            {action.label}
          </Button>
        </div>
      )}

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
