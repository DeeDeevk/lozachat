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
  getUsers: (page?: number, limit?: number) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,
  page: 1,
  totalPages: 1,
  total: 0,

  getUsers: async (page = 1, limit = 10) => {
    try {
      set({ loading: true });

      const res = await userService.getUsers(page, limit);

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
