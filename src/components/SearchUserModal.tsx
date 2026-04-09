import { useState, useRef, useEffect } from "react";
import {
  X,
  Search,
  UserRoundSearch,
  MessageCircle,
  UserPlus,
  Info,
  Users,
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

interface SearchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (user: User) => void;
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
  onStartChat,
  onRequestSent,
}: SearchUserModalProps) {
  const currentUser = useAuthStore((s) => s.userProfile);
  const { loading, searchByUserName, addFriend, getFriendStatus } =
    useFriendStore();

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [sendingReq, setSendingReq] = useState(false);
  const [reqSent, setReqSent] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("none");
  const [introMessage, setIntroMessage] = useState(
    "Chào bạn ~ Có thể kết bạn được không?",
  );

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery("");
      setResult(null);
      setNotFound(false);
      setReqSent(false);
      setShowDetail(false);
      setRequestStatus("none");
      setIntroMessage("Chào bạn ~ Có thể kết bạn được không?");
    }
  }, [isOpen]);

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
    setReqSent(false);
    setShowDetail(false);
    setRequestStatus("none");
    setIntroMessage("Chào bạn ~ Có thể kết bạn được không?");

    const user = await searchByUserName(q);
    if (!user) {
      setNotFound(true);
      return;
    }

    if (
      user._id === currentUser?._id ||
      user.username === currentUser?.username
    ) {
      setRequestStatus("self");
      setResult(user);
      return;
    }

    const status = await getFriendStatus(user._id);

    if (status === "friend") setRequestStatus("friend");
    else if (status === "sent") setRequestStatus("sent");
    else if (status === "received") setRequestStatus("received");
    else setRequestStatus("none");

    setResult(user);
  };

  const handleSendRequest = async () => {
    if (!result) return;
    setSendingReq(true);
    try {
      await friendService.sendFriendRequest(
        result._id,
        introMessage || undefined,
      );
      setReqSent(true);
      setRequestStatus("sent");
      toast.success("Đã gửi lời mời kết bạn!", {
        description: `Yêu cầu đã được gửi đến ${result.displayName || result.username}`,
      });
      // ← Reload danh sách lời mời gửi ở FriendsPage
      onRequestSent?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Không thể gửi lời mời. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSendingReq(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  if (!isOpen) return null;

  const avatarColor = result ? randomColor(result.username) : "#3b82f6";
  const initials = result
    ? getInitials(result.displayName || result.username)
    : "";
  const isSelf = requestStatus === "self";

  return (
    <>
      <style>{`
        @keyframes suModalIn {
          from { opacity:0; transform:scale(.96) translateY(-8px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes suFadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes suSpin { to { transform:rotate(360deg); } }
        @keyframes suBounce {
          0%,100% { transform:translateY(0); }
          40%     { transform:translateY(-6px); }
          60%     { transform:translateY(-3px); }
        }

        .su-backdrop {
          position:fixed; inset:0; z-index:1000;
          background:rgba(2,6,18,.75); backdrop-filter:blur(6px);
          display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .su-modal {
          width:100%; max-width:460px;
          background:linear-gradient(160deg,#0d1526 0%,#0a1020 100%);
          border:1px solid rgba(255,255,255,.08); border-radius:20px;
          box-shadow:0 32px 80px rgba(0,0,0,.7),0 0 0 1px rgba(99,102,246,.08),inset 0 1px 0 rgba(255,255,255,.05);
          animation:suModalIn .25s cubic-bezier(.22,1,.36,1);
          overflow:hidden; font-family:'Segoe UI',system-ui,sans-serif;
        }
        .su-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:20px 20px 16px; border-bottom:1px solid rgba(255,255,255,.05);
        }
        .su-title { display:flex; align-items:center; gap:10px; font-size:16px; font-weight:700; color:white; }
        .su-title-icon {
          width:32px; height:32px; border-radius:10px; background:rgba(99,102,246,.18);
          display:flex; align-items:center; justify-content:center;
        }
        .su-close-btn {
          width:30px; height:30px; border-radius:8px; border:none;
          background:rgba(255,255,255,.06); color:#64748b; cursor:pointer;
          display:flex; align-items:center; justify-content:center; transition:all .15s;
        }
        .su-close-btn:hover { background:rgba(255,255,255,.1); color:#e2e8f0; }
        .su-close-btn svg { display:block; stroke:currentColor; fill:none; }

        .su-body { padding:20px; display:flex; flex-direction:column; gap:16px; }

        .su-label {
          font-size:12px; font-weight:600; color:#64748b;
          text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px;
        }
        .su-input-row { display:flex; gap:8px; }
        .su-input {
          flex:1; background:rgba(15,23,42,.9); border:1.5px solid rgba(255,255,255,.08);
          border-radius:12px; padding:11px 14px; color:white; font-size:14px; outline:none;
          transition:border-color .2s,box-shadow .2s; font-family:inherit;
        }
        .su-input:focus { border-color:rgba(99,102,246,.5); box-shadow:0 0 0 3px rgba(99,102,246,.12); }
        .su-input::placeholder { color:#334155; }

        .su-search-btn {
          width:44px; height:44px; border-radius:12px; border:none;
          background:linear-gradient(135deg,#6366f1,#4f46e5); color:white; cursor:pointer;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
          transition:all .2s; box-shadow:0 4px 14px rgba(99,102,246,.35);
        }
        .su-search-btn:hover { transform:scale(1.05); box-shadow:0 6px 20px rgba(99,102,246,.5); }
        .su-search-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }
        .su-search-btn svg { display:block; stroke:currentColor; fill:none; }
        .su-spinner { animation:suSpin .7s linear infinite; }

        .su-intro-wrap { display:flex; flex-direction:column; gap:6px; }
        .su-intro-label {
          font-size:11px; font-weight:600; color:#64748b;
          text-transform:uppercase; letter-spacing:.5px;
        }
        .su-intro-textarea {
          width:100%; background:rgba(15,23,42,.9);
          border:1.5px solid rgba(255,255,255,.08); border-radius:12px;
          padding:10px 14px; color:white; font-size:13px; outline:none; resize:none;
          font-family:inherit; min-height:68px; line-height:1.55;
          transition:border-color .2s,box-shadow .2s;
        }
        .su-intro-textarea:focus { border-color:rgba(99,102,246,.5); box-shadow:0 0 0 3px rgba(99,102,246,.12); }
        .su-intro-textarea::placeholder { color:#334155; }
        .su-intro-count { font-size:10px; color:#475569; text-align:right; }

        .su-result-card {
          background:rgba(15,23,42,.7); border:1px solid rgba(255,255,255,.07);
          border-radius:14px; padding:14px;
          animation:suFadeUp .22s cubic-bezier(.22,1,.36,1);
        }
        .su-user-row { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
        .su-avatar {
          width:46px; height:46px; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          font-size:16px; font-weight:800; color:white; flex-shrink:0;
        }
        .su-user-info { flex:1; min-width:0; }
        .su-user-name { font-size:15px; font-weight:700; color:white; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .su-user-username { font-size:12px; color:#64748b; margin-top:2px; }

        .su-detail-btn {
          width:32px; height:32px; border-radius:9px; border:none;
          background:rgba(99,102,246,.12); color:#818cf8; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; transition:all .18s;
        }
        .su-detail-btn:hover { background:rgba(99,102,246,.22); color:#a5b4fc; transform:scale(1.08); }
        .su-detail-btn svg { display:block; stroke:currentColor; fill:none; }

        .su-detail-panel {
          background:rgba(99,102,246,.06); border:1px solid rgba(99,102,246,.15);
          border-radius:10px; padding:12px 14px; margin-bottom:14px;
          animation:suFadeUp .18s cubic-bezier(.22,1,.36,1);
        }
        .su-detail-row { display:flex; justify-content:space-between; align-items:center; padding:4px 0; }
        .su-detail-label { font-size:11px; color:#475569; font-weight:500; }
        .su-detail-value { font-size:12px; color:#cbd5e1; font-weight:600; }

        .su-status-banner {
          display:flex; align-items:flex-start; gap:10px;
          padding:12px 14px; border-radius:11px; margin-bottom:14px;
          animation:suFadeUp .2s cubic-bezier(.22,1,.36,1);
          font-size:13px; line-height:1.55;
        }
        .su-status-banner svg { flex-shrink:0; margin-top:1px; display:block; stroke:currentColor; fill:none; }
        .su-status-banner.sent     { background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.2); color:#fcd34d; }
        .su-status-banner.received { background:rgba(99,102,246,.08); border:1px solid rgba(99,102,246,.2); color:#a5b4fc; }
        .su-status-banner.friend   { background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.2); color:#6ee7b7; }

        .su-self-state {
          display:flex; flex-direction:column; align-items:center; gap:10px;
          padding:24px 0 8px; animation:suFadeUp .22s cubic-bezier(.22,1,.36,1);
        }
        .su-self-emoji { font-size:44px; animation:suBounce 1.2s ease-in-out infinite; display:block; }
        .su-self-text { font-size:14px; font-weight:600; color:#94a3b8; }
        .su-self-sub  { font-size:12px; color:#475569; text-align:center; }

        .su-actions { display:flex; gap:8px; }
        .su-btn {
          flex:1; padding:10px 0; border-radius:11px; border:none;
          font-size:13px; font-weight:600; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:7px;
          transition:all .2s; font-family:inherit;
        }
        .su-btn svg { display:block; stroke:currentColor; fill:none; flex-shrink:0; }
        .su-btn-chat { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); color:#cbd5e1; }
        .su-btn-chat:hover { background:rgba(255,255,255,.1); color:white; }
        .su-btn-friend {
          background:linear-gradient(135deg,#6366f1,#4f46e5); color:white;
          box-shadow:0 4px 14px rgba(99,102,246,.3);
        }
        .su-btn-friend:hover { box-shadow:0 6px 20px rgba(99,102,246,.5); transform:translateY(-1px); }
        .su-btn-friend:disabled { opacity:.6; cursor:not-allowed; transform:none; }
        .su-btn-sent {
          background:rgba(16,185,129,.12); border:1px solid rgba(16,185,129,.25);
          color:#10b981; cursor:default;
        }

        .su-notfound {
          display:flex; flex-direction:column; align-items:center;
          padding:28px 0 12px; gap:8px;
          animation:suFadeUp .22s cubic-bezier(.22,1,.36,1);
        }
        .su-notfound-icon {
          width:56px; height:56px; border-radius:18px; background:rgba(255,255,255,.04);
          display:flex; align-items:center; justify-content:center; margin-bottom:4px;
        }
        .su-notfound-title { font-size:14px; font-weight:600; color:#94a3b8; }
        .su-notfound-sub   { font-size:12px; color:#475569; text-align:center; }
      `}</style>

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
                  placeholder="Nhập username để tìm kiếm..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (result || notFound) {
                      setResult(null);
                      setNotFound(false);
                      setRequestStatus("none");
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
                  <button
                    className="su-detail-btn"
                    onClick={() => setShowDetail((v) => !v)}
                    aria-label="Xem thông tin"
                    title="Thông tin chi tiết"
                  >
                    <Info size={15} />
                  </button>
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
                          color: result.isOnline ? "#10b981" : "#64748b",
                        }}
                      >
                        {result.isOnline ? "● Đang hoạt động" : "Offline"}
                      </span>
                    </div>
                  </div>
                )}

                {requestStatus === "friend" && (
                  <div className="su-status-banner friend">
                    <UserCheck size={15} />
                    <span>Bạn và người này đã là bạn bè.</span>
                  </div>
                )}

                {requestStatus === "sent" && (
                  <div className="su-status-banner sent">
                    <Clock size={15} />
                    <span>
                      Bạn đã gửi yêu cầu kết bạn đến người này. Vui lòng chờ
                      phản hồi.
                    </span>
                  </div>
                )}

                {requestStatus === "received" && (
                  <div className="su-status-banner received">
                    <Bell size={15} />
                    <span>
                      Bạn đã được yêu cầu kết bạn từ người này. Vui lòng phản
                      hồi.
                    </span>
                  </div>
                )}

                {requestStatus === "none" && !reqSent && (
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

                {requestStatus === "none" && (
                  <div className="su-actions">
                    <button
                      className="su-btn su-btn-chat"
                      onClick={() => {
                        onStartChat?.(result);
                        onClose();
                      }}
                    >
                      <MessageCircle size={15} />
                      Nhắn tin
                    </button>
                    {reqSent ? (
                      <button className="su-btn su-btn-sent" disabled>
                        <Users size={15} />
                        Đã gửi lời mời
                      </button>
                    ) : (
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
                )}

                {(requestStatus === "friend" ||
                  requestStatus === "sent" ||
                  requestStatus === "received") && (
                  <div className="su-actions">
                    <button
                      className="su-btn su-btn-chat"
                      onClick={() => {
                        onStartChat?.(result);
                        onClose();
                      }}
                    >
                      <MessageCircle size={15} />
                      Nhắn tin
                    </button>
                  </div>
                )}
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
