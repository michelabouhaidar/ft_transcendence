import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";
type Show = (title: string, description?: string) => void;
type ToastApi = Record<ToastType, Show>;

interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

const STYLES = {
  success: { border: "border-success-500", text: "text-success-600 dark:text-success-400", icon: CheckCircle2 },
  error: { border: "border-destructive-500", text: "text-destructive-600 dark:text-destructive-400", icon: AlertCircle },
  warning: { border: "border-warning-500", text: "text-warning-600 dark:text-warning-400", icon: AlertTriangle },
  info: { border: "border-info-500", text: "text-info-600 dark:text-info-400", icon: Info },
};

const ToastContext = createContext<ToastApi | undefined>(undefined);
let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const remove = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const api = useMemo(() => {
    const show = (type: ToastType): Show => (title, description) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => remove(id), 4000);
    };
    return { success: show("success"), error: show("error"), warning: show("warning"), info: show("info") };
  }, [remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const { border, text, icon: Icon } = STYLES[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-none border-l-4 border-y border-r border-zinc-200 dark:border-dark-border ${border} bg-white dark:bg-dark-card shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200`}
            >
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${text}`} />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-50 font-sans">{t.title}</h4>
                {t.description && <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => remove(t.id)}
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
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
