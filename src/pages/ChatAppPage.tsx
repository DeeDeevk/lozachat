import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  Check,
  CheckCheck,
  Image,
  Mic,
  MessageSquare,
  Archive,
  Trash2,
  ArrowLeft,
  PanelRightOpen,
  PanelRightClose,
  Bell,
} from "lucide-react";

import { useAuthStore } from "@/stores/useAuthStore";
import SideNav from "../components/SideNav";
import ConversationList from "@/components/ConversationList";
import type { Conversation } from "@/components/ConversationList";

// ── Fake data ──────────────────────────────────────────────────────────────────
const FAKE_CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "Nguyễn Minh Tuấn",
    avatar: "MT",
    avatarColor: "#3b82f6",
    lastMessage: "Oke bro, tối gặp nhé!",
    time: "10:42",
    unread: 3,
    online: true,
    pinned: true,
    messages: [
      {
        id: "m1",
        senderId: "them",
        text: "Bro ơi hôm nay có rảnh không?",
        time: "10:30",
        status: "read",
        type: "text",
      },
      {
        id: "m2",
        senderId: "me",
        text: "Chiều mình bận họp, tối thì ok",
        time: "10:35",
        status: "read",
        type: "text",
      },
      {
        id: "m3",
        senderId: "them",
        text: "Tối đi ăn lẩu không? Team mình kêu hết rồi 🔥",
        time: "10:40",
        status: "read",
        type: "text",
      },
      {
        id: "m4",
        senderId: "me",
        text: "Oke bro, tối gặp nhé!",
        time: "10:42",
        status: "delivered",
        type: "text",
      },
    ],
  },
  {
    id: "2",
    name: "Trần Thị Hương",
    avatar: "TH",
    avatarColor: "#10b981",
    lastMessage: "Bạn đã gửi file design mới chưa?",
    time: "09:15",
    unread: 1,
    online: true,
    messages: [
      {
        id: "m1",
        senderId: "them",
        text: "Hey, design sprint tuần này bắt đầu từ thứ 2 nha",
        time: "09:00",
        status: "read",
        type: "text",
      },
      {
        id: "m2",
        senderId: "me",
        text: "Ok mình sẽ chuẩn bị wireframe trước",
        time: "09:05",
        status: "read",
        type: "text",
      },
      {
        id: "m3",
        senderId: "them",
        text: "Bạn đã gửi file design mới chưa?",
        time: "09:15",
        status: "read",
        type: "text",
      },
    ],
  },
  {
    id: "3",
    name: "Team Loza Dev 🚀",
    avatar: "TL",
    avatarColor: "#8b5cf6",
    lastMessage: "Lê Bảo: Pushed hotfix lên prod rồi!",
    time: "Hôm qua",
    unread: 12,
    online: false,
    messages: [
      {
        id: "m1",
        senderId: "them",
        text: "CI/CD pipeline fail rồi anh ơi 😭",
        time: "Yesterday 18:00",
        status: "read",
        type: "text",
      },
      {
        id: "m2",
        senderId: "me",
        text: "Mình check thử, lỗi ở bước build Docker",
        time: "Yesterday 18:10",
        status: "read",
        type: "text",
      },
      {
        id: "m3",
        senderId: "them2",
        text: "Fix rồi, do thiếu env variable thôi",
        time: "Yesterday 18:30",
        status: "read",
        type: "text",
      },
      {
        id: "m4",
        senderId: "them",
        text: "Lê Bảo: Pushed hotfix lên prod rồi!",
        time: "Yesterday 19:00",
        status: "read",
        type: "text",
      },
    ],
  },
  {
    id: "4",
    name: "Phạm Quốc Huy",
    avatar: "PH",
    avatarColor: "#f59e0b",
    lastMessage: "Tks bro 🙏",
    time: "Hôm qua",
    unread: 0,
    online: false,
    messages: [
      {
        id: "m1",
        senderId: "me",
        text: "Bro review PR của mình được không?",
        time: "Yesterday 14:00",
        status: "read",
        type: "text",
      },
      {
        id: "m2",
        senderId: "them",
        text: "Để tao xem... ok lgtm, merge đi",
        time: "Yesterday 14:30",
        status: "read",
        type: "text",
      },
      {
        id: "m3",
        senderId: "me",
        text: "Cảm ơn bro nhiều!",
        time: "Yesterday 14:32",
        status: "read",
        type: "text",
      },
      {
        id: "m4",
        senderId: "them",
        text: "Tks bro 🙏",
        time: "Yesterday 14:33",
        status: "read",
        type: "text",
      },
    ],
  },
  {
    id: "5",
    name: "Lê Ngọc Anh",
    avatar: "NA",
    avatarColor: "#ef4444",
    lastMessage: "Ảnh: [Hình ảnh]",
    time: "T2",
    unread: 0,
    online: true,
    messages: [
      {
        id: "m1",
        senderId: "them",
        text: "Cuối tuần đi cà phê không?",
        time: "Monday 11:00",
        status: "read",
        type: "text",
      },
      {
        id: "m2",
        senderId: "me",
        text: "Được nha, quán nào?",
        time: "Monday 11:05",
        status: "read",
        type: "text",
      },
      {
        id: "m3",
        senderId: "them",
        text: "[Hình ảnh]",
        time: "Monday 11:10",
        status: "read",
        type: "image",
      },
    ],
  },
  {
    id: "6",
    name: "Võ Thanh Long",
    avatar: "VL",
    avatarColor: "#06b6d4",
    lastMessage: "Meeting lúc 3h chiều nha",
    time: "T2",
    unread: 0,
    online: false,
    messages: [
      {
        id: "m1",
        senderId: "them",
        text: "Meeting lúc 3h chiều nha",
        time: "Monday 09:00",
        status: "read",
        type: "text",
      },
      {
        id: "m2",
        senderId: "me",
        text: "Ok, mình sẽ có mặt",
        time: "Monday 09:01",
        status: "read",
        type: "text",
      },
    ],
  },
];

export default function ChatPage() {
  const navigate = useNavigate();
  const userProfile = useAuthStore((s) => s.userProfile);

  const myId = "me";
  const myName = userProfile?.displayName || "Bạn";

  const [conversations, setConversations] =
    useState<Conversation[]>(FAKE_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [showEmojiHint, setShowEmojiHint] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConv = activeId
    ? (conversations.find((c) => c.id === activeId) ?? null)
    : null;

  // Mobile view logic:
  //   activeId === null  → show SideNav + ConversationList (full screen)
  //   activeId !== null  → show Chat (full screen), SideNav+ConvList hidden
  const mobileShowChat = isMobile && activeId !== null;
  const mobileShowList = isMobile && activeId === null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, conversations]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (window.innerWidth <= 900) setShowRightPanel(false);
      else setShowRightPanel(true);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sendMessage = () => {
    if (!inputText.trim() || !activeId) return;
    const newMsg = {
      id: `m${Date.now()}`,
      senderId: myId,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sent",
      type: "text",
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? ({
              ...c,
              messages: [...c.messages, newMsg],
              lastMessage: newMsg.text,
              time: newMsg.time,
              unread: 0,
            } as Conversation)
          : c,
      ),
    );
    setInputText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const markRead = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    );
  };

  const selectConversation = (id: string) => {
    setActiveId(id);
    markRead(id);
  };

  // Back: set activeId null → mobile returns to SideNav + ConvList
  const handleBack = () => setActiveId(null);

  const emojis = [
    "😂",
    "❤️",
    "👍",
    "😍",
    "🔥",
    "😭",
    "🙏",
    "💯",
    "😊",
    "🤣",
    "😅",
    "👀",
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#060d1f",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,130,186,.25); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,130,186,.45); }

        @keyframes pulse     { 0%,100%{opacity:.6;transform:scale(1);}     50%{opacity:1;transform:scale(1.4);} }
        @keyframes popIn     { from{opacity:0;transform:scale(.9) translateY(4px);} to{opacity:1;transform:scale(1) translateY(0);} }
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:.4;} 30%{transform:translateY(-4px);opacity:1;} }
        @keyframes wdot      { 0%,100%{opacity:.2;transform:scale(1);}     50%{opacity:.6;transform:scale(1.5);} }
        @keyframes wfloat    { 0%,100%{transform:translateY(0);}           50%{transform:translateY(-14px);} }
        @keyframes wfadein   { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
        @keyframes wshine    { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(32px);} to{opacity:1;transform:translateX(0);} }

        .w-fade-1 { animation: wfadein .5s .1s  cubic-bezier(.22,1,.36,1) both; }
        .w-fade-2 { animation: wfadein .5s .25s cubic-bezier(.22,1,.36,1) both; }
        .w-fade-3 { animation: wfadein .5s .4s  cubic-bezier(.22,1,.36,1) both; }
        .w-fade-4 { animation: wfadein .5s .55s cubic-bezier(.22,1,.36,1) both; }
        .w-float  { animation: wfloat 4s ease-in-out infinite; }
        .w-shine {
          background: linear-gradient(90deg,#60a5fa,#ffffff,#a78bfa,#60a5fa);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: wshine 4s linear infinite;
        }

        .msg-bubble-me {
          background: linear-gradient(135deg,#2563eb,#3b82f6);
          color: white; border-radius: 18px 18px 4px 18px;
          padding: 10px 14px; max-width: 68%; font-size: 14px; line-height: 1.55;
          box-shadow: 0 2px 12px rgba(37,99,235,.25);
          animation: popIn .2s cubic-bezier(.22,1,.36,1) both;
        }
        .msg-bubble-them {
          background: rgba(22,32,56,.95); border: 2px solid rgba(255,255,255,.07);
          color: #e2e8f0; border-radius: 18px 18px 18px 4px;
          padding: 10px 14px; max-width: 68%; font-size: 14px; line-height: 1.55;
          animation: popIn .2s cubic-bezier(.22,1,.36,1) both;
        }

        button svg { display: block; stroke: currentColor; fill: none; pointer-events: none; flex-shrink: 0; }

        .icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px; border: none;
          background: transparent; color: #94a3b8; cursor: pointer;
          transition: all .18s; flex-shrink: 0;
        }
        .icon-btn:hover { background: rgba(255,255,255,.07); color: #e2e8f0; }

        .panel-toggle-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px; border: none;
          cursor: pointer; transition: all .18s; flex-shrink: 0;
        }
        .panel-toggle-btn.panel-on  { background: rgba(59,130,246,.2); color: #60a5fa; }
        .panel-toggle-btn.panel-off { background: transparent; color: #94a3b8; }
        .panel-toggle-btn:hover { background: rgba(59,130,246,.15); color: #93c5fd; }

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
        .send-btn.active {
          background: linear-gradient(135deg,#2563eb,#3b82f6); color: white;
          box-shadow: 0 4px 14px rgba(37,99,235,.4);
        }
        .send-btn.active svg { stroke: white; }
        .send-btn.inactive { background: rgba(30,41,59,.6); color: #64748b; cursor: not-allowed; }
        .send-btn.inactive svg { stroke: #64748b; }
        .send-btn.active:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(37,99,235,.5); }

        .emoji-btn { font-size: 20px; cursor: pointer; padding: 4px; border-radius: 8px; transition: transform .15s; }
        .emoji-btn:hover { transform: scale(1.25); }

        .online-dot {
          width: 9px; height: 9px; border-radius: 50%; background: #10b981;
          border: 2px solid #060d1f; animation: pulse 2.5s ease-in-out infinite;
        }

        /* Right info panel */
        .right-panel {
          display: flex; flex-direction: column;
          background: rgba(8,14,28,.97);
          border-left: 2px solid rgba(255,255,255,.05);
          flex-shrink: 0; overflow: hidden;
          transition: width .3s cubic-bezier(.22,1,.36,1), opacity .3s;
        }
        .right-panel.visible { width: 300px; opacity: 1; overflow-y: auto; }
        .right-panel.hidden  { width: 0; opacity: 0; border-left: none; }
        @media (max-width: 1100px) { .right-panel.visible { width: 260px; } }
        @media (max-width: 900px)  {
          .right-panel { width: 0 !important; opacity: 0 !important; border-left: none !important; overflow: hidden !important; }
        }

        /* ──────────────────────────────────────────
           MOBILE LAYOUT  (<768px)
           
           State A — no activeId:
             SideNav  ✓ visible
             ConvList ✓ visible  (takes remaining space)
             Center   ✗ hidden

           State B — has activeId:
             SideNav  ✗ hidden
             ConvList ✗ hidden
             Center   ✓ full-screen with slide-in animation
        ────────────────────────────────────────── */
        @media (max-width: 767px) {
          /* State A: hide center */
          .center-wrap.no-chat { display: none !important; }

          /* State B: hide sidenav + convlist */
          .sidenav-wrap.has-chat  { display: none !important; }
          .convlist-wrap.has-chat { display: none !important; }

          /* Chat slides in from right */
          .center-wrap.has-chat { animation: slideInRight .28s cubic-bezier(.22,1,.36,1) both; }

          /* State A: convlist takes full remaining width (next to SideNav) */
          .convlist-wrap.no-chat {
            flex: 1 !important;
            width: 100% !important;
            min-width: 0 !important;
          }
          /* Also force the inner ConversationList to fill */
          .convlist-wrap.no-chat > * {
            width: 90% !important;
            min-width: 0 !important;
            max-width: 100% !important;
          }
        }

        .profile-section { padding: 16px; border-bottom: 2px solid rgba(255,255,255,.04); }
        .profile-action-btn {
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          background: rgba(20,30,50,.9); border: 2px solid rgba(255,255,255,.07);
          border-radius: 12px; padding: 10px 14px; cursor: pointer;
          color: #94a3b8; font-size: 10px; font-weight: 500;
          transition: all .2s; font-family: inherit;
        }
        .profile-action-btn svg { stroke: currentColor; }
        .profile-action-btn:hover { background: rgba(59,130,246,.15); color: #60a5fa; }

        .danger-btn {
          display: flex; align-items: center; gap: 8px; width: 100%;
          padding: 9px 10px; border-radius: 10px; border: none; background: transparent;
          font-size: 12px; cursor: pointer; font-family: inherit; transition: background .18s;
        }
        .danger-btn svg { stroke: currentColor; flex-shrink: 0; }
        .danger-btn:hover { background: rgba(255,255,255,.05); }
      `}</style>

      {/* ── SideNav ──────────────────────────────────────────────────────── */}
      {/* On mobile: hide when chat is open */}
      <SideNav onNewMessage={() => {}} />

      {/* ── ConversationList ─────────────────────────────────────────────── */}
      {/* On mobile: hide when chat is open; always isOpen=true (no overlay mode) */}
      <div
        className={`convlist-wrap${mobileShowChat ? " has-chat" : ""}${mobileShowList ? " no-chat" : ""}`}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          isOpen={true}
          onSelectConversation={selectConversation}
          onClose={() => {}}
        />
      </div>

      {/* ── CENTER: Chat or Welcome ───────────────────────────────────────── */}
      {/* On mobile: hidden when no activeId (mobileShowList); slide-in when mobileShowChat */}
      <div
        className={`center-wrap${mobileShowList ? " no-chat" : ""}${mobileShowChat ? " has-chat" : ""}`}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          position: "relative",
        }}
      >
        {activeConv ? (
          <>
            {/* ── Chat Header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "rgba(8,14,28,.97)",
                borderBottom: "2px solid rgba(255,255,255,.05)",
                flexShrink: 0,
              }}
            >
              {/* Back arrow — only on mobile */}
              {isMobile && (
                <button
                  className="icon-btn"
                  onClick={handleBack}
                  aria-label="Quay lại danh sách"
                  style={{ marginLeft: -4, flexShrink: 0 }}
                >
                  <ArrowLeft size={20} />
                </button>
              )}

              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    background: activeConv.avatarColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "white",
                    boxShadow: `0 4px 14px ${activeConv.avatarColor}44`,
                  }}
                >
                  {activeConv.avatar}
                </div>
                {activeConv.online && (
                  <div
                    className="online-dot"
                    style={{ position: "absolute", bottom: -1, right: -1 }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>
                  {activeConv.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: activeConv.online ? "#10b981" : "#475569",
                  }}
                >
                  {activeConv.online ? "● Đang hoạt động" : "Offline"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button className="icon-btn" aria-label="Gọi điện">
                  <Phone size={17} />
                </button>
                <button className="icon-btn" aria-label="Video call">
                  <Video size={17} />
                </button>
                <button className="icon-btn" aria-label="Tìm kiếm">
                  <Search size={17} />
                </button>
                <button
                  className={`panel-toggle-btn ${showRightPanel ? "panel-on" : "panel-off"}`}
                  onClick={() => setShowRightPanel((v) => !v)}
                  aria-label="Bật/tắt thông tin"
                >
                  {showRightPanel ? (
                    <PanelRightClose size={17} />
                  ) : (
                    <PanelRightOpen size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                background: "linear-gradient(180deg,#060d1f 0%,#080f1e 100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  margin: "8px 0 16px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(255,255,255,.05)",
                  }}
                />
                <span
                  style={{
                    color: "#475569",
                    fontSize: 11,
                    fontWeight: 500,
                    background: "#060d1f",
                    padding: "0 12px",
                  }}
                >
                  Hôm nay
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(255,255,255,.05)",
                  }}
                />
              </div>

              {activeConv.messages.map((msg, i) => {
                const isMe = msg.senderId === myId;
                const showAvatar =
                  !isMe &&
                  (i === 0 ||
                    activeConv.messages[i - 1]?.senderId !== msg.senderId);
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      alignItems: "flex-end",
                      gap: 8,
                      marginTop:
                        i > 0 &&
                        activeConv.messages[i - 1]?.senderId !== msg.senderId
                          ? 12
                          : 2,
                    }}
                  >
                    {!isMe && (
                      <div style={{ width: 28, flexShrink: 0 }}>
                        {showAvatar && (
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 9,
                              background: activeConv.avatarColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 700,
                              color: "white",
                            }}
                          >
                            {activeConv.avatar}
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start",
                        gap: 2,
                        maxWidth: "70%",
                      }}
                    >
                      <div
                        className={isMe ? "msg-bubble-me" : "msg-bubble-them"}
                      >
                        {msg.text}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "0 4px",
                        }}
                      >
                        <span style={{ color: "#475569", fontSize: 10 }}>
                          {msg.time}
                        </span>
                        {isMe &&
                          (msg.status === "read" ? (
                            <CheckCheck size={12} color="#3b82f6" />
                          ) : msg.status === "delivered" ? (
                            <CheckCheck size={12} color="#64748b" />
                          ) : (
                            <Check size={12} color="#64748b" />
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {activeConv.online && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 9,
                      background: activeConv.avatarColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    {activeConv.avatar}
                  </div>
                  <div
                    className="msg-bubble-them"
                    style={{ padding: "10px 16px", display: "flex", gap: 5 }}
                  >
                    {[0, 0.2, 0.4].map((d, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#60a5fa",
                          animation: `typingDot .8s ${d}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(8,14,28,.97)",
                borderTop: "2px solid rgba(255,255,255,.05)",
                flexShrink: 0,
              }}
            >
              {showEmojiHint && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    padding: "10px 14px",
                    background: "rgba(15,23,42,.95)",
                    border: "2px solid rgba(255,255,255,.07)",
                    borderRadius: 14,
                    marginBottom: 10,
                    animation: "popIn .2s cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  {emojis.map((e) => (
                    <span
                      key={e}
                      className="emoji-btn"
                      onClick={() => {
                        setInputText((t) => t + e);
                        setShowEmojiHint(false);
                        inputRef.current?.focus();
                      }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(15,23,42,.9)",
                  border: "2px solid rgba(255,255,255,.07)",
                  borderRadius: 16,
                  padding: "8px 8px 8px 14px",
                }}
              >
                <button
                  className="icon-btn"
                  style={{ width: 30, height: 30, borderRadius: 8 }}
                  aria-label="Đính kèm"
                >
                  <Paperclip size={16} />
                </button>
                <button
                  className="icon-btn"
                  style={{ width: 30, height: 30, borderRadius: 8 }}
                  aria-label="Hình ảnh"
                >
                  <Image size={16} />
                </button>
                <input
                  ref={inputRef}
                  className="msg-input"
                  placeholder="Nhập tin nhắn..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="icon-btn"
                  style={{ width: 30, height: 30, borderRadius: 8 }}
                  onClick={() => setShowEmojiHint((v) => !v)}
                  aria-label="Emoji"
                >
                  <Smile size={16} />
                </button>
                <button
                  className="icon-btn"
                  style={{ width: 30, height: 30, borderRadius: 8 }}
                  aria-label="Ghi âm"
                >
                  <Mic size={16} />
                </button>
                <button
                  className={`send-btn ${inputText.trim() ? "active" : "inactive"}`}
                  onClick={sendMessage}
                  aria-label="Gửi"
                >
                  <Send size={16} />
                </button>
              </div>
              <p
                style={{
                  textAlign: "center",
                  color: "#334155",
                  fontSize: 10,
                  marginTop: 8,
                }}
              >
                Nhấn Enter để gửi • Shift+Enter để xuống dòng
              </p>
            </div>
          </>
        ) : (
          /* ── WELCOME SCREEN (desktop only; hidden on mobile via .no-chat) ── */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(160deg,#060d1f 0%,#080f1e 60%,#060d1f 100%)",
              position: "relative",
              overflow: "hidden",
              padding: "40px 24px",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(ellipse at 30% 40%,rgba(37,99,235,.1) 0%,transparent 55%), radial-gradient(ellipse at 75% 65%,rgba(99,102,241,.07) 0%,transparent 50%)",
              }}
            />

            {[
              { s: 4, c: "#3b82f6", t: "12%", l: "8%" },
              { s: 3, c: "#818cf8", t: "25%", r: "12%" },
              { s: 5, c: "#2563eb", t: "72%", l: "6%" },
              { s: 3, c: "#60a5fa", t: "85%", r: "8%" },
              { s: 4, c: "#6366f1", t: "45%", r: "3%" },
              { s: 3, c: "#3b82f6", t: "60%", l: "3%" },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  borderRadius: "50%",
                  width: p.s,
                  height: p.s,
                  background: p.c,
                  top: p.t,
                  left: p.l,
                  right: p.r,
                  opacity: 0.4,
                  animation: `wdot 3s ${i * 0.4}s ease-in-out infinite`,
                }}
              />
            ))}

            <div
              className="w-float w-fade-1"
              style={{ marginBottom: 36, position: "relative", zIndex: 2 }}
            >
              <img
                src="/icon.png"
                alt="Welcome"
                style={{
                  width: 440,
                  height: 200,
                  objectFit: "contain",
                  filter: "drop-shadow(0 10px 30px rgba(99,102,241,0.4))",
                }}
              />
            </div>

            <div
              style={{
                textAlign: "center",
                position: "relative",
                zIndex: 2,
                maxWidth: 520,
              }}
            >
              <p
                className="w-fade-2"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#3b82f6",
                  marginBottom: 10,
                }}
              >
                ✦ Chào mừng đến với
              </p>
              <h1
                className="w-fade-2 w-shine"
                style={{
                  fontSize: "3rem",
                  fontWeight: 800,
                  letterSpacing: "-1px",
                  lineHeight: 1.08,
                  marginBottom: 12,
                }}
              >
                Loza
              </h1>
              <h2
                className="w-fade-3"
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  color: "#e2e8f0",
                  marginBottom: 10,
                  lineHeight: 1.4,
                }}
              >
                Chào {myName} 👋, sẵn sàng chưa?
              </h2>
              <p
                className="w-fade-3"
                style={{
                  fontSize: 14,
                  color: "#64748b",
                  lineHeight: 1.8,
                  marginBottom: 28,
                }}
              >
                Kết nối và tận hưởng những cuộc trò chuyện thú vị.
                <br />
                Mỗi tin nhắn là một cầu nối — hãy bắt đầu ngay hôm nay.
              </p>
              <div
                className="w-fade-4"
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: 28,
                }}
              >
                {[
                  { icon: "🔒", text: "Mã hóa đầu cuối" },
                  { icon: "⚡", text: "Siêu nhanh" },
                  { icon: "🌍", text: "Đa nền tảng" },
                ].map((f) => (
                  <div
                    key={f.text}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(15,23,42,.9)",
                      border: "2px solid rgba(255,255,255,.07)",
                      borderRadius: 100,
                      padding: "6px 14px",
                      fontSize: 12,
                      color: "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    <span>{f.icon}</span>
                    {f.text}
                  </div>
                ))}
              </div>
              <div
                className="w-fade-4"
                style={{ display: "flex", gap: 10, justifyContent: "center" }}
              >
                <button
                  onClick={() => {
                    if (conversations.length > 0)
                      selectConversation(conversations[0].id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "linear-gradient(135deg,#2563eb,#3b82f6)",
                    border: "none",
                    borderRadius: 12,
                    padding: "11px 24px",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    boxShadow: "0 4px 18px rgba(37,99,235,.4)",
                    transition: "all .2s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-2px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 8px 24px rgba(37,99,235,.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 4px 18px rgba(37,99,235,.4)";
                  }}
                >
                  <MessageSquare size={15} />
                  Bắt đầu trò chuyện
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Info Panel ────────────────────────────────────────────── */}
      <div
        className={`right-panel ${activeConv && showRightPanel ? "visible" : "hidden"}`}
      >
        {activeConv && showRightPanel && (
          <>
            <div
              className="profile-section"
              style={{ padding: "28px 20px 20px", textAlign: "center" }}
            >
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 22,
                    background: activeConv.avatarColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 800,
                    color: "white",
                    margin: "0 auto",
                    boxShadow: `0 8px 28px ${activeConv.avatarColor}55`,
                  }}
                >
                  {activeConv.avatar}
                </div>
                {activeConv.online && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 17,
                      height: 17,
                      borderRadius: "50%",
                      background: "#10b981",
                      border: "2.5px solid #080e1d",
                    }}
                  />
                )}
              </div>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "white",
                  marginBottom: 4,
                }}
              >
                {activeConv.name}
              </h3>
              <p
                style={{
                  color: activeConv.online ? "#10b981" : "#475569",
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                {activeConv.online ? "● Đang hoạt động" : "Offline"}
              </p>
              <div
                style={{ display: "flex", justifyContent: "center", gap: 10 }}
              >
                {[
                  { icon: <Phone size={16} />, label: "Gọi" },
                  { icon: <Video size={16} />, label: "Video" },
                  { icon: <Search size={16} />, label: "Tìm" },
                ].map((a) => (
                  <button key={a.label} className="profile-action-btn">
                    {a.icon}
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="profile-section">
              <p
                style={{
                  color: "#475569",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 12,
                }}
              >
                Thông tin
              </p>
              {[
                {
                  label: "Tên đăng nhập",
                  value: `@${activeConv.name.split(" ").pop()?.toLowerCase()}`,
                },
                { label: "Tham gia", value: "01/2024" },
                {
                  label: "Tin nhắn chung",
                  value: `${activeConv.messages.length} tin`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span style={{ color: "#64748b", fontSize: 12 }}>
                    {row.label}
                  </span>
                  <span
                    style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 500 }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="profile-section" style={{ borderBottom: "none" }}>
              <p
                style={{
                  color: "#475569",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 12,
                }}
              >
                File & Media
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 6,
                }}
              >
                {[
                  "#3b82f6",
                  "#10b981",
                  "#8b5cf6",
                  "#f59e0b",
                  "#ef4444",
                  "#06b6d4",
                ].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 10,
                      background: `linear-gradient(135deg,${c}33,${c}66)`,
                      border: `2px solid ${c}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "transform .18s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.transform =
                        "scale(1.06)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.transform =
                        "scale(1)")
                    }
                  >
                    <Image size={16} color={c} />
                  </div>
                ))}
              </div>
              <button
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "8px 0",
                  borderRadius: 10,
                  background: "rgba(20,30,50,.9)",
                  border: "2px solid rgba(255,255,255,.07)",
                  color: "#64748b",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all .2s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#60a5fa";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#64748b";
                }}
              >
                Xem tất cả →
              </button>
            </div>

            <div style={{ padding: "8px 16px 16px", marginTop: "auto" }}>
              {[
                {
                  icon: <Bell size={13} />,
                  label: "Tắt thông báo",
                  color: "#94a3b8",
                },
                {
                  icon: <Archive size={13} />,
                  label: "Lưu trữ",
                  color: "#94a3b8",
                },
                {
                  icon: <Trash2 size={13} />,
                  label: "Xóa cuộc trò chuyện",
                  color: "#f87171",
                },
              ].map((item) => (
                <button
                  key={item.label}
                  className="danger-btn"
                  style={{ color: item.color }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
