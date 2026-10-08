import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const typeStyles: Record<
  ToastType,
  { bg: string; border: string; text: string; icon: typeof CheckCircle2 }
> = {
  success: {
    bg: "bg-white dark:bg-dark-card",
    border: "border-success-500",
    text: "text-success-600 dark:text-success-400",
    icon: CheckCircle2,
  },
  error: {
    bg: "bg-white dark:bg-dark-card",
    border: "border-destructive-500",
    text: "text-destructive-600 dark:text-destructive-400",
    icon: AlertCircle,
  },
  warning: {
    bg: "bg-white dark:bg-dark-card",
    border: "border-warning-500",
    text: "text-warning-600 dark:text-warning-400",
    icon: AlertTriangle,
  },
  info: {
    bg: "bg-white dark:bg-dark-card",
    border: "border-info-500",
    text: "text-info-600 dark:text-info-400",
    icon: Info,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, description, duration = 4000 }: Omit<ToastMessage, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, description, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => addToast({ type: "success", title, description }),
    [addToast]
  );
  const error = useCallback(
    (title: string, description?: string) => addToast({ type: "error", title, description }),
    [addToast]
  );
  const warning = useCallback(
    (title: string, description?: string) => addToast({ type: "warning", title, description }),
    [addToast]
  );
  const info = useCallback(
    (title: string, description?: string) => addToast({ type: "info", title, description }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const { bg, border, text, icon: Icon } = typeStyles[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-none border-l-4 border-y border-r border-zinc-200 dark:border-dark-border ${border} ${bg} shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200`}
            >
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${text}`} />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-50 font-sans">
                  {t.title}
                </h4>
                {t.description && (
                  <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
