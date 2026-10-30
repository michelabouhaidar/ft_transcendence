import { ReactNode, useState } from "react";
import { Bell, Building2, FolderKanban, Lock, PanelLeftClose, Rocket, Search, Settings, ShieldAlert, UserCheck, Users, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { Avatar } from "./Avatar";
import { IconButton } from "./IconButton";
import { Logo } from "./Logo";

interface SidebarProps {
  onOpenAccountModal: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  active: (path: string) => boolean;
}

const icon = (Icon: typeof Bell) => <Icon className="w-4 h-4 shrink-0" />;
const exact = (p: string) => (path: string) => path === p;

const WORKSPACE: NavItem[] = [
  { label: "Projects", path: "/projects", icon: icon(FolderKanban), active: (p) => p === "/projects" || p === "/onboarding" || p.startsWith("/projects/") },
  { label: "Search", path: "/search", icon: icon(Search), active: exact("/search") },
  { label: "Notifications", path: "/notifications", icon: icon(Bell), active: exact("/notifications") },
  { label: "Friends", path: "/friends", icon: icon(UserCheck), active: exact("/friends") },
];
const MEMBERS: NavItem = { label: "Members", path: "/org/members", icon: icon(Users), active: (p) => p === "/org/members" || p === "/org/invitations" || p.startsWith("/users/") };
const ORGANIZATION: NavItem[] = [
  { label: "Workspace Settings", path: "/org/settings", icon: icon(Settings), active: exact("/org/settings") },
];
const ADMIN: NavItem[] = [
  { label: "User Management", path: "/admin/users", icon: icon(ShieldAlert), active: (p) => p.startsWith("/admin/users") },
  { label: "Organizations", path: "/admin/orgs", icon: icon(Building2), active: (p) => p.startsWith("/admin/orgs") },
  { label: "Notifications", path: "/admin/notifications", icon: icon(Bell), active: exact("/admin/notifications") },
];

export function Sidebar({ onOpenAccountModal, isMobileOpen, onCloseMobile }: SidebarProps) {
  const { user, organization, role, isSA } = useAuth();
  const { path, navigate } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const isUnaffiliated = !organization || role === "U";

  // System Admins get the Admin menu only; the Organization menu needs an org (§4.1, §4.3).
  const sections: Array<{ title: string; items: NavItem[]; accent: string; className?: string }> = isSA
    ? [{ title: "Platform Admin", items: ADMIN, accent: "bg-platform-600" }]
    : [
        { title: "Workspace", items: organization ? [...WORKSPACE, MEMBERS] : WORKSPACE, accent: "bg-brand-600" },
        ...(role === "OA" && organization
          ? [{ title: "Organization", items: ORGANIZATION, accent: "bg-brand-600", className: "pt-2 border-t border-zinc-100 dark:border-dark-border/60" }]
          : []),
      ];

  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-xs md:hidden" onClick={onCloseMobile} aria-hidden="true" />}

      <aside
        aria-label="Main Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-white dark:bg-dark-bg border-r border-zinc-200/80 dark:border-dark-border/80 transition-all duration-200 ease-in-out md:static ${
          collapsed ? "md:w-20" : "md:w-64"
        } ${isMobileOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full md:translate-x-0 w-64"}`}
      >
        {/* Logo and workspace */}
        <div className="flex flex-col border-b border-zinc-200/80 dark:border-dark-border/80">
          <div className={`h-16 flex items-center transition-all ${collapsed ? "px-2 justify-center" : "px-4 justify-between"}`}>
            <div
              onClick={() => (collapsed ? setCollapsed(false) : navigate("/"))}
              className="flex items-center gap-2.5 cursor-pointer select-none"
              title={collapsed ? "Expand sidebar" : "Trenno Home"}
            >
              <Logo size="sm" showWordmark={!collapsed} />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-1">
                <IconButton label="Collapse sidebar" icon={<PanelLeftClose className="w-4 h-4" />} onClick={() => setCollapsed(true)} className="hidden md:inline-flex" />
                <IconButton label="Close navigation sidebar" icon={<X className="w-5 h-5" />} onClick={onCloseMobile} size="sm" className="md:hidden" />
              </div>
            )}
          </div>

          <div className={`px-4 py-3 border-t border-zinc-200/80 dark:border-dark-border/80 flex items-center ${collapsed ? "justify-center" : isUnaffiliated ? "gap-2" : "gap-3"}`}>
            {!isUnaffiliated ? (
              <>
                <div className="h-7 w-7 rounded-none bg-brand-600 text-white font-bold font-sans text-[11px] flex items-center justify-center shrink-0 select-none">
                  {organization.name.substring(0, 2).toUpperCase()}
                </div>
                {!collapsed && <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{organization.name}</span>}
              </>
            ) : (
              <>
                {isSA ? <ShieldAlert className="w-4 h-4 text-brand-600 shrink-0" /> : <Rocket className="w-4 h-4 text-brand-600 shrink-0" />}
                {!collapsed && <span className="text-xs text-zinc-500 dark:text-zinc-400">{isSA ? "Platform administration" : "Unaffiliated User"}</span>}
              </>
            )}
          </div>

          {role === "VIEWER" && !collapsed && (
            <div className="px-4 py-1.5 bg-warning-50 dark:bg-warning-950/40 border-t border-warning-200 dark:border-warning-900/60 text-[11px] font-sans font-medium text-warning-700 dark:text-warning-300 flex items-center gap-1.5">
              <Lock className="w-3 h-3 shrink-0" />
              <span>Read-Only Privileges</span>
            </div>
          )}
        </div>

        {/* Role-based navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title} className={`space-y-1 ${section.className ?? ""}`}>
              {!collapsed && <div className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{section.title}</div>}
              {section.items.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    navigate(item.path);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-sm transition-colors cursor-pointer text-left ${
                    item.active(path)
                      ? `${section.accent} text-white`
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-dark-card hover:text-zinc-950 dark:hover:text-white"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Account */}
        <div className={`p-3 border-t border-zinc-200/80 dark:border-dark-border/80 flex gap-1 ${collapsed ? "flex-col items-center" : "items-center"}`}>
          <button
            type="button"
            onClick={onOpenAccountModal}
            title="Account Settings"
            className={`min-w-0 p-2.5 bg-transparent hover:bg-zinc-100 dark:hover:bg-dark-card transition-colors flex items-center gap-3 cursor-pointer text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              collapsed ? "justify-center" : "flex-1"
            }`}
          >
            <Avatar size="sm" colorSeed={user?.id} name={user ? `${user.firstName} ${user.lastName}` : "User"} src={user?.avatarPath || undefined} />
            {!collapsed && (
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                {user?.firstName} {user?.lastName}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}