import { useCallback, useEffect, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronLeft, ChevronRight, Search, SearchX, X } from "lucide-react";
import { EMPTY_SEARCH, SearchParams, SearchResult, SearchSort, fromQueryString, searchApi, toQueryString } from "../api/search";
import { Alert, Avatar, Button, EmptyState, IconButton, Input, PageHeader, Select, Spinner } from "../components";
import { AppLayout } from "./AppLayout";
import { useApp } from "../context/AppContext";

import { DueDate, PRIORITIES, PRIORITY_LABELS, PriorityBadge, STATUSES, STATUS_LABELS, StatusBadge, applyPresence, personOption } from "./projects/taskUi";
import { useSocketEvent } from "../context/RealtimeContext";
import type { PresenceUpdate } from "../api/users";
import { formatDay, formatRelative } from "../lib/format";

const ANY = "__any__";
const SORT_LABELS: Record<SearchSort, string> = {
  updated: "Last updated",
  created: "Created",
  due: "Due date",
  priority: "Priority",
  title: "Title",
};
const DEFAULT_DIR: Record<SearchSort, "asc" | "desc"> = { updated: "desc", created: "desc", due: "asc", priority: "desc", title: "asc" };

// /search: every value lives in the URL, so a search can be shared and Back restores it.
export function SearchPage() {
  const { navigate } = useApp();
  const [params, setParams] = useState<SearchParams>(() => fromQueryString(window.location.search));
  const [text, setText] = useState(params.q);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Back / forward, and a new search from the header box while this page is open: the URL is the source of truth.
  useEffect(() => {
    const onPop = () => {
      const next = fromQueryString(window.location.search);
      setParams(next);
      setText(next.q);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Filter, sort and page changes are history entries; typing replaces the current entry.
  const apply = useCallback((patch: Partial<SearchParams>, mode: "push" | "replace" = "push") => {
    setParams((prev) => {
      const next = { ...prev, page: 1, ...patch };
      const url = `/search${toQueryString(next) ? `?${toQueryString(next)}` : ""}`;
      if (mode === "push") window.history.pushState({}, "", url);
      else window.history.replaceState({}, "", url);
      return next;
    });
  }, []);

  useEffect(() => {
    if (text === params.q) return;
    const t = window.setTimeout(() => apply({ q: text.trim() }, "replace"), 300);
    return () => window.clearTimeout(t);
  }, [text]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    searchApi
      .tasks(params, ctrl.signal)
      .then((r) => {
        setResult(r);
        setError(null);
        // Keep the URL honest if the page was past the end.
        if (r.page !== params.page) apply({ page: r.page }, "replace");
      })
      .catch((err) => {
        if ((err as Error).name !== "AbortError") setError((err as Error).message);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [params]);

  // Friends' dots stay live; new or ended friendships reload the choices.
  useSocketEvent<PresenceUpdate>("presence:update", (u) =>
    setResult((r) => (r ? { ...r, options: { ...r.options, assignees: applyPresence(r.options.assignees, u) } } : r))
  );
  useSocketEvent("friendship:updated", () => setParams((p) => ({ ...p })));

  const options = result?.options;
  const projectName = (key: string) => options?.projects.find((p) => p.key === key)?.name ?? key;
  const assigneeName = (id: string) =>
    id === "me"
      ? "Me"
      : id === "unassigned"
      ? "Unassigned"
      : id === "friends"
      ? "My friends"
      : options?.assignees.find((a) => a.id === id)?.name ?? "Someone";

  // One removable chip per active filter.
  const chips: Array<{ id: string; label: string; clear: Partial<SearchParams> }> = [];
  if (params.q) chips.push({ id: "q", label: `Text: “${params.q}”`, clear: { q: "" } });
  if (params.project) chips.push({ id: "project", label: `Project: ${projectName(params.project)}`, clear: { project: "" } });
  if (params.status) chips.push({ id: "status", label: `Status: ${STATUS_LABELS[params.status]}`, clear: { status: "" } });
  if (params.priority) chips.push({ id: "priority", label: `Priority: ${PRIORITY_LABELS[params.priority]}`, clear: { priority: "" } });
  if (params.assignee) chips.push({ id: "assignee", label: `Assignee: ${assigneeName(params.assignee)}`, clear: { assignee: "" } });
  if (params.dueFrom) chips.push({ id: "dueFrom", label: `Due from ${formatDay(params.dueFrom)}`, clear: { dueFrom: "" } });
  if (params.dueTo) chips.push({ id: "dueTo", label: `Due until ${formatDay(params.dueTo)}`, clear: { dueTo: "" } });

  const dir = params.dir || DEFAULT_DIR[params.sort];
  const first = result && result.total > 0 ? (result.page - 1) * result.pageSize + 1 : 0;
  const last = result ? Math.min(result.page * result.pageSize, result.total) : 0;
  const pages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  const rangeError = params.dueFrom && params.dueTo && params.dueFrom > params.dueTo ? "Pick a “to” date after the “from” date." : undefined;

  return (
    <AppLayout>
      <PageHeader title="Search" subtitle="Tasks from the projects you can open." />

      <section aria-label="Search and filters" className="space-y-4">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q: text.trim() });
          }}
        >
          <Input
            type="search"
            inputSize="lg"
            aria-label="Search tasks"
            placeholder="Search by key, title or description…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            autoFocus
          />
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <Select
            label="Project"
            value={params.project || ANY}
            onChange={(v) => apply({ project: v === ANY ? "" : v })}
            options={[{ value: ANY, label: "All projects" }, ...(options?.projects ?? []).map((p) => ({ value: p.key, label: `${p.key} · ${p.name}` }))]}
          />
          <Select
            label="Status"
            value={params.status || ANY}
            onChange={(v) => apply({ status: v === ANY ? "" : (v as SearchParams["status"]) })}
            options={[{ value: ANY, label: "Any status" }, ...STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))]}
          />
          <Select
            label="Priority"
            value={params.priority || ANY}
            onChange={(v) => apply({ priority: v === ANY ? "" : (v as SearchParams["priority"]) })}
            options={[{ value: ANY, label: "Any priority" }, ...PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))]}
          />
          <Select
            label="Assignee"
            value={params.assignee || ANY}
            onChange={(v) => apply({ assignee: v === ANY ? "" : v })}
            options={[
              { value: ANY, label: "Anyone" },
              { value: "me", label: "Assigned to me" },
              { value: "friends", label: "My friends' tasks" },
              { value: "unassigned", label: "Unassigned" },
              ...(options?.assignees ?? []).map(personOption),
            ]}
          />
          <Input label="Due from" type="date" value={params.dueFrom} onChange={(e) => apply({ dueFrom: e.target.value })} />
          <Input label="Due until" type="date" value={params.dueTo} min={params.dueFrom || undefined} onChange={(e) => apply({ dueTo: e.target.value })} error={rangeError} />
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
            {chips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200/80 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900/60"
              >
                {chip.label}
                <IconButton
                  label={`Remove filter ${chip.label}`}
                  size="sm"
                  icon={<X className="w-3 h-3" />}
                  onClick={() => {
                    if (chip.id === "q") setText("");
                    apply(chip.clear);
                  }}
                />
              </span>
            ))}
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                setText("");
                apply({ ...EMPTY_SEARCH, sort: params.sort, dir: params.dir });
              }}
            >
              Clear all
            </Button>
          </div>
        )}
      </section>

      <section aria-label="Results" aria-busy={loading} className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 tabular-nums" aria-live="polite">
            {result ? (result.total === 0 ? "No tasks" : `${first}–${last} of ${result.total}`) : " "}
          </p>
          <div className="flex items-end gap-2">
            <Select
              label="Sort by"
              className="w-44"
              value={params.sort}
              onChange={(v) => apply({ sort: v as SearchSort, dir: "" })}
              options={(Object.keys(SORT_LABELS) as SearchSort[]).map((s) => ({ value: s, label: SORT_LABELS[s] }))}
            />
            <Button
              variant="outline"
              onClick={() => apply({ dir: dir === "asc" ? "desc" : "asc" })}
              leftIcon={dir === "asc" ? <ArrowUpNarrowWide className="w-4 h-4" /> : <ArrowDownWideNarrow className="w-4 h-4" />}
              aria-label={`Sort direction: ${dir === "asc" ? "ascending" : "descending"}. Click to reverse.`}
            >
              {dir === "asc" ? "Asc" : "Desc"}
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="error" action={<Button size="sm" variant="outline" onClick={() => setParams({ ...params })}>Try again</Button>}>
            Search failed: {error}
          </Alert>
        ) : !result ? (
          <div className="py-16 flex justify-center">
            <Spinner size="lg" label="Searching" />
          </div>
        ) : result.total === 0 ? (
          <EmptyState
            icon={<SearchX className="w-6 h-6" />}
            title={chips.length ? "No tasks match" : "No tasks yet"}
            description={chips.length ? "Try other words, or remove a filter." : "Tasks from your projects will show up here."}
            action={
              chips.length
                ? {
                    label: "Clear all",
                    onClick: () => {
                      setText("");
                      apply({ ...EMPTY_SEARCH, sort: params.sort, dir: params.dir });
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className={`relative overflow-x-auto border border-zinc-200 dark:border-dark-border bg-white dark:bg-dark-card transition-opacity ${loading ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="bg-zinc-50 dark:bg-dark-elevated/50 border-b border-zinc-200 dark:border-dark-border text-left text-xs text-zinc-600 dark:text-zinc-300">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold w-28">Key</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Title</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold w-32">Status</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold w-28">Priority</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold w-44">Assignee</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold w-32">Due</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold w-28">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-dark-border">
                {result.tasks.map((t) => {
                  const open = () => navigate(`/projects/${t.project.key}/tasks/${t.number}`);
                  return (
                    <tr
                      key={t.id}
                      tabIndex={0}
                      onClick={open}
                      onKeyDown={(e) => e.key === "Enter" && open()}
                      className="hover:bg-zinc-50 dark:hover:bg-dark-elevated cursor-pointer focus-visible:outline-none focus-visible:bg-brand-50/60 dark:focus-visible:bg-brand-950/30"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t.key}</td>
                      <td className="px-4 py-2.5 max-w-0">
                        <span className="block truncate font-medium text-zinc-900 dark:text-white" title={t.title}>
                          {t.title}
                        </span>
                        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{t.project.name}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-4 py-2.5">
                        {t.assignee ? (
                          <span className="flex items-center gap-2 min-w-0">
                            <Avatar
                              size="xs"
                              name={t.assignee.name}
                              src={t.assignee.avatarPath || undefined}
                              colorSeed={t.assignee.id}
                              status={options?.assignees.find((a) => a.id === t.assignee!.id && a.isFriend)?.presence?.status}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {result && result.total > result.pageSize && (
          <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />} disabled={result.page <= 1} onClick={() => apply({ page: result.page - 1 })}>
              Previous
            </Button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
              Page {result.page} of {pages}
            </span>
            <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />} disabled={result.page >= pages} onClick={() => apply({ page: result.page + 1 })}>
              Next
            </Button>
          </nav>
        )}
      </section>
    </AppLayout>
  );
}
