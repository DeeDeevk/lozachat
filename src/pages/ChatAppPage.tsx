import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Send, Paperclip, Smile, Phone, Video,
  MoreHorizontal, ChevronDown, Check, CheckCheck,
  Image, Mic, X, Bell, Settings, LogOut, Users,
  MessageSquare, Hash, Star, Archive, Trash2, Edit3,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

// ── Auth store (chỉ lấy userProfile) ──────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  status: "sent" | "delivered" | "read";
  type: "text" | "image" | "file";
}

interface Conversation {
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

// ── Fake data ──────────────────────────────────────────────────────────────────
const FAKE_CONVERSATIONS: Conversation[] = [
  {
    id: "1", name: "Nguyễn Minh Tuấn", avatar: "MT", avatarColor: "#3b82f6",
    lastMessage: "Oke bro, tối gặp nhé!", time: "10:42", unread: 3, online: true, pinned: true,
    messages: [
      { id:"m1", senderId:"them", text:"Bro ơi hôm nay có rảnh không?", time:"10:30", status:"read", type:"text" },
      { id:"m2", senderId:"me",   text:"Chiều mình bận họp, tối thì ok", time:"10:35", status:"read", type:"text" },
      { id:"m3", senderId:"them", text:"Tối đi ăn lẩu không? Team mình kêu hết rồi 🔥", time:"10:40", status:"read", type:"text" },
      { id:"m4", senderId:"me",   text:"Oke bro, tối gặp nhé!", time:"10:42", status:"delivered", type:"text" },
    ],
  },
  {
    id: "2", name: "Trần Thị Hương", avatar: "TH", avatarColor: "#10b981",
    lastMessage: "Bạn đã gửi file design mới chưa?", time: "09:15", unread: 1, online: true,
    messages: [
      { id:"m1", senderId:"them", text:"Hey, design sprint tuần này bắt đầu từ thứ 2 nha", time:"09:00", status:"read", type:"text" },
      { id:"m2", senderId:"me",   text:"Ok mình sẽ chuẩn bị wireframe trước", time:"09:05", status:"read", type:"text" },
      { id:"m3", senderId:"them", text:"Bạn đã gửi file design mới chưa?", time:"09:15", status:"read", type:"text" },
    ],
  },
  {
    id: "3", name: "Team Loza Dev 🚀", avatar: "TL", avatarColor: "#8b5cf6",
    lastMessage: "Lê Bảo: Pushed hotfix lên prod rồi!", time: "Hôm qua", unread: 12, online: false,
    messages: [
      { id:"m1", senderId:"them", text:"CI/CD pipeline fail rồi anh ơi 😭", time:"Yesterday 18:00", status:"read", type:"text" },
      { id:"m2", senderId:"me",   text:"Mình check thử, lỗi ở bước build Docker", time:"Yesterday 18:10", status:"read", type:"text" },
      { id:"m3", senderId:"them2", text:"Fix rồi, do thiếu env variable thôi", time:"Yesterday 18:30", status:"read", type:"text" },
      { id:"m4", senderId:"them",  text:"Lê Bảo: Pushed hotfix lên prod rồi!", time:"Yesterday 19:00", status:"read", type:"text" },
    ],
  },
  {
    id: "4", name: "Phạm Quốc Huy", avatar: "PH", avatarColor: "#f59e0b",
    lastMessage: "Tks bro 🙏", time: "Hôm qua", unread: 0, online: false,
    messages: [
      { id:"m1", senderId:"me",   text:"Bro review PR của mình được không?", time:"Yesterday 14:00", status:"read", type:"text" },
      { id:"m2", senderId:"them", text:"Để tao xem... ok lgtm, merge đi", time:"Yesterday 14:30", status:"read", type:"text" },
      { id:"m3", senderId:"me",   text:"Cảm ơn bro nhiều!", time:"Yesterday 14:32", status:"read", type:"text" },
      { id:"m4", senderId:"them", text:"Tks bro 🙏", time:"Yesterday 14:33", status:"read", type:"text" },
    ],
  },
  {
    id: "5", name: "Lê Ngọc Anh", avatar: "NA", avatarColor: "#ef4444",
    lastMessage: "Ảnh: [Hình ảnh]", time: "T2", unread: 0, online: true,
    messages: [
      { id:"m1", senderId:"them", text:"Cuối tuần đi cà phê không?", time:"Monday 11:00", status:"read", type:"text" },
      { id:"m2", senderId:"me",   text:"Được nha, quán nào?", time:"Monday 11:05", status:"read", type:"text" },
      { id:"m3", senderId:"them", text:"[Hình ảnh]", time:"Monday 11:10", status:"read", type:"image" },
    ],
  },
  {
    id: "6", name: "Võ Thanh Long", avatar: "VL", avatarColor: "#06b6d4",
    lastMessage: "Meeting lúc 3h chiều nha", time: "T2", unread: 0, online: false,
    messages: [
      { id:"m1", senderId:"them", text:"Meeting lúc 3h chiều nha", time:"Monday 09:00", status:"read", type:"text" },
      { id:"m2", senderId:"me",   text:"Ok, mình sẽ có mặt", time:"Monday 09:01", status:"read", type:"text" },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name?.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase() || "U";

const randomColor = (str: string) => {
  const colors = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const navigate = useNavigate();
  const userProfile = useAuthStore(s => s.userProfile);

  const myId = "me";
  const myName = userProfile?.displayName || "Bạn";
  const myInitials = getInitials(myName);
  const myColor = randomColor(myName);

  const [conversations, setConversations] = useState<Conversation[]>(FAKE_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>("1");
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiHint, setShowEmojiHint] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats"|"groups">("chats");
  const [showSidebar, setShowSidebar] = useState(true);   // mobile: ẩn/hiện sidebar
  const [showProfile, setShowProfile] = useState(false);  // mobile: ẩn/hiện panel phải

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeId)!;

  const filteredConvs = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, conversations]);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      senderId: myId,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" }),
      status: "sent",
      type: "text",
    };
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.text, time: newMsg.time, unread: 0 }
        : c
    ));
    setInputText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const markRead = (id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  const selectConversation = (id: string) => {
    setActiveId(id);
    markRead(id);
    // mobile: ẩn sidebar, hiện chat
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const emojis = ["😂","❤️","👍","😍","🔥","😭","🙏","💯","😊","🤣","😅","👀"];

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#060d1f",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,130,186,.25); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,130,186,.45); }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
        @keyframes fadeIn   { from{opacity:0;} to{opacity:1;} }
        @keyframes pulse    { 0%,100%{opacity:.6;transform:scale(1);} 50%{opacity:1;transform:scale(1.4);} }
        @keyframes slideIn  { from{opacity:0;transform:translateX(-10px);} to{opacity:1;transform:translateX(0);} }
        @keyframes popIn    { from{opacity:0;transform:scale(.9) translateY(4px);} to{opacity:1;transform:scale(1) translateY(0);} }
        @keyframes typingDot{ 0%,60%,100%{transform:translateY(0);opacity:.4;} 30%{transform:translateY(-4px);opacity:1;} }
        @keyframes spin     { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }

        .conv-item {
          display: flex; align-items: center; gap: 12; padding: 12px 16px;
          cursor: pointer; border-radius: 14px; transition: all .18s; position: relative;
        }
        .conv-item:hover { background: rgba(59,130,246,.08); }
        .conv-item.active { background: rgba(59,130,246,.14); }
        .conv-item.active::before {
          content: ""; position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg,#3b82f6,#2563eb);
        }

        .msg-bubble-me {
          background: linear-gradient(135deg,#2563eb,#3b82f6);
          color: white; border-radius: 18px 18px 4px 18px;
          padding: 10px 14px; max-width: 68%; font-size: 14px; line-height: 1.55;
          box-shadow: 0 2px 12px rgba(37,99,235,.25);
          animation: popIn .2s cubic-bezier(.22,1,.36,1) both;
        }
        .msg-bubble-them {
          background: rgba(22,32,56,.95);
          border: 1px solid rgba(255,255,255,.07);
          color: #e2e8f0; border-radius: 18px 18px 18px 4px;
          padding: 10px 14px; max-width: 68%; font-size: 14px; line-height: 1.55;
          animation: popIn .2s cubic-bezier(.22,1,.36,1) both;
        }

        .icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px; border: none;
          background: transparent; color: #64748b; cursor: pointer; transition: all .18s;
          flex-shrink: 0;
        }
        .icon-btn:hover { background: rgba(255,255,255,.07); color: #e2e8f0; }

        .search-input {
          background: rgba(15,23,42,.9); border: 1px solid rgba(255,255,255,.07);
          border-radius: 12px; padding: 9px 14px 9px 36px;
          color: white; font-size: 13px; outline: none; width: 100%; transition: all .2s;
        }
        .search-input:focus { border-color: rgba(59,130,246,.4); background: rgba(20,30,50,.9); }
        .search-input::placeholder { color: #475569; }

        .msg-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: white; font-size: 14px; resize: none;
          font-family: 'Segoe UI', system-ui, sans-serif;
          line-height: 1.5; max-height: 120px;
        }
        .msg-input::placeholder { color: #475569; }

        .send-btn {
          width: 40px; height: 40px; border-radius: 12px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all .2s;
        }
        .send-btn.active { background: linear-gradient(135deg,#2563eb,#3b82f6); color: white; box-shadow: 0 4px 14px rgba(37,99,235,.4); }
        .send-btn.inactive { background: rgba(30,41,59,.8); color: #475569; cursor: not-allowed; }
        .send-btn.active:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(37,99,235,.5); }

        .tab-btn {
          flex: 1; padding: 8px 0; border: none; background: transparent;
          color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer;
          border-radius: 10px; transition: all .2s;
        }
        .tab-btn.active { background: rgba(59,130,246,.15); color: #60a5fa; }

        .emoji-btn { font-size: 20px; cursor: pointer; padding: 4px; border-radius: 8px; transition: transform .15s; }
        .emoji-btn:hover { transform: scale(1.25); }

        .user-menu-item {
          display: flex; align-items: center; gap: 10; padding: 10px 14px;
          color: #cbd5e1; font-size: 13px; cursor: pointer; border-radius: 10px;
          transition: background .15s; border: none; background: transparent; width: 100%;
          font-family: inherit;
        }
        .user-menu-item:hover { background: rgba(255,255,255,.07); }
        .user-menu-item.danger { color: #f87171; }
        .user-menu-item.danger:hover { background: rgba(239,68,68,.1); }

        .online-dot {
          width: 9px; height: 9px; border-radius: 50%; background: #10b981;
          border: 2px solid #060d1f;
          animation: pulse 2.5s ease-in-out infinite;
        }

        /* ── Responsive ── */
        .sidebar       { width: 300px; flex-shrink: 0; }
        .profile-panel { width: 260px; flex-shrink: 0; }

        @media (max-width: 1024px) {
          .profile-panel { display: none !important; }
        }
        @media (max-width: 767px) {
          .sidebar { 
            position: fixed; top: 0; left: 0; bottom: 0; z-index: 40;
            width: 100vw !important; max-width: 320px;
            transform: translateX(-100%); transition: transform .28s cubic-bezier(.22,1,.36,1);
            box-shadow: 4px 0 32px rgba(0,0,0,.5);
          }
          .sidebar.open { transform: translateX(0); }
          .back-btn     { display: flex !important; }
          .header-menu-btn { display: flex !important; }
        }
        .back-btn     { display: none; }
        .header-menu-btn { display: none; }

        @media (max-width: 767px) {
          .mobile-overlay { display: block !important; }
        }
      `}</style>

      {/* Mobile overlay backdrop */}
      {!showSidebar ? null : (
        <div
          onClick={() => setShowSidebar(false)}
          style={{
            display: "none",
            position: "fixed", inset: 0, zIndex: 39,
            background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)",
          }}
          className="mobile-overlay"
        />
      )}

      {/* ══════════════════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════════════════ */}
      <div className={`sidebar ${showSidebar ? "open" : ""}`} style={{
        display: "flex", flexDirection: "column",
        background: "rgba(8,14,28,.97)",
        borderRight: "1px solid rgba(255,255,255,.05)",
      }}>

        {/* Top bar */}
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "linear-gradient(135deg,#2563eb,#3b82f6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(37,99,235,.4)",
              }}>
                <MessageSquare size={16} color="white" fill="white"/>
              </div>
              <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.3px" }}>Loza</span>
            </div>

            <div style={{ display: "flex", gap: 2 }}>
              <button className="icon-btn"><Bell size={16}/></button>
              <button className="icon-btn"><Edit3 size={16}/></button>
              {/* Close sidebar button — mobile only */}
              <button className="icon-btn back-btn" style={{ display:"none" }}
                onClick={() => setShowSidebar(false)}>
                <X size={16}/>
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#475569",pointerEvents:"none" }}/>
            <input
              className="search-input"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "10px 12px 6px" }}>
          <button className={`tab-btn ${activeTab === "chats" ? "active" : ""}`}
            onClick={() => setActiveTab("chats")}>
            Tin nhắn
          </button>
          <button className={`tab-btn ${activeTab === "groups" ? "active" : ""}`}
            onClick={() => setActiveTab("groups")}>
            Nhóm
          </button>
        </div>

        {/* Pinned label */}
        {filteredConvs.some(c => c.pinned) && (
          <div style={{ padding: "8px 16px 4px", display: "flex", alignItems: "center", gap: 6 }}>
            <Star size={10} color="#64748b"/>
            <span style={{ color: "#475569", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Đã ghim
            </span>
          </div>
        )}

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {filteredConvs.map(conv => (
            <div
              key={conv.id}
              className={`conv-item ${conv.id === activeId ? "active" : ""}`}
              style={{ gap: 12 }}
              onClick={() => selectConversation(conv.id)}
            >
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: conv.avatarColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "white",
                  boxShadow: conv.id === activeId ? `0 4px 12px ${conv.avatarColor}55` : "none",
                }}>
                  {conv.avatar}
                </div>
                {conv.online && (
                  <div className="online-dot" style={{ position: "absolute", bottom: -1, right: -1 }}/>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{
                    fontWeight: conv.unread > 0 ? 700 : 500,
                    fontSize: 14, color: conv.unread > 0 ? "white" : "#cbd5e1",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {conv.name}
                  </span>
                  <span style={{ color: "#475569", fontSize: 11, flexShrink: 0, marginLeft: 4 }}>{conv.time}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    color: conv.unread > 0 ? "#94a3b8" : "#475569",
                    fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    flex: 1,
                  }}>
                    {conv.lastMessage}
                  </span>
                  {conv.unread > 0 && (
                    <div style={{
                      minWidth: 18, height: 18, borderRadius: 9,
                      background: "linear-gradient(135deg,#2563eb,#3b82f6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: "white",
                      padding: "0 5px", marginLeft: 6, flexShrink: 0,
                    }}>
                      {conv.unread > 9 ? "9+" : conv.unread}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredConvs.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#475569" }}>
              <Search size={28} style={{ marginBottom: 8, opacity: .4 }}/>
              <p style={{ fontSize: 13 }}>Không tìm thấy cuộc trò chuyện</p>
            </div>
          )}
        </div>

        {/* ── User profile bottom ── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", padding: "12px 12px" }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                borderRadius: 12, cursor: "pointer", transition: "background .18s",
                background: showUserMenu ? "rgba(59,130,246,.1)" : "transparent",
              }}
              onClick={() => setShowUserMenu(v => !v)}
              onMouseEnter={e => { if (!showUserMenu) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,.05)"; }}
              onMouseLeave={e => { if (!showUserMenu) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11,
                  background: myColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "white",
                }}>
                  {myInitials}
                </div>
                <div className="online-dot" style={{ position: "absolute", bottom: -1, right: -1 }}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {myName}
                </div>
                <div style={{ fontSize: 11, color: "#10b981" }}>● Đang hoạt động</div>
              </div>
              <ChevronDown size={14} color="#64748b" style={{ transform: showUserMenu ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}/>
            </div>

            {/* User dropdown */}
            {showUserMenu && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0,
                background: "rgba(10,16,32,.98)", border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 14, padding: 6, zIndex: 50,
                boxShadow: "0 -16px 48px rgba(0,0,0,.6)",
                animation: "popIn .2s cubic-bezier(.22,1,.36,1)",
              }}>
                <button className="user-menu-item"><Settings size={14}/> Cài đặt</button>
                <button className="user-menu-item"><Archive size={14}/> Tin nhắn đã lưu</button>
                <div style={{ height: 1, background: "rgba(255,255,255,.06)", margin: "4px 6px" }}/>
                <button className="user-menu-item danger" onClick={() => navigate("/signin")}>
                  <LogOut size={14}/> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MAIN CHAT AREA
      ══════════════════════════════════════════ */}
      {activeConv ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>

          {/* Chat header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 20px",
            background: "rgba(8,14,28,.97)",
            borderBottom: "1px solid rgba(255,255,255,.05)",
            flexShrink: 0,
          }}>
            {/* Back button (mobile only) */}
            <button className="back-btn icon-btn" onClick={() => setShowSidebar(true)} style={{ marginLeft: -4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            {/* Avatar + name */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13,
                background: activeConv.avatarColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "white",
                boxShadow: `0 4px 14px ${activeConv.avatarColor}44`,
              }}>
                {activeConv.avatar}
              </div>
              {activeConv.online && (
                <div className="online-dot" style={{ position: "absolute", bottom: -1, right: -1 }}/>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>{activeConv.name}</div>
              <div style={{ fontSize: 12, color: activeConv.online ? "#10b981" : "#475569" }}>
                {activeConv.online ? "● Đang hoạt động" : "Offline"}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 4 }}>
              <button className="icon-btn"><Phone size={17}/></button>
              <button className="icon-btn"><Video size={17}/></button>
              <button className="icon-btn"><Search size={17}/></button>
              <button className="icon-btn"><MoreHorizontal size={17}/></button>
            </div>
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "24px 20px",
            display: "flex", flexDirection: "column", gap: 6,
            background: "linear-gradient(180deg, #060d1f 0%, #080f1e 100%)",
          }}>
            {/* Date separator */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 16px" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.05)" }}/>
              <span style={{ color: "#475569", fontSize: 11, fontWeight: 500, background: "#060d1f", padding: "0 12px" }}>
                Hôm nay
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.05)" }}/>
            </div>

            {activeConv.messages.map((msg, i) => {
              const isMe = msg.senderId === myId;
              const showAvatar = !isMe && (i === 0 || activeConv.messages[i-1]?.senderId !== msg.senderId);
              return (
                <div key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: isMe ? "flex-end" : "flex-start",
                    alignItems: "flex-end", gap: 8,
                    marginTop: (i > 0 && activeConv.messages[i-1]?.senderId !== msg.senderId) ? 12 : 2,
                  }}
                >
                  {/* Their avatar */}
                  {!isMe && (
                    <div style={{ width: 28, flexShrink: 0 }}>
                      {showAvatar && (
                        <div style={{
                          width: 28, height: 28, borderRadius: 9,
                          background: activeConv.avatarColor,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: "white",
                        }}>
                          {activeConv.avatar}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 2, maxWidth: "70%" }}>
                    <div className={isMe ? "msg-bubble-me" : "msg-bubble-them"}>
                      {msg.text}
                    </div>
                    {/* Time + status */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 4px" }}>
                      <span style={{ color: "#475569", fontSize: 10 }}>{msg.time}</span>
                      {isMe && (
                        msg.status === "read"      ? <CheckCheck size={12} color="#3b82f6"/> :
                        msg.status === "delivered" ? <CheckCheck size={12} color="#64748b"/> :
                        <Check size={12} color="#64748b"/>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {activeConv.online && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9, background: activeConv.avatarColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "white", flexShrink: 0,
                }}>
                  {activeConv.avatar}
                </div>
                <div className="msg-bubble-them" style={{ padding: "10px 16px", display: "flex", gap: 5 }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%", background: "#60a5fa",
                      animation: `typingDot .8s ${d}s ease-in-out infinite`,
                    }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input area */}
          <div style={{
            padding: "12px 16px",
            background: "rgba(8,14,28,.97)",
            borderTop: "1px solid rgba(255,255,255,.05)",
            flexShrink: 0,
          }}>
            {/* Emoji picker */}
            {showEmojiHint && (
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 4, padding: "10px 14px",
                background: "rgba(15,23,42,.95)", border: "1px solid rgba(255,255,255,.07)",
                borderRadius: 14, marginBottom: 10,
                animation: "popIn .2s cubic-bezier(.22,1,.36,1)",
              }}>
                {emojis.map(e => (
                  <span key={e} className="emoji-btn"
                    onClick={() => { setInputText(t => t + e); setShowEmojiHint(false); inputRef.current?.focus(); }}>
                    {e}
                  </span>
                ))}
              </div>
            )}

            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(15,23,42,.9)",
              border: "1px solid rgba(255,255,255,.07)",
              borderRadius: 16, padding: "8px 8px 8px 14px",
              transition: "border-color .2s",
            }}>
              <button className="icon-btn" style={{ width:30, height:30, borderRadius:8 }}>
                <Paperclip size={16}/>
              </button>
              <button className="icon-btn" style={{ width:30, height:30, borderRadius:8 }}>
                <Image size={16}/>
              </button>

              <input
                ref={inputRef}
                className="msg-input"
                placeholder="Nhập tin nhắn..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <button className="icon-btn" style={{ width:30, height:30, borderRadius:8 }}
                onClick={() => setShowEmojiHint(v => !v)}>
                <Smile size={16}/>
              </button>
              <button className="icon-btn" style={{ width:30, height:30, borderRadius:8 }}>
                <Mic size={16}/>
              </button>

              <button
                className={`send-btn ${inputText.trim() ? "active" : "inactive"}`}
                onClick={sendMessage}
                disabled={!inputText.trim()}
              >
                <Send size={16}/>
              </button>
            </div>

            <p style={{ textAlign: "center", color: "#334155", fontSize: 10, marginTop: 8 }}>
              Nhấn Enter để gửi • Shift+Enter để xuống dòng
            </p>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "linear-gradient(180deg,#060d1f,#080f1e)",
          color: "#475569",
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, marginBottom: 20,
            background: "rgba(37,99,235,.1)", border: "1px solid rgba(59,130,246,.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MessageSquare size={36} color="#3b82f6" strokeWidth={1.5}/>
          </div>
          <h3 style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
            Chọn cuộc trò chuyện
          </h3>
          <p style={{ fontSize: 13, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
            Chọn một cuộc trò chuyện bên trái hoặc bắt đầu chat mới
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════
          RIGHT: PROFILE PANEL
      ══════════════════════════════════════════ */}
      <div className="profile-panel" style={{
        display: "flex", flexDirection: "column",
        background: "rgba(8,14,28,.97)",
        borderLeft: "1px solid rgba(255,255,255,.05)",
        overflowY: "auto",
      }}>
        {activeConv && (
          <>
            {/* Profile header */}
            <div style={{
              padding: "28px 20px 20px", textAlign: "center",
              borderBottom: "1px solid rgba(255,255,255,.04)",
            }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: 14 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: 20,
                  background: activeConv.avatarColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 800, color: "white",
                  boxShadow: `0 8px 24px ${activeConv.avatarColor}55`,
                  margin: "0 auto",
                }}>
                  {activeConv.avatar}
                </div>
                {activeConv.online && (
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 16, height: 16, borderRadius: "50%", background: "#10b981",
                    border: "2.5px solid #080e1d",
                  }}/>
                )}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: "white", marginBottom: 4 }}>
                {activeConv.name}
              </h3>
              <p style={{ color: activeConv.online ? "#10b981" : "#475569", fontSize: 12 }}>
                {activeConv.online ? "● Đang hoạt động" : "Offline"}
              </p>

              {/* Quick actions */}
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16 }}>
                {[
                  { icon: <Phone size={16}/>, label: "Gọi" },
                  { icon: <Video size={16}/>, label: "Video" },
                  { icon: <Search size={16}/>, label: "Tìm" },
                ].map(a => (
                  <button key={a.label} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                    background: "rgba(20,30,50,.9)", border: "1px solid rgba(255,255,255,.07)",
                    borderRadius: 12, padding: "10px 14px", cursor: "pointer",
                    color: "#94a3b8", fontSize: 10, fontWeight: 500,
                    transition: "all .2s",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,.15)"; (e.currentTarget as HTMLButtonElement).style.color = "#60a5fa"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(20,30,50,.9)"; (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}>
                    {a.icon}
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info section */}
            <div style={{ padding: "16px 16px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
              <p style={{ color: "#475569", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                Thông tin
              </p>
              {[
                { label: "Tên đăng nhập", value: `@${activeConv.name.split(" ").pop()?.toLowerCase()}` },
                { label: "Tham gia", value: "01/2024" },
                { label: "Tin nhắn chung", value: `${activeConv.messages.length} tin` },
              ].map(row => (
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", marginBottom: 10 }}>
                  <span style={{ color:"#64748b", fontSize:12 }}>{row.label}</span>
                  <span style={{ color:"#cbd5e1", fontSize:12, fontWeight:500 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Shared media */}
            <div style={{ padding: "16px 16px" }}>
              <p style={{ color:"#475569", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>
                File & Media
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                {["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4"].map((c,i) => (
                  <div key={i} style={{
                    aspectRatio:"1",borderRadius:10,
                    background:`linear-gradient(135deg,${c}33,${c}66)`,
                    border:`1px solid ${c}30`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    cursor:"pointer",transition:"transform .18s",
                  }}
                    onMouseEnter={e=>((e.currentTarget as HTMLDivElement).style.transform="scale(1.06)")}
                    onMouseLeave={e=>((e.currentTarget as HTMLDivElement).style.transform="scale(1)")}>
                    <Image size={16} color={c}/>
                  </div>
                ))}
              </div>
              <button style={{
                width:"100%",marginTop:12,padding:"8px 0",borderRadius:10,
                background:"rgba(20,30,50,.9)",border:"1px solid rgba(255,255,255,.07)",
                color:"#64748b",fontSize:12,cursor:"pointer",transition:"all .2s",
              }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#60a5fa";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="#64748b";}}>
                Xem tất cả →
              </button>
            </div>

            {/* Danger zone */}
            <div style={{ padding: "4px 16px 16px", marginTop:"auto" }}>
              {[
                { icon:<Bell size={13}/>, label:"Tắt thông báo", color:"#94a3b8" },
                { icon:<Archive size={13}/>, label:"Lưu trữ", color:"#94a3b8" },
                { icon:<Trash2 size={13}/>, label:"Xóa cuộc trò chuyện", color:"#f87171" },
              ].map(item => (
                <button key={item.label} style={{
                  display:"flex",alignItems:"center",gap:8,width:"100%",
                  padding:"9px 10px",borderRadius:10,border:"none",background:"transparent",
                  color:item.color,fontSize:12,cursor:"pointer",
                  fontFamily:"inherit",transition:"background .18s",
                }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,.05)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}