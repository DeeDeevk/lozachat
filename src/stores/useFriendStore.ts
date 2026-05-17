import type { User, FriendRequest, Friend, RequestStatus } from "../types/user";
import { friendService } from "@/services/friendService";
import { useAuthStore } from "./useAuthStore";
import { create } from "zustand";

interface FriendState {
  handleRealTimeUpdate: (update: {
    action: string;
    targetUserId?: string;
    senderId?: string;
    receiverId?: string;
    fromUserId?: string;
    requestId?: string;
    request?: FriendRequest;
    newFriend?: Friend;
    status?: string;
  }) => void;
  targetStatuses: Record<string, RequestStatus>;
  friends: Friend[];
  newFriendIds: string[];
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
  updateFriendStatus: (targetId: string) => Promise<void>;
  getFriends: () => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  unfriend: (targetId: string) => Promise<void>;
  addNewFriendId: (friendId: string) => void;
  clearNewFriends: () => void;
  checkFriendship: (targetId: string) => Promise<boolean>;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  targetStatuses: {},
  friends: [],
  newFriendIds: [],
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

      // 👇 Lấy friend ID từ response hoặc từ receivedList
      const request = get().receivedList.find((r) => r._id === requestId);
      if (request) {
        const fromId =
          typeof request.from === "string"
            ? request.from
            : (request.from as Partial<typeof request.from>)?._id || "";
        if (fromId) {
          get().addNewFriendId(fromId);
        }
      }

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

      set((state) => ({
        friendStatus: status,
        targetStatuses: {
          ...state.targetStatuses,
          [targetId]: status as RequestStatus,
        },
      }));

      return status || null;
    } catch (error) {
      console.error("Lỗi khi lấy trạng thái bạn bè", error);
      return null;
    } finally {
      set({ loading: false });
    }
  },
  updateFriendStatus: async (targetId: string) => {
    try {
      const status = await friendService.getFriendStatus(targetId);
      set((state) => ({
        targetStatuses: {
          ...state.targetStatuses,
          [targetId]: status as RequestStatus,
        },
      }));
    } catch (error) {
      console.error("Lỗi update friend status", error);
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
  handleRealTimeUpdate: async (update: {
    action: string;
    targetUserId?: string;
    senderId?: string;
    receiverId?: string;
    fromUserId?: string;
    requestId?: string;
    request?: FriendRequest;
    newFriend?: Friend;
    status?: string;
  }) => {
    const authStore = useAuthStore.getState();
    const myId = authStore.user?.userId || authStore.userProfile?._id;
    if (!myId) return;

    if (
      update.targetUserId === myId ||
      update.senderId === myId ||
      update.receiverId === myId ||
      update.fromUserId === myId
    ) {
      console.log("🔥 Real-time friend update:", update.action, update);

      // OPTIMISTIC UPDATES - siêu nhanh UI
      set((state) => {
        switch (update.action) {
          case "request_received":
            if (
              update.request &&
              !state.receivedList.find((r) => r._id === update.request?._id)
            ) {
              return {
                receivedList: [
                  ...state.receivedList,
                  update.request as FriendRequest,
                ],
              };
            }
            break;
          case "request_sent":
            if (update.targetUserId) {
              return {
                targetStatuses: {
                  ...state.targetStatuses,
                  [update.targetUserId]: (update.status || "sent") as RequestStatus,
                },
              };
            }
            break;
          case "request_cancelled":
          case "request_declined":
            if (update.requestId) {
              const requestInfo =
                state.sentList.find((r) => r._id === update.requestId) ||
                state.receivedList.find((r) => r._id === update.requestId);
              const peerId =
                update.targetUserId ||
                requestInfo?.to?._id ||
                requestInfo?.from?._id;

              if (peerId) {
                const resetStatuses = { ...state.targetStatuses };
                resetStatuses[peerId] = "none";

                return {
                  targetStatuses: resetStatuses,
                  sentList: state.sentList.filter(
                    (r) => r._id !== update.requestId,
                  ),
                  receivedList: state.receivedList.filter(
                    (r) => r._id !== update.requestId,
                  ),
                };
              }
            }
            break;
          case "request_accepted":
            if (update.newFriend) {
              const newStatuses = { ...state.targetStatuses };
              const friendId =
                update.senderId === myId ? update.receiverId : update.senderId;
              if (friendId) {
                newStatuses[friendId] = (update.status || "friend") as RequestStatus;
              }
              const newFriends = state.friends.filter(
                (f) => f._id !== update.newFriend?._id,
              );
              newFriends.unshift(update.newFriend as Friend);
              return {
                targetStatuses: newStatuses,
                friends: newFriends,
                newFriendIds: [...state.newFriendIds, update.newFriend._id],
                receivedList: state.receivedList.filter(
                  (r) => r._id !== update.requestId,
                ),
                sentList: state.sentList.filter(
                  (r) => r._id !== update.requestId,
                ),
              };
            }
            break;
          case "unfriend":
            if (update.targetUserId) {
              return {
                friends: state.friends.filter(
                  (f) => f._id !== update.targetUserId,
                ),
              };
            }
            break;
        }
        return state;
      });

      // FALLBACK: Refetch để sync chính xác
      const targetIds = [
        update.targetUserId,
        update.senderId,
        update.receiverId,
        update.fromUserId,
      ].filter(Boolean) as string[];

      for (const id of targetIds) {
        await get().updateFriendStatus(id);
      }

      await Promise.all([get().getAllFriendRequest(), get().getFriends()]);
    }
  },
  addNewFriendId: (friendId: string) => {
    set((state) => {
      if (!state.newFriendIds.includes(friendId)) {
        return { newFriendIds: [...state.newFriendIds, friendId] };
      }
      return state;
    });
  },
  clearNewFriends: () => {
    set({ newFriendIds: [] });
  },
  checkFriendship: async (targetId: string) => {
    return await friendService.checkFriendship(targetId);
  },
}));
