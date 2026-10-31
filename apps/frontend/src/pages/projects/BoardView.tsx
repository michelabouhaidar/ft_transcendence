import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRightLeft, MessageSquare, Plus } from "lucide-react";
import { Task, TaskStatus } from "../../api/tasks";
import { Avatar, IconButton, Menu, PersonPicker, PersonPickerPerson } from "../../components";
import { DueDate, PriorityBadge, STATUSES, STATUS_LABELS } from "./taskUi";

type Columns = Record<TaskStatus, Task[]>;

const toColumns = (tasks: Task[]): Columns => {
  const cols: Columns = { TODO: [], IN_PROGRESS: [], DONE: [] };
  for (const t of [...tasks].sort((a, b) => a.position - b.position || a.number - b.number)) cols[t.status].push(t);
  return cols;
};

const columnOf = (cols: Columns, id: string): TaskStatus | null => {
  if (id.startsWith("col:")) return id.slice(4) as TaskStatus;
  return STATUSES.find((s) => cols[s].some((t) => t.id === id)) ?? null;
};

// Who can be assigned, and how to assign, for the cards' in-place assignee picker.
interface BoardPeople {
  people: PersonPickerPerson[];
  currentUserId?: string;
  onAssign?: (task: Task, assigneeId: string | null) => void;
}
const BoardPeopleContext = createContext<BoardPeople>({ people: [] });

interface BoardViewProps extends BoardPeople {
  /** Every task of the project, for placing moves correctly. */
  tasks: Task[];
  /** The tasks the filters let through. */
  visible: Set<string>;
  canEdit: boolean;
  onOpen: (task: Task) => void;
  /** Persist a move: target column and index among all its tasks (hidden ones included). */
  onMove: (task: Task, status: TaskStatus, index: number) => void;
  onCreateIn: (status: TaskStatus) => void;
}

// Three columns with counts, drag and drop (within and between columns) and a "Move to…" menu on every card. 
// Viewers get neither.
export function BoardView({ tasks, visible, canEdit, onOpen, onMove, onCreateIn, people, currentUserId, onAssign }: BoardViewProps) {
  const [columns, setColumns] = useState<Columns>(() => toColumns(tasks));
  const [dragging, setDragging] = useState<Task | null>(null);

  // Server data wins except while a card is in the air.
  useEffect(() => {
    if (!dragging) setColumns(toColumns(tasks));
  }, [tasks, dragging]);

  // Mouse: drag after a 6px move. Touch: press and hold a card for 250ms to pick it up, so a normal
  // swipe still scrolls the page and the columns (a single PointerSensor loses touches to scrolling).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const shown = useMemo(() => {
    const out = {} as Columns;
    for (const s of STATUSES) out[s] = columns[s].filter((t) => visible.has(t.id));
    return out;
  }, [columns, visible]);

  const onDragStart = (e: DragStartEvent) => {
    setDragging(tasks.find((t) => t.id === e.active.id) ?? null);
    // A short buzz on phones that support it, so a long-press pickup is felt.
    if (typeof TouchEvent !== "undefined" && e.activatorEvent instanceof TouchEvent) navigator.vibrate?.(10);
  };

  // Moving across columns while dragging, so the card previews in its new column.
  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const from = columnOf(columns, String(active.id));
    const to = columnOf(columns, String(over.id));
    if (!from || !to || from === to) return;
    setColumns((prev) => {
      const card = prev[from].find((t) => t.id === active.id);
      if (!card) return prev;
      const target = prev[to].filter((t) => t.id !== card.id);
      const overIndex = target.findIndex((t) => t.id === over.id);
      target.splice(overIndex >= 0 ? overIndex : target.length, 0, { ...card, status: to });
      return { ...prev, [from]: prev[from].filter((t) => t.id !== card.id), [to]: target };
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const card = dragging;
    setDragging(null);
    if (!over || !card) {
      setColumns(toColumns(tasks));
      return;
    }
    const to = columnOf(columns, String(over.id));
    if (!to) return;
    // Final order of what's on screen in the target column.
    const visibleCol = columns[to].filter((t) => visible.has(t.id) || t.id === card.id);
    const from = visibleCol.findIndex((t) => t.id === active.id);
    let at = visibleCol.findIndex((t) => t.id === over.id);
    if (at < 0) at = visibleCol.length - 1;
    const ordered = [...visibleCol];
    if (from >= 0) {
      ordered.splice(from, 1);
      ordered.splice(at, 0, card);
    }
    const pos = ordered.findIndex((t) => t.id === card.id);
    // Index among every task of the column (filters may hide some): place it before the next visible card.
    const allOthers = toColumns(tasks)[to].filter((t) => t.id !== card.id);
    const next = ordered[pos + 1];
    const prev = ordered[pos - 1];
    const index = next ? allOthers.findIndex((t) => t.id === next.id) : prev ? allOthers.findIndex((t) => t.id === prev.id) + 1 : allOthers.length;
    const original = tasks.find((t) => t.id === card.id)!;
    const originalIndex = toColumns(tasks)[original.status].findIndex((t) => t.id === card.id);
    if (original.status === to && originalIndex === index) {
      setColumns(toColumns(tasks));
      return;
    }
    // Keep the new order on screen until the server answers.
    setColumns((c) => ({ ...c, [to]: ordered.concat(c[to].filter((t) => !ordered.some((o) => o.id === t.id))) }));
    onMove(original, to, index);
  };

  return (
    <BoardPeopleContext.Provider value={{ people, currentUserId, onAssign: canEdit ? onAssign : undefined }}>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setDragging(null);
        setColumns(toColumns(tasks));
      }}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up ${tasks.find((t) => t.id === active.id)?.key ?? "task"}.`,
          onDragOver: ({ over }) => (over ? `Over ${STATUS_LABELS[columnOf(columns, String(over.id)) ?? "TODO"]}.` : ""),
          onDragEnd: ({ over }) => (over ? `Dropped in ${STATUS_LABELS[columnOf(columns, String(over.id)) ?? "TODO"]}.` : "Dropped."),
          onDragCancel: () => "Move cancelled.",
        },
      }}
    >
      {/* Horizontal scroll on small screens. */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        <div className="grid grid-cols-[repeat(3,minmax(17rem,1fr))] gap-4 min-w-max sm:min-w-0">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={shown[status]}
              canEdit={canEdit}
              onOpen={onOpen}
              onCreate={() => onCreateIn(status)}
              onMoveTo={(task, to) => onMove(task, to, toColumns(tasks)[to].filter((t) => t.id !== task.id).length)}
            />
          ))}
        </div>
      </div>
      <DragOverlay>{dragging ? <CardBody task={dragging} lifted /> : null}</DragOverlay>
    </DndContext>
    </BoardPeopleContext.Provider>
  );
}

function Column({
  status,
  tasks,
  canEdit,
  onOpen,
  onCreate,
  onMoveTo,
}: {
  status: TaskStatus;
  tasks: Task[];
  canEdit: boolean;
  onOpen: (task: Task) => void;
  onCreate: () => void;
  onMoveTo: (task: Task, to: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}`, disabled: !canEdit });
  return (
    <section
      aria-label={`${STATUS_LABELS[status]}, ${tasks.length} tasks`}
      className={`flex flex-col min-h-[14rem] bg-zinc-100/70 dark:bg-dark-card/60 border transition-colors ${
        isOver ? "border-brand-400 dark:border-brand-700" : "border-zinc-200/80 dark:border-zinc-800/80"
      }`}
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
          {STATUS_LABELS[status]}
          <span className="px-1.5 py-0.5 text-[11px] tabular-nums bg-white dark:bg-dark-elevated border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
            {tasks.length}
          </span>
        </h2>
        {canEdit && <IconButton label={`New task in ${STATUS_LABELS[status]}`} icon={<Plus className="w-4 h-4" />} size="sm" onClick={onCreate} />}
      </header>
      <SortableContext id={`col:${status}`} items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ol ref={setNodeRef} className="flex-1 p-2 space-y-2">
          {tasks.map((task) => (
            <SortableCard key={task.id} task={task} canEdit={canEdit} onOpen={onOpen} onMoveTo={onMoveTo} />
          ))}
          {tasks.length === 0 && (
            <li className="h-20 flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700">
              {canEdit ? "Drop tasks here" : "No tasks"}
            </li>
          )}
        </ol>
      </SortableContext>
    </section>
  );
}

function SortableCard({
  task,
  canEdit,
  onOpen,
  onMoveTo,
}: {
  task: Task;
  canEdit: boolean;
  onOpen: (task: Task) => void;
  onMoveTo: (task: Task, to: TaskStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: !canEdit });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li ref={setNodeRef} style={style} className={isDragging ? "opacity-40" : ""}>
      <div
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        aria-roledescription={canEdit ? "draggable task" : "task"}
        aria-label={`${task.key} ${task.title}`}
        onClick={() => onOpen(task)}
        onKeyDown={(e) => {
          // Space picks the card up (dnd-kit); Enter opens it.
          if (e.key === "Enter") onOpen(task);
          else listeners?.onKeyDown?.(e);
        }}
        className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${canEdit ? "cursor-grab active:cursor-grabbing select-none [-webkit-touch-callout:none]" : "cursor-pointer"}`}
      >
        <CardBody
          task={task}
          action={
            canEdit ? (
              <Menu
                label={`Move ${task.key} to…`}
                title="Move to…"
                icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                items={STATUSES.map((s) => ({ id: s, label: STATUS_LABELS[s], disabled: s === task.status, hint: s === task.status ? "Current" : undefined }))}
                onSelect={(s) => onMoveTo(task, s as TaskStatus)}
              />
            ) : null
          }
        />
      </div>
    </li>
  );
}

function CardBody({ task, action, lifted = false }: { task: Task; action?: ReactNode; lifted?: boolean }) {
  return (
    <article
      className={`bg-white dark:bg-dark-card border p-3 transition-shadow ${
        lifted ? "border-brand-400 shadow-xl rotate-1" : "border-zinc-200/90 dark:border-zinc-800/90 shadow-2xs hover:border-zinc-400 dark:hover:border-zinc-600"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{task.key}</span>
        {action}
      </div>
      <h3 className="mt-1 text-sm font-medium leading-snug text-zinc-900 dark:text-white break-words line-clamp-3">{task.title}</h3>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <PriorityBadge priority={task.priority} />
        <DueDate task={task} />
        <span className="ml-auto flex items-center gap-2">
          {task.commentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums" title={`${task.commentCount} comments`}>
              <MessageSquare className="w-3 h-3" aria-hidden="true" />
              {task.commentCount}
            </span>
          )}
          <CardAssignee task={task} />
        </span>
      </div>
    </article>
  );
}

// Click the avatar to reassign in place; Viewers just see who it is (with a live dot for friends).
function CardAssignee({ task }: { task: Task }) {
  const { people, currentUserId, onAssign } = useContext(BoardPeopleContext);
  const fallback = task.assignee ? { id: task.assignee.id, name: task.assignee.name, avatarPath: task.assignee.avatarPath } : null;
  if (onAssign) {
    return (
      <PersonPicker
        variant="avatar"
        align="right"
        label={`Assignee of ${task.key}`}
        people={people}
        value={task.assignee?.id ?? null}
        fallback={fallback}
        currentUserId={currentUserId}
        onChange={(id) => onAssign(task, id)}
      />
    );
  }
  if (!task.assignee) return <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Unassigned</span>;
  const status = people.find((p) => p.id === task.assignee!.id)?.status;
  return (
    <span title={`Assigned to ${task.assignee.name}`}>
      <Avatar size="xs" name={task.assignee.name} src={task.assignee.avatarPath || undefined} colorSeed={task.assignee.id} status={status} />
    </span>
  );
}