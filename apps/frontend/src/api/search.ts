import type { Presence } from "./users";
import { http } from "./http";
import { Task, TaskPriority, TaskStatus } from "./tasks";

// Task search
export type SearchSort = "updated" | "created" | "due" | "priority" | "title";

export interface SearchParams {
  q: string;
  project: string;
  status: TaskStatus | "";
  priority: TaskPriority | "";
  // "me", "unassigned", "friends" or a user id.
  assignee: string;
  dueFrom: string;
  dueTo: string;
  sort: SearchSort;
  dir: "asc" | "desc" | "";
  page: number;
}

export interface SearchResult {
  tasks: Array<Task & { project: { key: string; name: string } }>;
  total: number;
  page: number;
  pageSize: number;
  sort: SearchSort;
  dir: "asc" | "desc";
  options: {
    projects: Array<{ key: string; name: string }>;
    assignees: Array<{ id: string; name: string; avatarPath: string | null; isFriend: boolean; presence: Presence | null }>;
  };
}

export const EMPTY_SEARCH: SearchParams = {
  q: "",
  project: "",
  status: "",
  priority: "",
  assignee: "",
  dueFrom: "",
  dueTo: "",
  sort: "updated",
  dir: "",
  page: 1,
};

// URL <-> params: only non-default values go in the query string.
export function toQueryString(p: SearchParams): string {
  const qs = new URLSearchParams();
  (Object.keys(EMPTY_SEARCH) as Array<keyof SearchParams>).forEach((k) => {
    const v = p[k];
    if (v !== EMPTY_SEARCH[k] && v !== "" && v !== undefined) qs.set(k, String(v));
  });
  return qs.toString();
}

export function fromQueryString(search: string): SearchParams {
  const qs = new URLSearchParams(search);
  const get = (k: string) => qs.get(k) ?? "";
  const sort = get("sort") as SearchSort;
  const dir = get("dir");
  const page = Number(get("page"));
  return {
    q: get("q"),
    project: get("project").toUpperCase(),
    status: (["TODO", "IN_PROGRESS", "DONE"].includes(get("status")) ? get("status") : "") as SearchParams["status"],
    priority: (["LOW", "MEDIUM", "HIGH", "URGENT"].includes(get("priority")) ? get("priority") : "") as SearchParams["priority"],
    assignee: get("assignee"),
    dueFrom: /^\d{4}-\d{2}-\d{2}$/.test(get("dueFrom")) ? get("dueFrom") : "",
    dueTo: /^\d{4}-\d{2}-\d{2}$/.test(get("dueTo")) ? get("dueTo") : "",
    sort: ["updated", "created", "due", "priority", "title"].includes(sort) ? sort : "updated",
    dir: dir === "asc" || dir === "desc" ? dir : "",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export const searchApi = {
  tasks: (p: SearchParams, signal?: AbortSignal) => http.get<SearchResult>(`/api/v1/search/tasks?${toQueryString(p)}`, signal),
};
