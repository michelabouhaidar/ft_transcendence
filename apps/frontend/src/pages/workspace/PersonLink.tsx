import { Avatar, Badge } from "../../components";
import { useApp } from "../../context/AppContext";

// Avatar, name and a second line; opens the person's profile (directory and friends lists).
export function PersonLink({ id, name, avatarPath, status, subtitle, you = false }: { id: string; name: string; avatarPath: string | null; status?: "online" | "offline"; subtitle: string; you?: boolean }) {
  const { navigate } = useApp();
  return (
    <button
      type="button"
      onClick={() => navigate(`/users/${id}`)}
      className="flex items-center gap-3.5 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <Avatar size="md" name={name} src={avatarPath || undefined} colorSeed={id} status={status} />
      <div className="min-w-0">
        <div className="font-semibold text-sm text-zinc-950 dark:text-white flex items-center gap-2">
          <span className="truncate">{name}</span>
          {you && <Badge variant="primary">You</Badge>}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{subtitle}</div>
      </div>
    </button>
  );
}
