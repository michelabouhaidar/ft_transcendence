import { http, query } from "./http";
import type { Role } from "./auth";

export type FriendshipState = "NONE" | "FRIENDS" | "OUTGOING" | "INCOMING";

export interface Presence {
  status: "online" | "offline";
  lastSeenAt: string | null;
}

// USR-06: pushed to friends when someone comes online or goes offline (after a 10 s grace period).
export interface PresenceUpdate extends Presence {
  userId: string;
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  avatarPath: string | null;
}

export interface UserProfile extends PublicUser {
  bio: string | null;
  organization: { id: string; name: string } | null;
  role: Exclude<Role, "U"> | null;
  memberSince: string;
}

export interface UserProfileResponse {
  user: UserProfile;
  isSelf: boolean;
  friendship: { state: FriendshipState; id: string | null };
  presence: Presence | null;
  canRequestFriend: boolean;
  /** When the two became friends (friends only). */
  friendsSince?: string | null;
  /** Work and friends in the viewer's organization; null for people outside it. */
  work?: ProfileWork | null;
}

export interface ProfileTask {
  key: string;
  projectKey: string;
  projectName: string;
  number: number;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface ProfileWork {
  stats: { open: number; overdue: number; doneLast30Days: number };
  openTasks: ProfileTask[];
  recentlyCompleted: ProfileTask[];
  projects: Array<{ key: string; name: string; openAssigned: number }>;
  friendCount: number;
  mutualFriends: Array<{ id: string; name: string; avatarPath: string | null }>;
}

export interface DirectoryMember {
  userId: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  avatarPath: string | null;
  role: "OA" | "MEMBER" | "VIEWER";
  friendship: { state: FriendshipState; id: string | null };
  /** Friends only (USR-06). */
  presence?: Presence | null;
}

export interface DirectoryResponse {
  members: DirectoryMember[];
  total: number;
  orgAdminCount: number;
  page: number;
  pageSize: number;
}

export interface FriendItem {
  friendshipId: string;
  user: PublicUser;
  since: string;
  requestedAt: string;
  presence?: Presence;
}

export interface FriendsResponse {
  friends: FriendItem[];
  incoming: FriendItem[];
  outgoing: FriendItem[];
}

export const usersApi = {
  getProfile: (id: string) => http.get<UserProfileResponse>(`/api/v1/users/${id}`),
  listMembers: (params: { q?: string; page?: number; pageSize?: number }) => http.get<DirectoryResponse>(`/api/v1/orgs/current/members${query(params)}`),
  uploadAvatar: (file: File) => http.post<{ avatarPath: string }>("/api/v1/users/me/avatar", file),
  removeAvatar: () => http.del<{ avatarPath: null }>("/api/v1/users/me/avatar"),
  getFriends: () => http.get<FriendsResponse>("/api/v1/friends"),
  sendFriendRequest: (userId: string) => http.post<{ friendshipId: string }>("/api/v1/friends/requests", { userId }),
  acceptFriendRequest: (friendshipId: string) => http.post<void>(`/api/v1/friendships/${friendshipId}/accept`),
  declineFriendRequest: (friendshipId: string) => http.post<void>(`/api/v1/friendships/${friendshipId}/decline`),
  // Removes a friend or cancels an outgoing request.
  removeFriendship: (friendshipId: string) => http.del<void>(`/api/v1/friendships/${friendshipId}`),
};
