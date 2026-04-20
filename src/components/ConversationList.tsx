import { useState } from "react";
import { Search, UserSearch, UsersRound } from "lucide-react";
import { formatTime } from "@/utils/formatTime";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";
import SearchUserModal from "./SearchUserModal";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useChatStore } from "@/stores/useChatStore";
import { getSafeMessagePreview } from "@/utils/chatMessageCodec";
import "../css/conversationList.css";
import CreateGroupModal from "./CreateGroupModal";
import MiniAvatar from "./MiniAvatar";

// ── Types (match BE) ─────────────────────────────────────────
export interface Conversation {
  _id: string;
  group?: {
    name: string;
    avatar?: string;
  };
  participants: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  }[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unread?: number;
  pinned?: boolean;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  onSelectConversation: (id: string) => void;
  onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ConversationList({
  conversations,
  activeId,
  isOpen,
  onSelectConversation,
  onClose: _onClose,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "direct" | "group">("all");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();

  const location = useLocation();
  const { setActiveConversation } = useChatStore();

  const conversationIdFromNav = location.state?.conversationId;

  useEffect(() => {
    if (conversationIdFromNav) {
      setActiveConversation(conversationIdFromNav);
    }
  }, [conversationIdFromNav, setActiveConversation]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getOtherUser = (conv: Conversation) => {
    if (!user?.userId) return null;
    return conv.participants?.find(
      (p) => String(p._id) !== String(user.userId),
    );
  };

  const getName = (conv: Conversation) => {
    if (conv.group) return conv.group.name;
    const other = getOtherUser(conv);
    return other?.displayName || "Unknown";
  };

  const getAvatarText = (conv: Conversation) => {
    const name = getName(conv);
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarUrl = (conv: Conversation) => {
    if (conv.group) return conv.group.avatar ?? null; // ✅ trả về avatar nhóm nếu có
    return getOtherUser(conv)?.avatarUrl ?? null;
  };

  const isOnline = (conv: Conversation) => {
    if (conv.group) return false;
    const other = getOtherUser(conv);
    if (!other) return false;

    // Ép kiểu cả hai về string để tránh lệch Object ID
    return onlineUsers.some((id) => String(id) === String(other._id));
  };

  const getAvatarColor = (conv: Conversation) => {
    const name = getName(conv);
    const colors = [
      "#3b82f6",
      "#10b981",
      "#8b5cf6",
      "#f59e0b",
      "#ef4444",
      "#06b6d4",
      "#ec4899",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++)
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getDisplayParticipants = (conv: Conversation) => {
    if (!user?.userId) return [];
    if (!conv.group) {
      const other = getOtherUser(conv);
      return other ? [other] : [];
    }
    return (conv.participants || [])
      .filter((p) => String(p._id) !== String(user.userId))
      .slice(0, 3);
  };

  // ── Filter ───────────────────────────────────────────────────────────────
  const filteredConvs = conversations
    .filter((c) => {
      const matchesSearch = getName(c)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (activeTab === "group") return matchesSearch && !!c.group;
      if (activeTab === "direct") return matchesSearch && !c.group;
      return matchesSearch;
    })
    .sort((a, b) => {
      const timeA = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const timeB = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;

      return timeB - timeA;
    });

  return (
    <>
      <div
        className={`chat-sidebar ${isOpen ? "open" : ""}`}
        style={{
          display: "flex",
          flexDirection: "column",
          background: "rgba(8,14,28,.97)",
          borderRight: "2px solid rgba(255,255,255,.05)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "14px 14px 10px",
            borderBottom: "2px solid rgba(255,255,255,.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span className="cl-sidebar-title">Tin nhắn</span>
            <div style={{ display: "flex", gap: 2 }}>
              <button
                className="cl-icon-btn"
                aria-label="Tìm kiếm người dùng"
                title="Tìm người dùng"
                onClick={() => setShowSearchModal(true)}
              >
                <UserSearch size={16} />
              </button>
              <button
                className="cl-icon-btn"
                aria-label="Tạo nhóm chat"
                title="Tạo nhóm chat"
                onClick={() => setShowCreateGroupModal(true)}
              >
                <UsersRound size={16} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#475569",
                pointerEvents: "none",
              }}
            />
            <input
              className="cl-search-input"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 4, padding: "8px 10px 4px" }}>
          {(["all", "direct", "group"] as const).map((tab) => (
            <button
              key={tab}
              className={`cl-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "all"
                ? "Tất cả"
                : tab === "direct"
                  ? "Đoạn chat"
                  : "Nhóm chat"}
            </button>
          ))}
        </div>

        {/* ── Conversation list ── */}
        <div
          className="cl-list"
          style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}
        >
          {filteredConvs.map((conv) => {
            const name = getName(conv);
            const avatarUrl = getAvatarUrl(conv);
            const online = isOnline(conv);
            const color = getAvatarColor(conv);
            // Sửa lại để đọc đúng từ unreadCounts (MongoDB Map serialize thành object)
            const unread =
              (conv as any).unreadCounts?.[user?.userId ?? ""] ??
              (conv as any).unreadCounts?.get?.(user?.userId ?? "") ??
              conv.unread ??
              0;
            const displayParticipants = getDisplayParticipants(conv);
            const count = displayParticipants.length;

            return (
              <div
                key={conv._id}
                className={`cl-conv-item ${conv._id === activeId ? "active" : ""}`}
                onClick={() => onSelectConversation(conv._id)}
              >
                {/* Avatar */}
                <div
                  style={{
                    position: "relative",
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                  }}
                >
                  {/* ✅ Nếu là nhóm và có group.avatar → hiện ảnh nhóm luôn */}
                  {conv.group?.avatar ? (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 14,
                        overflow: "hidden",
                        boxShadow:
                          conv._id === activeId
                            ? "0 4px 12px rgba(59,130,246,0.5)"
                            : "none",
                      }}
                    >
                      <img
                        src={conv.group.avatar}
                        alt={conv.group.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ) : count <= 1 ? (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 14,
                        overflow: "hidden",
                        boxShadow:
                          conv._id === activeId
                            ? "0 4px 12px rgba(59,130,246,0.5)"
                            : "none",
                      }}
                    >
                      {count === 1 ? (
                        <MiniAvatar p={displayParticipants[0]} fontSize={14} />
                      ) : (
                        <MiniAvatar p={{ displayName: name }} fontSize={14} />
                      )}
                    </div>
                  ) : count === 2 ? (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          overflow: "hidden",
                        }}
                      >
                        <MiniAvatar p={displayParticipants[0]} fontSize={10} />
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: "2px solid rgba(8,14,28,.97)",
                          zIndex: 2,
                        }}
                      >
                        <MiniAvatar p={displayParticipants[1]} fontSize={10} />
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 8,
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          overflow: "hidden",
                          zIndex: 1,
                        }}
                      >
                        <MiniAvatar p={displayParticipants[0]} fontSize={9} />
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: "2px solid rgba(8,14,28,.97)",
                          zIndex: 2,
                        }}
                      >
                        <MiniAvatar p={displayParticipants[1]} fontSize={9} />
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: "2px solid rgba(8,14,28,.97)",
                          zIndex: 3,
                        }}
                      >
                        <MiniAvatar p={displayParticipants[2]} fontSize={9} />
                      </div>
                    </div>
                  )}

                  {/* Dot Online: Chỉ hiện khi chat 1-1 */}
                  {online && count <= 1 && <div className="cl-online-dot" />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: unread > 0 ? 700 : 500,
                        fontSize: 14,
                        color: unread > 0 ? "white" : "#cbd5e1",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </span>
                    {(conv as any).isStranger &&
                      (conv as any).strangerStatus === "pending" && (
                        <span
                          style={{
                            fontSize: 10,
                            background: "rgba(248,113,113,0.15)",
                            border: "1px solid rgba(248,113,113,0.3)",
                            color: "#fca5a5",
                            borderRadius: 6,
                            padding: "1px 5px",
                            flexShrink: 0,
                            marginLeft: 4,
                          }}
                        >
                          Mới
                        </span>
                      )}
                    {conv.lastMessage && (
                      <span
                        style={{
                          color: "#475569",
                          fontSize: 11,
                          flexShrink: 0,
                          marginLeft: 4,
                        }}
                      >
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: unread > 0 ? "#94a3b8" : "#475569",
                        fontSize: 12,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {getSafeMessagePreview(
                        conv.lastMessage?.content,
                        "Chưa có tin nhắn",
                      )}
                    </span>
                    {unread > 0 && (
                      <div className="cl-badge">
                        {unread > 9 ? "9+" : unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredConvs.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#475569",
              }}
            >
              <Search
                size={28}
                style={{
                  marginBottom: 8,
                  opacity: 0.4,
                  display: "block",
                  margin: "0 auto 8px",
                }}
              />
              <p style={{ fontSize: 13 }}>Không tìm thấy cuộc trò chuyện</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Search User Modal ── */}
      <SearchUserModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
      {/* ── Create Group Modal ──  */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
      />
    </>
  );
}
