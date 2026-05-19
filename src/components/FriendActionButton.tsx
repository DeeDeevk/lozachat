import { useState, useEffect } from "react";
import {
  UserPlus,
  Clock,
  Bell,
  UserCheck,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { friendService } from "@/services/friendService";
import { useFriendStore } from "@/stores/useFriendStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useChatStore } from "@/stores/useChatStore";
import { chatService } from "@/services/chatService";
import { useNavigate } from "react-router-dom";
import type { RequestStatus } from "../types/user";

interface FriendActionButtonProps {
  userId: string;
  displayName?: string;
  username?: string;
  /** Hiển thị nút "Nhắn tin" bên cạnh — mặc định false */
  showChat?: boolean;
  /** Gọi lại sau khi gửi lời mời thành công */
  onRequestSent?: () => void;
  className?: string;
}

export default function FriendActionButton({
  userId,
  displayName,
  username,
  showChat = false,
  onRequestSent,
  className = "",
}: FriendActionButtonProps) {
  const [sending, setSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { updateFriendStatus } = useFriendStore();
  const requestStatus = useFriendStore(
    (s) => s.targetStatuses[userId] || ("none" as RequestStatus),
  );
  const socket = useSocketStore((s) => s.socket);
  const { setActiveConversation, addConversation } = useChatStore();
  const navigate = useNavigate();

  // Load trạng thái khi mount
  useEffect(() => {
    if (userId) updateFriendStatus(userId);
  }, [userId, updateFriendStatus]);

  // Real-time update qua socket (tái sử dụng logic từ SearchUserModal)
  useEffect(() => {
    if (!socket || !userId) return;

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

      if (involvedIds.includes(userId.toString())) {
        setIsUpdatingStatus(true);
        try {
          await updateFriendStatus(userId);
        } finally {
          setIsUpdatingStatus(false);
        }
      }
    };

    socket.on("friend_update", handleFriendUpdate);
    return () => {socket.off("friend_update", handleFriendUpdate);}
  }, [socket, userId, updateFriendStatus]);

  const handleSendRequest = async () => {
    setSending(true);
    try {
      await friendService.sendFriendRequest(userId);
      // Cập nhật trạng thái ngay lập tức, không cần chờ socket
      await updateFriendStatus(userId);
      toast.success("Đã gửi lời mời kết bạn!", {
        description: `Yêu cầu đã được gửi đến ${displayName || username}`,
      });
      onRequestSent?.();
    } catch (err) {
      const msg =
        (err as any)?.response?.data?.message ||
        "Không thể gửi lời mời. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const handleStartChat = async () => {
    try {
      const convo = await chatService.getOrCreateDirectConversation(userId);
      if (!convo?._id) return;
      const socket = useSocketStore.getState().socket;
      socket?.emit("join-conversation", { conversationId: convo._id });
      addConversation(convo);
      setActiveConversation(convo._id);
      navigate("/chat");
    } catch {
      toast.error("Không thể mở chat");
    }
  };

  // ── Render theo trạng thái ────────────────────────────────────────────────

  return (
    <div className={`fab-wrapper ${className}`}>
      {/* ĐÃ LÀ BẠN BÈ */}
      {requestStatus === "friend" && (
        <div className="su-status-banner friend fab-banner">
          <UserCheck size={15} />
          <span>Bạn bè</span>
        </div>
      )}

      {/* ĐÃ GỬI YÊU CẦU — giống hình ảnh mẫu */}
      {requestStatus === "sent" && (
        <div className="su-status-banner sent fab-banner">
          {isUpdatingStatus ? (
            <Loader2 size={15} className="su-spinner" />
          ) : (
            <Clock size={15} />
          )}
          <span>Đang chờ được đồng ý kết bạn</span>
        </div>
      )}

      {/* ĐÃ NHẬN YÊU CẦU */}
      {requestStatus === "received" && (
        <div className="su-status-banner received fab-banner">
          {isUpdatingStatus ? (
            <Loader2 size={15} className="su-spinner" />
          ) : (
            <Bell size={15} />
          )}
          <span>Đã nhận lời mời kết bạn từ người này</span>
        </div>
      )}

      {/* CHƯA KẾT BẠN — hiển thị nút */}
      {requestStatus === "none" && (
        <div className="fab-actions">
          <button
            className="su-btn su-btn-friend"
            onClick={handleSendRequest}
            disabled={sending}
          >
            {sending ? (
              <Loader2 size={15} className="su-spinner" />
            ) : (
              <UserPlus size={15} />
            )}
            Gửi kết bạn
          </button>

          {showChat && (
            <button className="su-btn su-btn-chat" onClick={handleStartChat}>
              <MessageCircle size={15} />
              Nhắn tin
            </button>
          )}
        </div>
      )}

      {/* Nút chat riêng khi đã là bạn / sent / received */}
      {showChat && requestStatus !== "none" && (
        <button
          className="su-btn su-btn-chat fab-chat-extra"
          onClick={handleStartChat}
        >
          <MessageCircle size={15} />
          Nhắn tin
        </button>
      )}

      <style>{`
        .fab-wrapper {
          display: flex;
          align-items: center;
          margin: 8px 0 8px 12px;
        }

        .fab-banner {
          width: fit-content;
          padding: 5px 14px !important;
          font-size: 11px !important;
          border-radius: 20px !important;
          margin: 0 !important;
          gap: 5px !important;
        }

        .fab-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .fab-wrapper .su-btn {
          padding: 6px 16px !important;
          font-size: 12px !important;
          border-radius: 20px !important;
          height: auto !important;
          width: auto !important;
          min-width: unset !important;
          white-space: nowrap;
        }

        .fab-chat-extra {
          margin: 0;
        }
      `}</style>
    </div>
  );
}