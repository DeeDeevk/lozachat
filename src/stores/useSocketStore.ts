import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useFriendStore } from "./useFriendStore";

const baseURL = import.meta.env.VITE_SOCKET_URL;

const registerSocketEvents = (
  socket: Socket,
  set: (partial: Partial<SocketState>) => void,
) => {
  socket.off("connect");
  socket.off("online-users");
  socket.off("new-message");
  socket.off("message-recalled");

  socket.on("connect", () => {
    console.log("Đã kết nối với socket");
  });

  socket.on("online-users", (userIds) => {
    set({ onlineUsers: userIds });
  });

  socket.on("new-message", ({ message, conversation, unreadCounts }) => {
    useChatStore.getState().addMessage(message);

    const lastMessage = {
      _id: conversation.lastMessage._id,
      content: conversation.lastMessage.content,
      createdAt: conversation.lastMessage.createdAt,
      sender: {
        _id: conversation.lastMessage.senderId,
        displayName: "",
        avatarUrl: null,
      },
    };

    useChatStore.getState().updateConversation({
      ...conversation,
      lastMessage,
      unreadCounts,
    });
  });

  socket.on("message-recalled", ({ messageId, conversationId }) => {
    useChatStore.getState().applyRecallMessage(messageId, conversationId);
  });

  socket.off("friend_update");
  socket.on("friend_update", (update) => {
    useFriendStore.getState().handleRealTimeUpdate(update);
  });

  socket.off("new-conversation");
  socket.on("new-conversation", (conversation) => {
    console.log("New conversation from socket:", conversation);
    useChatStore.getState().addConversation(conversation);
  });
};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: () => {
    console.log("CONNECT SOCKET CALLED");
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    // ← Nếu socket cũ còn sống thì dùng lại, chỉ register events
    if (existingSocket?.connected) {
      registerSocketEvents(existingSocket, set);
      return;
    }

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });
    registerSocketEvents(socket, set);
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
