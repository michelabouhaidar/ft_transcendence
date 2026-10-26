import { ReactNode, useState } from "react";
import { LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { AccountButton, AccountModal, Button, IconButton, Input, LegalLink, Logo, Sidebar, ThemeToggle } from "../components";
import { NotificationBell } from "./notifications/NotificationBell";

interface AppLayoutProps {
  /** "workspace": org pages; "admin": System Admin pages; "plain": no sidebar (unaffiliated users). */
  variant?: "workspace" | "admin" | "plain";
  /** Breadcrumb shown in the admin header, e.g. "Users / Ada Lovelace". */
  trail?: ReactNode;
  children: ReactNode;
}

const MAIN = {
  workspace: "max-w-7xl p-4 sm:p-8 space-y-8",
  admin: "max-w-7xl px-4 sm:px-8 py-6 sm:py-8",
  plain: "max-w-5xl p-4 sm:p-8 space-y-8",
};

// Shell for signed-in pages: sidebar, header, footer, account and legal dialogs.
export function AppLayout({ variant = "workspace", trail, children }: AppLayoutProps) {
  const { user, organization, logout } = useAuth();
  const { navigate } = useApp();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasSidebar = variant !== "plain";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-dark-bg text-zinc-900 dark:text-zinc-100 flex transition-colors font-sans selection:bg-brand-600 selection:text-white">
      {hasSidebar && <Sidebar onOpenAccountModal={() => setAccountOpen(true)} isMobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className={`sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-dark-border bg-white/95 dark:bg-dark-bg/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-3 ${variant === "admin" ? "h-14" : "h-16 shadow-2xs"}`}>
          <div className="flex items-center gap-3 min-w-0">
            {hasSidebar ? (
              <IconButton label="Open sidebar navigation" icon={<Menu className="w-5 h-5" />} onClick={() => setMobileOpen(true)} className="md:hidden" />
            ) : (
              <div onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer select-none" title="Trenno Home">
                <Logo size="sm" />
              </div>
            )}
            {variant === "workspace" && <span className="font-semibold text-sm text-zinc-950 dark:text-white font-sans">{organization?.name}</span>}
            {variant === "admin" && (
              <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                {trail}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {variant === "workspace" && <HeaderSearch />}
            <NotificationBell allPath={variant === "admin" ? "/admin/notifications" : "/notifications"} />
            <ThemeToggle />
            {user && <AccountButton user={user} onClick={() => setAccountOpen(true)} />}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              className="text-xs"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
            >
              Sign Out
            </Button>
          </div>
        </header>

        <main className={`flex-1 w-full mx-auto ${MAIN[variant]}`}>{children}</main>

        <footer className="py-6 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-dark-border font-sans">
          <div>
            &copy; {new Date().getFullYear()} <span className="font-semibold text-zinc-900 dark:text-white">Trenno</span>. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <LegalLink to="privacy" className="hover:text-zinc-900 dark:hover:text-white" />
            <span aria-hidden="true">&middot;</span>
            <LegalLink to="terms" className="hover:text-zinc-900 dark:hover:text-white" />
          </div>
        </footer>
      </div>

      <AccountModal isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  );
}

// SRCH-01: the header box opens the search page with the text.
function HeaderSearch() {
  const { navigate } = useApp();
  const [query, setQuery] = useState("");
  return (
    <form
      role="search"
      className="hidden sm:block w-56"
      onSubmit={(e) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
        // Already on /search: let the page re-read the URL.
        window.dispatchEvent(new PopStateEvent("popstate"));
        setQuery("");
      }}
    >
      <Input
        type="search"
        inputSize="sm"
        aria-label="Search tasks"
        placeholder="Search tasks…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={<Search className="w-3.5 h-3.5" />}
      />
    </form>
  );
}

// "Admin / Users / Ada Lovelace" trail; earlier crumbs with a path are links.
export function Trail({ items }: { items: Array<{ label: string; path?: string }> }) {
  const { navigate } = useApp();
  return (
    <ol className="flex items-center gap-1.5 min-w-0">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <li key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && (
              <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">
                /
              </span>
            )}
            {item.path && !isLast ? (
              <Button variant="quiet" className="font-normal" onClick={() => navigate(item.path!)}>
                {item.label}
              </Button>
            ) : (
              <span aria-current={isLast ? "page" : undefined} className={`truncate ${isLast ? "font-semibold text-zinc-900 dark:text-white" : ""}`}>
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}