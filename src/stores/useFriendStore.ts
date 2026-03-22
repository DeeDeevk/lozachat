import type { User, FriendRequest, Friend } from "../types/user";
import { friendService } from "@/services/friendService";
import { create } from "zustand";

interface FriendState {
  friends: Friend[];
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  friendStatus: string | null;
  searchByUserName: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequest: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  getFriendStatus: (targetId: string) => Promise<string | null>;
  getFriends: () => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  unfriend: (targetId: string) => Promise<void>;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  loading: false,
  receivedList: [],
  sentList: [],
  friendStatus: null,
  searchByUserName: async (username) => {
    try {
      set({ loading: true });

      const user = await friendService.searchByUserName(username);

      return user;
    } catch (error) {
      console.error("Lỗi xảy ra khi tìm user bằng username", error);
      return null;
    } finally {
      set({ loading: false });
    }
  },
  addFriend: async (to, message) => {
    try {
      set({ loading: true });
      const resultMessage = await friendService.sendFriendRequest(to, message);
      return resultMessage;
    } catch (error) {
      console.error("Lỗi xảy ra khi addFriend", error);
      return "Lỗi xảy ra khi kết bạn. Hãy thử lại";
    } finally {
      set({ loading: false });
    }
  },
  getAllFriendRequest: async () => {
    try {
      set({ loading: true });
      const result = await friendService.getAllFriendRequest();
      if (!result) return;
      const { received, sent } = result;
      set({ receivedList: received, sentList: sent });
    } catch (error) {
      console.error("Lỗi xảy ra khi lấy danh sách yêu cầu kết bạn", error);
    } finally {
      set({ loading: false });
    }
  },
  acceptRequest: async (requestId) => {
    try {
      set({ loading: true });
      await friendService.acceptRequest(requestId);

      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
      }));
    } catch (error) {
      console.error("Lỗi xảy ra khi chấp nhận yêu cầu kết bạn", error);
    } finally {
      set({ loading: false });
    }
  },
  declineRequest: async (requestId) => {
    try {
      set({ loading: true });
      await friendService.declineRequest(requestId);

      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
      }));
    } catch (error) {
      console.error("Lỗi xảy ra khi từ chối yêu cầu kết bạn", error);
    } finally {
      set({ loading: false });
    }
  },
  getFriendStatus: async (targetId) => {
    try {
      set({ loading: true });

      const status = await friendService.getFriendStatus(targetId);

      set({ friendStatus: status });

      return status || null;
    } catch (error) {
      console.error("Lỗi khi lấy trạng thái bạn bè", error);
      return null;
    } finally {
      set({ loading: false });
    }
  },
  getFriends: async () => {
    try {
      set({ loading: true });
      const friends = await friendService.getFriendList();
      set({ friends: friends });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bạn bè", error);
      set({ friends: [] });
    } finally {
      set({ loading: false });
    }
  },
  cancelRequest: async (requestId) => {
  try {
    set({ loading: true });

    await friendService.cancelRequest(requestId);

    set((state) => ({
      sentList: state.sentList.filter((r) => r._id !== requestId),
    }));
  } catch (error) {
    console.error("Lỗi khi huỷ yêu cầu", error);
  } finally {
    set({ loading: false });
  }
},
unfriend: async (targetId) => {
  try {
    set({ loading: true });

    await friendService.unfriend(targetId);

    // 👇 xóa khỏi danh sách bạn
    set((state) => ({
      friends: state.friends.filter((f) => f._id !== targetId),
      friendStatus: "none",
    }));
  } catch (error) {
    console.error("Lỗi khi huỷ kết bạn", error);
  } finally {
    set({ loading: false });
  }
},
}));
