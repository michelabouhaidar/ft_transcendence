import {
  InputHTMLAttributes,
  ReactNode,
  forwardRef,
  useId,
  useState,
} from "react";
import { Eye, EyeOff } from "lucide-react";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  /** Small action shown at the right of the label, e.g. a "Forgot password?" link. */
  labelAction?: ReactNode;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  inputSize?: InputSize;
  showPasswordToggle?: boolean;
}

const sizeStyles: Record<InputSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-3.5 py-2 text-sm",
  lg: "px-4 py-2.5 text-base",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelAction,
      error,
      helperText,
      leftIcon,
      rightIcon,
      inputSize = "md",
      className = "",
      id,
      type,
      showPasswordToggle = true,
      ...props
    },
    ref
  ) => {
    const defaultId = useId();
    const inputId = id || defaultId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const effectiveType = isPassword && showPassword ? "text" : type;

    const describedBy = error ? errorId : helperText ? helperId : undefined;

    const hasRightContent = Boolean(
      rightIcon || (isPassword && showPasswordToggle)
    );

    return (
      <div className="w-full">
        {(label || labelAction) && (
          <div className="flex items-center justify-between gap-2 mb-1.5">
            {label && (
              <label
                htmlFor={inputId}
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-sans"
              >
                {label}
              </label>
            )}
            {labelAction}
          </div>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-zinc-400 dark:text-zinc-500 pointer-events-none shrink-0 flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`w-full bg-white dark:bg-dark-card border rounded-none shadow-2xs transition-all duration-150 font-sans
              text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500
              focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500
              ${sizeStyles[inputSize]}
              ${leftIcon ? "pl-9" : ""}
              ${hasRightContent ? "pr-10" : ""}
              ${
                error
                  ? "border-destructive-500 dark:border-destructive-500 focus:ring-destructive-500 focus:border-destructive-500"
                  : "border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700"
              }
              disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          />

          {rightIcon ? (
            <div className="absolute right-3 text-zinc-400 dark:text-zinc-500 shrink-0 flex items-center justify-center">
              {rightIcon}
            </div>
          ) : isPassword && showPasswordToggle ? (
            <div className="absolute right-3 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 focus:outline-none focus:text-brand-600 transition-colors p-1 rounded-md cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          ) : null}
        </div>

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-xs text-destructive-600 dark:text-destructive-400 font-sans font-medium"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-sans"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
