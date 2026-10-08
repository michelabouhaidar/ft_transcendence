import { ReactNode, useEffect, useId, useRef, useState, KeyboardEvent } from "react";
import { IconButton } from "./IconButton";

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** Short note shown instead of acting, e.g. "Current column". */
  hint?: string;
}

export interface MenuProps {
  /** Accessible name of the trigger, also its tooltip. */
  label: string;
  icon: ReactNode;
  items: MenuItem[];
  onSelect: (id: string) => void;
  /** Heading inside the panel, e.g. "Move to…". */
  title?: string;
  align?: "left" | "right";
  className?: string;
}

// Icon-triggered action menu (same panel style as Select). Arrow keys move, Enter picks, Escape closes.
export function Menu({ label, icon, items, onSelect, title, align = "right", className = "" }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActive(Math.max(0, items.findIndex((i) => !i.disabled)));
      listRef.current?.focus();
    }
  }, [isOpen]);

  const step = (dir: 1 | -1) => {
    if (!items.length) return;
    let i = active;
    for (let n = 0; n < items.length; n++) {
      i = (i + dir + items.length) % items.length;
      if (!items[i].disabled) break;
    }
    setActive(i);
  };

  const pick = (item: MenuItem | undefined) => {
    if (!item || item.disabled) return;
    setIsOpen(false);
    onSelect(item.id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-flex ${className}`} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <IconButton
        label={label}
        icon={icon}
        size="sm"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
      />
      {isOpen && (
        <div
          id={menuId}
          ref={listRef}
          role="menu"
          tabIndex={-1}
          aria-label={title || label}
          aria-activedescendant={`${menuId}-${active}`}
          onKeyDown={onKeyDown}
          className={`absolute top-full mt-1.5 z-50 min-w-44 bg-white dark:bg-dark-card border border-zinc-200/90 dark:border-zinc-800/90 shadow-xl rounded-none py-1 focus:outline-none animate-in fade-in zoom-in-95 duration-100 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {title && (
            <div className="px-3.5 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{title}</div>
          )}
          {items.map((item, i) => (
            <div
              key={item.id}
              id={`${menuId}-${i}`}
              role="menuitem"
              aria-disabled={item.disabled}
              onMouseEnter={() => !item.disabled && setActive(i)}
              onClick={() => pick(item)}
              className={`flex items-center justify-between gap-3 px-3.5 py-2 text-xs select-none ${
                item.disabled
                  ? "text-zinc-400 dark:text-zinc-600 cursor-default"
                  : i === active
                  ? "bg-zinc-100 dark:bg-dark-elevated text-zinc-900 dark:text-white cursor-pointer"
                  : "text-zinc-700 dark:text-zinc-200 cursor-pointer"
              }`}
            >
              <span className="flex items-center gap-2.5">
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
              </span>
              {item.hint && <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{item.hint}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
