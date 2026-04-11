import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "@/stores/useChatStore";
import SideNav from "@/components/SideNav";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatTime } from "@/utils/formatTime";
import ConversationList from "@/components/ConversationList";
import { Image, Send } from "lucide-react";
import { Ellipsis, RotateCcw, Trash2 } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref để điều khiển input file
  const [image, setImage] = useState<File | null>(null); // Lưu file tạm thời nếu muốn xem trước
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click(); // Kích hoạt chọn file khi bấm vào icon
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File đã chọn:", file);
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const cancelImage = () => {
    setImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl); // Giải phóng bộ nhớ
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
    if ((!input.trim() && !image) || !activeConversationId) return;
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
            <div
              ref={messagesContainerRef}
              style={{ flex: 1, padding: 16, overflowY: "auto" }}
            >
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
                        <Ellipsis />
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
                          {msg.imgUrl && (
                            <div style={{ marginBottom: msg.content ? 8 : 0 }}>
                              <img
                                src={msg.imgUrl}
                                alt="Sent attachment"
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: 300, // Giới hạn chiều cao để không choán hết màn hình
                                  borderRadius: 8,
                                  display: "block",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  window.open(msg.imgUrl, "_blank")
                                } // Click để xem ảnh to
                              />
                            </div>
                          )}

                          {/* ── HIỂN THỊ CHỮ ── */}
                          {msg.content && (
                            <div style={{ wordBreak: "break-word" }}>
                              {renderMessageContent(msg.content)}
                            </div>
                          )}

                          <div
                            style={{
                              fontSize: 10,
                              marginTop: 4,
                              color: isMe ? "rgba(255,255,255,0.7)" : "#cbd5e1", // Chỉnh màu thời gian cho dễ nhìn trên nền xanh
                              textAlign: isMe ? "right" : "left",
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
            {previewUrl && (
              <div
                style={{
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(30, 41, 59, 0.5)",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  position: "relative",
                }}
              >
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      height: 80,
                      borderRadius: 8,
                      objectFit: "cover",
                      border: "1px solid #3b82f6",
                    }}
                  />
                  <button
                    onClick={cancelImage}
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      background: "#1e293b",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      cursor: "pointer",
                      fontSize: 12,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div
              style={{
                padding: 10,
                borderTop: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                gap: 8,
              }}
            >
              <button
                onClick={handleImageClick}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#3b82f6")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                <Image size={24} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
              />
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
              <button className="flex items-center gap-2 text-white hover:text-gray-300">
                <Trash2 size={18} />
                <span>Xoá phía tôi</span>
              </button>
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
