import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { SignInData, SignUpData } from "@/services/authService";
import { AxiosError } from "axios";

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

interface User {
  userId: string;
  username: string;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (data: SignInData) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  signOut: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  refresh: () => Promise<void>;
  clearState: () => void;
  setAccessToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  userProfile: null,
  loading: false,
  error: null,

  setAccessToken: (accessToken) => {
    set({ accessToken });
  },

  signIn: async (data: SignInData) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.signIn(data);
      // Lưu accessToken vào store (có thể cần xử lý thêm với jwt decode nếu cần)
      const token = response.accessToken;

      // Giải mã JWT để lấy thông tin user (nếu cần)
      const payload = JSON.parse(atob(token.split(".")[1]));

      get().setAccessToken(token);

      set({
        //accessToken: token
        user: {
          userId: payload.userId,
          username: payload.username,
          role: payload.role,
        },
        loading: false,
      });
      //lay du lieu user khi sign in
      await get().fetchCurrentUser();

      toast.success(response.message);
      return true;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data?.message || "Đăng nhập thất bại";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  signUp: async (data: SignUpData) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.signUp(data);
      toast.success(response.message);
      set({ loading: false });
      return true;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data?.message || "Đăng ký tài khoản thất bại";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    } finally {
      set({ accessToken: null, user: null, userProfile: null, error: null });
      toast.success("Đăng xuất thành công");
    }
  },

  fetchCurrentUser: async () => {
    set({ loading: true, error: null });
    try {
      const response = await authService.getCurrentUser();
      set({
        userProfile: response,
        loading: false,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data?.message || "Lấy thông tin user thất bại";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
    }
  },

  refresh: async () => {
    try {
      set({ loading: true });
      const { user, fetchCurrentUser, setAccessToken } = get();
      const accessToken = await authService.refresh();

      setAccessToken(accessToken);
      if (!user) {
        await fetchCurrentUser();
      }
    } catch (error) {
      console.error(error);
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      get().clearState();
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),

  clearState: () => {
    set({ accessToken: null, user: null, loading: false });
  },
}));
