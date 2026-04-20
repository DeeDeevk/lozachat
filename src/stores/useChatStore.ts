import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import type { Message } from "@/types/chat";
import { useSocketStore } from "./useSocketStore";

const dedupeMessages = (items: Message[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key =
      item._id ||
      `${item.conversationId}-${item.senderId}-${item.createdAt}-${item.content}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      typingUsersByConv: {},
      activeConversationId: null,
      convoLoading: false,
      messageLoading: false,
      setActiveConversation: (id) => set({ activeConversationId: id }),
      reset: () => {
        set({
          conversations: [],
          messages: {},
          typingUsersByConv: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
        });
      },
      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversations();
          set({ conversations, convoLoading: false });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchConversations: ", error);
          set({ convoLoading: false });
        }
      },
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();

        const convoId = conversationId ?? activeConversationId;

        if (!convoId) return;

        const current = messages?.[convoId];
        const nextCursor =
          current?.nextCursor === undefined ? "" : current?.nextCursor;

        if (nextCursor === null) return;

        set({ messageLoading: true });

        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(
            convoId,
            nextCursor,
          );

          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?.userId,
          }));

          set((state) => {
            const prev = state.messages[convoId]?.items ?? [];
            const merged = dedupeMessages(
              prev.length > 0 ? [...processed, ...prev] : processed,
            );

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchMessages:", error);
        } finally {
          set({ messageLoading: false });
        }
      },
      sendDirectMessage: async (recipientId, payload, conversationId) => {
        try {
          // Nếu có conversationId truyền vào (khi forward) thì dùng,
          // không thì mới lấy activeConversationId từ store
          const targetConvId = conversationId ?? get().activeConversationId;

          await chatService.sendDirecrMessages(
            recipientId,
            payload?.content || "",
            payload?.imgUrl || "",
            targetConvId || undefined, // Truyền ID chuẩn vào đây
          );

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === targetConvId ? { ...c, seenBy: [] } : c,
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gửi direct message", error);
        }
      },
      sendGroupMessage: async (conversationId, payload) => {
        try {
          await chatService.sendGroupMessages(
            conversationId,
            payload?.content || "",
            payload?.imgUrl,
          );
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === get().activeConversationId ? { ...c, seenBy: [] } : c,
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gửi group message", error);
        }
      },
      uploadAttachment: async (file) => {
        try {
          return await chatService.uploadAttachment(file);
        } catch (error) {
          console.error("Lỗi upload file chat", error);
          throw error;
        }
      },
      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();
          message.isOwn = message.senderId === user?.userId;

          const convoId = message.conversationId;

          let prevItems = get().messages[convoId]?.items ?? [];
          if (prevItems.length === 0) {
            await fetchMessages(message.conversationId);
            prevItems = get().messages[convoId]?.items ?? [];
          }

          set((state) => {
            const existingItems = state.messages[convoId]?.items ?? prevItems;
            if (existingItems.some((m) => m._id === message._id)) {
              return state;
            }

            const currentConvoState = state.messages[convoId] ?? {
              items: [],
              hasMore: false,
              nextCursor: undefined,
            };

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: dedupeMessages([...existingItems, message]),
                  hasMore: currentConvoState.hasMore,
                  nextCursor: currentConvoState.nextCursor ?? undefined,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi add message: ", error);
        }
      },
      updateConversation: (conversation) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversation._id ? { ...c, ...conversation } : c,
          ),
        }));
      },
      addConversation: (conversation) => {
        set((state) => {
          const exists = state.conversations.some(
            (c) => c._id === conversation._id,
          );

          if (exists) return state;

          return {
            conversations: [conversation, ...state.conversations],
          };
        });
      },
      recallMessage: async (messageId: string, conversationId: string) => {
        try {
          await chatService.recallMessage(messageId);

          // ✅ gọi hàm mới (đã tách riêng)
          get().applyRecallMessage(messageId, conversationId);
        } catch (error) {
          console.error("Lỗi khi thu hồi tin nhắn:", error);
          throw error;
        }
      },

      deleteMessageForMe: async (messageId: string, conversationId: string) => {
        try {
          await chatService.deleteMessageForMe(messageId);

          set((state) => {
            const convo = state.messages[conversationId];
            if (!convo) return state;

            return {
              messages: {
                ...state.messages,
                [conversationId]: {
                  ...convo,
                  items: convo.items.filter((m) => m._id !== messageId),
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi khi xoá tin nhắn:", error);
          throw error;
        }
      },
      applyRecallMessage: (messageId: string, conversationId: string) => {
        set((state) => {
          const convo = state.messages[conversationId];
          if (!convo) return state;

          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...convo,
                items: convo.items.map((m) =>
                  m._id === messageId
                    ? {
                        ...m,
                        isRecalled: true,
                        content: "Tin nhắn đã bị thu hồi",
                      }
                    : m,
                ),
              },
            },

            conversations: state.conversations.map((c) =>
              c._id === conversationId && c.lastMessage?._id === messageId
                ? {
                    ...c,
                    lastMessage: {
                      ...c.lastMessage,
                      content: "Tin nhắn đã bị thu hồi",
                    },
                  }
                : c,
            ),
          };
        });
      },
      updateLastRead: (
        userId: string,
        conversationId: string,
        messageId: string,
      ) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) => {
            if (conversation._id !== conversationId) return conversation;

            return {
              ...conversation,
              participants: conversation.participants.map((participant) =>
                participant._id === userId
                  ? { ...participant, lastReadMessageId: messageId }
                  : participant,
              ),
            };
          }),
        }));
      },

      addTypingUser: (userId: string, conversationId: string) =>
        set((state) => {
          console.log("📝 addTypingUser called:", userId, conversationId);
          console.log(
            "📝 current typingUsersByConv:",
            useChatStore.getState().typingUsersByConv,
          );
          const current = state.typingUsersByConv[conversationId] || [];

          if (current.includes(userId)) return state;

          return {
            typingUsersByConv: {
              ...state.typingUsersByConv,
              [conversationId]: [...current, userId],
            },
          };
        }),
      editMessage: async (
        messageId: string,
        conversationId: string,
        content: string,
      ) => {
        try {
          await chatService.editMessage(messageId, content);
          get().applyEditMessage(
            messageId,
            conversationId,
            content,
            new Date().toISOString(),
          );
        } catch (error) {
          console.error("Lỗi khi sửa tin nhắn:", error);
          throw error;
        }
      },

      applyEditMessage: (
        messageId: string,
        conversationId: string,
        newContent: string,
        editedAt: string,
      ) => {
        set((state) => {
          const convo = state.messages[conversationId];
          if (!convo) return state;

          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...convo,
                items: convo.items.map((m) =>
                  m._id === messageId
                    ? { ...m, content: newContent, isEdited: true, editedAt }
                    : m,
                ),
              },
            },

            // Cập nhật lastMessage nếu tin nhắn đó là tin cuối cùng
            conversations: state.conversations.map((c) =>
              c._id === conversationId && c.lastMessage?._id === messageId
                ? {
                    ...c,
                    lastMessage: { ...c.lastMessage, content: newContent },
                  }
                : c,
            ),
          };
        });
      },
      removeTypingUser: (userId: string, conversationId: string) =>
        set((state) => {
          const current = state.typingUsersByConv[conversationId] || [];

          return {
            typingUsersByConv: {
              ...state.typingUsersByConv,
              [conversationId]: current.filter((id) => id !== userId),
            },
          };
        }),

      clearTypingUsers: (conversationId: string) =>
        set((state) => ({
          typingUsersByConv: {
            ...state.typingUsersByConv,
            [conversationId]: [],
          },
        })),
      updateStrangerStatus: async (conversationId, action) => {
        try {
          await chatService.updateStrangerStatus(conversationId, action);
          if (action === "decline") {
            set((state) => ({
              conversations: state.conversations.filter(
                (c) => c._id !== conversationId,
              ),
              activeConversationId:
                get().activeConversationId === conversationId
                  ? null
                  : get().activeConversationId,
            }));
          } else {
            set((state) => ({
              conversations: state.conversations.map((c) =>
                c._id === conversationId
                  ? { ...c, isStranger: true, strangerStatus: "accepted" }
                  : c,
              ),
            }));
          }
        } catch (error) {
          console.log("Lỗi khi update trạng thái người lạ: ", error);
          throw error;
        }
      },
      forwardMessage: async (message, targetConversationIds) => {
        const { sendDirectMessage, sendGroupMessage, conversations } = get();
        const { user } = useAuthStore.getState();
        const myId = user?.userId;

        for (const convId of targetConversationIds) {
          const targetConv = conversations.find((c) => c._id === convId);
          if (!targetConv) continue;

          const payload = {
            content: message.content ?? undefined,
            imgUrl: message.imgUrl || undefined,
          };

          if (targetConv.type === "group") {
            await sendGroupMessage(convId, payload);
          } else {
            const recipient = targetConv.participants.find(
              (p) => p._id !== myId,
            );
            if (recipient) {
              // QUAN TRỌNG: Truyền convId vào tham số thứ 3
              await sendDirectMessage(recipient._id, payload, convId);
            }
          }
        }
      },
      createConversation: async (payload) => {
        try {
          set({ convoLoading: true });

          // Gọi API tạo cuộc hội thoại
          const newConvoRaw = await chatService.createConversation(payload);

          // XỬ LÝ LỖI ĐỒNG BỘ DỮ LIỆU BACKEND:
          // Backend trả về participants có cấu trúc { userId: { _id, displayName... } }
          // Nhưng Store đang dùng cấu trúc phẳng { _id, displayName... } (đã format ở getConversation)
          // Nên ta cần format lại ở đây để UI không bị văng lỗi khi render danh sách thành viên
          const formattedParticipants = (newConvoRaw.participants || []).map(
            (p: any) => ({
              _id: p.userId?._id,
              displayName: p.userId?.displayName,
              avatarUrl: p.userId?.avatarUrl ?? null,
              joinedAt: p.joinedAt,
              lastReadMessageId: p.lastReadMessageId?.toString() ?? null,
            }),
          );

          const formattedConvo = {
            ...newConvoRaw,
            participants: formattedParticipants,
            unreadCounts: newConvoRaw.unreadCounts || {},
          };

          set((state) => {
            // Check trùng lặp (phòng trường hợp socket trả data về trước khi API resolve)
            const exists = state.conversations.some(
              (c) => c._id === formattedConvo._id,
            );
            if (exists) return state;

            return {
              // Thêm nhóm mới lên đầu danh sách
              conversations: [formattedConvo, ...state.conversations],
              // Tự động nhảy vào đoạn chat mới tạo luôn
              activeConversationId: formattedConvo._id,
            };
          });

          const socket = useSocketStore.getState().socket;
          if (socket?.connected) {
            socket.emit("join-conversation", {
              conversationId: formattedConvo._id,
            });
          }
        } catch (error) {
          console.error("Lỗi khi tạo conversation:", error);
          throw error;
        } finally {
          set({ convoLoading: false });
        }
      },
      pinnedMessages: {},
      fetchPinnedMessages: async (conversationId) => {
        try {
          const messages = await chatService.fetchPinnedMessages(conversationId);
          set((state) => ({
            pinnedMessages: {
              ...state.pinnedMessages,
              [conversationId]: messages,
            },
          }));
        } catch (error) {
          console.error("Lỗi fetch pinned messages:", error);
        }
      },
      pinMessage: async (conversationId, messageId) => {
        try {
          const messages = await chatService.pinMessage(conversationId, messageId);
          set((state) => ({
            pinnedMessages: {
              ...state.pinnedMessages,
              [conversationId]: messages,
            },
          }));
        } catch (error) {
          console.error("Lỗi pin message:", error);
          throw error;
        }
      },
      unpinMessage: async (conversationId, messageId) => {
        try {
          await chatService.unpinMessage(conversationId, messageId);
          set((state) => ({
            pinnedMessages: {
              ...state.pinnedMessages,
              [conversationId]: (state.pinnedMessages[conversationId] ?? []).filter(
                (m) => m._id !== messageId
              ),
            },
          }));
        } catch (error) {
          console.error("Lỗi unpin message:", error);
          throw error;
        }
      },
    })
      updateMemberRole: (conversationId, targetUserId, role) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversationId
              ? {
                  ...c,
                  participants: c.participants.map((p) =>
                    p._id === targetUserId ? { ...p, role } : p,
                  ),
                }
              : c,
          ),
        }));
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    },
  ),
);
