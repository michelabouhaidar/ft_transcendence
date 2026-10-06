import {
  useState,
  useRef,
  useEffect,
  ReactNode,
  KeyboardEvent,
  useId,
} from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  description?: string;
}

export interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  id?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  error,
  helperText,
  className = "",
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultId = useId();
  const selectId = id || defaultId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  const selectedOption = options.find((opt) => opt.value === value);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        if (currentIndex < options.length - 1) {
          onChange(options[currentIndex + 1].value);
        }
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen) {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        if (currentIndex > 0) {
          onChange(options[currentIndex - 1].value);
        }
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 font-sans"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`w-full flex items-center justify-between bg-white dark:bg-dark-card border rounded-none px-3.5 py-2 text-sm shadow-2xs transition-all duration-150 text-left
          ${
            disabled
              ? "opacity-50 cursor-not-allowed border-zinc-200 dark:border-zinc-800"
              : isOpen
              ? "border-brand-600 ring-2 ring-brand-600/20"
              : error
              ? "border-destructive-500 focus:border-destructive-500"
              : "border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700"
          }
          focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 cursor-pointer`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span
            className={
              selectedOption
                ? "text-zinc-900 dark:text-zinc-100 font-sans"
                : "text-zinc-400 dark:text-zinc-500 font-sans"
            }
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <ChevronDown
          className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-brand-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-dark-card border border-zinc-200/90 dark:border-zinc-800/90 shadow-xl rounded-none max-h-72 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500 text-center font-sans">
              No options available
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors cursor-pointer select-none
                    ${
                      isSelected
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-semibold"
                        : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-dark-elevated"
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <div className="min-w-0">
                      <div className="leading-snug">{option.label}</div>
                      {option.description && (
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-brand-600 shrink-0 ml-2" />}
                </div>
              );
            })
          )}
        </div>
      )}

      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-destructive-600 dark:text-destructive-400 font-sans">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
