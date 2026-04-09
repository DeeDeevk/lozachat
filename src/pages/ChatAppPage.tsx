import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "@/stores/useChatStore";
import SideNav from "@/components/SideNav";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatTime } from "@/utils/formatTime";
import ConversationList from "@/components/ConversationList";
interface ContextMenu {
  x: number;
  y: number;
  messageId: string;
  senderId: string;
  createdAt: string;
  isRecalled: boolean;
}

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
    recallMessage,
    deleteMessageForMe,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversationId]);

  // Đóng context menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  //xu li vi tri context menu
  useEffect(() => {
  if (!contextMenu || !menuRef.current) return;

  const menu = menuRef.current;
  const { innerWidth, innerHeight } = window;

  const rect = menu.getBoundingClientRect();
  let newX = contextMenu.x;
  let newY = contextMenu.y;
  if (rect.right > innerWidth) {
    newX = innerWidth - rect.width - 8;
  }
  if (rect.bottom > innerHeight) {
    newY = innerHeight - rect.height - 8;
  }
  if (newX < 0) newX = 8;
  if (newY < 0) newY = 8;
  if (newX !== contextMenu.x || newY !== contextMenu.y) {
    setContextMenu((prev) =>
      prev ? { ...prev, x: newX, y: newY } : prev
    );
  }
}, [contextMenu]);

//khoa scroll khi bat context menu
useEffect(() => {
  const el = messagesContainerRef.current;
  if (!el) return;
  if (contextMenu) {
    el.style.overflow = "hidden";
  } else {
    el.style.overflow = "auto";
  }
  return () => { el.style.overflow = "auto"; };
}, [contextMenu]);

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
    if (!input.trim() || !activeConversationId) return;
    try {
      if (activeConv?.group) {
        await sendGroupMessage(activeConversationId, input);
      } else {
        const otherUser = activeConv?.participants.find(
          (p) => p._id !== user?.userId,
        );
        if (!otherUser) return;
        await sendDirectMessage(otherUser._id, input);
      }
      setInput("");
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const handleRightClick = useCallback((e: React.MouseEvent, msg: any) => {
  e.preventDefault();

  const isMe = msg.senderId === user?.userId;

  const menuWidth = 180;
  const offset = 8;

  let x = e.clientX;
  let y = e.clientY;

  if (isMe) {
    x = x - menuWidth - offset;
  } else {
    x = x + offset;
  }
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 8;
  }
  if (x < 0) x = 8;

  if (y + 150 > window.innerHeight) {
    y = window.innerHeight - 150 - 8;
  }
  setContextMenu({
    x,
    y,
    messageId: msg._id,
    senderId: msg.senderId,
    createdAt: msg.createdAt,
    isRecalled: msg.isRecalled ?? false,
  });
}, [user]);

  // ── Kiểm tra 24h
  const canRecall = (menu: ContextMenu) => {
    if (menu.senderId !== user?.userId) return false;
    if (menu.isRecalled) return false;
    const age = Date.now() - new Date(menu.createdAt).getTime();
    return age <= 24 * 60 * 60 * 1000;
  };

  const handleRecall = async () => {
    if (!contextMenu) return;
    try {
      await recallMessage(contextMenu.messageId);
    } catch {
      alert("Không thể thu hồi tin nhắn này");
    } finally {
      setContextMenu(null);
    }
  };

  const handleDeleteForMe = async () => {
    if (!contextMenu) return;
    try {
      await deleteMessageForMe(contextMenu.messageId, activeConversationId!);
    } catch {
      alert("Xoá thất bại");
    } finally {
      setContextMenu(null);
    }
  };

  const otherUser = activeConv?.participants.find(
    (p) => p._id !== user?.userId,
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#060d1f" }}>
      <SideNav onNewMessage={() => {}} />
      <ConversationList
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelect}
      />

      {/* ── Chat Area ── */}
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
            <div ref={messagesContainerRef}
            style={{ flex: 1, padding: 16, overflowY: "auto" }}>
              {currentMessages.map((msg: any, i: number) => {
                const isMe = msg.senderId === user?.userId;

                return (
                  <div
                    key={msg._id || i}
                    className={`group flex items-center gap-1.5 mb-2.5 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {!msg.isRecalled && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRightClick(e as any, msg);
                        }}
                       className={`opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-white text-xl ${isMe ? "order-first" : "order-last"}`}
                      >
                        ⋮
                      </div>
                    )}
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 14,
                        maxWidth: "70%",
                        // Tin thu hồi style khác
                        background: msg.isRecalled
                          ? "transparent"
                          : isMe
                            ? "linear-gradient(135deg,#2563eb,#3b82f6)"
                            : "#1e293b",
                        border: msg.isRecalled
                          ? "1px dashed rgba(255,255,255,0.2)"
                          : "none",
                      }}
                      onContextMenu={(e) =>
                        !msg.isRecalled && handleRightClick(e, msg)
                      }
                    >
                      {msg.isRecalled ? (
                        <span
                          style={{
                            color: "#64748b",
                            fontStyle: "italic",
                            fontSize: 13,
                          }}
                        >
                          🚫 Tin nhắn đã được thu hồi
                        </span>
                      ) : (
                        <>
                          {msg.content}
                          <div
                            style={{
                              fontSize: 10,
                              marginTop: 4,
                              color: "#cbd5e1",
                            }}
                          >
                            {msg.createdAt ? formatTime(msg.createdAt) : ""}
                          </div>
                        </>
                      )}
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
                  if (e.key === "Enter") sendMessage();
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

      {/* ── Context Menu ── */}
      {contextMenu && (
        <div
           ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "#1e293b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "4px 0",
            zIndex: 1000,
            minWidth: 160,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {/* Thu hồi — chỉ hiện với người gửi trong 24h */}
          {canRecall(contextMenu) && (
            <button
              onClick={handleRecall}
              style={menuItemStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#334155")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              🔄 Thu hồi tin nhắn
            </button>
          )}

          {/* Xoá phía mình — ai cũng xoá được */}
          {!contextMenu.isRecalled && (
            <button
              onClick={handleDeleteForMe}
              style={menuItemStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#334155")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              🗑️ Xoá phía tôi
            </button>
          )}

          <button
            onClick={() => setContextMenu(null)}
            style={{ ...menuItemStyle, color: "#64748b" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#334155")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Huỷ
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 16px",
  background: "transparent",
  border: "none",
  color: "white",
  textAlign: "left",
  cursor: "pointer",
  fontSize: 14,
  transition: "background 0.15s",
};
