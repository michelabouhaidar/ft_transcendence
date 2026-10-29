import { Moon, Sun } from "lucide-react";
import { useApp } from "../context/AppContext";

// "switch": sun / switch / moon (headers). "pill": a single icon button (landing footer).
export function ThemeToggle({ variant = "switch", className = "" }: { variant?: "switch" | "pill"; className?: string }) {
  const { theme, setTheme, toggleTheme } = useApp();
  const isDark = theme === "dark";
  const next = isDark ? "light" : "dark";

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${next} mode`}
        title={`Switch to ${next} mode`}
        className={`inline-flex items-center justify-center gap-1.5 h-7 px-2 rounded-none transition-all duration-200 border text-xs font-sans font-semibold tracking-wide
          bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-dark-card dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700
          focus:outline-none focus:ring-2 focus:ring-brand-600/40 cursor-pointer ${className}`}
      >
        {isDark ? (
          <Sun className="w-3.5 h-3.5 text-warning-500 fill-warning-500 transition-transform rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-brand-600 fill-current transition-transform rotate-0 hover:-rotate-12" />
        )}
      </button>
    );
  }

  const iconButton = (mode: "light" | "dark", active: boolean) => (
    <button
      type="button"
      onClick={() => setTheme(mode)}
      aria-label={`Switch to ${mode} mode`}
      title={mode === "light" ? "Light mode" : "Dark mode"}
      className={`flex items-center justify-center p-0.5 rounded-none transition-all duration-200 cursor-pointer ${
        !active
          ? "text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
          : mode === "light"
          ? "text-warning-400 drop-shadow-[0_0_6px_theme(colors.warning.400/70%)] scale-105"
          : "text-brand-400 drop-shadow-[0_0_6px_theme(colors.brand.400/70%)] scale-105"
      }`}
    >
      {mode === "light" ? (
        <Sun className={`h-3.5 w-3.5 transition-transform duration-200 ${active ? "fill-warning-400/20" : ""}`} />
      ) : (
        <Moon className={`h-3.5 w-3.5 transition-transform duration-200 ${active ? "fill-brand-400/20" : ""}`} />
      )}
    </button>
  );

  return (
    <div role="group" aria-label="Color scheme toggle" className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {iconButton("light", !isDark)}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${next} mode`}
        onClick={toggleTheme}
        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border border-white/15 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-brand-500/50 ${
          isDark ? "bg-brand-600" : "bg-zinc-600 hover:bg-zinc-500"
        }`}
      >
        <span className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white transition-transform duration-200 ease-in-out ${isDark ? "translate-x-3" : "translate-x-0"}`} />
      </button>
      {iconButton("dark", isDark)}
    </div>
  );
}
