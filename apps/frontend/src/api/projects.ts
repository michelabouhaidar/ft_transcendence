import { http, query, type ApiError } from "./http";
import type { OrgRole } from "./auth";

// Projects and project access.

export interface Project {
  id: string;
  orgId: string;
  key: string;
  name: string;
  description: string | null;
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  doneCount: number;
  openCount: number;
  overdueCount: number;
  percentDone: number;
}

export interface ProjectInput {
  name: string;
  description?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
}

export interface ProjectAccessMember {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  avatarPath: string | null;
  role: OrgRole;
  hasAccess: boolean;
  implicit: boolean;
  grantedAt: string | null;
  grantedByName: string | null;
  assignedTasks: number;
}

export type ProjectApiError = ApiError;

const scope = (orgId?: string) => query({ orgId });
const path = (key: string, rest = "") => `/api/v1/projects/${encodeURIComponent(key)}${rest}`;

export const projectsApi = {
  list: (orgId?: string) => http.get<{ projects: Project[]; canManage: boolean }>(`/api/v1/projects${scope(orgId)}`),
  create: (payload: ProjectInput & { key: string; orgId?: string }) => http.post<{ message: string; project: Project }>("/api/v1/projects", payload),
  get: (key: string, orgId?: string) => http.get<{ project: Project; canManage: boolean; canEditTasks: boolean }>(path(key, scope(orgId))),
  update: (key: string, payload: ProjectInput, orgId?: string) => http.patch<{ message: string; project: Project }>(path(key, scope(orgId)), payload),
  remove: (key: string, confirmKey: string, orgId?: string) => http.del<{ message: string }>(path(key, scope(orgId)), { confirmKey }),
  getAccess: (key: string, orgId?: string) => http.get<{ members: ProjectAccessMember[] }>(path(key, `/access${scope(orgId)}`)),
  grantAccess: (key: string, userId: string, orgId?: string) => http.post<{ message: string }>(path(key, `/access${scope(orgId)}`), { userId }),
  revokeAccess: (key: string, userId: string, orgId?: string) =>
    http.del<{ message: string; unassignedTasks: number }>(path(key, `/access/${userId}${scope(orgId)}`)),
};
