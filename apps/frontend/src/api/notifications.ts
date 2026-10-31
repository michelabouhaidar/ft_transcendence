	import { http, query } from "./http";

	// Server does not send a ready-made sentence.
	// It sends a type and params; notificationText.ts words them.

	export interface AppNotification {
	id: string;
	type: string;
	params: Record<string, unknown>;
	resourceType: string;
	resourceId: string;
	read: boolean;
	createdAt: string;
	actor: { id: string; name: string; avatarPath: string | null } | null;
	}

	export interface NotificationPage {
	notifications: AppNotification[];
	total: number;
	unreadCount: number;
	page: number;
	pageSize: number;
	}

	// Where a notification leads now (A notification can be days old, and things change).
	export interface NotificationTarget {
	path: string | null;
	gone: boolean;
	unreadCount: number;
	}

	export const notificationsApi = {
	list: ({ filter, page, pageSize }: { filter?: "all" | "unread"; page?: number; pageSize?: number } = {}) =>
		http.get<NotificationPage>(`/api/v1/notifications${query({ filter: filter === "unread" ? "unread" : undefined, page, pageSize })}`),
	markRead: (id: string) => http.patch<NotificationTarget>(`/api/v1/notifications/${id}/read`),
	markAllRead: () => http.post<{ marked: number; unreadCount: number }>("/api/v1/notifications/read-all"),
	remove: (id: string) => http.del<{ unreadCount: number }>(`/api/v1/notifications/${id}`),
	};
