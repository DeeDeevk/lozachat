import { useState } from "react";
import { Search, UserSearch, UsersRound } from "lucide-react";
import { formatTime } from "@/utils/formatTime";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";
import SearchUserModal from "./SearchUserModal";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useChatStore } from "@/stores/useChatStore";
import "../css/conversationList.css";

// ── Types (match BE) ─────────────────────────────────────────
export interface Conversation {
  _id: string;
  group?: {
    name: string;
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
  onClose,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "direct" | "group">("all");
  const [showSearchModal, setShowSearchModal] = useState(false);

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
    if (conv.group) return null;
    return getOtherUser(conv)?.avatarUrl ?? null;
  };

  const isOnline = (conv: Conversation) => {
    if (conv.group) return false;
    const other = getOtherUser(conv);
    return other ? onlineUsers.includes(other._id) : false;
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

  // ── Filter ───────────────────────────────────────────────────────────────
  const filteredConvs = conversations.filter((c) => {
    const matchesSearch = getName(c)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (activeTab === "group") return matchesSearch && !!c.group;
    if (activeTab === "direct") return matchesSearch && !c.group;
    return matchesSearch;
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
            const unread = conv.unread ?? 0;

            return (
              <div
                key={conv._id}
                className={`cl-conv-item ${conv._id === activeId ? "active" : ""}`}
                onClick={() => onSelectConversation(conv._id)}
              >
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      overflow: "hidden",
                      background: color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow:
                        conv._id === activeId
                          ? `0 4px 12px ${color}55`
                          : "none",
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          color: "white",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {getAvatarText(conv)}
                      </span>
                    )}
                  </div>
                  {/* Online/offline dot */}
                  {online ? (
                    <div className="cl-online-dot" />
                  ) : (
                    <div className="cl-offline-dot" />
                  )}
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
                      {conv.lastMessage?.content || "Chưa có tin nhắn"}
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
    </>
  );
}
