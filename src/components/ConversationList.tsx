import { useState } from "react";
import { Search, UserSearch, UsersRound } from "lucide-react";
import { formatTime } from "@/utils/formatTime";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";

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
}

// ── Props ────────────────────────────────────────────────────
interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
}

// ── Component ────────────────────────────────────────────────
export default function ConversationList({
  conversations,
  activeId,
  onSelectConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();

  // helper lấy tên
  const getOtherUser = (conv: Conversation) => {
    if (!user?.userId) return null;

    return conv.participants?.find(
      (p) => String(p._id) !== String(user.userId),
    );
    console.log("ME:", user?.userId);
    console.log("PARTICIPANTS:", conv.participants);
  };
  const getName = (conv: Conversation) => {
    if (conv.group) return conv.group.name;

    const otherUser = getOtherUser(conv);

    return otherUser?.displayName || "Unknown";
  };

  // filter search
  const filteredConvs = conversations.filter((c) =>
    getName(c).toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const getAvatar = (conv: Conversation) => {
    const name = getName(conv);
    return name.slice(0, 2).toUpperCase();
  };
  const getAvatarText = (conv: Conversation) => {
    const name = getName(conv);
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarUrl = (conv: Conversation) => {
    const otherUser = getOtherUser(conv);
    return otherUser?.avatarUrl;
  };
  const getGroupColor = (name: string) => {
    const colors = [
      "#ef4444",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
    ];
    // Hash tên group để chọn màu cố định cho group đó
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      style={{
        width: 300,
        borderRight: "1px solid rgba(255,255,255,0.05)",
        padding: 10,
        color: "white",
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span style={{ fontWeight: "bold" }}>Tin nhắn</span>

          <div style={{ display: "flex", gap: 4 }}>
            <button>
              <UserSearch size={16} />
            </button>
            <button>
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
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#475569",
            }}
          />
          <input
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px 8px 30px",
              borderRadius: 8,
              border: "none",
              background: "#1e293b",
              color: "white",
            }}
          />
        </div>
      </div>

      {/* ── List ── */}
      {filteredConvs.map((c) => {
        const name = getName(c);
        const avatarUrl = getAvatarUrl(c);
        const otherUser = getOtherUser(c);
        const isGroup = !!c.group;
        const bgColor = isGroup ? getGroupColor(name) : "#3b82f6";
        const isOnline =
          !isGroup && otherUser && onlineUsers.includes(otherUser._id);
        return (
          <div
            key={c._id}
            onClick={() => onSelectConversation(c._id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12, // Tăng gap một chút cho thoáng
              padding: 10,
              cursor: "pointer",
              borderRadius: 10,
              marginBottom: 8,
              background:
                c._id === activeId ? "rgba(59,130,246,0.2)" : "transparent",
              position: "relative", // Quan trọng để định vị badge tuyệt đối nếu cần
            }}
          >
            {/* Avatar Container */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: isGroup ? getGroupColor(name) : "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {!isGroup && otherUser?.avatarUrl ? (
                  <img
                    src={otherUser.avatarUrl}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ color: "white", fontWeight: "bold" }}>
                    {getAvatarText(c)}
                  </span>
                )}
              </div>

              {/* Chấm xanh */}
              {isOnline ? (
                <div
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 14,
                    height: 14,
                    backgroundColor: "#22c55e", // Màu xanh lá (Emerald 500)
                    borderRadius: "50%",
                    border: "3px solid #0f172a", // Màu nền của sidebar để tạo hiệu ứng tách biệt
                  }}
                  title="Đang hoạt động"
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 14,
                    height: 14,
                    backgroundColor: "#646464",
                    borderRadius: "50%",
                    border: "3px solid #0f172a", 
                  }}
                  title="Đang hoạt động"
                />
              )}
            </div>

            {/* Content & Time */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span
                  style={{
                    fontWeight: "600",
                    color: "#f8fafc",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {name}
                </span>
                {c.lastMessage && (
                  <span
                    style={{ fontSize: 10, color: "#64748b", flexShrink: 0 }}
                  >
                    {formatTime(c.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: isOnline ? "#94a3b8" : "#64748b",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.lastMessage?.content || "Chưa có tin nhắn"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
