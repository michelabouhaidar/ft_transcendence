import { CSSProperties, KeyboardEvent, ReactNode, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { useClickOutside } from "../lib/hooks";
import { FieldLabel, FieldMessage, describedBy } from "./Field";

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
}

export function Select({ label, value, onChange, options, placeholder = "Select an option...", disabled = false, error, helperText, className = "" }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [listStyle, setListStyle] = useState<CSSProperties | null>(null);
  const selectId = useId();
  const selected = options.find((o) => o.value === value);
  useClickOutside([containerRef, listRef], () => setIsOpen(false), isOpen);

  // The list is rendered on <body> with fixed coordinates, so a scrolling parent (like a dialog body)
  // can't clip it or grow a scrollbar; the list scrolls on its own instead. It opens upward when there's
  // more room above, and follows the field when the page or dialog scrolls.
  useLayoutEffect(() => {
    if (!isOpen) {
      setListStyle(null);
      return;
    }
    const place = () => {
      const r = buttonRef.current?.getBoundingClientRect();
      if (!r) return;
      const gap = 6;
      const margin = 8;
      const below = window.innerHeight - r.bottom - gap - margin;
      const above = r.top - gap - margin;
      const openUp = below < 180 && above > below;
      setListStyle({
        position: "fixed",
        left: r.left,
        width: r.width,
        maxHeight: Math.max(120, Math.min(288, openUp ? above : below)),
        ...(openUp ? { bottom: window.innerHeight - r.top + gap } : { top: r.bottom + gap }),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [isOpen]);

  // Enter/Space toggle, Escape closes, arrows step through the options.
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const index = options.findIndex((o) => o.value === value);
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((o) => !o);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      else if (index < options.length - 1) onChange(options[index + 1].value);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen && index > 0) onChange(options[index - 1].value);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <FieldLabel htmlFor={selectId} label={label} />
      <button
        ref={buttonRef}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(selectId, error, helperText)}
        className={`w-full flex items-center justify-between bg-white dark:bg-dark-card border rounded-none px-3.5 py-2 text-sm shadow-2xs transition-all duration-150 text-left focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 cursor-pointer ${
          disabled
            ? "opacity-50 cursor-not-allowed border-zinc-200 dark:border-zinc-800"
            : isOpen
            ? "border-brand-600 ring-2 ring-brand-600/20"
            : error
            ? "border-destructive-500 focus:border-destructive-500"
            : "border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700"
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
          <span className={`font-sans ${selected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}`}>{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-brand-600" : ""}`} />
      </button>

      {isOpen &&
        listStyle &&
        createPortal(
          <div
            ref={listRef}
            role="listbox"
            style={listStyle}
            className="z-[60] bg-white dark:bg-dark-card border border-zinc-200/90 dark:border-zinc-800/90 shadow-xl rounded-none overflow-y-auto overscroll-contain py-1 font-sans animate-in fade-in zoom-in-95 duration-100"
          >
            {options.length === 0 && <div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500 text-center font-sans">No options available</div>}
            {options.map((option) => {
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
                  className={`flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors cursor-pointer select-none ${
                    isSelected
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-semibold"
                      : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-dark-elevated"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <div className="min-w-0">
                      <div className="leading-snug">{option.label}</div>
                      {option.description && <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{option.description}</div>}
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-brand-600 shrink-0 ml-2" />}
                </div>
              );
            })}
          </div>,
          document.body
        )}

      <FieldMessage id={selectId} error={error} helperText={helperText} />
    </div>
  );
}