import { userService } from "@/services/userService";
import type { AdminUser } from "@/types/user";
import { create } from "zustand";

// @ts-expect-error - Interface kept for future extensibility
interface UserProfile {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface UserStore {
  users: AdminUser[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  lockUser: (targetUserId: string, reason: string) => Promise<void>;
  unlockUser: (targetUserId: string) => Promise<void>;
  getUsers: (page?: number, limit?: number, search?: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,
  page: 1,
  totalPages: 1,
  total: 0,

  getUsers: async (page = 1, limit = 10, search) => {
    try {
      set({ loading: true });

      const res = await userService.getUsers(page, limit, search);

      set({
        users: res.users,
        page: res.pagination.page,
        totalPages: res.pagination.totalPages,
        total: res.pagination.total,
      });
    } catch (error) {
      console.error(error);
    } finally {
      set({ loading: false });
    }
  },

  // implementation
  lockUser: async (targetUserId, reason) => {
    await userService.adminLockAccount(targetUserId, reason);
  },

  unlockUser: async (targetUserId) => {
    await userService.adminUnlockAccount(targetUserId);
  },
}));

// interface User {
//   userId: string;
//   username: string;
//   role: string;
// }

// interface UpdateProfilePayload {
//   displayName?: string;
//   phone?: string;
//   bio?: string;
// }

// interface UpdateProfileResponse {
//   message: string;
//   user: UserProfile;
// }

// interface UpdateProfilePayload {
//   displayName?: string;
//   bio?: string;
//   phone?: string;
// }
