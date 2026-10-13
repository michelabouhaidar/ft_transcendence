import { http, query } from "./http";

export type Role = "SA" | "OA" | "MEMBER" | "VIEWER" | "U";
export type OrgRole = "OA" | "MEMBER" | "VIEWER";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  bio: string | null;
  avatarPath: string | null;
  isSystemAdmin: boolean;
  status: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthMeResponse {
  user: User;
  organization: Organization | null;
  role: Role;
}

export interface LoginResponse {
  requires2fa: boolean;
  message?: string;
  user?: User;
  organization?: Organization | null;
  role?: Role;
}

export interface Invitation {
  id: string;
  email: string;
  role: OrgRole;
  status: string;
  expiresAt: string;
  organization: { id: string; name: string; description: string | null };
  invitedBy: { id: string; firstName: string; lastName: string; email: string };
}

type Message = { success?: boolean; message: string };
type NewAccount = { firstName: string; lastName: string; password: string; passwordConfirmation: string; acceptTerms: boolean };

export const authApi = {
  getMe: () => http.get<AuthMeResponse>("/api/v1/auth/me"),
  signup: (payload: NewAccount & { email: string; acceptTerms: true }) => http.post<Message>("/api/v1/auth/signup", payload),
  verifyEmail: (token: string) => http.post<Message>("/api/v1/auth/verify", { token }),
  resendVerification: (email: string) => http.post<Message>("/api/v1/auth/verify/resend", { email }),
  login: (payload: { email: string; password: string }) => http.post<LoginResponse>("/api/v1/auth/login", payload),
  login2fa: (payload: { code: string; isRecoveryCode?: boolean }) => http.post<LoginResponse>("/api/v1/auth/login/2fa", payload),
  logout: () => http.post<{ success: boolean }>("/api/v1/auth/logout"),
  forgotPassword: (email: string) => http.post<Message>("/api/v1/auth/password/forgot", { email }),
  resetPassword: (payload: { token: string; password: string; passwordConfirmation: string }) => http.post<Message>("/api/v1/auth/password/reset", payload),
  verifyResetToken: (token: string) => http.get<{ valid: boolean; email?: string }>(`/api/v1/auth/password/reset/verify${query({ token })}`),

  // ---------- Profile, password, 2FA ----------
  updateProfile: (payload: { firstName?: string; lastName?: string; jobTitle?: string | null; bio?: string | null }) =>
    http.patch<Message & { user: User }>("/api/v1/auth/profile", payload),
  changePassword: (payload: { currentPassword: string; newPassword: string }) => http.post<Message>("/api/v1/auth/password/change", payload),
  get2faStatus: () => http.get<{ enabled: boolean; remainingRecoveryCodes?: number }>("/api/v1/auth/2fa/status"),
  setup2fa: (payload: { password: string }) => http.post<{ secret: string; qrCodeDataUrl: string }>("/api/v1/auth/2fa/setup", payload),
  enable2fa: (payload: { code: string }) => http.post<{ success: boolean; recoveryCodes: string[] }>("/api/v1/auth/2fa/enable", payload),
  disable2fa: (payload: { password: string; code: string }) => http.post<Message>("/api/v1/auth/2fa/disable", payload),

  // ---------- Organizations and invitations (spec §6.3) ----------
  getInvitations: () => http.get<{ invitations: Invitation[] }>("/api/v1/me/invitations"),
  acceptInvitation: (id: string) => http.post<Message & { organization: Organization; role: OrgRole }>(`/api/v1/invitations/${id}/accept`),
  declineInvitation: (id: string) => http.post<Message>(`/api/v1/invitations/${id}/decline`),
  createOrganization: (payload: { name: string; description?: string }) =>
    http.post<{ success: boolean; organization: Organization; role: string }>("/api/v1/orgs", payload),
  getCurrentOrg: () => http.get<CurrentOrgResponse>("/api/v1/orgs/current"),
  getOrgInvitations: (orgId: string) => http.get<{ invitations: OrgInvitation[] }>(`/api/v1/orgs/${orgId}/invitations`),
  inviteToOrg: (orgId: string, payload: { email: string; role: OrgRole }) => http.post<Message>(`/api/v1/orgs/${orgId}/invitations`, payload),
  resendInvitation: (id: string) => http.post<Message>(`/api/v1/invitations/${id}/resend`),
  revokeInvitation: (id: string) => http.post<Message>(`/api/v1/invitations/${id}/revoke`),
  getInvitationByToken: (token: string) =>
    http.get<{ invitation: InvitationPreview; accountExists: boolean }>(`/api/v1/invitations/by-token/${encodeURIComponent(token)}`),
  acceptInvitationAsNew: (token: string, payload: NewAccount) =>
    http.post<Message & { user: User; organization: Organization; role: OrgRole }>(`/api/v1/invitations/by-token/${encodeURIComponent(token)}/accept`, payload),

  // ---------- System Admin invitation (ADM-02) ----------
  getSaInvitationByToken: (token: string) =>
    http.get<{ invitation: { email: string; expiresAt: string; invitedByName: string }; accountExists: boolean }>(
      `/api/v1/invitations/sa/by-token/${encodeURIComponent(token)}`
    ),
  acceptSaInvitation: (token: string, payload: NewAccount) =>
    http.post<Message & { user: User; organization: null; role: "SA" }>(`/api/v1/invitations/sa/by-token/${encodeURIComponent(token)}/accept`, payload),

  // ---------- Administration (spec §6.5) ----------
  adminGetUsers: (params: { page?: number; limit?: number; q?: string; status?: string; orgId?: string; role?: string; sort?: AdminUserSort; order?: "asc" | "desc" } = {}) =>
    http.get<AdminUsersResponse>(`/api/v1/admin/users${query(params)}`),
  adminGetUser: (id: string) => http.get<{ user: AdminUserDetail }>(`/api/v1/admin/users/${id}`),
  adminUpdateUser: (
    id: string,
    payload: { firstName?: string; lastName?: string; jobTitle?: string | null; bio?: string | null; isSystemAdmin?: boolean; orgRole?: OrgRole }
  ) => http.patch<{ message: string; changes: string[]; unassignedTasks?: number }>(`/api/v1/admin/users/${id}`, payload),
  adminSuspendUser: (id: string, reason?: string) => http.post<Message>(`/api/v1/admin/users/${id}/suspend`, { reason }),
  adminReactivateUser: (id: string) => http.post<Message>(`/api/v1/admin/users/${id}/reactivate`),
  adminDeleteUser: (id: string, confirmEmail: string) => http.del<Message>(`/api/v1/admin/users/${id}`, { confirmEmail }),
  adminCreateInvitation: (payload: { email: string; role: "SA" | OrgRole; orgId?: string }) => http.post<Message>("/api/v1/admin/invitations", payload),
  adminGetOrgs: () => http.get<{ organizations: AdminOrgItem[] }>("/api/v1/admin/orgs"),
  adminCreateOrg: (payload: { name: string; description?: string; firstOaEmail?: string }) =>
    http.post<Message & { organization: Organization }>("/api/v1/admin/orgs", payload),
  adminGetOrg: (id: string) => http.get<{ organization: AdminOrgDetail }>(`/api/v1/admin/orgs/${id}`),
  adminUpdateOrg: (id: string, payload: { name: string; description?: string }) =>
    http.patch<Message & { organization: Organization }>(`/api/v1/admin/orgs/${id}`, payload),
  adminDeleteOrg: (id: string, confirmName: string) => http.del<Message>(`/api/v1/admin/orgs/${id}`, { confirmName }),

  // ---------- Organization management for Org Admins (ORG-03…07) ----------
  getOrg: (id: string) => http.get<{ organization: Organization & { memberCount: number; projectCount: number } }>(`/api/v1/orgs/${id}`),
  updateOrg: (id: string, payload: { name: string; description?: string }) => http.patch<Message & { organization: Organization }>(`/api/v1/orgs/${id}`, payload),
  deleteOrg: (id: string, confirmName: string) => http.del<Message>(`/api/v1/orgs/${id}`, { confirmName }),
  getMemberImpact: (orgId: string, userId: string) => http.get<{ assignedTasks: number }>(`/api/v1/orgs/${orgId}/members/${userId}/impact`),
  changeMemberRole: (orgId: string, userId: string, role: "MEMBER" | "VIEWER") =>
    http.patch<Message & { unassignedTasks: number }>(`/api/v1/orgs/${orgId}/members/${userId}`, { role }),
  removeMember: (orgId: string, userId: string) => http.del<Message>(`/api/v1/orgs/${orgId}/members/${userId}`),
  leaveOrg: (orgId: string) => http.post<Message>(`/api/v1/orgs/${orgId}/leave`),
};

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DELETED";
export type AdminUserSort = "name" | "email" | "status" | "lastLoginAt" | "createdAt";

export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle: string | null;
  bio: string | null;
  avatarPath: string | null;
  status: AccountStatus;
  isSystemAdmin: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  organization: { id: string; name: string } | null;
  orgRole: OrgRole | null;
  role: "SA" | OrgRole | "U";
  /** Actions the backend would refuse (§4.1 last-SA / last-OA rules). */
  guards: {
    isSelf: boolean;
    lastSa: boolean;
    lastOa: boolean;
  };
}

export interface AdminUserDetail extends AdminUserListItem {
  memberships: Array<{
    id: string;
    orgId: string;
    orgName: string;
    orgDeleted: boolean;
    role: OrgRole;
    status: "ACTIVE" | "REMOVED";
    joinedAt: string;
    leftAt: string | null;
  }>;
  counts: {
    tasksCreated: number;
    tasksAssigned: number;
    comments: number;
    friendships: number;
  };
}

export interface AdminUsersResponse {
  users: AdminUserListItem[];
  statusCounts: Record<AccountStatus, number>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminOrgItem {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
  projectCount: number;
}

export interface AdminOrgDetail {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  createdByName: string;
  members: Array<{
    userId: string;
    fullName: string;
    email: string;
    avatarPath: string | null;
    accountStatus: AccountStatus;
    role: OrgRole;
    joinedAt: string;
  }>;
  projects: Array<{ id: string; key: string; name: string; taskCount: number }>;
  pendingInvitations: Array<{ id: string; email: string; role: OrgRole; expiresAt: string }>;
  counts: {
    members: number;
    projects: number;
    tasks: number;
    comments: number;
    pendingInvitations: number;
  };
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  avatarPath: string | null;
  role: OrgRole;
  joinedAt: string;
}

export interface OrgPendingInvitation {
  id: string;
  email: string;
  role: OrgRole;
  expiresAt: string;
  createdAt: string;
}

export interface CurrentOrgResponse {
  organization: Organization | null;
  members?: WorkspaceMember[];
  pendingInvitationsCount?: number;
  pendingInvitations?: OrgPendingInvitation[];
  role?: Role;
}

export type InvitationState = "PENDING" | "EXPIRED" | "ACCEPTED" | "DECLINED" | "REVOKED";

export interface OrgInvitation {
  id: string;
  email: string;
  role: OrgRole;
  status: InvitationState;
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
}

export interface InvitationPreview {
  id: string;
  email: string;
  role: OrgRole;
  expiresAt: string;
  organization: { name: string; description: string | null };
  invitedByName: string;
}
