import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import SideNav from "@/components/SideNav";
import { Search, UserSearch, UsersRound } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatTime } from "@/utils/formatTime";
import ConversationList from "@/components/ConversationList";

export default function ChatPage() {
  const {
    conversations,
    fetchConversations,
    fetchMessages,
    messages,
    activeConversationId,
    setActiveConversation,
    sendDirectMessage,
    sendGroupMessage,
  } = useChatStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversationId]);

  const activeConv = conversations.find((c) => c._id === activeConversationId);

  const currentMessages = activeConversationId
    ? Array.isArray(messages[activeConversationId])
      ? messages[activeConversationId]
      : messages[activeConversationId]?.items || []
    : [];

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    fetchMessages(id);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    try {
      if (activeConv?.group) {
        await sendGroupMessage(activeConversationId, input);
      } else {
        const otherUser = activeConv?.participants.find(
          (p) => p._id !== user?.userId,
        );

        if (!otherUser) return;

        await sendDirectMessage(otherUser._id, input);
        const newMsg = {
          id: Date.now().toString(),
          senderId: user?.userId,
          text: input,
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "sent",
          type: "text",
        };

        // useChatStore.setState((state: any) => ({
        //   messages: {
        //     ...state.messages,
        //     [activeConversationId]: {
        //       ...state.messages[activeConversationId],
        //       items: [
        //         ...(state.messages[activeConversationId]?.items || []),
        //         newMsg,
        //       ],
        //     },
        //   },
        // }));

        setInput("");
      }
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const handleSend = () => {
    if (!input.trim() || !activeConversationId) return;

    const newMsg = {
      id: Date.now().toString(),
      senderId: user?.userId,
      text: input,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sent",
      type: "text",
    };

    useChatStore.setState((state: any) => ({
      messages: {
        ...state.messages,
        [activeConversationId]: [
          ...(state.messages[activeConversationId] || []),
          newMsg,
        ],
      },
    }));

    setInput("");
  };

  const mappedConversations = conversations.map((c) => {
    const otherUser = c.participants?.find(
      (p: any) => p.userId !== user?.userId,
    );

    return {
      id: c._id,
      name: c.group?.name || otherUser?.displayName || "Unknown",
      avatar: (c.group?.name || otherUser?.displayName || "U")
        .slice(0, 2)
        .toUpperCase(),
      avatarColor: "#3b82f6",
      lastMessage: c.lastMessage?.content || "Chưa có tin nhắn",
      time: c.lastMessage?.createdAt ? formatTime(c.lastMessage.createdAt) : "",
      unread: 0,
      online: false,
      messages: [], // không cần dùng ở đây
    };
  });

  const otherUser = activeConv?.participants.find(
    (p) => p._id !== user?.userId,
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#060d1f" }}>
      {/* ───────── SideNav ───────── */}
      <SideNav onNewMessage={() => {}} />
      <ConversationList
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelect}
      />
      {/* ───────── Chat Area ───────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          color: "white",
        }}
      >
        {activeConv ? (
          <>
            {/* Header */}
            <div
              style={{
                padding: 12,
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontWeight: "bold",
              }}
            >
              {activeConv.group?.name || otherUser?.displayName}
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: 16,
                overflowY: "auto",
              }}
            >
              {currentMessages.map((msg: any, i: number) => {
                const isMe = msg.senderId === user?.userId;

                return (
                  <div
                    key={msg.id || i}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 14,
                        maxWidth: "70%",
                        background: isMe
                          ? "linear-gradient(135deg,#2563eb,#3b82f6)"
                          : "#1e293b",
                      }}
                    >
                      {msg.content || msg.text}
                      <div
                        style={{
                          fontSize: 10,
                          marginTop: 4,
                          color: "#cbd5e1",
                        }}
                      >
                        {msg.createdAt ? formatTime(msg.createdAt) : msg.time}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: 10,
                borderTop: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                gap: 8,
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: "none",
                  outline: "none",
                  background: "#1e293b",
                  color: "white",
                }}
              />

              <button
                onClick={sendMessage}
                style={{
                  padding: "0 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#3b82f6",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Gửi
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#64748b",
            }}
          >
            Chọn cuộc trò chuyện
          </div>
        )}
      </div>
    </div>
  );
}
