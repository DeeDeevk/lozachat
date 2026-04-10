import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";

const baseURL = import.meta.env.VITE_SOCKET_URL;

const registerSocketEvents = (socket: Socket, set: any) => {
  socket.off("connect");
  socket.off("online-users");
  socket.off("new-message");
  socket.off("message-recalled");
socket.off("message-read");
socket.off("user-typing");
socket.off("user-stop-typing");
  socket.on("connect", () => {
    console.log("Đã kết nối với socket");
  });
 socket.on("message-read", ({ userId, conversationId, messageId }) => {
  useChatStore.getState().updateLastRead(userId, conversationId, messageId);
});

  socket.on("online-users", (userIds) => {
    set({ onlineUsers: userIds });
  });
 socket.on("user-typing", (payload) => {
  console.log("🔥 typing event:", payload);
  useChatStore.getState().addTypingUser(payload.userId, payload.conversationId);
});

socket.on("user-stop-typing", ({ userId, conversationId }) => {
  useChatStore.getState().removeTypingUser(userId, conversationId);
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