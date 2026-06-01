import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { GroupJoinRequest } from "@/types/store";

interface ManageGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: {
    requireApprovalToJoin?: boolean;
    whoCanEditGroup?: "all" | "admin";
    whoCanSendMessages?: "all" | "admin";
  };
  onUpdateSettings?: (settings: {
    requireApprovalToJoin?: boolean;
    whoCanEditGroup?: "all" | "admin";
    whoCanSendMessages?: "all" | "admin";
  }) => Promise<void>;
  pendingRequests?: GroupJoinRequest[];
  onReviewRequest?: (
    requestId: string,
    action: "approved" | "rejected",
  ) => Promise<void>;
}

// ─── Reusable Toggle Row ───────────────────────────────────────────────────────
function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
  disabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderRadius: 12,
        background: "rgba(148,163,184,0.05)",
        border: "1px solid rgba(148,163,184,0.12)",
        gap: 12,
      }}
    >
      <div>
        <p
          style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
        >
          {title}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 11,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          border: "none",
          background: enabled ? "#2563eb" : "rgba(148,163,184,0.3)",
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.2s",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 4,
            left: enabled ? 23 : 4,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "white",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </div>
  );
}

export default function ManageGroupModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  pendingRequests,
  onReviewRequest,
}: ManageGroupModalProps) {
  const [requireApproval, setRequireApproval] = useState(
    settings?.requireApprovalToJoin ?? false,
  );
  const [allowMembersEditInfo, setAllowMembersEditInfo] = useState(
    settings?.whoCanEditGroup === "all",
  );
  const [allowMembersChat, setAllowMembersChat] = useState(
    settings?.whoCanSendMessages === "all",
  );

  // Đồng bộ khi settings thay đổi từ bên ngoài
  useEffect(() => {
    if (!settings) return;
    setRequireApproval(settings.requireApprovalToJoin ?? false);
    setAllowMembersEditInfo(settings.whoCanEditGroup === "all");
    setAllowMembersChat(settings.whoCanSendMessages === "all");
  }, [
    settings?.requireApprovalToJoin,
    settings?.whoCanEditGroup,
    settings?.whoCanSendMessages,
  ]);

  const uniquePendingRequests = (() => {
    if (!pendingRequests) return [];
    const map = new Map();
    pendingRequests.forEach((req) => {
      const uId = req.invitedUserId?._id || req.invitedUserId;
      map.set(uId, req);
    });
    return Array.from(map.values());
  })();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 400,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #0f172a 0%, #1a1f3a 100%)",
          borderRadius: 18,
          width: "100%",
          maxWidth: 440,
          border: "1px solid rgba(148,163,184,0.15)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 20px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(148,163,184,0.1)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: "#f1f5f9",
            }}
          >
            Quản lý nhóm
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "rgba(148,163,184,0.1)",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(148,163,184,0.2)";
              (e.currentTarget as HTMLButtonElement).style.color = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(148,163,184,0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Settings Content */}
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* 1. Phê duyệt thành viên mới */}
          <ToggleRow
            title="Phê duyệt thành viên mới"
            description="Thành viên mới cần được duyệt trước khi vào nhóm"
            enabled={requireApproval}
            onToggle={() => {
              const next = !requireApproval;
              setRequireApproval(next);
              onUpdateSettings?.({ requireApprovalToJoin: next });
            }}
            disabled={!onUpdateSettings}
          />

          <div
            style={{
              height: 1,
              background: "rgba(148,163,184,0.08)",
              margin: "2px 0",
            }}
          />

          {/* 2. Chỉnh sửa ảnh & tên nhóm */}
          <ToggleRow
            title="Thay đổi ảnh và tên nhóm"
            description={
              allowMembersEditInfo
                ? "Tất cả thành viên có thể thay đổi ảnh và tên nhóm"
                : "Chỉ trưởng nhóm và phó nhóm mới có thể thay đổi"
            }
            enabled={allowMembersEditInfo}
            onToggle={() => {
              const next = !allowMembersEditInfo;
              setAllowMembersEditInfo(next);
              onUpdateSettings?.({ whoCanEditGroup: next ? "all" : "admin" });
            }}
            disabled={!onUpdateSettings}
          />

          {/* 3. Gửi tin nhắn */}
          <ToggleRow
            title="Gửi tin nhắn"
            description={
              allowMembersChat
                ? "Tất cả thành viên có thể nhắn tin trong nhóm"
                : "Chỉ trưởng nhóm và phó nhóm mới được nhắn tin"
            }
            enabled={allowMembersChat}
            onToggle={() => {
              const next = !allowMembersChat;
              setAllowMembersChat(next);
              onUpdateSettings?.({
                whoCanSendMessages: next ? "all" : "admin",
              });
            }}
            disabled={!onUpdateSettings}
          />

          {/* Pending requests */}
          {uniquePendingRequests.length > 0 && (
            <>
              <div
                style={{
                  height: 1,
                  background: "rgba(148,163,184,0.08)",
                  margin: "4px 0",
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Đang chờ duyệt ({uniquePendingRequests.length})
              </p>
              {uniquePendingRequests.map((req) => (
                <div
                  key={req._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid rgba(148,163,184,0.12)",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: req.invitedUserId.avatarUrl
                        ? "transparent"
                        : "#1e293b",
                      border: "1px solid rgba(148,163,184,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#94a3b8",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {req.invitedUserId.avatarUrl ? (
                      <img
                        src={req.invitedUserId.avatarUrl}
                        alt={req.invitedUserId.displayName}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      req.invitedUserId.displayName?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: "#f1f5f9",
                        fontWeight: 600,
                      }}
                    >
                      {req.invitedUserId.displayName}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 11,
                        color: "#475569",
                      }}
                    >
                      Mời bởi {req.invitedBy.displayName}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => onReviewRequest?.(req._id, "approved")}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 7,
                        border: "1px solid rgba(37,99,235,0.4)",
                        background: "rgba(37,99,235,0.15)",
                        color: "#93c5fd",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => onReviewRequest?.(req._id, "rejected")}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 7,
                        border: "1px solid rgba(148,163,184,0.2)",
                        background: "rgba(148,163,184,0.08)",
                        color: "#64748b",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}