import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

// The current path with a tiny history-based router, and the light/dark theme.
export type Theme = "light" | "dark";
export const AUTH_ROUTES = ["/login", "/signup", "/verify", "/forgot-password", "/reset-password"];

interface AppContextValue {
  path: string;
  navigate: (to: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function initialTheme(): Theme {
  const saved = localStorage.getItem("trenno-theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [path, setPath] = useState(window.location.pathname);
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("trenno-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (to: string) => {
    // Signed in: the auth pages lead to the workspace instead.
    const target = user && AUTH_ROUTES.includes(to) ? "/onboarding" : to;
    window.history.pushState({}, "", target);
    setPath(target.split("?")[0]);
    window.scrollTo(0, 0);
  };

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return <AppContext.Provider value={{ path, navigate, theme, setTheme, toggleTheme }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}
