import { useState } from "react";
import { Search, Star, X, UserSearch, UsersRound } from "lucide-react";
import SearchUserModal from "./SearchUserModal";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  status: "sent" | "delivered" | "read";
  type: "text" | "image" | "file";
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  avatarColor: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  pinned?: boolean;
  messages: Message[];
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  onSelectConversation: (id: string) => void;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
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

  const filteredConvs = conversations.filter((c) => {
    const matchesSearch = c.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (activeTab === "group") return matchesSearch && c.name.includes("Team");
    if (activeTab === "direct")
      return matchesSearch && !c.name.includes("Team");
    return matchesSearch;
  });

  return (
    <>
      <style>{`
        /* ── Sidebar wrapper ── */
        .chat-sidebar {
          width: 360px;
          flex-shrink: 0;
        }

        @media (max-width: 1100px) { .chat-sidebar { width: 270px; } }

        @media (max-width: 767px) {
          .chat-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 38;
            width: calc(100vw - 56px) !important;
            max-width: 300px !important;
            transform: translateX(-100%);
            visibility: hidden;
            transition: transform .28s cubic-bezier(.22,1,.36,1), visibility .28s;
            box-shadow: 4px 0 32px rgba(0,0,0,.6);
          }
          .chat-sidebar.open {
            transform: translateX(56px);
            visibility: visible;
          }
          .cl-back-btn { display: flex !important; }
        }

        /* ── Shared utils (scoped to sidebar) ── */
        .cl-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px; border: none;
          background: transparent; color: #94a3b8; cursor: pointer;
          transition: all .18s; flex-shrink: 0;
        }
        .cl-icon-btn:hover { background: rgba(255,255,255,.07); color: #e2e8f0; }
        .cl-icon-btn svg { display: block; stroke: currentColor; fill: none; pointer-events: none; }

        .cl-back-btn { display: none; }

        .cl-search-input {
          background: rgba(15,23,42,.9);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 12px;
          padding: 9px 14px 9px 36px;
          color: white; font-size: 13px; outline: none; width: 100%;
          transition: all .2s;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .cl-search-input:focus { border-color: rgba(59,130,246,.4); background: rgba(20,30,50,.9); }
        .cl-search-input::placeholder { color: #475569; }

        .cl-tab-btn {
          flex: 1; padding: 7px 0; border: none; background: transparent;
          color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer;
          border-radius: 10px; transition: all .2s;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .cl-tab-btn.active { background: rgba(59,130,246,.15); color: #60a5fa; }

        .cl-conv-item {
          display: flex; align-items: center; gap: 12px; padding: 10px 12px;
          cursor: pointer; border-radius: 12px; transition: all .18s; position: relative;
        }
        .cl-conv-item:hover  { background: rgba(59,130,246,.08); }
        .cl-conv-item.active { background: rgba(59,130,246,.14); }
        .cl-conv-item.active::before {
          content: ""; position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg,#3b82f6,#2563eb);
        }

        @keyframes cl-pulse { 0%,100%{opacity:.6;transform:scale(1);} 50%{opacity:1;transform:scale(1.4);} }
        .cl-online-dot {
          position: absolute; bottom: -1px; right: -1px;
          width: 9px; height: 9px; border-radius: 50%;
          background: #10b981; border: 2px solid #060d1f;
          animation: cl-pulse 2.5s ease-in-out infinite;
        }

        .cl-sidebar-title { color: white; font-weight: 700; font-size: 17px; }
      `}</style>

      <div
        className={`chat-sidebar ${isOpen ? "open" : ""}`}
        style={{
          display: "flex",
          flexDirection: "column",
          background: "rgba(8,14,28,.97)",
          borderRight: "1px solid rgba(255,255,255,.05)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "14px 14px 10px",
            borderBottom: "1px solid rgba(255,255,255,.04)",
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
              {/* Close — mobile only */}
              <button
                className="cl-icon-btn cl-back-btn"
                onClick={onClose}
                aria-label="Đóng"
              >
                <X size={18} />
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

        {/* ── Pinned label ── */}
        {filteredConvs.some((c) => c.pinned) && (
          <div
            style={{
              padding: "8px 16px 4px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Star size={10} color="#64748b" />
            <span
              style={{
                color: "#475569",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Đã ghim
            </span>
          </div>
        )}

        {/* ── Conversation list ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {filteredConvs.map((conv) => (
            <div
              key={conv.id}
              className={`cl-conv-item ${conv.id === activeId ? "active" : ""}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: conv.avatarColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "white",
                    boxShadow:
                      conv.id === activeId
                        ? `0 4px 12px ${conv.avatarColor}55`
                        : "none",
                  }}
                >
                  {conv.avatar}
                </div>
                {conv.online && <div className="cl-online-dot" />}
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
                      fontWeight: conv.unread > 0 ? 700 : 500,
                      fontSize: 14,
                      color: conv.unread > 0 ? "white" : "#cbd5e1",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {conv.name}
                  </span>
                  <span
                    style={{
                      color: "#475569",
                      fontSize: 11,
                      flexShrink: 0,
                      marginLeft: 4,
                    }}
                  >
                    {conv.time}
                  </span>
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
                      color: conv.unread > 0 ? "#94a3b8" : "#475569",
                      fontSize: 12,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {conv.lastMessage}
                  </span>
                  {conv.unread > 0 && (
                    <div
                      style={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        background: "linear-gradient(135deg,#2563eb,#3b82f6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "white",
                        padding: "0 5px",
                        marginLeft: 6,
                        flexShrink: 0,
                      }}
                    >
                      {conv.unread > 9 ? "9+" : conv.unread}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredConvs.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#475569",
              }}
            >
              <Search size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
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
