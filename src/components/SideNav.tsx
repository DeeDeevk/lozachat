import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MessageSquare,
  Users,
  Rss,
  Edit3,
  HelpCircle,
  User,
  LogOut,
} from "lucide-react";
import ProfileModal from "./ProfileModal"
import { useAuthStore } from "@/stores/useAuthStore";

const getInitials = (name: string) =>
  name?.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase() || "U";

const randomColor = (str: string) => {
  const colors = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899"];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

interface SideNavProps {
  onNewMessage?: () => void;
}

export default function SideNav({ onNewMessage }: SideNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAuthStore((s) => s.userProfile);
  const setUserProfile = useAuthStore((s) => s.setUserProfile);

  const myName = userProfile?.displayName || "Bạn";
  const myUsername = userProfile?.username || userProfile?.email?.split("@")[0] || "user";
  const myInitials = getInitials(myName);
  const myColor = randomColor(myName);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile?.avatarUrl ?? null);
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const isChat = location.pathname === "/chat";
  const isFriends = location.pathname === "/friends";
  const isFeed = location.pathname === "/feed";

  const navItems = [
    { icon: <MessageSquare size={22} />, label: "Tin nhắn", path: "/chat", active: isChat },
    { icon: <Users size={22} />, label: "Bạn bè", path: "/friends", active: isFriends },
    { icon: <Rss size={22} />, label: "Mạng xã hội", path: "/feed", active: isFeed },
  ];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowAvatarModal(false);
      }
    };
    if (showAvatarModal) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAvatarModal]);

  return (
    <>
      <style>{`
        .sidenav {
          width: 64px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #040c1a;
          /* no full border-right; use pseudo-element for 90% height separator */
          border-right: none;
          padding: 0;
          position: relative;
          z-index: 30;
        }

        /* Centered vertical separator — 90% height, visually distinct */
        .sidenav::after {
          content: "";
          position: absolute;
          right: 0;
          top: 5%;
          height: 90%;
          width: 2px;
          border-radius: 2px;
          background: rgba(59,130,246,.35);
          pointer-events: none;
        }

        .sidenav-logo {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,.04);
          margin-bottom: 6px;
        }

        .sidenav-logo img {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 12px;
          box-shadow:
            0 0 14px rgba(59,130,246,.55),
            0 0 32px rgba(59,130,246,.22),
            0 4px 16px rgba(0,0,0,.5);
          transition: box-shadow .3s ease;
        }

        .sidenav-logo img:hover {
          box-shadow:
            0 0 20px rgba(59,130,246,.75),
            0 0 48px rgba(59,130,246,.35),
            0 4px 20px rgba(0,0,0,.6);
        }

        .sidenav-items {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 6px 0;
          width: 100%;
        }

        .sidenav-item {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          background: transparent;
          color: #475569;
          transition: all .18s cubic-bezier(.22,1,.36,1);
        }

        .sidenav-item:hover {
          background: rgba(59,130,246,.1);
          color: #93c5fd;
          transform: scale(1.05);
        }

        .sidenav-item.active {
          background: rgba(59,130,246,.18);
          color: #60a5fa;
        }

        .sidenav-item.active::after {
          content: "";
          position: absolute;
          right: -1px;
          top: 28%;
          bottom: 28%;
          width: 3px;
          border-radius: 3px 0 0 3px;
          background: linear-gradient(180deg, #60a5fa, #2563eb);
        }

        .sidenav-item svg {
          display: block;
          stroke: currentColor;
          fill: none;
          flex-shrink: 0;
        }

        .sidenav-tooltip {
          position: absolute;
          left: calc(100% + 14px);
          top: 50%;
          transform: translateY(-50%);
          background: rgba(10,16,32,.97);
          border: 1px solid rgba(255,255,255,.1);
          color: #e2e8f0;
          font-size: 11px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity .15s;
          z-index: 200;
          font-family: 'Segoe UI', system-ui, sans-serif;
          box-shadow: 0 4px 16px rgba(0,0,0,.5);
        }

        .sidenav-item:hover .sidenav-tooltip {
          opacity: 1;
        }

        .sidenav-divider {
          width: 32px;
          height: 1px;
          background: rgba(255,255,255,.06);
          margin: 4px 0;
        }

        .sidenav-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding-bottom: 14px;
          width: 100%;
        }

        .sidenav-avatar-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: white;
          position: relative;
          transition: all .18s;
          flex-shrink: 0;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .sidenav-avatar-btn:hover { transform: scale(1.08); filter: brightness(1.12); }

        .sidenav-online-dot {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid #040c1a;
        }

        @keyframes modalPop {
          from { opacity:0; transform: translateX(-6px) scale(.97); }
          to   { opacity:1; transform: translateX(0) scale(1); }
        }

        .avatar-modal {
          position: absolute;
          bottom: 0;
          left: calc(100% + 14px);
          width: 240px;
          background: #0d1526;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,.7), 0 2px 8px rgba(0,0,0,.4);
          z-index: 300;
          overflow: hidden;
          animation: modalPop .2s cubic-bezier(.22,1,.36,1);
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .avatar-modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(59,130,246,.07);
          border-bottom: 1px solid rgba(255,255,255,.06);
        }

        .avatar-modal-name {
          font-weight: 700;
          font-size: 14px;
          color: white;
          line-height: 1.3;
        }

        .avatar-modal-username {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .avatar-modal-body {
          padding: 8px;
        }

        .avatar-modal-label {
          font-size: 10px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          padding: 6px 8px 4px;
        }

        .avatar-modal-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          transition: background .15s;
          font-family: 'Segoe UI', system-ui, sans-serif;
          text-align: left;
        }

        .avatar-modal-item:hover { background: rgba(255,255,255,.06); }

        .avatar-modal-item.danger { color: #f87171; }
        .avatar-modal-item.danger:hover { background: rgba(239,68,68,.1); }

        .avatar-modal-item svg { stroke: currentColor; fill: none; flex-shrink: 0; }

        .avatar-modal-icon {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .avatar-modal-divider {
          height: 1px;
          background: rgba(255,255,255,.05);
          margin: 4px 8px;
        }

        @media (max-width: 767px) {
          .sidenav { width: 56px; }
          .sidenav-logo { width: 56px; height: 56px; }
          .sidenav-item { width: 44px; height: 44px; }
          .sidenav-tooltip { display: none; }
          .avatar-modal { left: calc(100% + 8px); width: 210px; }
        }
      `}</style>

      <nav className="sidenav">
        <div className="sidenav-logo">
          <img src="/logo.png" alt="Loza" />
        </div>

        <div className="sidenav-items">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`sidenav-item ${item.active ? "active" : ""}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
            >
              {item.icon}
              <span className="sidenav-tooltip">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="sidenav-bottom">
          <div className="sidenav-divider" />

          <button className="sidenav-item" onClick={onNewMessage} aria-label="Soạn tin nhắn mới">
            <Edit3 size={20} />
            <span className="sidenav-tooltip">Soạn tin nhắn</span>
          </button>

          <button className="sidenav-item" aria-label="Trợ giúp">
            <HelpCircle size={20} />
            <span className="sidenav-tooltip">Trợ giúp</span>
          </button>

          <div className="sidenav-divider" />

          {/* Avatar + Modal */}
          <div ref={modalRef} style={{ position: "relative" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <div
                className="sidenav-avatar-btn"
                style={{ background: userProfile?.avatarUrl ? "transparent" : myColor, overflow: "hidden", cursor: "pointer" }}
                aria-label={`Tài khoản: ${myName}`}
                onClick={() => setShowAvatarModal((v) => !v)}
                role="button"
              >
                {userProfile?.avatarUrl
                  ? <img src={userProfile.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : myInitials
                }
              </div>
              <div className="sidenav-online-dot" />
            </div>

            {showAvatarModal && (
              <div className="avatar-modal">
                {/* Header */}
                <div className="avatar-modal-header">
                  <div
                    className="sidenav-avatar-btn"
                    style={{ background: userProfile?.avatarUrl ? "transparent" : myColor, width: 44, height: 44, fontSize: 16, flexShrink: 0, boxShadow: `0 4px 14px ${myColor}55` }}
                  >
                    {userProfile?.avatarUrl
                      ? <img src={userProfile.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "20%" }} />
                      : <span>{myInitials}</span>
                    }
                    <div className="sidenav-online-dot" style={{ width: 12, height: 12 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="avatar-modal-name">{myName}</div>
                    <div className="avatar-modal-username">@{myUsername}</div>
                  </div>
                </div>

                {/* Body */}
                <div className="avatar-modal-body">
                  <div className="avatar-modal-label">Tài khoản của tôi</div>

                  <button className="avatar-modal-item" onClick={() => setOpen(true)}>
                    <div className="avatar-modal-icon" style={{ background: "rgba(59,130,246,.12)" }}>
                      <User size={15} color="#60a5fa" />
                    </div>
                    Thông tin cá nhân
                  </button>

                  {open && (<ProfileModal 
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                    onClose={() => setOpen(false)} 
                    myColor={myColor}
                    myName={myName}
                  />)}

                  <div className="avatar-modal-divider" />

                  <button className="avatar-modal-item danger" onClick={() => navigate("/signin")}>
                    <div className="avatar-modal-icon" style={{ background: "rgba(239,68,68,.1)" }}>
                      <LogOut size={15} color="#f87171" />
                    </div>
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}