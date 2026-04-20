// components/AddMemberModal.tsx
import { useState, useEffect } from "react";
import { Search, X, UserPlus } from "lucide-react";
import { useFriendStore } from "@/stores/useFriendStore";

interface AddMemberModalProps {
  conversationId: string;
  currentParticipantIds: string[];
  onClose: () => void;
  onAdd: (targetUserId: string) => Promise<void>;
}

export default function AddMemberModal({
  conversationId,
  currentParticipantIds,
  onClose,
  onAdd,
}: AddMemberModalProps) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const { friends, getFriends } = useFriendStore();

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  // Lọc ra bạn bè chưa ở trong nhóm
  const eligible = friends.filter(
    (f) =>
      !currentParticipantIds.includes(f._id) &&
      f.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1e293b",
          width: 400,
          borderRadius: 16,
          padding: 20,
          border: "1px solid rgba(148,163,184,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ color: "#f1f5f9", margin: 0, fontSize: 16 }}>
            Thêm thành viên
          </h3>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
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
            placeholder="Tìm bạn bè..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{
              width: "100%",
              padding: "9px 9px 9px 32px",
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.2)",
              background: "rgba(148,163,184,0.05)",
              color: "#f1f5f9",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        {/* Friend list */}
        <div
          style={{ maxHeight: 320, overflowY: "auto", display: "grid", gap: 6 }}
        >
          {eligible.length === 0 ? (
            <p
              style={{
                color: "#475569",
                fontSize: 13,
                textAlign: "center",
                padding: 20,
              }}
            >
              Không có bạn bè nào để thêm
            </p>
          ) : (
            eligible.map((friend) => (
              <div
                key={friend._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(148,163,184,0.05)",
                  border: "1px solid rgba(148,163,184,0.1)",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: friend.avatarUrl
                      ? `url(${friend.avatarUrl}) center/cover`
                      : "#3b82f6",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {!friend.avatarUrl && friend.displayName?.[0]?.toUpperCase()}
                </div>

                <span style={{ flex: 1, color: "#f1f5f9", fontSize: 14 }}>
                  {friend.displayName}
                </span>

                <button
                  disabled={adding === friend._id}
                  onClick={async () => {
                    setAdding(friend._id);
                    await onAdd(friend._id);
                    setAdding(null);
                  }}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    background: adding === friend._id ? "#334155" : "#2563eb",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: adding === friend._id ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <UserPlus size={13} />
                  {adding === friend._id ? "Đang thêm..." : "Thêm"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
