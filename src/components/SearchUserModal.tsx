import { useState, useRef, useEffect } from "react";
import {
  X,
  Search,
  UserRoundSearch,
  MessageCircle,
  UserPlus,
  AlertCircle as _Info,
  Loader2,
  Clock,
  Bell,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { friendService } from "@/services/friendService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFriendStore } from "@/stores/useFriendStore";
import type { User, RequestStatus } from "../types/user";
import "../css/userSearchModal.css";
import { useNavigate } from "react-router-dom";
import { chatService } from "@/services/chatService";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";

interface SearchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSent?: () => void; // ← callback reload data sau khi gửi lời mời
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name
    ?.split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "U";

const randomColor = (str: string) => {
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
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function SearchUserModal({
  isOpen,
  onClose,
  onRequestSent,
}: SearchUserModalProps) {
  // @ts-expect-error - Intentionally unused, kept for future use
  const onStartChat = () => {};
  const currentUser = useAuthStore((s) => s.userProfile);
  const friendStore = useFriendStore();
  const { loading, searchByUserName } = friendStore;
  const onlineUsers = useSocketStore((s) => s.onlineUsers);
  const { setActiveConversation, addConversation } = useChatStore();

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [sendingReq, setSendingReq] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const requestStatus = useFriendStore(
    (s) => s.targetStatuses[result?._id || ""] || ("none" as RequestStatus),
  );
  const updateFriendStatus = friendStore.updateFriendStatus;
  const socket = useSocketStore((s) => s.socket);
  const [introMessage, setIntroMessage] = useState(
    "Chào bạn ~ Có thể kết bạn được không?",
  );

  // ✨ Compute isOnline from onlineUsers store
  const isOnline = result ? onlineUsers.includes(result._id) : false;

  const navigate = useNavigate();

  const handleStartChat = async (user: User) => {
    try {
      const res = await chatService.getOrCreateDirectConversation(user._id);
      const convo = res;
      console.log("Convo ID:", convo._id); // Kiểm tra convo._id có hợp lệ không
      if (!convo._id) return;
      const socket = useSocketStore.getState().socket;
      socket?.emit("join-conversation", { conversationId: convo._id });
      navigate("/chat");
      onClose();
      if (!convo?._id) {
        console.error("Conversation không hợp lệ");
        return;
      }

      // ✅ thêm vào store ngay lập tức
      addConversation(convo);

      // ✅ set active
      setActiveConversation(convo._id);

      // ✅ navigate
      navigate("/chat");

      onClose();
    } catch (error) {
      console.error("Lỗi tạo conversation:", error);
      toast.error("Không thể mở chat");
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery("");
      setResult(null);
      setNotFound(false);
      setShowDetail(false);
      setIntroMessage("Chào bạn ~ Có thể kết bạn được không?");
    }
  }, [isOpen]);

  // Reset intro message and ensure clean state when status changes
  useEffect(() => {
    if (requestStatus !== "friend") {
      setIntroMessage("Chào bạn ~ Có thể kết bạn được không?");
    }
  }, [requestStatus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setResult(null);
    setNotFound(false);
    setShowDetail(false);
    setIntroMessage("Chào bạn ~ Có thể kết bạn được không?");

    const user = await searchByUserName(q);
    if (!user) {
      setNotFound(true);
      return;
    }

    setResult(user);
    await updateFriendStatus(user._id);
  };

  const handleSendRequest = async () => {
    if (!result) return;
    setSendingReq(true);
    try {
      await friendService.sendFriendRequest(
        result._id,
        introMessage || undefined,
      );
      toast.success("Đã gửi lời mời kết bạn!", {
        description: `Yêu cầu đã được gửi đến ${result.displayName || result.username}`,
      });
      // Socket will handle real-time status update via store
      // ← Reload danh sách lời mời gửi ở FriendsPage
      onRequestSent?.();
    } catch (err) {
      const msg =
        (err as any)?.response?.data?.message ||
        "Không thể gửi lời mời. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSendingReq(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // Real-time socket listener for current result user's friend status
  useEffect(() => {
    if (!socket || !result?._id) return;

    const handleFriendUpdate = async (update: any) => {
      const involvedIds = [
        update.targetUserId,
        update.senderId,
        update.receiverId,
        update.fromUserId,
        update.newFriend?._id,
      ]
        .filter(Boolean)
        .map((id: string) => id.toString());

      // ✅ Chỉ cần result._id có trong danh sách liên quan là update
      if (involvedIds.includes(result._id.toString())) {
        console.log(
          "🔥 SearchUserModal real-time update:",
          result.username,
          "action:",
          update.action,
        );
        setIsUpdatingStatus(true);
        try {
          await updateFriendStatus(result._id);
        } finally {
          setIsUpdatingStatus(false);
        }
      }
    };

    socket.on("friend_update", handleFriendUpdate);
    return () => {
      socket.off("friend_update", handleFriendUpdate);
    };
  }, [socket, result?._id, updateFriendStatus]);

  if (!isOpen) return null;

  const avatarColor = result ? randomColor(result.username) : "#3b82f6";
  const initials = result
    ? getInitials(result.displayName || result.username)
    : "";
  const isSelf = requestStatus === "self" || currentUser?._id === result?._id;

  return (
    <>
      <div className="su-backdrop" onClick={handleBackdrop}>
        <div className="su-modal">
          {/* Header */}
          <div className="su-header">
            <div className="su-title">
              <div className="su-title-icon">
                <UserRoundSearch size={17} color="#818cf8" />
              </div>
              Tìm kiếm người dùng
            </div>
            <button
              className="su-close-btn"
              onClick={onClose}
              aria-label="Đóng"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="su-body">
            {/* Input */}
            <div>
              <div className="su-label">Tên người dùng</div>
              <div className="su-input-row">
                <input
                  ref={inputRef}
                  className="su-input"
                  placeholder="Nhập username hoặc email để tìm kiếm..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (result || notFound) {
                      setResult(null);
                      setNotFound(false);
                      setIntroMessage("Chào bạn ~ Có thể kết bạn được không?");
                    }
                  }}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="su-search-btn"
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  aria-label="Tìm kiếm"
                >
                  {loading ? (
                    <Loader2 size={17} className="su-spinner" />
                  ) : (
                    <Search size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Chính mình */}
            {isSelf && (
              <div className="su-self-state">
                <span className="su-self-emoji">🤡</span>
                <div className="su-self-text">
                  Bạn đang tìm ai vậy. Người này là chính bạn 😄
                </div>
              </div>
            )}

            {/* Result card */}
            {result && !isSelf && (
              <div className="su-result-card">
                <div className="su-user-row">
                  {result.avatarUrl ? (
                    <img
                      src={result.avatarUrl}
                      alt={result.displayName}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        objectFit: "cover",
                        flexShrink: 0,
                        boxShadow: `0 4px 12px ${avatarColor}44`,
                      }}
                    />
                  ) : (
                    <div
                      className="su-avatar"
                      style={{
                        background: avatarColor,
                        boxShadow: `0 4px 12px ${avatarColor}44`,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div className="su-user-info">
                    <div className="su-user-name">
                      {result.displayName || result.username}
                    </div>
                    <div className="su-user-username">@{result.username}</div>
                  </div>
                </div>

                {showDetail && (
                  <div className="su-detail-panel">
                    <div className="su-detail-row">
                      <span className="su-detail-label">Tên hiển thị</span>
                      <span className="su-detail-value">
                        {result.displayName || "—"}
                      </span>
                    </div>
                    <div className="su-detail-row">
                      <span className="su-detail-label">Username</span>
                      <span className="su-detail-value">
                        @{result.username}
                      </span>
                    </div>
                    <div className="su-detail-row">
                      <span className="su-detail-label">Trạng thái</span>
                      <span
                        className="su-detail-value"
                        style={{
                          color: "#64748b",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: isOnline ? "#06b6d4" : "#9ca3af",
                              animation: isOnline
                                ? "su-pulse 2.5s ease-in-out infinite"
                                : "none",
                            }}
                          />
                          {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                        </div>
                      </span>
                    </div>
                  </div>
                )}

                <style>{`
                  @keyframes su-pulse {
                    0%,100% { opacity: .6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.4); }
                  }
                `}</style>

                {requestStatus === "friend" && (
                  <div className="su-status-banner friend">
                    <UserCheck size={15} />
                    <span>Bạn và người này đã là bạn bè.</span>
                  </div>
                )}

                {requestStatus === "sent" && (
                  <div className="su-status-banner sent">
                    {isUpdatingStatus ? (
                      <Loader2 size={15} className="su-spinner" />
                    ) : (
                      <Clock size={15} />
                    )}
                    <span>
                      Bạn đã gửi yêu cầu kết bạn đến người này. Vui lòng chờ
                      phản hồi.
                    </span>
                  </div>
                )}

                {requestStatus === "received" && (
                  <div className="su-status-banner received">
                    {isUpdatingStatus ? (
                      <Loader2 size={15} className="su-spinner" />
                    ) : (
                      <Bell size={15} />
                    )}
                    <span>
                      Bạn đã được yêu cầu kết bạn từ người này. Vui lòng phản
                      hồi.
                    </span>
                  </div>
                )}

                {requestStatus === "none" && (
                  <div className="su-intro-wrap">
                    <div className="su-intro-label">Giới thiệu</div>
                    <textarea
                      className="su-intro-textarea"
                      placeholder="Nhập lời giới thiệu..."
                      value={introMessage}
                      maxLength={150}
                      onChange={(e) => setIntroMessage(e.target.value)}
                    />
                    <div className="su-intro-count">
                      {introMessage.length}/150
                    </div>
                  </div>
                )}

                <div className="su-actions">
                  <button
                    className="su-btn su-btn-chat"
                    onClick={() => handleStartChat(result)}
                  >
                    <MessageCircle size={15} />
                    Nhắn tin
                  </button>
                  {requestStatus === "none" && (
                    <button
                      className="su-btn su-btn-friend"
                      onClick={handleSendRequest}
                      disabled={sendingReq}
                    >
                      {sendingReq ? (
                        <Loader2 size={15} className="su-spinner" />
                      ) : (
                        <UserPlus size={15} />
                      )}
                      Kết bạn
                    </button>
                  )}
                </div>
              </div>
            )}

            {notFound && (
              <div className="su-notfound">
                <div className="su-notfound-icon">
                  <UserRoundSearch size={26} color="#334155" />
                </div>
                <div className="su-notfound-title">
                  Không tìm thấy người dùng
                </div>
                <div className="su-notfound-sub">
                  Vui lòng kiểm tra lại username và thử lại
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
