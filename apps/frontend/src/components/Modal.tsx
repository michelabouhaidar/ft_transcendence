import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: keyof typeof WIDTHS;
  /** Extra controls in the header, left of the close button (e.g. an actions menu). */
  headerActions?: ReactNode;
  /** Content above the title, e.g. a breadcrumb. */
  eyebrow?: ReactNode;
}

const WIDTHS = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl", "2xl": "max-w-2xl", "4xl": "max-w-4xl", "6xl": "max-w-6xl" };

export function Modal({ isOpen, onClose, title, description, children, maxWidth = "md", headerActions, eyebrow }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" onClick={onClose} aria-hidden="true" />
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby={description ? "modal-description" : undefined}
          className={`relative w-full ${WIDTHS[maxWidth]} max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col bg-white dark:bg-dark-card rounded-none border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl z-10 text-left transform transition-all animate-in zoom-in-95 duration-150`}
        >
          <div className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/60 flex items-start justify-between shrink-0 bg-white dark:bg-dark-card z-10">
            <div className="min-w-0">
              {eyebrow && <div className="mb-1">{eyebrow}</div>}
              <h3 id="modal-title" className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
                {title}
              </h3>
              {description && (
                <p id="modal-description" className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-sans leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              {headerActions}
              <IconButton label="Close dialog" icon={<X className="h-5 w-5" />} onClick={onClose} size="sm" />
            </div>
          </div>
          <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 font-sans">{children}</div>
        </div>
      </div>
    </div>
  );
}
