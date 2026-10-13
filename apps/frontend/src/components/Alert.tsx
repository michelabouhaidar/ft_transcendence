import { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export interface AlertProps {
  variant?: "error" | "warning" | "info" | "success";
  /** "inline" drops the box: icon, title and text sit directly in the flow (used in auth forms). */
  appearance?: "boxed" | "inline";
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
  className?: string;
}

const STYLES = {
  error: {
    box: "bg-destructive-500/5 dark:bg-destructive-500/10 border-destructive-500/20 dark:border-destructive-500/30",
    icon: "text-destructive-600 dark:text-destructive-400",
    title: "text-destructive-900 dark:text-destructive-200",
    text: "text-destructive-700 dark:text-destructive-300",
    Icon: AlertCircle,
  },
  warning: {
    box: "bg-warning-500/5 dark:bg-warning-500/10 border-warning-500/20 dark:border-warning-500/30",
    icon: "text-warning-600 dark:text-warning-400",
    title: "text-warning-900 dark:text-warning-200",
    text: "text-warning-700 dark:text-warning-300",
    Icon: AlertTriangle,
  },
  info: {
    box: "bg-brand-500/5 dark:bg-brand-500/10 border-brand-500/20 dark:border-brand-500/30",
    icon: "text-brand-600 dark:text-brand-400",
    title: "text-brand-900 dark:text-brand-200",
    text: "text-brand-700 dark:text-brand-300",
    Icon: Info,
  },
  success: {
    box: "bg-success-500/5 dark:bg-success-500/10 border-success-500/20 dark:border-success-500/30",
    icon: "text-success-600 dark:text-success-400",
    title: "text-success-900 dark:text-success-200",
    text: "text-success-700 dark:text-success-300",
    Icon: CheckCircle2,
  },
};

export function Alert({ variant = "error", appearance = "boxed", title, children, icon, action, onClose, className = "" }: AlertProps) {
  const s = STYLES[variant];
  const inline = appearance === "inline";
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start font-sans ${
        inline ? "gap-2 text-xs" : `gap-2.5 relative p-3 rounded-none border ${s.box} transition-all animate-in fade-in duration-150`
      } ${className}`}
    >
      <div className={`shrink-0 mt-0.5 ${s.icon}`}>{icon || <s.Icon className="w-4 h-4" />}</div>
      <div className="flex-1 min-w-0">
        {title &&
          (inline ? (
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
          ) : (
            <h5 className={`text-xs font-semibold leading-tight ${s.title}`}>{title}</h5>
          ))}
        <div
          className={
            inline
              ? title
                ? "mt-0.5 text-zinc-600 dark:text-zinc-300"
                : `font-medium ${s.text}`
              : `text-xs leading-relaxed ${title ? "mt-0.5" : ""} ${s.text}`
          }
        >
          {children}
        </div>
        {action && <div className={inline ? "mt-1.5" : "mt-2.5 pt-2 border-t border-current/15"}>{action}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className={`shrink-0 p-0.5 rounded-none hover:opacity-75 transition-opacity cursor-pointer ${s.icon}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
