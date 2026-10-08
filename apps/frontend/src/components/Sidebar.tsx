import React, { useState } from "react";
import { User, Organization } from "../api/auth";
import {
  Logo,
  Avatar,
  IconButton,
} from "./index";
import {
  FolderKanban,
  Search,
  BarChart3,
  Bell,
  UserCheck,
  Users,
  Mail,
  Settings,
  ShieldAlert,
  Building2,
  Rocket,
  Lock,
  X,
  PanelLeftClose,
} from "lucide-react";

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  user: User | null;
  organization: Organization | null;
  role: "SA" | "OA" | "MEMBER" | "VIEWER" | "U" | null;
  onOpenAccountModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  user,
  organization,
  role,
  onOpenAccountModal,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const isSA = role === "SA";
  // The Organization menu needs an org; a System Admin belongs to none (§4.1, §4.3).
  const showOrgMenu = role === "OA" && Boolean(organization);
  const isViewer = role === "VIEWER";
  const isUnaffiliated = !organization || role === "U";

  const navItems = [
    {
      id: "projects",
      label: "Projects",
      path: "/projects",
      icon: <FolderKanban className="w-4 h-4 shrink-0" />,
      active: currentPath === "/projects" || currentPath === "/onboarding" || currentPath.startsWith("/projects/"),
    },
    {
      id: "search",
      label: "Search",
      path: "/search",
      icon: <Search className="w-4 h-4 shrink-0" />,
      active: currentPath === "/search",
    },
    {
      id: "analytics",
      label: "Analytics",
      path: "/analytics",
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
      active: currentPath === "/analytics",
    },
    {
      id: "notifications",
      label: "Notifications",
      path: "/notifications",
      icon: <Bell className="w-4 h-4 shrink-0" />,
      active: currentPath === "/notifications",
    },
    {
      id: "friends",
      label: "Friends",
      path: "/friends",
      icon: <UserCheck className="w-4 h-4 shrink-0" />,
      active: currentPath === "/friends",
    },
    ...(organization && !isSA
      ? [
          {
            id: "members",
            label: "Members",
            path: "/org/members",
            icon: <Users className="w-4 h-4 shrink-0" />,
            active: currentPath === "/org/members" || currentPath.startsWith("/users/"),
          },
        ]
      : []),
  ];

  const orgItems = [
    {
      id: "invitations",
      label: "Invitations",
      path: "/org/invitations",
      icon: <Mail className="w-4 h-4 shrink-0" />,
      active: currentPath === "/org/invitations",
    },
    {
      id: "settings",
      label: "Workspace Settings",
      path: "/org/settings",
      icon: <Settings className="w-4 h-4 shrink-0" />,
      active: currentPath === "/org/settings",
    },
  ];

  const adminItems = [
    {
      id: "admin-users",
      label: "User Management",
      path: "/admin/users",
      icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
      active: currentPath.startsWith("/admin/users"),
    },
    {
      id: "admin-orgs",
      label: "Organizations",
      path: "/admin/orgs",
      icon: <Building2 className="w-4 h-4 shrink-0" />,
      active: currentPath.startsWith("/admin/orgs"),
    },
    {
      id: "admin-notifications",
      label: "Notifications",
      path: "/admin/notifications",
      icon: <Bell className="w-4 h-4 shrink-0" />,
      active: currentPath === "/admin/notifications",
    },
  ];


  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label="Main Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-white dark:bg-dark-bg border-r border-zinc-200/80 dark:border-dark-border/80 transition-all duration-200 ease-in-out md:static ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } ${
          isMobileOpen
            ? "translate-x-0 w-72 shadow-2xl"
            : "-translate-x-full md:translate-x-0 w-64"
        }`}
      >
        {/* ========================================================= */}
        {/* TOP: LOGO & WORKSPACE CONTEXT                             */}
        {/* ========================================================= */}
        <div className="flex flex-col border-b border-zinc-200/80 dark:border-dark-border/80">
          {/* Header Row */}
          <div className={`h-16 flex items-center transition-all ${isCollapsed ? "px-2 justify-center" : "px-4 justify-between"}`}>
            {/* Logo — always visible */}
            <div
              onClick={() => isCollapsed ? handleToggleCollapse() : onNavigate("/")}
              className="flex items-center gap-2.5 cursor-pointer select-none"
              title={isCollapsed ? "Expand sidebar" : "Trenno Home"}
            >
              <Logo size="sm" showWordmark={!isCollapsed} />
            </div>

            {/* Controls — only when expanded */}
            {!isCollapsed && (
              <div className="flex items-center gap-1">
                <IconButton
                  label="Collapse sidebar"
                  icon={<PanelLeftClose className="w-4 h-4" />}
                  onClick={handleToggleCollapse}
                  className="hidden md:inline-flex"
                />
                <IconButton
                  label="Close navigation sidebar"
                  icon={<X className="w-5 h-5" />}
                  onClick={onCloseMobile}
                  size="sm"
                  className="md:hidden"
                />
              </div>
            )}
          </div>

          {/* Active Workspace / Org Indicator */}
          {!isUnaffiliated && organization ? (
            <div className={`px-4 py-3 border-t border-zinc-200/80 dark:border-dark-border/80 flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
              <div className="h-7 w-7 rounded-none bg-brand-600 text-white font-bold font-sans text-[11px] flex items-center justify-center shrink-0 select-none">
                {organization.name.substring(0, 2).toUpperCase()}
              </div>
              {!isCollapsed && (
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                  {organization.name}
                </span>
              )}
            </div>
          ) : (
            <div className={`px-4 py-3 border-t border-zinc-200/80 dark:border-dark-border/80 flex items-center ${isCollapsed ? "justify-center" : "gap-2"}`}>
              {isSA ? (
                <ShieldAlert className="w-4 h-4 text-brand-600 shrink-0" />
              ) : (
                <Rocket className="w-4 h-4 text-brand-600 shrink-0" />
              )}
              {!isCollapsed && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isSA ? "Platform administration" : "Unaffiliated User"}
                </span>
              )}
            </div>
          )}

          {/* Viewer Read-Only Notice */}
          {isViewer && !isCollapsed && (
            <div className="px-4 py-1.5 bg-warning-50 dark:bg-warning-950/40 border-t border-warning-200 dark:border-warning-900/60 text-[11px] font-sans font-medium text-warning-700 dark:text-warning-300 flex items-center gap-1.5">
              <Lock className="w-3 h-3 shrink-0" />
              <span>Read-Only Privileges</span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* CENTER: ROLE-BASED NAVIGATION LINKS                       */}
        {/* ========================================================= */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation (workspace pages need an org, so System Admins skip it) */}
          {!isSA && (
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Workspace
              </div>
            )}
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.path);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-sm transition-colors cursor-pointer text-left ${
                  item.active
                    ? "bg-brand-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-dark-card hover:text-zinc-950 dark:hover:text-white"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={item.label}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
          )}

          {/* Organization Menu (OA only) */}
          {showOrgMenu && (
            <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-dark-border/60">
              {!isCollapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Organization
                </div>
              )}
              {orgItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.path);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-sm transition-colors cursor-pointer text-left ${
                    item.active
                      ? "bg-brand-600 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-dark-card hover:text-zinc-950 dark:hover:text-white"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={item.label}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Platform Admin Menu (SA Only) */}
          {isSA && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Platform Admin
                </div>
              )}
              {adminItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.path);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-sm transition-colors cursor-pointer text-left ${
                    item.active
                      ? "bg-platform-600 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-dark-card hover:text-zinc-950 dark:hover:text-white"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={item.label}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* ========================================================= */}
        {/* BOTTOM: USER ACCOUNT TRIGGER                               */}
        {/* ========================================================= */}
        <div
          className={`p-3 border-t border-zinc-200/80 dark:border-dark-border/80 flex gap-1 ${
            isCollapsed ? "flex-col items-center" : "items-center"
          }`}
        >
          {/* User Account Trigger Button */}
          <button
            type="button"
            onClick={onOpenAccountModal}
            className={`min-w-0 p-2.5 bg-transparent hover:bg-zinc-100 dark:hover:bg-dark-card transition-colors flex items-center gap-3 cursor-pointer text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              isCollapsed ? "justify-center" : "flex-1"
            }`}
            title="Account Settings"
          >
            <Avatar
              size="sm"
              name={user ? `${user.firstName} ${user.lastName}` : "User"}
              src={user?.avatarPath || undefined}
            />
            {!isCollapsed && (
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                {user?.firstName} {user?.lastName}
              </span>
            )}
          </button>

        </div>
      </aside>
    </>
  );
};
