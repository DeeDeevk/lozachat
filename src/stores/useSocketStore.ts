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
  socket.off("message-read");
  socket.off("message-edited");
  socket.off("user-typing");
  socket.off("user-stop-typing");
  socket.off("stranger-declined");
  socket.off("stranger-accepted");
  socket.off("stranger-request");
  socket.off("stranger-removed");
  socket.off("new-group-created");
  socket.off("member-role-updated");
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
    useChatStore
      .getState()
      .addTypingUser(payload.userId, payload.conversationId);
  });

  socket.on("user-stop-typing", ({ userId, conversationId }) => {
    useChatStore.getState().removeTypingUser(userId, conversationId);
  });
  socket.on("message-edited", ({ messageId, conversationId, newContent, editedAt }) => {
  useChatStore.getState().applyEditMessage(messageId, conversationId, newContent, editedAt);
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

  socket.on("stranger-request", ({ conversation }) => {
    useChatStore.getState().addConversation(conversation);
    socket.emit("join-conversation", { conversationId: conversation._id });
  });

  socket.on("stranger-accepted", ({ conversationId }) => {
    useChatStore.setState((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId
          ? { ...c, isStranger: true, strangerStatus: "accepted" }
          : c,
      ),
    }));
  });

  socket.on("stranger-declined", ({ conversationId }) => {
    useChatStore.setState((state) => ({
      conversations: state.conversations.filter(
        (c) => c._id !== conversationId,
      ),
      activeConversationId:
        state.activeConversationId === conversationId
          ? null
          : state.activeConversationId,
    }));
  });
  socket.off("friend_update");
  socket.on("friend_update", (update) => {
    useFriendStore.getState().handleRealTimeUpdate(update);
  });

  socket.off("new-conversation");
  socket.on("new-conversation", (conversation) => {
    const existing = useChatStore
      .getState()
      .conversations.find((c) => c._id === conversation.id);
    if (existing) {
      console.log("Updated conversation from socket:", conversation);
      useChatStore.getState().updateConversation(conversation);
    } else {
      console.log("New conversation from socket:", conversation);
      useChatStore.getState().addConversation(conversation);
    }
  });
  socket.on("stranger-removed", ({ conversationId }) => {
    useChatStore.setState((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, isStranger: false } : c,
      ),
    }));
  });
  socket.on("new-group-created", (conversation) => {
    const formattedParticipants = (conversation.participants || []).map(
      (p: any) => ({
        // Thêm || p._id và || p.displayName để dự phòng
        _id: p.userId?._id || p._id,
        displayName: p.userId?.displayName || p.displayName,
        avatarUrl: p.userId?.avatarUrl || p.avatarUrl || null,
        joinedAt: p.joinedAt,
        lastReadMessageId: p.lastReadMessageId?.toString() ?? null,
      }),
    );

    const formattedConvo = {
      ...conversation,
      participants: formattedParticipants,
      unreadCounts: conversation.unreadCounts || {},
    };
    useChatStore.getState().addConversation(formattedConvo);
    socket.emit("join-conversation", { conversationId: conversation._id });
  });

  socket.on("member-role-updated", ({ conversationId, targetUserId, role }) => {
    useChatStore
      .getState()
      .updateMemberRole(conversationId, targetUserId, role);
  });
};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: () => {
    console.log("CONNECT SOCKET CALLED");
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    // Reuse existing socket when it is connected or still connecting.
    if (existingSocket && !existingSocket.disconnected) {
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
      set({ socket: null, onlineUsers: [] });
    }
  },
}));
