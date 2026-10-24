import { useEffect, useState } from "react";
import { AlertTriangle, CircleDot } from "lucide-react";
import { Project, projectsApi } from "../../api/projects";
import { ConfirmDialog, FormDialog, Input, Textarea, useToast } from "../../components";
import { useAsync } from "../../lib/hooks";
import { ConsequenceList, Consequence } from "../admin/adminUi";
import { plural } from "../../lib/format";

const PROJECT_KEY_RE = /^[A-Z][A-Z0-9]{1,5}$/;

// PRJ-02 card numbers: % Done bar, open and overdue counts.
export function ProjectProgress({ project, className = "" }: { project: Project; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between text-xs mb-1.5">
        <span className="text-zinc-500 dark:text-zinc-400">
          {project.taskCount === 0 ? "No tasks yet" : `${project.doneCount} of ${plural(project.taskCount, "task")} done`}
        </span>
        <span className="font-semibold tabular-nums text-brand-600 dark:text-brand-400">{project.percentDone}%</span>
      </div>
      <div
        className="h-1.5 w-full bg-zinc-100 dark:bg-dark-elevated overflow-hidden"
        role="progressbar"
        aria-label={`${project.name} progress`}
        aria-valuenow={project.percentDone}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-brand-600 transition-all" style={{ width: `${project.percentDone}%` }} />
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs">
        <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 tabular-nums">
          <CircleDot className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
          {project.openCount} open
        </span>
        <span
          className={`inline-flex items-center gap-1.5 tabular-nums ${
            project.overdueCount > 0 ? "text-destructive-600 dark:text-destructive-400 font-medium" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          {project.overdueCount} overdue
        </span>
      </div>
    </div>
  );
}

interface ProjectFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (project: Project) => void;
  /** Editing an existing project (PRJ-03) when set; creating one (PRJ-01) otherwise. */
  project?: Project | null;
  /** The org a System Admin acts on. */
  orgId?: string;
}

// PRJ-01 / PRJ-03: name, key (fixed once created), description and optional dates.
export function ProjectFormDialog({ isOpen, onClose, onSaved, project, orgId }: ProjectFormDialogProps) {
  const toast = useToast();
  const isEdit = Boolean(project);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const { busy: saving, error, setError, run } = useAsync();

  useEffect(() => {
    if (!isOpen) return;
    setName(project?.name ?? "");
    setKey(project?.key ?? "");
    setDescription(project?.description ?? "");
    setStartDate(project?.startDate ?? "");
    setTargetDate(project?.targetDate ?? "");
    setError(null);
  }, [isOpen, project]);

  const keyError = !isEdit && key && !PROJECT_KEY_RE.test(key) ? "Start with a letter; 2 to 6 letters or digits." : undefined;
  const dateError = startDate && targetDate && targetDate < startDate ? "The target date can't be before the start date." : undefined;

  const handleSubmit = async () => {
    if (keyError || dateError) return;
    const fields = { name: name.trim(), description: description.trim() || null, startDate: startDate || null, targetDate: targetDate || null };
    await run(async () => {
      if (project) {
        const res = await projectsApi.update(project.key, fields, orgId);
        toast.success("Changes saved", `${res.project.name} is up to date.`);
        onSaved({ ...project, ...res.project });
      } else {
        const res = await projectsApi.create({ ...fields, key, orgId });
        toast.success("Project created", res.message);
        onSaved(res.project);
      }
    });
  };

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit project" : "New project"}
      description={isEdit ? undefined : "Members and Viewers see it once you give them access."}
      maxWidth="lg"
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Save changes" : "Create project"}
      busy={saving}
      submitDisabled={Boolean(keyError || dateError)}
      error={error}
      onDismissError={() => setError(null)}
    >
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Website relaunch"
          required
          minLength={2}
          maxLength={100}
          disabled={saving}
          helperText="Unique within the organization."
        />
        <Input
          label="Key"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          placeholder="e.g. WEB"
          required
          maxLength={6}
          disabled={saving || isEdit}
          error={keyError}
          helperText={isEdit ? "The key can't be changed." : "Prefix for task numbers, like WEB-12. It can't be changed later."}
        />
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
          disabled={saving}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Start date (optional)" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={saving} />
          <Input
            label="Target date (optional)"
            type="date"
            value={targetDate}
            min={startDate || undefined}
            onChange={(e) => setTargetDate(e.target.value)}
            disabled={saving}
            error={dateError}
          />
        </div>
    </FormDialog>
  );
}

// PRJ-05: typed key, with the consequences listed first.
export function DeleteProjectDialog({
  project,
  isOpen,
  onClose,
  onDeleted,
  orgId,
}: {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  orgId?: string;
}) {
  const toast = useToast();
  if (!project) return null;

  const consequences: Consequence[] = [];
  if (project.taskCount > 0) {
    consequences.push({ kind: "change", text: `${plural(project.taskCount, "task")} and their comments are deleted` });
  }
  consequences.push({ kind: "change", text: "Everyone's access to the project is removed" });
  consequences.push({ kind: "change", text: "Anyone with the project open sees that it was deleted" });
  consequences.push({ kind: "keep", text: `The name “${project.name}” and the key ${project.key}, which become free to reuse` });

  const handleDelete = async () => {
    try {
      const res = await projectsApi.remove(project.key, project.key, orgId);
      toast.success("Project deleted", res.message);
      onDeleted();
    } catch (err) {
      toast.error("Couldn't delete this project", (err as Error).message);
      throw err;
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      variant="danger"
      title="Delete project"
      description={`${project.name} (${project.key}) and everything in it will be deleted. There's no undo in the app.`}
      confirmLabel="Delete project"
      typedConfirmationText={project.key}
    >
      <ConsequenceList items={consequences} />
    </ConfirmDialog>
  );
}
