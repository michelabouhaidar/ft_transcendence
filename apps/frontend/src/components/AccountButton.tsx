import { Avatar } from "./Avatar";

export interface AccountButtonProps {
  user: { id?: string; firstName: string; lastName: string; avatarPath?: string | null };
  onClick: () => void;
  className?: string;
}

// Header trigger for the account settings modal: avatar + first name, after a divider.
export function AccountButton({ user, onClick, className = "" }: AccountButtonProps) {
  const fullName = `${user.firstName} ${user.lastName}`;
  return (
    <button
      type="button"
      onClick={onClick}
      title="Account settings"
      aria-label={`Account settings for ${fullName}`}
      className={`flex items-center gap-2 pl-3 border-l border-zinc-200 dark:border-dark-border cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${className}`}
    >
      <Avatar size="sm" name={fullName} src={user.avatarPath || undefined} colorSeed={user.id} />
      <span className="hidden sm:inline text-xs font-semibold text-zinc-900 dark:text-white font-sans">{user.firstName}</span>
    </button>
  );
}
