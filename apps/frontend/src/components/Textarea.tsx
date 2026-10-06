import { TextareaHTMLAttributes, forwardRef, useId } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", id, rows = 3, maxLength, value, ...props }, ref) => {
    const defaultId = useId();
    const textareaId = id || defaultId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const length = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <div className="flex items-baseline justify-between mb-1.5">
            <label
              htmlFor={textareaId}
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-sans"
            >
              {label}
            </label>
            {maxLength && (
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums font-sans">
                {length}/{maxLength}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          maxLength={maxLength}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full bg-white dark:bg-dark-card border rounded-none shadow-2xs transition-all duration-150 font-sans px-3.5 py-2 text-sm resize-y
            text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500
            ${
              error
                ? "border-destructive-500 focus:ring-destructive-500 focus:border-destructive-500"
                : "border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700"
            }
            disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-destructive-600 dark:text-destructive-400 font-sans font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
