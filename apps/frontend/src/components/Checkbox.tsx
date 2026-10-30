import { ComponentProps, ReactNode, useId } from "react";

export interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  label: ReactNode;
  // Secondary line under the label (what the option does, or why it's disabled).
  description?: ReactNode;
  // "card" wraps the control in a bordered, clickable box.
  variant?: "plain" | "card";
}

export function Checkbox({ label, description, variant = "plain", disabled, className = "", id, ...props }: CheckboxProps) {
  const defaultId = useId();
  const checkboxId = id || defaultId;
  const isCard = variant === "card";
  return (
    <label
      htmlFor={checkboxId}
      className={`flex items-start gap-2.5 select-none font-sans ${
        isCard ? "p-3 border border-zinc-200 dark:border-dark-border hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors" : ""
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      <input
        id={checkboxId}
        type="checkbox"
        disabled={disabled}
        aria-describedby={description ? `${checkboxId}-description` : undefined}
        className="mt-0.5 h-4 w-4 shrink-0 rounded-none accent-brand-600 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-dark-bg"
        {...props}
      />
      <span className="min-w-0">
        <span className={`block ${isCard ? "text-sm font-semibold text-zinc-900 dark:text-white" : "text-xs text-zinc-600 dark:text-zinc-400"}`}>{label}</span>
        {description && (
          <span id={`${checkboxId}-description`} className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
