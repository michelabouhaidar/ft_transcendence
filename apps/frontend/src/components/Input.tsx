import { ComponentProps, ReactNode, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FieldLabel, FieldMessage, controlClass, describedBy } from "./Field";

export interface InputProps extends Omit<ComponentProps<"input">, "size"> {
  label?: string;
  /** Small action shown at the right of the label, e.g. a "Forgot password?" link. */
  labelAction?: ReactNode;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

const SIZES = { sm: "px-3 py-1.5 text-xs", md: "px-3.5 py-2 text-sm", lg: "px-4 py-2.5 text-base" };

export function Input({ label, labelAction, error, helperText, leftIcon, inputSize = "md", className = "", id, type, ...props }: InputProps) {
  const defaultId = useId();
  const inputId = id || defaultId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="w-full">
      <FieldLabel htmlFor={inputId} label={label} aside={labelAction} />
      <div className="relative flex items-center">
        {leftIcon && <div className="absolute left-3 text-zinc-400 dark:text-zinc-500 pointer-events-none flex items-center">{leftIcon}</div>}
        <input
          id={inputId}
          type={isPassword && showPassword ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(inputId, error, helperText)}
          className={`${controlClass(error)} ${SIZES[inputSize]} ${leftIcon ? "pl-9" : ""} ${isPassword ? "pr-10" : ""} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 focus:outline-none focus:text-brand-600 transition-colors p-1 rounded-md cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      <FieldMessage id={inputId} error={error} helperText={helperText} />
    </div>
  );
}
