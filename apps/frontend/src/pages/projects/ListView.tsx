import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Task } from "../../api/tasks";
import { Avatar, PersonPicker, PersonPickerPerson } from "../../components";

import { DueDate, PRIORITY_RANK, PriorityBadge, STATUSES, StatusBadge } from "./taskUi";
import { formatRelative } from "../../lib/format";

type SortKey = "key" | "title" | "status" | "priority" | "assignee" | "dueDate" | "updatedAt";

const COLUMNS: Array<{ key: SortKey; label: string; className?: string }> = [
  { key: "key", label: "Key", className: "w-24" },
  { key: "title", label: "Title" },
  { key: "status", label: "Status", className: "w-32" },
  { key: "priority", label: "Priority", className: "w-28" },
  { key: "assignee", label: "Assignee", className: "w-44" },
  { key: "dueDate", label: "Due", className: "w-32" },
  { key: "updatedAt", label: "Updated", className: "w-32" },
];

// Empty values (no due date, unassigned) sort last in both directions.
function compare(a: Task, b: Task, key: SortKey): number {
  switch (key) {
    case "key":
      return a.number - b.number;
    case "title":
      return a.title.localeCompare(b.title);
    case "status":
      return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
    case "priority":
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    case "assignee":
      return (a.assignee?.name ?? "").localeCompare(b.assignee?.name ?? "");
    case "dueDate":
      return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
    case "updatedAt":
      return a.updatedAt.localeCompare(b.updatedAt);
  }
}
const isEmpty = (t: Task, key: SortKey) => (key === "dueDate" && !t.dueDate) || (key === "assignee" && !t.assignee);

// TSK-08: sortable table of the project's tasks.
export function ListView({
  tasks,
  onOpen,
  people = [],
  currentUserId,
  onAssign,
}: {
  tasks: Task[];
  onOpen: (task: Task) => void;
  people?: PersonPickerPerson[];
  currentUserId?: string;
  /** Set when the viewer can reassign: click the assignee to change it in place. */
  onAssign?: (task: Task, assigneeId: string | null) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "key", dir: -1 });

  const rows = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const ea = isEmpty(a, sort.key);
        const eb = isEmpty(b, sort.key);
        if (ea !== eb) return ea ? 1 : -1;
        return compare(a, b, sort.key) * sort.dir || b.number - a.number;
      }),
    [tasks, sort]
  );

  const toggle = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  return (
    <div className="relative overflow-x-auto border border-zinc-200 dark:border-dark-border bg-white dark:bg-dark-card">
      <table className="w-full min-w-[56rem] text-sm">
        <thead className="bg-zinc-50 dark:bg-dark-elevated/50 border-b border-zinc-200 dark:border-dark-border">
          <tr>
            {COLUMNS.map((col) => {
              const active = sort.key === col.key;
              const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                  className={`text-left font-semibold text-xs text-zinc-600 dark:text-zinc-300 ${col.className ?? ""}`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(col.key)}
                    className="w-full px-4 py-2.5 inline-flex items-center gap-1.5 hover:text-zinc-950 dark:hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                  >
                    {col.label}
                    <Icon className={`w-3.5 h-3.5 ${active ? "text-brand-600 dark:text-brand-400" : "text-zinc-400"}`} aria-hidden="true" />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-dark-border">
          {rows.map((t) => (
            <tr
              key={t.id}
              tabIndex={0}
              onClick={() => onOpen(t)}
              onKeyDown={(e) => e.key === "Enter" && onOpen(t)}
              className="hover:bg-zinc-50 dark:hover:bg-dark-elevated cursor-pointer focus-visible:outline-none focus-visible:bg-brand-50/60 dark:focus-visible:bg-brand-950/30"
            >
              <td className="px-4 py-2.5 font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t.key}</td>
              <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-white max-w-0 truncate" title={t.title}>
                {t.title}
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={t.status} />
              </td>
              <td className="px-4 py-2.5">
                <PriorityBadge priority={t.priority} />
              </td>
              <td className="px-4 py-2.5">
                {onAssign ? (
                  <PersonPicker
                    label={`Assignee of ${t.key}`}
                    people={people}
                    value={t.assignee?.id ?? null}
                    fallback={t.assignee ? { id: t.assignee.id, name: t.assignee.name, avatarPath: t.assignee.avatarPath } : null}
                    currentUserId={currentUserId}
                    onChange={(id) => onAssign(t, id)}
                  />
                ) : t.assignee ? (
                  <span className="flex items-center gap-2 min-w-0">
                    <Avatar
                      size="xs"
                      name={t.assignee.name}
                      src={t.assignee.avatarPath || undefined}
                      colorSeed={t.assignee.id}
                      status={people.find((p) => p.id === t.assignee!.id)?.status}
                    />
                    <span className="truncate text-zinc-700 dark:text-zinc-200">{t.assignee.name}</span>
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">Unassigned</span>
                )}
              </td>
              <td className="px-4 py-2.5">{t.dueDate ? <DueDate task={t} /> : <span className="text-xs text-zinc-400">—</span>}</td>
              <td className="px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400" title={new Date(t.updatedAt).toLocaleString()}>
                {formatRelative(t.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
