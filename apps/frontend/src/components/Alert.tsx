import { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type AlertVariant = "error" | "warning" | "info" | "success";

export type AlertAppearance = "boxed" | "inline";

export interface AlertProps {
  variant?: AlertVariant;
  /** "inline" drops the box: icon, title and text sit directly in the flow (used in auth forms). */
  appearance?: AlertAppearance;
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<
  AlertVariant,
  {
    container: string;
    iconColor: string;
    titleColor: string;
    textColor: string;
    defaultIcon: typeof AlertCircle;
  }
> = {
  error: {
    container: "bg-destructive-500/5 dark:bg-destructive-500/10 border-destructive-500/20 dark:border-destructive-500/30",
    iconColor: "text-destructive-600 dark:text-destructive-400",
    titleColor: "text-destructive-900 dark:text-destructive-200",
    textColor: "text-destructive-700 dark:text-destructive-300",
    defaultIcon: AlertCircle,
  },
  warning: {
    container: "bg-warning-500/5 dark:bg-warning-500/10 border-warning-500/20 dark:border-warning-500/30",
    iconColor: "text-warning-600 dark:text-warning-400",
    titleColor: "text-warning-900 dark:text-warning-200",
    textColor: "text-warning-700 dark:text-warning-300",
    defaultIcon: AlertTriangle,
  },
  info: {
    container: "bg-brand-500/5 dark:bg-brand-500/10 border-brand-500/20 dark:border-brand-500/30",
    iconColor: "text-brand-600 dark:text-brand-400",
    titleColor: "text-brand-900 dark:text-brand-200",
    textColor: "text-brand-700 dark:text-brand-300",
    defaultIcon: Info,
  },
  success: {
    container: "bg-success-500/5 dark:bg-success-500/10 border-success-500/20 dark:border-success-500/30",
    iconColor: "text-success-600 dark:text-success-400",
    titleColor: "text-success-900 dark:text-success-200",
    textColor: "text-success-700 dark:text-success-300",
    defaultIcon: CheckCircle2,
  },
};

export function Alert({
  variant = "error",
  appearance = "boxed",
  title,
  children,
  icon,
  action,
  onClose,
  className = "",
}: AlertProps) {
  const styles = variantStyles[variant];
  const IconComponent = styles.defaultIcon;

  if (appearance === "inline") {
    return (
      <div role="alert" aria-live="polite" className={`flex items-start gap-2 text-xs font-sans ${className}`}>
        <div className={`shrink-0 mt-0.5 ${styles.iconColor}`}>{icon || <IconComponent className="w-4 h-4" />}</div>
        <div className="flex-1 min-w-0">
          {title && <p className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>}
          <div className={title ? "mt-0.5 text-zinc-600 dark:text-zinc-300" : `font-medium ${styles.textColor}`}>
            {children}
          </div>
          {action && <div className="mt-1.5">{action}</div>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss alert"
            className={`shrink-0 p-0.5 hover:opacity-75 transition-opacity cursor-pointer ${styles.iconColor}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`relative p-3 rounded-none border ${styles.container} font-sans transition-all animate-in fade-in duration-150 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`shrink-0 mt-0.5 ${styles.iconColor}`}>
          {icon || <IconComponent className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <h5 className={`text-xs font-semibold leading-tight font-sans ${styles.titleColor}`}>
              {title}
            </h5>
          )}
          <div className={`text-xs font-sans leading-relaxed ${title ? "mt-0.5" : ""} ${styles.textColor}`}>
            {children}
          </div>

          {action && <div className="mt-2.5 pt-2 border-t border-current/15">{action}</div>}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss alert"
            className={`shrink-0 p-0.5 rounded-none hover:opacity-75 transition-opacity cursor-pointer ${styles.iconColor}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
