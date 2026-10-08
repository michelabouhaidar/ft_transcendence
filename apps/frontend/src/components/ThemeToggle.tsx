import React from "react";
import { Sun, Moon } from "lucide-react";

export interface ThemeToggleProps {
  theme?: "light" | "dark";
  onToggle?: () => void;
  onThemeChange?: (theme: "light" | "dark") => void;
  className?: string;
  showLabel?: boolean;
  variant?: "switch" | "segmented" | "pill" | "button";
}

export function ThemeToggle({
  theme: controlledTheme,
  onToggle,
  onThemeChange,
  className = "",
  showLabel = false,
  variant = "switch",
}: ThemeToggleProps) {
  const [internalTheme, setInternalTheme] = React.useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("trenno-theme");
      if (saved === "dark" || saved === "light") {
        return saved;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  const isControlled = controlledTheme !== undefined;
  const currentTheme = isControlled ? controlledTheme : internalTheme;

  const setMode = (mode: "light" | "dark") => {
    if (mode === currentTheme) return;
    if (onThemeChange) {
      onThemeChange(mode);
    } else if (onToggle) {
      onToggle();
    } else {
      setInternalTheme(mode);
      if (typeof document !== "undefined") {
        if (mode === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      localStorage.setItem("trenno-theme", mode);
    }
  };

  const handleToggle = () => {
    setMode(currentTheme === "dark" ? "light" : "dark");
  };

  if (variant === "switch" || variant === "segmented") {
    const isDark = currentTheme === "dark";
    return (
      <div
        role="group"
        aria-label="Color scheme toggle"
        className={`inline-flex items-center gap-1.5 select-none ${className}`}
      >
        {/* Light State Icon (Sun) - next to left direction */}
        <button
          type="button"
          onClick={() => setMode("light")}
          aria-label="Switch to light mode"
          title="Light mode"
          className={`flex items-center justify-center p-0.5 rounded-none transition-all duration-200 cursor-pointer ${
            !isDark
              ? "text-warning-400 drop-shadow-[0_0_6px_theme(colors.warning.400/70%)] scale-105"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Sun className={`h-3.5 w-3.5 transition-transform duration-200 ${!isDark ? "fill-warning-400/20" : ""}`} />
        </button>

        {/* Simple Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          onClick={handleToggle}
          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border border-white/15 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-brand-500/50 ${
            isDark ? "bg-brand-600" : "bg-zinc-600 hover:bg-zinc-500"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
              isDark ? "translate-x-3" : "translate-x-0"
            }`}
          />
        </button>

        {/* Dark State Icon (Moon) - next to right direction */}
        <button
          type="button"
          onClick={() => setMode("dark")}
          aria-label="Switch to dark mode"
          title="Dark mode"
          className={`flex items-center justify-center p-0.5 rounded-none transition-all duration-200 cursor-pointer ${
            isDark
              ? "text-brand-400 drop-shadow-[0_0_6px_theme(colors.brand.400/70%)] scale-105"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Moon className={`h-3.5 w-3.5 transition-transform duration-200 ${isDark ? "fill-brand-400/20" : ""}`} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
      className={`inline-flex items-center justify-center gap-1.5 h-7 px-2 rounded-none transition-all duration-200 border text-xs font-sans font-semibold tracking-wide
        bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-300 shadow-xs
        dark:bg-dark-card dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700
        focus:outline-none focus:ring-2 focus:ring-brand-600/40 cursor-pointer ${className}`}
    >
      {currentTheme === "dark" ? (
        <>
          <Sun className="w-3.5 h-3.5 text-warning-500 fill-warning-500 transition-transform rotate-0 hover:rotate-45" />
          {showLabel && <span>Light</span>}
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-brand-600 fill-current transition-transform rotate-0 hover:-rotate-12" />
          {showLabel && <span>Dark</span>}
        </>
      )}
    </button>
  );
}
