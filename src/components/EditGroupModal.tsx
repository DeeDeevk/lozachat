import { useRef, useState, useEffect } from "react";
import { Camera, X, Loader2, Check, AlertCircle } from "lucide-react";
import type { Conversation } from "@/types/chat";
import { chatService } from "@/services/chatService";
import { useChatStore } from "@/stores/useChatStore";

interface EditGroupModalProps {
  conversation: Conversation;
  onClose: () => void;
}

export default function EditGroupModal({
  conversation,
  onClose,
}: EditGroupModalProps) {
  const [name, setName] = useState(conversation.group?.name || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    conversation.group?.avatar || null,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file ảnh");
      return;
    }

    setError(null);
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const isDirty =
    name.trim() !== (conversation.group?.name || "") || avatarFile !== null;

  const handleSubmit = async () => {
    if (!isDirty) return;

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      setError("Tên nhóm quá dài (tối đa 100 ký tự)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (trimmedName !== conversation.group?.name) {
        formData.append("name", trimmedName);
      }
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const updated = await chatService.updateGroupInfo(
        conversation._id,
        formData,
      );

      // Update local store
      useChatStore.getState().updateConversation(updated.conversation);

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại",
      );
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  return (
    /* Backdrop */
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes ripple { 0% { transform: scale(0); opacity: 0.6 } 100% { transform: scale(2.5); opacity: 0 } }
        .edit-input:focus { outline: none; border-color: rgba(99,102,241,0.6) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; }
        .edit-input { transition: border-color 0.2s, box-shadow 0.2s; }
        .avatar-upload-btn:hover .avatar-overlay { opacity: 1 !important; }
        .submit-btn:not(:disabled):hover { background: #5b5fc7 !important; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,102,241,0.35) !important; }
        .submit-btn:not(:disabled):active { transform: translateY(0); }
        .submit-btn { transition: all 0.2s; }
        .cancel-btn:hover { background: rgba(148,163,184,0.12) !important; color: #f1f5f9 !important; }
        .cancel-btn { transition: all 0.2s; }
      `}</style>

      {/* Modal card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "linear-gradient(145deg, #111827 0%, #1a1f3a 100%)",
          borderRadius: 20,
          border: "1px solid rgba(148,163,184,0.12)",
          boxShadow:
            "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
          overflow: "hidden",
          animation: "slideUp 0.2s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 20px 18px",
            borderBottom: "1px solid rgba(148,163,184,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: "#f1f5f9",
              letterSpacing: "-0.3px",
            }}
          >
            Chỉnh sửa nhóm
          </h2>
          <button
            onClick={onClose}
            className="cancel-btn"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,0.15)",
              background: "transparent",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 24px 24px" }}>
          {/* Avatar Picker */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />

            <button
              className="avatar-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: "relative",
                width: 88,
                height: 88,
                borderRadius: "50%",
                border: "2px dashed rgba(99,102,241,0.4)",
                padding: 3,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {/* Avatar inner */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: avatarPreview ? "transparent" : "#312e81",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  getInitials(name || "G")
                )}
              </div>

              {/* Hover overlay */}
              <div
                className="avatar-overlay"
                style={{
                  position: "absolute",
                  inset: 3,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
              >
                <Camera size={18} color="white" />
                <span style={{ fontSize: 9, color: "white", fontWeight: 600 }}>
                  Đổi ảnh
                </span>
              </div>

              {/* Changed badge */}
              {avatarFile && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#6366f1",
                    border: "2px solid #111827",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={11} color="white" strokeWidth={3} />
                </div>
              )}
            </button>

            <p
              style={{
                margin: "10px 0 0",
                fontSize: 12,
                color: "#64748b",
              }}
            >
              Nhấn để thay đổi ảnh đại diện
            </p>
          </div>

          {/* Name Input */}
          <div style={{ marginBottom: 8 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Tên nhóm
            </label>
            <input
              className="edit-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              maxLength={100}
              placeholder="Nhập tên nhóm..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.2)",
                background: "rgba(15,23,42,0.6)",
                color: "#f1f5f9",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 5,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: name.length > 90 ? "#f87171" : "#475569",
                }}
              >
                {name.length}/100
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                marginBottom: 16,
              }}
            >
              <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#f87171" }}>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div
            style={{ display: "flex", gap: 10, marginTop: error ? 0 : 16 }}
          >
            <button
              onClick={onClose}
              className="cancel-btn"
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.2)",
                background: "transparent",
                color: "#94a3b8",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Hủy
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || !isDirty || success}
              className="submit-btn"
              style={{
                flex: 2,
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background:
                  success
                    ? "#059669"
                    : !isDirty
                      ? "rgba(99,102,241,0.3)"
                      : "#6366f1",
                color: !isDirty ? "#64748b" : "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !isDirty || success ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: isDirty && !loading && !success
                  ? "0 4px 14px rgba(99,102,241,0.25)"
                  : "none",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
                  Đang lưu...
                </>
              ) : success ? (
                <>
                  <Check size={16} />
                  Đã lưu!
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}