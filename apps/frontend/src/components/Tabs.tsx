import { ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "segmented" | "underline";
  size?: "sm" | "md";
  className?: string;
}

const STYLES = {
  segmented: {
    list: "inline-flex items-center p-1 bg-zinc-100 dark:bg-dark-card border border-zinc-200/80 dark:border-zinc-800/80 rounded-none",
    tab: "rounded-none",
    active: "bg-brand-600 text-white",
    idle: "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white",
    countActive: "bg-white/20 text-white",
    countIdle: "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  },
  underline: {
    list: "flex items-center border-b border-zinc-200/80 dark:border-zinc-800/80 gap-6",
    tab: "pb-2.5 pt-1 border-b-2 text-xs sm:text-sm",
    active: "border-brand-600 text-brand-600 dark:text-brand-400 font-semibold",
    idle: "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700",
    countActive: "bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300",
    countIdle: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  },
};

export function Tabs({ tabs, activeTab, onChange, variant = "underline", size = "md", className = "" }: TabsProps) {
  const s = STYLES[variant];
  const sizeClass = variant === "segmented" ? (size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm") : "";
  return (
    <div role="tablist" className={`${s.list} ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            disabled={tab.disabled}
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 font-sans font-medium transition-all duration-150 cursor-pointer ${s.tab} ${sizeClass} ${isActive ? s.active : s.idle} ${
              tab.disabled ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-none font-sans font-medium tabular-nums ${isActive ? s.countActive : s.countIdle}`}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
