import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  Clock,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  UserRoundSearch,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useFriendStore } from "@/stores/useFriendStore";
import type { Friend, FriendRequest } from "../types/user";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name?.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase() || "U";

const randomColor = (str: string) => {
  const colors = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899"];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({
  name,
  avatarUrl,
  size = 40,
}: {
  name: string;
  avatarUrl?: string;
  size?: number;
}) {
  const color = randomColor(name);
  const radius = Math.round(size * 0.3);
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: radius, background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size * 0.35), fontWeight: 800, color: "white", flexShrink: 0,
        boxShadow: `0 3px 10px ${color}44`,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  count,
  open,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button className="fp-section-header" onClick={onToggle}>
      <div className="fp-section-left">
        {icon}
        <span className="fp-section-title">{title}</span>
        {count > 0 && <span className="fp-badge">{count}</span>}
      </div>
      {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function Empty({ text }: { text: string }) {
  return (
    <div className="fp-empty">
      <UserRoundSearch size={22} color="#334155" />
      <span>{text}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface FriendPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (userId: string, name: string) => void;
}

export default function FriendPanel({ isOpen, onClose, onStartChat }: FriendPanelProps) {
  const {
    loading,
    friends,
    receivedList,
    sentList,
    getAllFriendRequest,
    getFriends,
    acceptRequest,
    declineRequest,
    cancelRequest,
  } = useFriendStore();

  const [openReceived, setOpenReceived] = useState(true);
  const [openSent,     setOpenSent]     = useState(false);
  const [openFriends,  setOpenFriends]  = useState(true);
  const [actionId,     setActionId]     = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getAllFriendRequest();
      getFriends();
    }
  }, [isOpen]);

  const handleAccept = async (requestId: string, name: string) => {
    setActionId(requestId);
    await acceptRequest(requestId);
    toast.success(`Đã chấp nhận lời mời từ ${name}`);
    setActionId(null);
    getFriends();
  };

  const handleDecline = async (requestId: string, name: string) => {
    setActionId(requestId);
    await declineRequest(requestId);
    toast.info(`Đã từ chối lời mời từ ${name}`);
    setActionId(null);
  };

  const handleCancel = async (requestId: string, name: string) => {
    setActionId(requestId);
    await cancelRequest(requestId);
    toast.info(`Đã huỷ lời mời gửi đến ${name}`);
    setActionId(null);
  };

  return (
    <>
      <style>{`
        /* ── Wrapper ── */
        .fp-sidebar {
          width: 300px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: rgba(8,14,28,.97);
          border-right: 1px solid rgba(255,255,255,.05);
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        @media (max-width: 1100px) { .fp-sidebar { width: 270px; } }

        @media (max-width: 767px) {
          .fp-sidebar {
            position: fixed; top: 0; left: 0; bottom: 0; z-index: 38;
            width: calc(100vw - 56px) !important; max-width: 300px !important;
            transform: translateX(-100%); visibility: hidden;
            transition: transform .28s cubic-bezier(.22,1,.36,1), visibility .28s;
            box-shadow: 4px 0 32px rgba(0,0,0,.6);
          }
          .fp-sidebar.open { transform: translateX(56px); visibility: visible; }
          .fp-close-btn { display: flex !important; }
        }

        /* ── Header ── */
        .fp-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 14px 12px;
          border-bottom: 1px solid rgba(255,255,255,.04);
          flex-shrink: 0;
        }
        .fp-header-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 17px; font-weight: 700; color: white;
        }
        .fp-header-title svg { stroke: #60a5fa; fill: none; display: block; }
        .fp-close-btn {
          display: none;
          width: 30px; height: 30px; border-radius: 8px; border: none;
          background: rgba(255,255,255,.06); color: #64748b; cursor: pointer;
          align-items: center; justify-content: center; transition: all .15s;
        }
        .fp-close-btn:hover { background: rgba(255,255,255,.1); color: #e2e8f0; }
        .fp-close-btn svg { display: block; stroke: currentColor; fill: none; }

        /* ── Scroll body ── */
        .fp-body { flex: 1; overflow-y: auto; padding: 8px; }

        /* ── Section header button ── */
        .fp-section-header {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 8px 10px; border: none; background: transparent;
          cursor: pointer; border-radius: 10px; margin-bottom: 2px;
          transition: background .15s; font-family: inherit;
        }
        .fp-section-header:hover { background: rgba(255,255,255,.04); }
        .fp-section-header svg { display: block; stroke: #64748b; fill: none; flex-shrink: 0; }
        .fp-section-left { display: flex; align-items: center; gap: 8px; }
        .fp-section-title { font-size: 13px; font-weight: 700; color: #94a3b8; }
        .fp-badge {
          min-width: 18px; height: 18px; border-radius: 9px; padding: 0 5px;
          background: linear-gradient(135deg,#6366f1,#4f46e5);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: white;
        }

        /* ── Items ── */
        .fp-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 12px;
          transition: background .15s; margin-bottom: 2px;
        }
        .fp-item:hover { background: rgba(59,130,246,.07); }
        .fp-item-info { flex: 1; min-width: 0; }
        .fp-item-name {
          font-size: 13px; font-weight: 600; color: #e2e8f0;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .fp-item-sub {
          font-size: 11px; color: #475569; margin-top: 1px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* ── Action buttons ── */
        .fp-actions { display: flex; gap: 5px; flex-shrink: 0; }
        .fp-btn {
          width: 30px; height: 30px; border-radius: 9px; border: none;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all .18s; flex-shrink: 0;
        }
        .fp-btn svg { display: block; stroke: currentColor; fill: none; }
        .fp-btn:disabled { opacity: .5; cursor: not-allowed; }

        .fp-btn-accept  { background: rgba(16,185,129,.12); color: #10b981; }
        .fp-btn-accept:hover:not(:disabled)  { background: rgba(16,185,129,.22); transform: scale(1.08); }

        .fp-btn-decline { background: rgba(239,68,68,.1); color: #f87171; }
        .fp-btn-decline:hover:not(:disabled) { background: rgba(239,68,68,.2); transform: scale(1.08); }

        .fp-btn-chat    { background: rgba(59,130,246,.1); color: #60a5fa; }
        .fp-btn-chat:hover:not(:disabled)    { background: rgba(59,130,246,.2); transform: scale(1.08); }

        .fp-btn-cancel  { background: rgba(100,116,139,.1); color: #94a3b8; }
        .fp-btn-cancel:hover:not(:disabled)  { background: rgba(100,116,139,.2); transform: scale(1.08); }

        /* ── Empty ── */
        .fp-empty {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 16px 0 8px; color: #334155; font-size: 12px; text-align: center;
        }
        .fp-empty svg { display: block; }

        /* ── Divider ── */
        .fp-divider { height: 1px; background: rgba(255,255,255,.04); margin: 6px 4px; }

        /* ── Spinner ── */
        @keyframes fp-spin { to { transform: rotate(360deg); } }
        .fp-spin { animation: fp-spin .7s linear infinite; }

        /* ── Online dot ── */
        .fp-online-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #10b981;
          border: 1.5px solid #080e1d; flex-shrink: 0;
        }
      `}</style>

      <div className={`fp-sidebar ${isOpen ? "open" : ""}`}>

        {/* Header */}
        <div className="fp-header">
          <div className="fp-header-title">
            <Users size={18} />
            Bạn bè
          </div>
          <button className="fp-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="fp-body">

          {/* ── Lời mời đã nhận ── */}
          <SectionHeader
            icon={<UserPlus size={14} color="#818cf8" />}
            title="Lời mời đã nhận"
            count={receivedList.length}
            open={openReceived}
            onToggle={() => setOpenReceived((v) => !v)}
          />
          {openReceived && (
            <>
              {loading && receivedList.length === 0 ? (
                <div className="fp-empty">
                  <Loader2 size={18} className="fp-spin" color="#475569" />
                </div>
              ) : receivedList.length === 0 ? (
                <Empty text="Không có lời mời nào" />
              ) : (
                receivedList.map((req: FriendRequest) => {
                  const from = req.from as any;
                  const name = from?.displayName || from?.username || "Người dùng";
                  const isActing = actionId === req._id;
                  return (
                    <div key={req._id} className="fp-item">
                      <Avatar name={name} avatarUrl={from?.avatarUrl} size={40} />
                      <div className="fp-item-info">
                        <div className="fp-item-name">{name}</div>
                        {req.message && (
                          <div className="fp-item-sub" title={req.message}>
                            "{req.message}"
                          </div>
                        )}
                      </div>
                      <div className="fp-actions">
                        <button
                          className="fp-btn fp-btn-accept"
                          onClick={() => handleAccept(req._id, name)}
                          disabled={isActing}
                          title="Chấp nhận"
                        >
                          {isActing ? <Loader2 size={13} className="fp-spin" /> : <Check size={13} />}
                        </button>
                        <button
                          className="fp-btn fp-btn-decline"
                          onClick={() => handleDecline(req._id, name)}
                          disabled={isActing}
                          title="Từ chối"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              <div className="fp-divider" />
            </>
          )}

          {/* ── Lời mời đã gửi ── */}
          <SectionHeader
            icon={<Clock size={14} color="#fbbf24" />}
            title="Lời mời đã gửi"
            count={sentList.length}
            open={openSent}
            onToggle={() => setOpenSent((v) => !v)}
          />
          {openSent && (
            <>
              {loading && sentList.length === 0 ? (
                <div className="fp-empty">
                  <Loader2 size={18} className="fp-spin" color="#475569" />
                </div>
              ) : sentList.length === 0 ? (
                <Empty text="Chưa gửi lời mời nào" />
              ) : (
                sentList.map((req: FriendRequest) => {
                  const to = req.to as any;
                  const name = to?.displayName || to?.username || "Người dùng";
                  const isActing = actionId === req._id;
                  return (
                    <div key={req._id} className="fp-item">
                      <Avatar name={name} avatarUrl={to?.avatarUrl} size={40} />
                      <div className="fp-item-info">
                        <div className="fp-item-name">{name}</div>
                        <div className="fp-item-sub">
                          <span style={{ color: "#fbbf24" }}>● </span>Đang chờ phản hồi
                        </div>
                      </div>
                      <div className="fp-actions">
                        <button
                          className="fp-btn fp-btn-cancel"
                          onClick={() => handleCancel(req._id, name)}
                          disabled={isActing}
                          title="Huỷ lời mời"
                        >
                          {isActing ? <Loader2 size={13} className="fp-spin" /> : <UserMinus size={13} />}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              <div className="fp-divider" />
            </>
          )}

          {/* ── Danh sách bạn bè ── */}
          <SectionHeader
            icon={<UserCheck size={14} color="#34d399" />}
            title="Bạn bè"
            count={friends.length}
            open={openFriends}
            onToggle={() => setOpenFriends((v) => !v)}
          />
          {openFriends && (
            <>
              {loading && friends.length === 0 ? (
                <div className="fp-empty">
                  <Loader2 size={18} className="fp-spin" color="#475569" />
                </div>
              ) : friends.length === 0 ? (
                <Empty text="Chưa có bạn bè nào" />
              ) : (
                friends.map((friend: Friend) => {
                  const name = friend.displayName || friend.username || "Người dùng";
                  return (
                    <div key={friend._id} className="fp-item">
                      <Avatar name={name} avatarUrl={friend.avatarUrl} size={40} />
                      <div className="fp-item-info">
                        <div className="fp-item-name">{name}</div>
                        <div className="fp-item-sub">
                          {friend.isOnline
                            ? <span style={{ color: "#10b981" }}>● Đang hoạt động</span>
                            : `@${friend.username || name}`
                          }
                        </div>
                      </div>
                      <div className="fp-actions">
                        {friend.isOnline && (
                          <div className="fp-online-dot" style={{ marginRight: 2 }} />
                        )}
                        <button
                          className="fp-btn fp-btn-chat"
                          onClick={() => onStartChat?.(friend._id, name)}
                          title="Nhắn tin"
                        >
                          <MessageCircle size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}