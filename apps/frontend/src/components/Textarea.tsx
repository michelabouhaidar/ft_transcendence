import { ComponentProps, useId } from "react";
import { FieldLabel, FieldMessage, controlClass, describedBy } from "./Field";

export interface TextareaProps extends ComponentProps<"textarea"> {
  label?: string;
  error?: string;
  helperText?: string;
}

// With maxLength set, the label row shows a live character counter.
export function Textarea({ label, error, helperText, className = "", id, rows = 3, maxLength, value, ...props }: TextareaProps) {
  const defaultId = useId();
  const textareaId = id || defaultId;
  const counter = label && maxLength && (
    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums font-sans">
      {typeof value === "string" ? value.length : 0}/{maxLength}
    </span>
  );

  return (
    <div className="w-full">
      <FieldLabel htmlFor={textareaId} label={label} aside={counter} />
      <textarea
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(textareaId, error, helperText)}
        className={`${controlClass(error)} px-3.5 py-2 text-sm resize-y ${className}`}
        {...props}
      />
      <FieldMessage id={textareaId} error={error} helperText={helperText} />
    </div>
  );
}
