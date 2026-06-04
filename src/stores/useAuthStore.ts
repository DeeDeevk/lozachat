import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { SignInData, SignUpData } from "@/services/authService";
import { AxiosError } from "axios";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";
import { broadcastLogin, broadcastLogout } from "@/hook/useSyncAuthBetweenTabs";

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
  forceLogoutMessage: string | null;
  clearForceLogout: () => void;
  signIn: (
    data: SignInData,
    forceLogin?: boolean,
  ) => Promise<{ success: boolean; code?: string; message?: string }>;
  errorCode: string | null;
  fetchMe: () => Promise<void>;
  signUp: (data: SignUpData) => Promise<boolean>;
  signOut: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  refresh: () => Promise<void>;
  clearState: () => void;
  setAccessToken: (accessToken: string) => void;
  setUserProfile: (user: UserProfile) => void;
  initFromBroadcast: (accessToken: string) => Promise<void>;
  verifyPassword: (password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      userProfile: null,
      loading: false,
      error: null,
      errorCode: null,

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },
      setUserProfile: (user) =>
        set(() => ({
          userProfile: user,
        })),

      forceLogoutMessage: null,

      clearForceLogout: () => set({ forceLogoutMessage: null }),

      signIn: async (data: SignInData, forceLogin = true) => {
        set({ loading: true, error: null });
        localStorage.removeItem("accessToken");
        useChatStore.getState().reset();
        try {
          const response = await authService.signIn(data, forceLogin);
          const token = response.accessToken;
          const payload = JSON.parse(atob(token.split(".")[1]));

          get().setAccessToken(token);
          await get().fetchMe();

          set({
            user: {
              userId: payload.userId,
              username: payload.username,
              role: payload.role,
            },
            loading: false,
          });

          await get().fetchCurrentUser();
          useChatStore.getState().fetchConversations();
          broadcastLogin(token);
          toast.success(response.message);
          return { success: true };
        } catch (error) {
          const axiosError = error as AxiosError<{
            message: string;
            code?: string;
          }>;

          // ✅ Xử lý SESSION_CONFLICT riêng - không toast error
          if (axiosError.response?.status === 409) {
            set({ loading: false });
            return {
              success: false,
              code: axiosError.response.data.code,
              message: axiosError.response.data.message,
            };
          }

          const errorMessage =
            axiosError.response?.data?.message || "Đăng nhập thất bại";
          set({ loading: false, error: errorMessage });
          toast.error(errorMessage);
          return { success: false };
        }
      },

      verifyPassword: async (inputPassword: string) => {
        await authService.verifyPassword(inputPassword);
      },

      fetchMe: async () => {
        try {
          set({ loading: true });
          const user = await authService.fetchMe();

          set({ user });
        } catch (error) {
          console.error(error);
          set({ user: null, accessToken: null });
          toast.error("Lỗi xảy ra khi lấy dữ liệu người dùng. Hãy thử lại!");
        } finally {
          set({ loading: false });
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
          set({
            accessToken: null,
            user: null,
            userProfile: null,
            error: null,
            forceLogoutMessage: null, // ✅ thêm dòng này
          });
          // Broadcast đăng xuất tới các tab khác
          broadcastLogout();
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
          const { user, fetchMe, setAccessToken } = get();
          const accessToken = await authService.refresh();

          setAccessToken(accessToken);
          if (!user) {
            await fetchMe();
          }
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          const status = axiosError.response?.status;

          // ✅ Session bị xóa (thiết bị khác đăng nhập) → redirect signin
          if (status === 403) {
            get().clearState();
            // Set message để có thể hiển thị thông báo nếu muốn
            set({
              forceLogoutMessage:
                "Phiên đăng nhập đã hết hạn hoặc bị thay thế bởi thiết bị khác.",
            });
            return;
          }

          get().clearState();
        } finally {
          set({ loading: false });
        }
      },

      clearError: () => set({ error: null }),

      clearState: () => {
        set({
          accessToken: null,
          user: null,
          userProfile: null,
          loading: false,
          error: null,
          errorCode: null,
          forceLogoutMessage: null,
        });
        localStorage.removeItem("accessToken");
        useChatStore.getState().reset();
      },
      // useAuthStore.ts - thêm vào store implementation
      initFromBroadcast: async (token: string) => {
        // Set token TRƯỚC - để axios interceptor có token ngay
        set({ accessToken: token, user: null, userProfile: null });

        try {
          // Giải mã JWT lấy user info cơ bản (không cần gọi API)
          const payload = JSON.parse(atob(token.split(".")[1]));
          set({
            user: {
              userId: payload.userId,
              username: payload.username,
              role: payload.role,
            },
          });

          // Fetch full profile
          await get().fetchCurrentUser();

          // Fetch conversations SAU KHI user đã có
          await useChatStore.getState().fetchConversations();
        } catch (error) {
          console.error("Lỗi init từ broadcast:", error);
          get().clearState();
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        userProfile: state.userProfile, // Lưu profile để hiện avatar/tên ngay lập tức
      }),
    },
  ),
);
