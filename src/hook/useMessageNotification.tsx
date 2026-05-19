import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useSocketStore } from "@/stores/useSocketStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { getSafeMessagePreview } from "@/utils/chatMessageCodec";
import MiniAvatar from "@/components/MiniAvatar";

interface NotificationMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string;
  conversationName?: string;
  isGroup?: boolean;
}

export function useMessageNotification({
  activeConversationId,
}: {
  activeConversationId: string | null;
}) {
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const { conversations } = useChatStore(); // 👈 lấy từ store

  const activeConvRef = useRef(activeConversationId);
  useEffect(() => {
    activeConvRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const showBrowserNotification = useCallback(
    (title: string, body: string, avatarUrl?: string) => {
      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      if (document.visibilityState === "visible") return;

      const notification = new Notification(title, {
        body,
        icon: avatarUrl || "/favicon.ico",
        badge: "/favicon.ico",
        tag: "lozachat-message",
        renotify: true,
      } as NotificationOptions & { renotify: boolean });

      setTimeout(() => notification.close(), 5000);
    },
    [],
  );

  const showToastNotification = useCallback(
    (msg: NotificationMessage & { groupAvatar?: string }) => {
      const senderName = msg.senderName || "Người dùng";
      const preview = getSafeMessagePreview(msg.content, "Đã gửi một tin nhắn");

      const avatarUrl =
        msg.isGroup && msg.groupAvatar
          ? msg.groupAvatar
          : msg.senderAvatar || null;

      toast.custom(
        () => (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              // Chuyển toàn bộ style khung nền vào thẳng thẻ div này
              background: "linear-gradient(145deg, #0c1220 0%, #1a2540 100%)",
              border: "1px solid rgba(96,165,250,.2)",
              boxShadow: "0 20px 50px rgba(0,0,0,.7)",
              borderRadius: 18,
              padding: "12px 16px", // Đệm trái/phải 16px
              width: 320, // Cố định luôn độ rộng để khung đẹp
              maxWidth: "100%",
              pointerEvents: "auto", // Đảm bảo người dùng có thể tương tác (click, hover)
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                border: "2px solid rgba(96,165,250,.35)",
                boxShadow:
                  "0 4px 12px rgba(59,130,246,.25), inset 0 0 0 1px rgba(255,255,255,.05)",
              }}
            >
              <MiniAvatar
                p={{
                  displayName: senderName,
                  avatarUrl: avatarUrl || undefined,
                }}
                fontSize={15}
              />
            </div>

            {/* Text - Thêm flex: 1 và padding để ép 2 bên (avatar & dot) ra mép */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                paddingLeft: 12,
                paddingRight: 12,
              }}
            >
              {msg.isGroup && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#60a5fa",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    marginBottom: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {msg.conversationName || "Nhóm"}
                </div>
              )}
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#f8fafc",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: 2,
                }}
              >
                {senderName}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {preview}
              </div>
            </div>

            {/* Dot xanh */}
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22c55e",
                flexShrink: 0,
                boxShadow: "0 0 6px rgba(34,197,94,.5)",
              }}
            />
          </div>
        ),
        {
          position: "bottom-right",
          duration: 4000,
        },
      );
    },
    [],
  );

  // 👇 dùng ref để tránh stale closure trong socket handler
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!socket || !socket.connected) return;

    const handleNewMessage = (data: {
      message: NotificationMessage;
      conversation?: { _id: string; group?: { name: string } };
      unreadCounts?: Record<string, number>;
    }) => {
      const msg = data.message;
      if (msg.senderId === user?.userId) return;
      if (msg.content?.includes("{{system}}")) {
        msg.content = msg.content.replace("{{system}}", "").trim();
      }

      const conv = conversationsRef.current.find(
        (c) => c._id === msg.conversationId,
      );

      const isGroup = !!conv?.group;
      const conversationName = conv?.group?.name || undefined;
      const groupAvatar = (conv?.group as any)?.avatar || undefined; // 👈 lấy avatar nhóm

      const sender = conv?.participants.find((p) => p._id === msg.senderId);
      const senderName = sender?.displayName || "Người dùng";
      const senderAvatar = sender?.avatarUrl || undefined;

      const enrichedMsg = {
        ...msg,
        senderName,
        senderAvatar,
        conversationName,
        isGroup,
        groupAvatar, // 👈 truyền vào
      };

      showToastNotification(enrichedMsg);

      const title = isGroup
        ? `${senderName} trong ${conversationName || "Nhóm"}`
        : `Tin nhắn mới từ ${senderName}`;
      const preview = getSafeMessagePreview(msg.content, "Đã gửi một tin nhắn");

      showBrowserNotification(
        title,
        preview,
        isGroup ? groupAvatar : senderAvatar,
      );
    };

    socket.on("new-message", handleNewMessage);
    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [
    socket,
    socket?.connected,
    user?.userId,
    showToastNotification,
    showBrowserNotification,
  ]);
}
