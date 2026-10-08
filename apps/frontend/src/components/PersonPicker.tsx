import { KeyboardEvent, ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Search, UserX } from "lucide-react";
import { Avatar } from "./Avatar";

export interface PersonPickerPerson {
  id: string;
  name: string;
  avatarPath?: string | null;
  /** Live online dot (only shown for people whose status the viewer may see). */
  status?: "online" | "offline";
  /** Short note under the name, e.g. "Friend · Online" or "Org Admin". */
  description?: string;
}

export interface PersonPickerProps {
  /** Accessible name of the trigger, e.g. "Assignee of WEB-12". */
  label: string;
  people: PersonPickerPerson[];
  /** Selected person id; null = nobody. */
  value: string | null;
  onChange: (id: string | null) => void;
  /** Offer "Unassigned" (default true). */
  allowNone?: boolean;
  /** When set and in `people`, offers "Assign to me" at the top. */
  currentUserId?: string;
  disabled?: boolean;
  /** "inline": avatar + name (detail views, tables); "avatar": avatar only (cards). */
  variant?: "inline" | "avatar";
  align?: "left" | "right";
  /** Shown when `value` is set but not in `people` (e.g. someone who lost access). */
  fallback?: PersonPickerPerson | null;
  className?: string;
}

// Click the person to change them, in place (Jira-style): a small searchable list opens under it.
// Arrow keys move, Enter picks, Escape closes. Read-only when disabled.
export function PersonPicker({
  label,
  people,
  value,
  onChange,
  allowNone = true,
  currentUserId,
  disabled = false,
  variant = "inline",
  align = "left",
  fallback = null,
  className = "",
}: PersonPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Fixed to the window so scrolling boards, tables and dialogs can't clip it.
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });
  const listId = useId();

  const selected = people.find((p) => p.id === value) ?? (value && fallback?.id === value ? fallback : null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: Array<{ id: string | null; key: string; label: string; person?: PersonPickerPerson; icon?: ReactNode; hint?: string }> = [];
    const me = currentUserId ? people.find((p) => p.id === currentUserId) : undefined;
    if (me && value !== me.id && (!q || "assign to me".includes(q) || me.name.toLowerCase().includes(q))) {
      out.push({ id: me.id, key: "__me", label: "Assign to me", person: me });
    }
    if (allowNone && (!q || "unassigned".includes(q))) {
      out.push({ id: null, key: "__none", label: "Unassigned", icon: <UserX className="w-4 h-4 text-zinc-400" /> });
    }
    for (const p of people) {
      if (q && !p.name.toLowerCase().includes(q)) continue;
      out.push({ id: p.id, key: p.id, label: p.name, person: p, hint: p.description });
    }
    return out;
  }, [people, query, allowNone, currentUserId, value]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) {
      const width = 288;
      const left = Math.max(8, Math.min(align === "right" ? r.right - width : r.left, window.innerWidth - width - 8));
      // Opens upwards when there isn't room below.
      setPos(r.bottom + 360 > window.innerHeight && r.top > 360 ? { left, bottom: window.innerHeight - r.top + 6 } : { left, top: r.bottom + 6 });
    }
    const inside = (t: EventTarget | null) =>
      t instanceof Node && Boolean(rootRef.current?.contains(t) || panelRef.current?.contains(t));
    const close = (e: MouseEvent) => {
      if (!inside(e.target)) setOpen(false);
    };
    const dismiss = (e: Event) => {
      if (!inside(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open, align]);

  useEffect(() => setActive(0), [query]);

  const pick = (id: string | null) => {
    setOpen(false);
    if (id !== value) onChange(id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[active]) pick(items[active].id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const avatar = (p: PersonPickerPerson | null, size: "xs" | "sm" = "xs") =>
    p ? (
      <Avatar size={size} name={p.name} src={p.avatarPath || undefined} colorSeed={p.id} status={p.status} />
    ) : (
      <span
        className={`${size === "xs" ? "h-6 w-6" : "h-8 w-8"} inline-flex items-center justify-center rounded-full border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400`}
        aria-hidden="true"
      >
        <UserX className="w-3 h-3" />
      </span>
    );

  return (
    <div
      ref={rootRef}
      className={`relative ${variant === "avatar" ? "inline-flex" : "flex"} ${className}`}
      // Inside draggable cards and clickable rows: don't drag or open the row.
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={`${label}: ${selected?.name ?? "Unassigned"}${disabled ? "" : ". Click to change"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={disabled ? selected?.name ?? "Unassigned" : `${selected?.name ?? "Unassigned"} — click to change`}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 min-w-0 rounded-none border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
          disabled ? "cursor-default" : "cursor-pointer hover:bg-zinc-100 hover:border-zinc-200 dark:hover:bg-dark-elevated dark:hover:border-dark-border"
        } ${variant === "avatar" ? "p-0.5" : "px-1.5 py-1 -mx-1.5 max-w-full"} ${open ? "bg-zinc-100 border-zinc-200 dark:bg-dark-elevated dark:border-dark-border" : ""}`}
      >
        {avatar(selected)}
        {variant === "inline" && (
          <span className={`truncate text-sm ${selected ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500"}`}>
            {selected?.name ?? "Unassigned"}
          </span>
        )}
      </button>

      {open &&
        // In a portal: a transformed ancestor (dialogs animate with transform) would otherwise
        // become the reference for position: fixed.
        createPortal(
        <div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom }}
          className="fixed z-[60] w-72 bg-white dark:bg-dark-card border border-zinc-200/90 dark:border-zinc-800/90 shadow-xl animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search people…"
                aria-label="Search people"
                aria-controls={listId}
                aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-white dark:bg-dark-card border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
              />
            </div>
          </div>
          <ul id={listId} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto py-1">
            {items.length === 0 && <li className="px-3 py-3 text-xs text-center text-zinc-400">Nobody matches</li>}
            {items.map((item, i) => {
              const isSelected = item.id === value;
              return (
                <li
                  key={item.key}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer select-none ${
                    i === active ? "bg-zinc-100 dark:bg-dark-elevated" : ""
                  } ${isSelected ? "text-brand-700 dark:text-brand-300 font-semibold" : "text-zinc-700 dark:text-zinc-200"}`}
                >
                  {item.person ? avatar(item.person) : <span className="w-6 flex justify-center">{item.icon}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.label}</span>
                    {item.hint && <span className="block text-[11px] font-normal text-zinc-400 dark:text-zinc-500 truncate">{item.hint}</span>}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-brand-600" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
