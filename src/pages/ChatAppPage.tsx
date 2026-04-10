import { useEffect, useRef, useState, useCallback , useMemo} from "react";
import { useChatStore } from "@/stores/useChatStore";
import SideNav from "@/components/SideNav";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatTime } from "@/utils/formatTime";
import ConversationList from "@/components/ConversationList";
import { Ellipsis, RotateCcw, Trash2 } from "lucide-react";
import { useSocketStore } from "@/stores/useSocketStore";
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
  const { user, userProfile } = useAuthStore();
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
      setContextMenu((prev) => (prev ? { ...prev, x: newX, y: newY } : prev));
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
    return () => {
      el.style.overflow = "auto";
    };
  }, [contextMenu]);
  //load acvatar da doc khi vao trang chat
  useEffect(() => {
  if (activeConversationId) {
    fetchMessages(activeConversationId);
  }
}, [activeConversationId]);

  const activeConv = useMemo(() => {
  return conversations.find((c) => c._id === activeConversationId);
}, [conversations, activeConversationId]);

  const currentMessages = useMemo(() => {
  if (!activeConversationId) return [];
  const data = messages[activeConversationId];
  if (!data) return [];
  return Array.isArray(data) ? data : data.items ?? [];
}, [messages, activeConversationId]);
  useEffect(() => {
  if (!activeConversationId || currentMessages.length === 0) return;

  const { socket } = useSocketStore.getState();
  const { user } = useAuthStore.getState();

  const lastMsg = currentMessages.at(-1);
  if (!socket || !lastMsg) return;

  if (lastMsg.senderId === user?.userId) return;

  socket.emit("mark-read", {
    conversationId: activeConversationId,
    messageId: lastMsg._id,
  });
}, [activeConversationId, currentMessages]);
useEffect(() => {
  if (activeConv?.participants) {
    const other = activeConv.participants.find(p => p._id !== user?.userId);
    const me   = activeConv.participants.find(p => p._id === user?.userId);

    console.log("🔍 LastRead của NGƯỜI KIA:", other?.lastReadMessageId);
    console.log("🔍 LastRead của BẠN     :", me?.lastReadMessageId);
  }
}, [activeConv]);
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
      if (!otherUser) return;
      await sendDirectMessage(otherUser._id, input); // chỉ gọi 1 lần
    }
    setInput("");
  } catch (error) {
    console.error("Send message error:", error);
  }
};

  const renderMessageContent = (content: string) => {
    // Regex này sẽ bắt trọn link YouTube của bạn
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/g;

    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (part && part.match(urlRegex)) {
        const href = part.startsWith("www.") ? `https://${part}` : part;
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#f1f1f1", textDecoration: "underline" }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleRightClick = useCallback(
    (e: React.MouseEvent, msg: any) => {
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
    },
    [user],
  );

  // ── Kiểm tra 24h
  const canRecall = (menu: ContextMenu) => {
    if (menu.senderId !== user?.userId) return false;
    if (menu.isRecalled) return false;
    const age = Date.now() - new Date(menu.createdAt).getTime();
    return age <= 24 * 60 * 60 * 1000;
  };

  const handleRecall = async () => {
    if (!contextMenu || !activeConversationId) return;
    try {
      await recallMessage(contextMenu.messageId, activeConversationId);
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
  const otherUser = useMemo(() => {
  return activeConv?.participants?.find(
    (p) => p._id !== user?.userId,
  );
}, [activeConv, user?.userId]);
const otherAvatar = otherUser?.avatarUrl || "/miku.png";
const myAvatar = userProfile?.avatarUrl || "/miku.png";

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
            <div
              ref={messagesContainerRef}
              style={{ flex: 1, padding: 16, overflowY: "auto" }}
            >
            {currentMessages.map((msg: any, i: number) => {
  const isMe = msg.senderId === user?.userId;

  // ── Tính last read của 2 bên
  const lastReadId = activeConv?.participants?.find(
    (p) => p._id !== user?.userId
  )?.lastReadMessageId;

  const myLastReadId = activeConv?.participants?.find(
    (p) => p._id === user?.userId
  )?.lastReadMessageId;

  const isLastRead =
    lastReadId && msg._id?.toString() === lastReadId.toString();

  const myLastRead =
    myLastReadId && msg._id?.toString() === myLastReadId.toString();

  return (
    <div
      key={`${msg._id}-${i}`}
      className={`group flex flex-col mb-2.5 ${
        isMe ? "items-end" : "items-start"
      }`}
    >
      {/* Hàng ngang: icon + bubble */}
      <div
        className={`flex items-center gap-1.5 ${
          isMe ? "justify-end" : "justify-start"
        }`}
      >
        {/* Icon Ellipsis */}
        {!msg.isRecalled && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleRightClick(e as any, msg);
            }}
            className={`opacity-0 group-hover:opacity-100 cursor-pointer text-slate-400 hover:text-white text-xl ${
              isMe ? "order-first" : "order-last"
            }`}
          >
            <Ellipsis />
          </div>
        )}

        {/* Bubble tin nhắn */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 14,
            maxWidth: "85%",
            background: msg.isRecalled
              ? "transparent"
              : isMe
              ? "linear-gradient(135deg,#2563eb,#3b82f6)"
              : "#1e293b",
            border: msg.isRecalled
              ? "1px dashed rgba(255,255,255,0.2)"
              : "none",
            wordBreak: "break-word",
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
              <div>{renderMessageContent(msg.content)}</div>
              <div
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  color: "#cbd5e1",
                  textAlign: isMe ? "right" : "left",
                }}
              >
                {msg.createdAt ? formatTime(msg.createdAt) : ""}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 🔥 AVATAR SEEN - CẢ 2 CHIỀU (đặt ở đây, ngoài flex ngang) */}
      {!msg.isRecalled && (
        <>
          {/* 1. Tin của BẠN → người kia đã đọc */}
          {isMe && isLastRead && (
            <div className="flex justify-end pr-1 mt-0.5">
              <img
                src={otherAvatar}
                alt="seen"
                className="w-4 h-4 rounded-full border border-blue-400"
                title={`${otherUser?.displayName} đã xem`}
              />
            </div>
          )}

          {/* 2. Tin của NGƯỜI KIA → BẠN đã đọc */}
          {/* {!isMe && myLastRead && (
            <div className="flex justify-start pl-1 mt-0.5">
              <img
                src={myAvatar}
                alt="seen"
                className="w-4 h-4 rounded-full border border-blue-400"
                title="Bạn đã xem"
              />
            </div>
          )} */}
        </>
      )}
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
              <button className="flex items-center gap-2 text-white hover:text-gray-300">
                <RotateCcw size={18} />
                <span>Thu hồi tin nhắn</span>
              </button>{" "}
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
  <div className="flex items-center gap-2 text-white hover:text-gray-300">
    <Trash2 size={18} />
    <span>Xoá phía tôi</span>
  </div>
</button>
          )}

          <button
            onClick={() => setContextMenu(null)}
            style={{ ...menuItemStyle, color: "#f97316" }}
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
