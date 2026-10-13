import { ReactNode } from "react";

// Label row and helper/error line shared by Input, Textarea and Select.

export function FieldLabel({ htmlFor, label, aside }: { htmlFor: string; label?: string; aside?: ReactNode }) {
  if (!label && !aside) return null;
  return (
    <div className="flex items-center justify-between gap-2 mb-1.5">
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-sans">
          {label}
        </label>
      )}
      {aside}
    </div>
  );
}

export function FieldMessage({ id, error, helperText }: { id: string; error?: string; helperText?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-destructive-600 dark:text-destructive-400 font-sans font-medium">
        {error}
      </p>
    );
  }
  return helperText ? (
    <p id={`${id}-helper`} className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
      {helperText}
    </p>
  ) : null;
}

export const describedBy = (id: string, error?: string, helperText?: string) => (error ? `${id}-error` : helperText ? `${id}-helper` : undefined);

// Border/focus styles for text controls.
export const controlClass = (error?: string) =>
  `w-full bg-white dark:bg-dark-card border rounded-none shadow-2xs transition-all duration-150 font-sans
   text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500
   focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed ${
     error
       ? "border-destructive-500 dark:border-destructive-500 focus:ring-destructive-500 focus:border-destructive-500"
       : "border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700"
   }`;
