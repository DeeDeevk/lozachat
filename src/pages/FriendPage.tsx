import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCheck,
  UserPlus,
  UserMinus,
  Clock,
  Check,
  X,
  MessageCircle,
  Loader2,
  Search,
  Info,
  UserX,
  UserRoundSearch,
} from "lucide-react";
import { toast } from "sonner";
import { useFriendStore } from "@/stores/useFriendStore";
import SideNav from "../components/SideNav";
import SearchUserModal from "@/components/SearchUserModal";
import type { Friend, FriendRequest } from "../types/user";
import axios from "axios";
import { chatService } from "@/services/chatService";

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

type Tab = "friends" | "received" | "sent";

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({
  name,
  avatarUrl,
  size = 44,
}: {
  name: string;
  avatarUrl?: string;
  size?: number;
}) {
  const color = randomColor(name);
  const radius = Math.round(size * 0.28);
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          flexShrink: 0,
          boxShadow: `0 3px 10px rgba(0,0,0,.4)`,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.36),
        fontWeight: 800,
        color: "white",
        flexShrink: 0,
        boxShadow: `0 3px 10px ${color}44`,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FriendsPage() {
  const navigate = useNavigate();
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
    unfriend,
  } = useFriendStore();

  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [actionId, setActionId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getAllFriendRequest();
    getFriends();
  }, []);

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

  const handleUnfriend = async (targetId: string, name: string) => {
    setActionId(targetId);
    await unfriend(targetId);
    toast.info(`Đã huỷ kết bạn với ${name}`);
    setActionId(null);
  };

  const filteredFriends = friends.filter((f: Friend) => {
    const name = f.displayName || f.username || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      key: "friends",
      label: "Bạn bè",
      icon: <UserCheck size={18} />,
      count: friends.length,
    },
    {
      key: "received",
      label: "Lời mời nhận",
      icon: <UserPlus size={18} />,
      count: receivedList.length,
    },
    {
      key: "sent",
      label: "Lời mời gửi",
      icon: <Clock size={18} />,
      count: sentList.length,
    },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Fix: all svg in buttons visible ── */
        button svg {
          display: block !important;
          stroke: currentColor !important;
          fill: none !important;
          pointer-events: none;
          flex-shrink: 0;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,130,186,.25); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,130,186,.45); }

        @keyframes fp-fadein { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
        @keyframes fp-spin   { to{transform:rotate(360deg);} }
        @keyframes fp-pulse  { 0%,100%{opacity:.6;transform:scale(1);} 50%{opacity:1;transform:scale(1.4);} }

        .fp-page {
          display: flex; height: 100vh; overflow: hidden;
          background: #060d1f;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        /* ── Left sidebar ── */
        .fp-sidebar {
          width: 360px; flex-shrink: 0;
          display: flex; flex-direction: column;
          background: rgba(8,14,28,.97);
          border-right: 1px solid rgba(255,255,255,.12);
          overflow: hidden;
        }
        @media (max-width: 1100px) { .fp-sidebar { width: 300px; } }
        @media (max-width: 767px)  { .fp-sidebar { display: none !important; } }

        .fp-sidebar-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,.04);
          flex-shrink: 0;
        }
        .fp-sidebar-title {
          font-size: 18px; font-weight: 700; color: white;
          letter-spacing: -.3px;
        }

        .fp-topicons { display: flex; gap: 4px; }
        .fp-icon-btn {
          width: 36px; height: 36px; border-radius: 10px; border: none;
          background: rgba(59,130,246,.1); color: #60a5fa; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .18s;
        }
        .fp-icon-btn:hover { background: rgba(59,130,246,.22); color: #93c5fd; transform: scale(1.05); }

        /* ── Tabs ── */
        .fp-tabs {
          padding: 12px 10px 8px;
          display: flex; flex-direction: column; gap: 4px;
          flex: 1; overflow-y: auto;
        }

        .fp-tab {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 14px;
          border: 1px solid transparent;
          background: transparent; cursor: pointer;
          font-family: inherit; transition: all .2s;
          text-align: left; width: 100%;
          position: relative;
        }
        .fp-tab:hover { background: rgba(99,102,246,.06); }

        /* ── ALL active tabs: same purple ── */
        .fp-tab.active {
          background: rgba(99,102,246,.14);
          border-color: rgba(99,102,246,.35);
        }

        .fp-tab-icon-wrap {
          width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(99,102,246,.18);
          transition: all .2s;
        }
        .fp-tab.active .fp-tab-icon-wrap {
          background: rgba(99,102,246,.32);
          box-shadow: 0 0 14px rgba(99,102,246,.3);
        }

        /* Inactive: icon bright enough to see */
        .fp-tab-icon-wrap svg { stroke: #818cf8 !important; }
        /* Active: icon brighter */
        .fp-tab.active .fp-tab-icon-wrap svg { stroke: #c4b5fd !important; }

        .fp-tab-text { flex: 1; min-width: 0; }
        .fp-tab-label {
          font-size: 14px; font-weight: 600; color: #94a3b8; display: block;
          transition: color .18s;
        }
        .fp-tab.active .fp-tab-label { color: #c4b5fd; font-weight: 700; }
        .fp-tab-desc { font-size: 11px; color: #475569; margin-top: 2px; display: block; }
        .fp-tab.active .fp-tab-desc { color: #6d7fa3; }

        .fp-tab-badge {
          min-width: 22px; height: 22px; border-radius: 11px; padding: 0 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: white; flex-shrink: 0;
          background: linear-gradient(135deg,#6366f1,#4f46e5);
        }

        /* ── Main ── */
        .fp-main {
          flex: 1; display: flex; flex-direction: column; min-width: 0;
          background: linear-gradient(160deg, #060d1f 0%, #080f1e 100%);
          overflow: hidden;
        }

        .fp-content-header {
          padding: 24px 28px 18px;
          border-bottom: 1px solid rgba(255,255,255,.04);
          flex-shrink: 0;
        }
        @media (max-width: 600px) { .fp-content-header { padding: 16px 16px 14px; } }

        .fp-content-title { font-size: 20px; font-weight: 800; color: white; margin-bottom: 3px; }
        .fp-content-sub   { font-size: 13px; color: #475569; }

        .fp-search-wrap { position: relative; margin-top: 14px; max-width: 360px; }
        .fp-search-input {
          width: 100%;
          background: rgba(15,23,42,.9); border: 2px solid rgba(255,255,255,.07);
          border-radius: 12px; padding: 10px 14px 10px 38px;
          color: white; font-size: 13px; outline: none; font-family: inherit;
          transition: border-color .2s, box-shadow .2s;
        }
        .fp-search-input:focus { border-color: rgba(99,102,246,.4); box-shadow: 0 0 0 3px rgba(99,102,246,.1); }
        .fp-search-input::placeholder { color: #334155; }

        .fp-content-body {
          flex: 1; overflow-y: auto;
          padding: 20px 28px 28px;
          width: 100%;
          display: flex; justify-content: center;
        }
        @media (max-width: 600px) { .fp-content-body { padding: 14px 14px 20px; } }

        /* 90% centered wrapper for all tab content */
        .fp-content-inner {
          width: 95%;
          max-width: 1200px;
        }
        @media (max-width: 900px)  { .fp-content-inner { width: 95%; } }
        @media (max-width: 600px)  { .fp-content-inner { width: 100%; } }

        /* ── Unified grid for ALL 3 tabs — 1 column ── */
        .fp-friends-grid,
        .fp-request-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          width: 100%;
        }

        .fp-friend-card {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 20px; border-radius: 16px;
          background: rgba(15,24,48,.9);
          border: 1px solid rgba(99,102,246,.18);
          box-shadow: 0 4px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.05);
          transition: all .2s; animation: fp-fadein .25s cubic-bezier(.22,1,.36,1) both;
          width: 100%;
        }
        .fp-friend-card:hover {
          background: rgba(25,38,72,.95);
          border-color: rgba(99,102,246,.4);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(99,102,246,.15);
        }
        .fp-friend-info { flex: 1; min-width: 0; }
        .fp-friend-name     { font-size: 14px; font-weight: 700; color: white; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fp-friend-username { font-size: 12px; color: #475569; margin-top: 2px; }
        .fp-friend-online   { display: flex; align-items: center; gap: 5px; margin-top: 3px; font-size: 11px; color: #10b981; }
        .fp-online-dot      { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: fp-pulse 2.5s ease-in-out infinite; flex-shrink: 0; }

        .fp-card-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .fp-card-btn {
          width: 34px; height: 34px; border-radius: 10px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .18s; flex-shrink: 0; position: relative;
        }
        .fp-card-btn:disabled { opacity: .5; cursor: not-allowed; }

        .fp-card-btn-chat   { background: rgba(59,130,246,.12);  color: #60a5fa; }
        .fp-card-btn-unfriend { background: rgba(239,68,68,.09); color: #f87171; }
        .fp-card-btn-info   { background: rgba(99,102,246,.1);   color: #a5b4fc; }

        .fp-card-btn-chat:hover:not(:disabled)     { background: rgba(59,130,246,.24);  transform: scale(1.1); }
        .fp-card-btn-unfriend:hover:not(:disabled) { background: rgba(239,68,68,.18);   transform: scale(1.1); }
        .fp-card-btn-info:hover:not(:disabled)     { background: rgba(99,102,246,.22);  transform: scale(1.1); }

        /* tooltip */
        .fp-card-btn::after {
          content: attr(data-tip);
          position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
          background: rgba(10,16,32,.97); border: 1px solid rgba(255,255,255,.1);
          color: #e2e8f0; font-size: 10px; font-weight: 600;
          padding: 4px 8px; border-radius: 6px; white-space: nowrap;
          pointer-events: none; opacity: 0; transition: opacity .15s;
          font-family: 'Segoe UI', system-ui, sans-serif;
          z-index: 100;
        }
        .fp-card-btn:hover::after { opacity: 1; }

        /* ── Request list ── */

        .fp-request-card {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 20px; border-radius: 16px;
          background: rgba(15,24,48,.9);
          border: 1px solid rgba(99,102,246,.18);
          box-shadow: 0 4px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.05);
          transition: all .2s; animation: fp-fadein .25s cubic-bezier(.22,1,.36,1) both;
        }
        .fp-request-card:hover {
          background: rgba(25,38,72,.95);
          border-color: rgba(99,102,246,.35);
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(0,0,0,.45);
        }
        .fp-request-info { flex: 1; min-width: 0; }
        .fp-request-name    { font-size: 14px; font-weight: 700; color: white; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fp-request-msg     { font-size: 12px; color: #64748b; margin-top: 3px; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fp-request-pending { font-size: 11px; color: #fbbf24; margin-top: 3px; display: flex; align-items: center; gap: 4px; }

        .fp-request-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .fp-req-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 9px; border: none;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: all .18s; flex-shrink: 0;
          white-space: nowrap;
        }
        .fp-req-btn:disabled { opacity: .5; cursor: not-allowed; }
        .fp-req-btn-accept  { background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; box-shadow: 0 3px 10px rgba(99,102,246,.3); }
        .fp-req-btn-accept:hover:not(:disabled)  { box-shadow: 0 5px 16px rgba(99,102,246,.5); transform: translateY(-1px); }
        .fp-req-btn-decline { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2); color: #f87171; }
        .fp-req-btn-decline:hover:not(:disabled) { background: rgba(239,68,68,.18); }
        .fp-req-btn-cancel  { background: rgba(100,116,139,.1); border: 1px solid rgba(100,116,139,.2); color: #94a3b8; }
        .fp-req-btn-cancel:hover:not(:disabled)  { background: rgba(100,116,139,.18); }

        /* mobile: stack buttons vertically on very small screens */
        @media (max-width: 480px) {
          .fp-request-card { flex-wrap: wrap; }
          .fp-request-actions { width: 100%; margin-top: 8px; }
          .fp-req-btn { flex: 1; justify-content: center; }
        }

        /* ── Empty ── */
        .fp-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 80px 20px; gap: 14px; text-align: center;
        }
        .fp-empty-icon {
          width: 72px; height: 72px; border-radius: 22px;
          background: rgba(99,102,246,.08); border: 1px solid rgba(99,102,246,.15);
          display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
        }
        .fp-empty-icon svg { display: block !important; stroke: #475569 !important; fill: none !important; }
        .fp-empty-title { font-size: 16px; font-weight: 700; color: #64748b; }
        .fp-empty-sub   { font-size: 13px; color: #334155; max-width: 280px; line-height: 1.6; }

        /* ── Mobile bottom tab bar ── */
        .fp-mobile-tabs {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(8,14,28,.98);
          border-top: 1px solid rgba(255,255,255,.07);
          z-index: 50; padding: 8px 0 10px;
          backdrop-filter: blur(12px);
        }
        @media (max-width: 767px) {
          .fp-mobile-tabs { display: flex; }
          .fp-page { padding-bottom: 64px; }
        }
        .fp-mobile-tab-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
          border: none; background: transparent; cursor: pointer;
          color: #475569; font-family: inherit; font-size: 10px; font-weight: 600;
          padding: 4px 0; transition: color .18s; position: relative;
        }
        .fp-mobile-tab-btn.active { color: #818cf8; }
        .fp-mobile-tab-btn svg { display: block !important; stroke: currentColor !important; fill: none !important; }
        .fp-mobile-badge {
          position: absolute; top: 0; right: calc(50% - 20px);
          min-width: 16px; height: 16px; border-radius: 8px;
          background: #6366f1; color: white;
          font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; padding: 0 4px;
        }

        .fp-spin    { animation: fp-spin .7s linear infinite; }
        .fp-loading { display: flex; justify-content: center; padding: 48px 0; }

        /* ── Mobile search header ── */
        .fp-mobile-header {
          display: none;
          align-items: center; justify-content: space-between;
          padding: 14px 16px 10px;
          border-bottom: 1px solid rgba(255,255,255,.04);
          flex-shrink: 0;
        }
        @media (max-width: 767px) {
          .fp-mobile-header { display: flex; }
        }
        .fp-mobile-header-title { font-size: 18px; font-weight: 800; color: white; }
        .fp-mobile-search-btn {
          width: 36px; height: 36px; border-radius: 10px; border: none;
          background: rgba(59,130,246,.1); color: #60a5fa; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all .18s;
        }
        .fp-mobile-search-btn:hover { background: rgba(59,130,246,.22); }
      `}</style>

      <div className="fp-page">
        {/* ── SideNav ── */}
        <SideNav />

        {/* ── Left sidebar (desktop) ── */}
        <div className="fp-sidebar">
          <div className="fp-sidebar-top">
            <div className="fp-sidebar-title">Bạn bè</div>
            <div className="fp-topicons">
              <button
                className="fp-icon-btn"
                title="Tìm kiếm người dùng"
                onClick={() => setShowSearchModal(true)}
              >
                <UserRoundSearch size={16} />
              </button>
            </div>
          </div>

          <div className="fp-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`fp-tab fp-tab-${tab.key} ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <div className="fp-tab-icon-wrap">{tab.icon}</div>
                <div className="fp-tab-text">
                  <span className="fp-tab-label">{tab.label}</span>
                  <span className="fp-tab-desc">
                    {tab.key === "friends" && "Danh sách bạn bè đã kết nối"}
                    {tab.key === "received" && "Lời mời kết bạn từ người khác"}
                    {tab.key === "sent" && "Lời mời bạn đã gửi đi"}
                  </span>
                </div>
                {(tab.count ?? 0) > 0 && (
                  <span className="fp-tab-badge">
                    {(tab.count ?? 0) > 99 ? "99+" : tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="fp-main">
          {/* Mobile header */}
          <div className="fp-mobile-header">
            <div className="fp-mobile-header-title">
              {activeTab === "friends" && "Bạn bè"}
              {activeTab === "received" && "Lời mời nhận"}
              {activeTab === "sent" && "Lời mời gửi"}
            </div>
            <button
              className="fp-mobile-search-btn"
              onClick={() => setShowSearchModal(true)}
              title="Tìm người dùng"
            >
              <UserRoundSearch size={16} />
            </button>
          </div>

          {/* ─── BẠN BÈ ─── */}
          {activeTab === "friends" && (
            <>
              <div className="fp-content-header">
                <div className="fp-content-title">Danh sách bạn bè</div>
                <div className="fp-content-sub">{friends.length} bạn bè</div>
                {friends.length > 0 && (
                  <div className="fp-search-wrap">
                    <Search
                      size={14}
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        display: "block",
                        stroke: "#475569",
                        fill: "none",
                      }}
                    />
                    <input
                      className="fp-search-input"
                      placeholder="Tìm trong danh sách bạn bè..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="fp-content-body">
                <div className="fp-content-inner">
                  {loading && friends.length === 0 ? (
                    <div className="fp-loading">
                      <Loader2 size={24} className="fp-spin" color="#6366f1" />
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="fp-empty">
                      <div className="fp-empty-icon">
                        <UserCheck size={32} />
                      </div>
                      <div className="fp-empty-title">
                        {searchQuery
                          ? "Không tìm thấy kết quả"
                          : "Chưa có bạn bè"}
                      </div>
                      <div className="fp-empty-sub">
                        {searchQuery
                          ? `Không có bạn bè nào khớp với "${searchQuery}"`
                          : "Hãy gửi lời mời kết bạn để bắt đầu kết nối!"}
                      </div>
                    </div>
                  ) : (
                    <div className="fp-friends-grid">
                      {filteredFriends.map((friend: Friend, idx: number) => {
                        const name =
                          friend.displayName || friend.username || "Người dùng";
                        return (
                          <div
                            key={friend._id}
                            className="fp-friend-card"
                            style={{ animationDelay: `${idx * 0.04}s` }}
                          >
                            <Avatar
                              name={name}
                              avatarUrl={friend.avatarUrl}
                              size={46}
                            />
                            <div className="fp-friend-info">
                              <div className="fp-friend-name">{name}</div>
                              <div className="fp-friend-username">
                                @{friend.username || name.toLowerCase()}
                              </div>
                              {friend.isOnline && (
                                <div className="fp-friend-online">
                                  <div className="fp-online-dot" />
                                  Đang hoạt động
                                </div>
                              )}
                            </div>
                            <div className="fp-card-actions">
                              <button
                                className="fp-card-btn fp-card-btn-chat"
                                data-tip="Nhắn tin"
                          onClick={async () => {
  try {
    const convo = await chatService.getOrCreateDirectConversation(friend._id);

    navigate("/chat", {
      state: { conversationId: convo._id },
    });
  } catch (err) {
    console.error(err);
  }
}}
                              >
                                <MessageCircle size={15} />
                              </button>
                              <button
                                className="fp-card-btn fp-card-btn-info"
                                data-tip="Xem hồ sơ"
                              >
                                <Info size={15} />
                              </button>
                              <button
                                className="fp-card-btn fp-card-btn-unfriend"
                                data-tip="Hủy kết bạn"
                                disabled={actionId === friend._id}
                                onClick={() => handleUnfriend(friend._id, name)}
                              >
                                {actionId === friend._id ? (
                                  <Loader2 size={15} className="fp-spin" />
                                ) : (
                                  <UserX size={15} />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ─── LỜI MỜI NHẬN ─── */}
          {activeTab === "received" && (
            <>
              <div className="fp-content-header">
                <div className="fp-content-title">Lời mời nhận</div>
                <div className="fp-content-sub">
                  {receivedList.length > 0
                    ? `${receivedList.length} lời mời đang chờ phản hồi`
                    : "Không có lời mời nào"}
                </div>
              </div>
              <div className="fp-content-body">
                <div className="fp-content-inner">
                  {loading && receivedList.length === 0 ? (
                    <div className="fp-loading">
                      <Loader2 size={24} className="fp-spin" color="#6366f1" />
                    </div>
                  ) : receivedList.length === 0 ? (
                    <div className="fp-empty">
                      <div className="fp-empty-icon">
                        <UserPlus size={32} />
                      </div>
                      <div className="fp-empty-title">Không có lời mời nào</div>
                      <div className="fp-empty-sub">
                        Khi có người gửi lời mời kết bạn cho bạn, chúng sẽ xuất
                        hiện ở đây.
                      </div>
                    </div>
                  ) : (
                    <div className="fp-request-list">
                      {receivedList.map((req: FriendRequest, idx: number) => {
                        const from = req.from as any;
                        const name =
                          from?.displayName || from?.username || "Người dùng";
                        const isActing = actionId === req._id;
                        return (
                          <div
                            key={req._id}
                            className="fp-request-card"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                          >
                            <Avatar
                              name={name}
                              avatarUrl={from?.avatarUrl}
                              size={46}
                            />
                            <div className="fp-request-info">
                              <div className="fp-request-name">{name}</div>
                              {req.message ? (
                                <div className="fp-request-msg">
                                  "{req.message}"
                                </div>
                              ) : (
                                <div
                                  className="fp-request-msg"
                                  style={{
                                    fontStyle: "normal",
                                    color: "#475569",
                                  }}
                                >
                                  @{from?.username || name.toLowerCase()}
                                </div>
                              )}
                            </div>
                            <div className="fp-request-actions">
                              <button
                                className="fp-req-btn fp-req-btn-accept"
                                onClick={() => handleAccept(req._id, name)}
                                disabled={isActing}
                              >
                                {isActing ? (
                                  <Loader2 size={13} className="fp-spin" />
                                ) : (
                                  <Check size={13} />
                                )}
                                Chấp nhận
                              </button>
                              <button
                                className="fp-req-btn fp-req-btn-decline"
                                onClick={() => handleDecline(req._id, name)}
                                disabled={isActing}
                              >
                                <X size={13} />
                                Từ chối
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ─── LỜI MỜI GỬI ─── */}
          {activeTab === "sent" && (
            <>
              <div className="fp-content-header">
                <div className="fp-content-title">Lời mời đã gửi</div>
                <div className="fp-content-sub">
                  {sentList.length > 0
                    ? `${sentList.length} lời mời đang chờ phản hồi`
                    : "Chưa gửi lời mời nào"}
                </div>
              </div>
              <div className="fp-content-body">
                <div className="fp-content-inner">
                  {loading && sentList.length === 0 ? (
                    <div className="fp-loading">
                      <Loader2 size={24} className="fp-spin" color="#6366f1" />
                    </div>
                  ) : sentList.length === 0 ? (
                    <div className="fp-empty">
                      <div className="fp-empty-icon">
                        <Clock size={32} />
                      </div>
                      <div className="fp-empty-title">Chưa gửi lời mời nào</div>
                      <div className="fp-empty-sub">
                        Tìm kiếm người dùng và gửi lời mời để kết nối với bạn bè
                        mới.
                      </div>
                    </div>
                  ) : (
                    <div className="fp-request-list">
                      {sentList.map((req: FriendRequest, idx: number) => {
                        const to = req.to as any;
                        const name =
                          to?.displayName || to?.username || "Người dùng";
                        const isActing = actionId === req._id;
                        return (
                          <div
                            key={req._id}
                            className="fp-request-card"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                          >
                            <Avatar
                              name={name}
                              avatarUrl={to?.avatarUrl}
                              size={46}
                            />
                            <div className="fp-request-info">
                              <div className="fp-request-name">{name}</div>
                              <div className="fp-request-pending">
                                <Clock size={11} />
                                Đang chờ phản hồi
                              </div>
                            </div>
                            <div className="fp-request-actions">
                              <button
                                className="fp-req-btn fp-req-btn-cancel"
                                onClick={() => handleCancel(req._id, name)}
                                disabled={isActing}
                              >
                                {isActing ? (
                                  <Loader2 size={13} className="fp-spin" />
                                ) : (
                                  <UserMinus size={13} />
                                )}
                                Huỷ lời mời
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <div className="fp-mobile-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`fp-mobile-tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {(tab.count ?? 0) > 0 && (
              <span className="fp-mobile-badge">
                {(tab.count ?? 0) > 99 ? "99+" : tab.count}
              </span>
            )}
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <SearchUserModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onStartChat={() => navigate("/chat")}
        onRequestSent={() => getAllFriendRequest()}
      />
    </>
  );
}
