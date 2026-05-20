import api from "@/lib/axios";
import type { AdminUser } from "@/types/user";

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  role: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
  phone?: string;
}

interface UpdateProfileResponse {
  message: string;
  user: UserProfile;
}

export type AccountLockRequestStatus = "pending" | "approved" | "rejected";

export interface AccountLockRequest {
  _id: string;
  userId: string | UserProfile;
  reason: string;
  status: AccountLockRequestStatus;
  reviewedBy?:
    | string
    | Pick<UserProfile, "_id" | "username" | "displayName" | "avatarUrl">;
  reviewedAt?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountUnlockRequest {
  _id: string;
  userId: string | UserProfile;
  reason: string;
  status: AccountLockRequestStatus;
  reviewedBy?:
    | string
    | Pick<UserProfile, "_id" | "username" | "displayName" | "avatarUrl">;
  reviewedAt?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  updateMe: async (
    payload: UpdateProfilePayload,
  ): Promise<UpdateProfileResponse> => {
    const res = await api.put("/users/me", payload);
    return res.data;
  },

  uploadAvatar: async (
    file: File,
  ): Promise<{ message: string; user: UserProfile }> => {
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await api.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  deleteMe: async (): Promise<{ message: string }> => {
    const res = await api.delete("/users/me");
    return res.data;
  },

  requestAccountLock: async (
    reason?: string,
  ): Promise<{ message: string; request: AccountLockRequest }> => {
    const res = await api.post("/users/lock-requests", { reason });
    return res.data;
  },

  getMyAccountLockRequests: async (): Promise<{
    requests: AccountLockRequest[];
  }> => {
    const res = await api.get("/users/lock-requests/me");
    return res.data;
  },

  getAccountLockRequests: async (
    status: AccountLockRequestStatus | "all" = "pending",
  ): Promise<{ requests: AccountLockRequest[] }> => {
    const res = await api.get("/users/lock-requests", { params: { status } });
    return res.data;
  },

  reviewAccountLockRequest: async (
    requestId: string,
    action: "approved" | "rejected",
    adminNote?: string,
  ): Promise<{ message: string; request: AccountLockRequest }> => {
    const res = await api.patch(`/users/lock-requests/${requestId}/review`, {
      action,
      adminNote,
    });
    return res.data;
  },

  requestAccountUnlock: async (
    username: string,
    reason: string,
  ): Promise<{
    message: string;
    request: AccountUnlockRequest;
  }> => {
    const res = await api.post("/users/unlock-requests", {
      username,
      reason,
    });

    return res.data;
  },

  getAccountUnlockRequests: async (): Promise<{
    requests: AccountLockRequest[];
  }> => {
    const res = await api.get("/users/unlock-requests");
    return res.data;
  },

  reviewAccountUnlockRequest: async (
    requestId: string,
    action: "approved" | "rejected",
  ) => {
    const res = await api.patch(`/users/unlock-requests/${requestId}/review`, {
      action,
    });

    return res.data;
  },
  getUsers: async (
    page = 1,
    limit = 10,
    search = "",
  ): Promise<{
    users: AdminUser[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    const res = await api.get("/admin/users", {
      params: {
        page,
        limit,
        search,
      },
    });
    return res.data;
  },

  adminLockAccount: async (targetUserId: string, reason: string) => {
    const res = await api.post(`/users/${targetUserId}/lock`, { reason });
    return res.data;
  },

  adminUnlockAccount: async (targetUserId: string) => {
    const res = await api.post(`/users/${targetUserId}/unlock`);
    return res.data;
  },
  getActivityStats: async (
    period: "7d" | "30d" | "12m",
    date?: string,
  ): Promise<{
    data: Array<{ _id: string; count: number }>;
    period: string;
  }> => {
    const params = new URLSearchParams();
    if (date) {
      params.set("date", date);
    } else {
      params.set("period", period);
    }
    const res = await api.get(`/admin/stats/activity?${params.toString()}`);
    return res.data;
  },
};
