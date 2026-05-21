import axiosInstance from "../lib/axios";
import type { NotificationItem } from "../types/post";

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination: { page: number; limit: number; total: number; hasMore: boolean };
}

export const notificationService = {
  getNotifications: async (page = 1): Promise<NotificationsResponse> => {
    const { data } = await axiosInstance.get("/notifications", { params: { page } });
    return data;
  },
  markRead: async (id: string) => {
    const { data } = await axiosInstance.put(`/notifications/${id}/read`);
    return data;
  },
  markAllRead: async () => {
    const { data } = await axiosInstance.put("/notifications/read-all");
    return data;
  },
  getUnreadCount: async (): Promise<{ count: number }> => {
    const { data } = await axiosInstance.get("/notifications/unread-count");
    return data;
  },
};
