import { useState, useEffect } from "react";
import { X, Search, Check } from "lucide-react";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: Props) {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStrangers, setSelectedStrangers] = useState<any[]>([]);

  const { friends, getFriends, searchByUserName } = useFriendStore();
  const { createConversation } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      getFriends();
      setGroupName("");
      setSearchQuery("");
      setSelectedIds([]);
      setSearchResult(null);
      setSelectedStrangers([]);
    }
  }, [isOpen]);

  // Debounce search username
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }
    const timer = setTimeout(async () => {
      const user = await searchByUserName(searchQuery.trim());
      setSearchResult(user);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggle = (id: string, stranger?: any) => {
    const isRemoving = selectedIds.includes(id);

    setSelectedIds((prev) =>
      isRemoving ? prev.filter((x) => x !== id) : [...prev, id],
    );

    if (isRemoving) {
      setSelectedStrangers((prev) => prev.filter((s) => s._id !== id));
    } else if (stranger) {
      setSelectedStrangers((prev) => [...prev, stranger]);
    }
  };

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  const getAvatarColor = (name: string) => {
    const colors = [
      "#3b82f6",
      "#10b981",
      "#8b5cf6",
      "#f59e0b",
      "#ef4444",
      "#06b6d4",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++)
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  // Danh sách filtered từ friends
  const filteredFriends = friends.filter(
    (f) =>
      f.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // User được chọn (từ friends + searchResult nếu có)
  const selectedUsers = [
    ...friends.filter((f) => selectedIds.includes(f._id)),
    ...selectedStrangers.filter((s) => selectedIds.includes(s._id)),
  ];

  const handleCreate = async () => {
    if (!groupName.trim() || selectedIds.length < 2) return;
    setIsCreating(true);
    try {
      await createConversation({
        type: "group",
        name: groupName.trim(),
        memberIds: selectedIds,
      });
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "rgba(8,14,28,.97)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 440,
          overflow: "hidden",
          margin: "0 16px",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px 12px",
            borderBottom: "1px solid rgba(255,255,255,.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>
            Tạo nhóm chat
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Group name */}
        <div style={{ padding: "14px 18px 10px" }}>
          <label
            style={{
              fontSize: 12,
              color: "#64748b",
              display: "block",
              marginBottom: 6,
            }}
          >
            Tên nhóm
          </label>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Nhập tên nhóm..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 13,
              color: "#f1f5f9",
              outline: "none",
            }}
          />
        </div>

        {/* Search */}
        <div style={{ padding: "0 18px 10px", position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 30,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#475569",
              pointerEvents: "none",
            }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bạn bè hoặc nhập username..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 10,
              padding: "8px 12px 8px 32px",
              fontSize: 13,
              color: "#f1f5f9",
              outline: "none",
            }}
          />
        </div>

        {/* Selected tags */}
        {selectedUsers.length > 0 && (
          <div
            style={{
              padding: "0 18px 8px",
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {selectedUsers.map((u) => (
              <span
                key={u._id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(59,130,246,.15)",
                  color: "#93c5fd",
                  fontSize: 12,
                  padding: "3px 8px 3px 4px",
                  borderRadius: 999,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: getAvatarColor(u.displayName || u.username),
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {getInitials(u.displayName || u.username)}
                </span>
                {u.displayName || u.username}
                <X
                  size={11}
                  style={{ cursor: "pointer", opacity: 0.7 }}
                  onClick={() => toggle(u._id, null)}
                />
              </span>
            ))}
          </div>
        )}

        {/* Friend list */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ padding: "8px 18px 4px" }}>
            <span
              style={{
                fontSize: 11,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Bạn bè
            </span>
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filteredFriends.map((f) => {
              const selected = selectedIds.includes(f._id);
              const name = f.displayName || f.username;
              return (
                <div
                  key={f._id}
                  onClick={() => toggle(f._id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 18px",
                    cursor: "pointer",
                    background: selected
                      ? "rgba(59,130,246,.07)"
                      : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      flexShrink: 0,
                      background: f.avatarUrl
                        ? "transparent"
                        : getAvatarColor(name),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {f.avatarUrl ? (
                      <img
                        src={f.avatarUrl}
                        alt={name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}
                      >
                        {getInitials(name)}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#cbd5e1",
                      }}
                    >
                      {name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
                      @{f.username}
                    </p>
                  </div>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: selected ? "#3b82f6" : "transparent",
                      border: selected ? "none" : "1.5px solid #334155",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected && <Check size={11} color="#fff" />}
                  </div>
                </div>
              );
            })}

            {/* Username search result (người lạ) */}
            {searchResult &&
              !friends.find((f) => f._id === searchResult._id) && (
                <>
                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,.06)",
                      padding: "8px 18px 4px",
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Kết quả tìm kiếm
                    </span>
                  </div>
                  <div
                    onClick={() => toggle(searchResult._id, searchResult)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 18px",
                      cursor: "pointer",
                      background: selectedIds.includes(searchResult._id)
                        ? "rgba(59,130,246,.07)"
                        : "transparent",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: "rgba(255,255,255,.06)",
                        border: "1px solid rgba(255,255,255,.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ color: "#475569", fontSize: 12 }}>?</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#cbd5e1",
                        }}
                      >
                        {searchResult.displayName ||
                          `@${searchResult.username}`}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
                        Không phải bạn bè
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        background: "rgba(251,191,36,.1)",
                        color: "#fbbf24",
                        padding: "2px 7px",
                        borderRadius: 999,
                        flexShrink: 0,
                      }}
                    >
                      Người lạ
                    </span>
                  </div>
                </>
              )}

            {filteredFriends.length === 0 && !searchResult && (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#475569",
                  fontSize: 13,
                }}
              >
                Không tìm thấy
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid rgba(255,255,255,.06)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "7px 16px",
              fontSize: 13,
              borderRadius: 8,
              background: "transparent",
              border: "1px solid rgba(255,255,255,.1)",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            Huỷ
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedIds.length < 2 || isCreating}
            style={{
              padding: "7px 16px",
              fontSize: 13,
              borderRadius: 8,
              background:
                selectedIds.length >= 2 && groupName.trim()
                  ? "#3b82f6"
                  : "rgba(59,130,246,.3)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {isCreating
              ? "Đang tạo..."
              : `Tạo nhóm${selectedIds.length >= 2 ? ` (${selectedIds.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
