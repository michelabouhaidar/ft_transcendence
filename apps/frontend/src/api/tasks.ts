import type { Presence } from "./users";
import { http, type ApiError } from "./http";

// Tasks, board and comments.

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskPerson {
  id: string;
  name: string;
  avatarPath: string | null;
}

export interface Task {
  id: string;
  number: number;
  key: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  dueDate: string | null;
  version: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator: TaskPerson | null;
  assignee: TaskPerson | null;
  commentCount: number;
}

//Used for updates; Every field is optional, so you can send just one change.
export interface TaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export interface Assignee extends TaskPerson {
  role: "OA" | "MEMBER";
  // Friends appear first in the picker and carry their online status/presence.
  isFriend?: boolean;
  presence?: Presence | null;
}

export interface TaskComment {
  id: string;
  body: string | null;
  deleted: boolean;
  edited: boolean;
  editedAt: string | null;
  createdAt: string;
  author: TaskPerson | null;
  canEdit: boolean;
  canDelete: boolean;
}

// A 409 checks the latest version.
export type TaskApiError = ApiError & { task?: Task };

const base = (key: string) => `/api/v1/projects/${encodeURIComponent(key)}`;

export const tasksApi = {
  list: (key: string) => http.get<{ tasks: Task[] }>(`${base(key)}/tasks`),
  assignees: (key: string) => http.get<{ assignees: Assignee[] }>(`${base(key)}/assignees`),
  get: (key: string, n: number) => http.get<{ task: Task; canEdit: boolean; canDelete: boolean }>(`${base(key)}/tasks/${n}`),
  create: (key: string, input: TaskInput & { title: string }) => http.post<{ message: string; task: Task }>(`${base(key)}/tasks`, input),
  update: (key: string, n: number, input: TaskInput, version: number) => http.patch<{ task: Task }>(`${base(key)}/tasks/${n}`, { ...input, version }),
  move: (key: string, n: number, status: TaskStatus, index: number, version: number) =>
    http.post<{ task: Task }>(`${base(key)}/tasks/${n}/move`, { status, index, version }),
  remove: (key: string, n: number) => http.del<{ message: string }>(`${base(key)}/tasks/${n}`),
  comments: (key: string, n: number) => http.get<{ comments: TaskComment[] }>(`${base(key)}/tasks/${n}/comments`),
  addComment: (key: string, n: number, body: string) => http.post<{ comment: TaskComment }>(`${base(key)}/tasks/${n}/comments`, { body }),
  editComment: (id: string, body: string) => http.patch<{ comment: TaskComment }>(`/api/v1/comments/${id}`, { body }),
  deleteComment: (id: string) => http.del<{ message: string }>(`/api/v1/comments/${id}`),
};
