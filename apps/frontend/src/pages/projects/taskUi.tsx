import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Assignee, Task, TaskPriority, TaskStatus, tasksApi } from "../../api/tasks";
import { Avatar, Badge, FormDialog, Input, PersonPickerPerson, Select, Textarea, useToast } from "../../components";
import { useAsync } from "../../lib/hooks";
import type { Presence, PresenceUpdate } from "../../api/users";

import { useOnReconnect, useRealtime } from "../../context/RealtimeContext";
import { formatDay } from "../../lib/format";

export const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
export const PRIORITIES: TaskPriority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

export const STATUS_LABELS: Record<TaskStatus, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };
export const PRIORITY_LABELS: Record<TaskPriority, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent" };
export const PRIORITY_RANK: Record<TaskPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export const statusOptions = STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }));
export const priorityOptions = PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }));
export const UNASSIGNED = "__none__";

// A person in a picker or filter: avatar (with a live online dot for friends), name, and a note.
// Lists come from the API with friends first.
export interface PickerPerson {
  id: string;
  name: string;
  avatarPath?: string | null;
  role?: string;
  isFriend?: boolean;
  presence?: Presence | null;
}
export function personOption(p: PickerPerson) {
  const status = p.isFriend && p.presence ? p.presence.status : undefined;
  return {
    value: p.id,
    label: p.name,
    icon: <Avatar size="xs" name={p.name} src={p.avatarPath || undefined} colorSeed={p.id} status={status} />,
    description: p.isFriend ? `Friend · ${status === "online" ? "Online" : "Offline"}` : p.role === "OA" ? "Org Admin" : undefined,
  };
}
const assigneeOptions = (people: Assignee[]) => [{ value: UNASSIGNED, label: "Unassigned" }, ...people.map(personOption)];

// For PersonPicker: friends get their live dot and a "Friend · Online" note.
export function toPickerPeople(people: PickerPerson[]): PersonPickerPerson[] {
  return people.map((p) => {
    const o = personOption(p);
    return { id: p.id, name: p.name, avatarPath: p.avatarPath, status: p.isFriend && p.presence ? p.presence.status : undefined, description: o.description };
  });
}

// Applies a presence:update to a list of people (only friends carry presence).
export function applyPresence<T extends PickerPerson>(people: T[], u: PresenceUpdate): T[] {
  return people.map((p) => (p.id === u.userId && p.isFriend ? { ...p, presence: { status: u.status, lastSeenAt: u.lastSeenAt } } : p));
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant={status} size="sm">
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant={priority} size="sm">
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Overdue = not Done and due before today (same rule as the project cards).
export const isOverdue = (t: Pick<Task, "dueDate" | "status">) => Boolean(t.dueDate && t.status !== "DONE" && t.dueDate < todayIso());

export function DueDate({ task, className = "" }: { task: Pick<Task, "dueDate" | "status">; className?: string }) {
  if (!task.dueDate) return null;
  const overdue = isOverdue(task);
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] tabular-nums ${
        overdue ? "text-destructive-600 dark:text-destructive-400 font-semibold" : "text-zinc-500 dark:text-zinc-400"
      } ${className}`}
      title={overdue ? "Overdue" : "Due date"}
    >
      <CalendarDays className="w-3 h-3" aria-hidden="true" />
      {formatDay(task.dueDate)}
      {overdue && <span className="sr-only"> (overdue)</span>}
    </span>
  );
}

// The open board joins its project room and hears about other people's changes.
// Bursts are batched (100 ms) into one `onChange(events)`; the caller refetches. After a reconnect the
// room is rejoined and `onChange` gets a "reconnect" event, since anything may have been missed.
interface ProjectLiveEvent {
  event: string;
  payload: { id?: string; number?: number; version?: number; taskId?: string; userId?: string };
}

const PROJECT_EVENTS = [
  "task:created",
  "task:updated",
  "task:deleted",
  "comment:created",
  "comment:updated",
  "comment:deleted",
  "project:updated",
  "project:deleted",
  "member:updated", // access or role changed: assignees, unassigned tasks
  "me:updated", // my own access changed
];

export function useProjectLive(projectKey: string, onChange: (events: ProjectLiveEvent[]) => void, enabled = true) {
  const { socket, connections } = useRealtime();
  const projectId = useRef<string | null>(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  const pending = useRef<ProjectLiveEvent[]>([]);
  const timer = useRef<number | null>(null);

  const push = useCallback((e: ProjectLiveEvent) => {
    pending.current.push(e);
    if (timer.current !== null) return;
    timer.current = window.setTimeout(() => {
      timer.current = null;
      const batch = pending.current;
      pending.current = [];
      callback.current(batch);
    }, 100);
  }, []);

  // Join on every (re)connect; the server checks access. Refused → let the page refetch and show why.
  useEffect(() => {
    if (!socket || !enabled || !socket.connected) return;
    let cancelled = false;
    socket.emit("project:join", { key: projectKey }, (r: { ok: boolean; projectId?: string }) => {
      if (cancelled) return;
      if (r?.ok && r.projectId) projectId.current = r.projectId;
      else push({ event: "project:unavailable", payload: {} });
    });
    return () => {
      cancelled = true;
      if (projectId.current) socket.emit("project:leave", { projectId: projectId.current });
      projectId.current = null;
    };
  }, [socket, connections, projectKey, enabled, push]);

  useEffect(() => {
    if (!socket || !enabled) return;
    const handlers = PROJECT_EVENTS.map((event) => {
      const fn = (payload: ProjectLiveEvent["payload"] = {}) => {
        // project:* arrives through the org room: only this project's matter.
        if (event.startsWith("project:") && payload.id !== projectId.current) return;
        push({ event, payload });
      };
      socket.on(event, fn);
      return [event, fn] as const;
    });
    return () => {
      for (const [event, fn] of handlers) socket.off(event, fn);
    };
  }, [socket, enabled, push]);

  useOnReconnect(() => enabled && push({ event: "reconnect", payload: {} }));

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );
}

// Create a task. Status can be preset (e.g. from a column's "+").
export function CreateTaskDialog({
  isOpen,
  onClose,
  onCreated,
  projectKey,
  assignees,
  initialStatus = "TODO",
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (task: Task) => void;
  projectKey: string;
  assignees: Assignee[];
  initialStatus?: TaskStatus;
}) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState(UNASSIGNED);
  const { busy: saving, error, setError, run } = useAsync();

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setDescription("");
    setStatus(initialStatus);
    setPriority("MEDIUM");
    setDueDate("");
    setAssigneeId(UNASSIGNED);
    setError(null);
  }, [isOpen, initialStatus]);

  const handleSubmit = async () => {
    const res = await run(() =>
      tasksApi.create(projectKey, {
        title: title.trim(),
        description: description.trim() ? description : null,
        status,
        priority,
        dueDate: dueDate || null,
        assigneeId: assigneeId === UNASSIGNED ? null : assigneeId,
      })
    );
    if (res) {
      toast.success("Task created", res.message);
      onCreated(res.task);
    }
  };

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title="New task"
      maxWidth="lg"
      onSubmit={handleSubmit}
      submitLabel="Create task"
      busy={saving}
      submitDisabled={!title.trim()}
      error={error}
      onDismissError={() => setError(null)}
    >
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} disabled={saving} autoFocus />
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={10000}
          disabled={saving}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Status" value={status} onChange={(v) => setStatus(v as TaskStatus)} options={statusOptions} disabled={saving} />
          <Select label="Priority" value={priority} onChange={(v) => setPriority(v as TaskPriority)} options={priorityOptions} disabled={saving} />
          <Input label="Due date (optional)" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={saving} />
          <Select
            label="Assignee"
            value={assigneeId}
            onChange={setAssigneeId}
            options={assigneeOptions(assignees)}
            disabled={saving}
            helperText="Org Admins, and Members with access."
          />
        </div>
    </FormDialog>
  );
}
