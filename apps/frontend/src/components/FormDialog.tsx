import { SubmitEvent, ReactNode } from "react";
import { Modal, ModalProps } from "./Modal";
import { Alert } from "./Alert";
import { Button } from "./Button";

interface FormDialogProps extends Omit<ModalProps, "children"> {
  onSubmit: () => void;
  submitLabel: string;
  busy?: boolean;
  submitDisabled?: boolean;
  error?: string | null;
  onDismissError?: () => void;
  /** Left side of the footer, e.g. a note about the result. */
  footerNote?: ReactNode;
  className?: string;
  children: ReactNode;
}

// A dialog with a form: dismissible error on top, Cancel / submit at the bottom.
export function FormDialog({ onSubmit, submitLabel, busy, submitDisabled, error, onDismissError, footerNote, className = "space-y-4", children, ...modal }: FormDialogProps) {
  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <Modal {...modal}>
      <form onSubmit={submit} className={className}>
        {error && (
          <Alert variant="error" onClose={onDismissError}>
            {error}
          </Alert>
        )}
        {children}
        <div className={`flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-dark-border ${footerNote ? "justify-between" : "justify-end"}`}>
          {footerNote}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={modal.onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" isLoading={busy} disabled={submitDisabled}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
