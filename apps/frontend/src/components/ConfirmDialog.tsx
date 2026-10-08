import { useState, useEffect, ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";
import { AlertTriangle, Trash2, CheckCircle2 } from "lucide-react";

export type ConfirmDialogVariant = "danger" | "warning" | "primary";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  typedConfirmationText?: string;
  isLoading?: boolean;
  /** Blocks the confirm button without showing a spinner (e.g. a rule forbids the action). */
  confirmDisabled?: boolean;
  /** Extra content between the description and the typed confirmation. */
  children?: ReactNode;
}

const variantConfig: Record<
  ConfirmDialogVariant,
  {
    icon: typeof AlertTriangle;
    iconBg: string;
    iconColor: string;
    buttonVariant: "destructive" | "primary" | "secondary";
  }
> = {
  danger: {
    icon: Trash2,
    iconBg: "bg-destructive-50 dark:bg-destructive-950/30",
    iconColor: "text-destructive-600 dark:text-destructive-400",
    buttonVariant: "destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-warning-50 dark:bg-warning-950/30",
    iconColor: "text-warning-600 dark:text-warning-400",
    buttonVariant: "primary",
  },
  primary: {
    icon: CheckCircle2,
    iconBg: "bg-brand-50 dark:bg-brand-950/30",
    iconColor: "text-brand-600 dark:text-brand-400",
    buttonVariant: "primary",
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  typedConfirmationText,
  isLoading = false,
  confirmDisabled = false,
  children,
}: ConfirmDialogProps) {
  const [typedInput, setTypedInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTypedInput("");
      setSubmitting(false);
    }
  }, [isOpen]);

  const config = variantConfig[variant];
  const Icon = config.icon;

  const isConfirmDisabled =
    confirmDisabled ||
    isLoading ||
    submitting ||
    (Boolean(typedConfirmationText) && typedInput.trim() !== typedConfirmationText);

  const handleConfirm = async () => {
    if (isConfirmDisabled) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // The caller reports the error; keep the dialog open so it can retry.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-none shrink-0 ${config.iconBg} ${config.iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans pt-1">
            {description}
          </p>
        </div>

        {children}

        {typedConfirmationText && (
          <div className="pt-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-sans">
              To proceed, please type{" "}
              <strong className="font-sans font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-dark-elevated px-1.5 py-0.5 border border-zinc-200 dark:border-dark-border">
                {typedConfirmationText}
              </strong>{" "}
              below:
            </p>
            <Input
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={`Type "${typedConfirmationText}" to confirm`}
              autoFocus
            />
          </div>
        )}

        <div className="pt-4 border-t border-zinc-100 dark:border-dark-border flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading || submitting}>
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            isLoading={isLoading || submitting}
            disabled={isConfirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
