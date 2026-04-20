import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import SideNav from "@/components/SideNav";
import ConversationList from "@/components/ConversationList";
import ConversationInfoPanel from "@/components/ConversationInfoPanel";
import GroupConversationInfoPanel from "@/components/GroupConversationInfoPanel";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import {
  CHAT_THEME_OPTIONS,
  getChatThemeById,
  useChatThemeStore,
} from "@/stores/useChatThemeStore";
import { useSocketStore } from "@/stores/useSocketStore";
import toast from "react-hot-toast";
import type {
  ChatStructuredPayload,
  Conversation,
  Message,
  PollOption,
  PollVote,
} from "@/types/chat";
import {
  decodeChatPayload,
  encodeChatPayload,
  getSafeMessagePreview,
} from "@/utils/chatMessageCodec";
import {
  BarChart3,
  Ellipsis,
  FileUp,
  ImagePlus,
  Mic,
  Pencil,
  Phone,
  PanelRight,
  PanelRightClose,
  Reply,
  RotateCcw,
  Search,
  Send,
  Smile,
  Sticker,
  Trash2,
  User as UserIcon,
  UserPlus,
  Palette,
  Video,
  X,
  Key,
} from "lucide-react";
import { chatService } from "@/services/chatService";
import AddMemberModal from "@/components/AddMemberModal";

type PopupType = "emoji" | "media" | "sticker" | "audio" | "poll" | null;

interface ContextMenu {
  x: number;
  y: number;
  message: Message;
}

interface PollAggregate {
  question: string;
  options: PollOption[];
  createdBy: string;
  votes: Array<PollVote & { createdAt: string }>;
  latestActivityAt: string;
}

interface EmojiSelectEvent {
  native?: string;
}

interface ConversationListItem {
  _id: string;
  group?: { name: string };
  participants: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  }[];
  lastMessage?: { content: string; createdAt: string };
  unread?: number;
  pinned?: boolean;
  isStranger: boolean;
  strangerStatus: string;
}

type CallKind = "voice" | "video";
type CallStatus = "idle" | "outgoing" | "incoming" | "connecting" | "in-call";

const CHAT_STICKER_LIST = [
  "https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1414779/LINEStorePC/main.png;compress=true?__=20161019",
  "https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1414816/LINEStorePC/main.png;compress=true?__=20161019",
  "https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1414814/IOS/main_animation.png?__=20161019",
  "https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1414808/LINEStorePC/main.png;compress=true?__=20161019",
  "https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1414804/LINEStorePC/main.png;compress=true?__=20161019",
  "https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1414799/IOS/main_animation.png?__=20161019",
];

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// --- STYLES ---
const popupBoxStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 62,
  left: 0,
  zIndex: 30,
  width: 300,
  maxHeight: 380,
  overflow: "auto",
  background: "linear-gradient(160deg, #0c1a38 0%, #131f40 100%)",
  border: "0.5px solid rgba(148,163,184,.22)",
  borderRadius: 16,
  boxShadow: "0 16px 40px rgba(0,0,0,.5)",
  padding: 14,
};

const actionIconStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#94a3b8",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  borderRadius: 10,
  transition: "color .15s, background .15s",
};

const actionDotsStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#94a3b8",
  cursor: "pointer",
  width: 28,
  height: 28,
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background .15s",
};

const contextMenuItemStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "transparent",
  color: "#e2e8f0",
  padding: "9px 12px",
  borderRadius: 10,
  textAlign: "left",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 9,
  fontSize: 13,
  transition: "background .12s",
};

const popupActionStyle: React.CSSProperties = {
  width: "100%",
  border: "0.5px solid rgba(148,163,184,.22)",
  background: "rgba(255,255,255,.05)",
  color: "#e2e8f0",
  borderRadius: 12,
  padding: "11px 14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
  transition: "background .15s",
};

const pollInputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  border: "0.5px solid rgba(148,163,184,.22)",
  background: "rgba(255,255,255,.05)",
  color: "#f1f5f9",
  borderRadius: 11,
  padding: "9px 12px",
  outline: "none",
  fontSize: 14,
};

const miniButtonStyle: React.CSSProperties = {
  border: "0.5px solid rgba(148,163,184,.25)",
  background: "transparent",
  color: "#94a3b8",
  borderRadius: 11,
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: 13,
  transition: "all .15s",
};

const miniButtonPrimaryStyle: React.CSSProperties = {
  ...miniButtonStyle,
  border: "none",
  background: "#2563eb",
  color: "white",
};

// --- HELPERS ---
function createPollId() {
  return `poll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getSenderName(
  message: Message,
  myId: string | undefined,
  participants: Array<{ _id: string; displayName: string }> = [],
) {
  if (message.senderId === myId) return "Bạn";
  return (
    participants.find((p) => p._id === message.senderId)?.displayName ||
    "Người dùng"
  );
}

function formatMessageDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCallDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// --- GROUP SEEN AVATARS ---
interface GroupSeenAvatarsProps {
  seenParticipants: Array<{
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  }>;
}

function GroupSeenAvatars({ seenParticipants }: GroupSeenAvatarsProps) {
  if (seenParticipants.length === 0) return null;
  const MAX_SHOW = 4;
  const shown = seenParticipants.slice(0, MAX_SHOW);
  const overflow = seenParticipants.length - MAX_SHOW;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: 4,
        marginTop: 2,
        gap: 0,
      }}
    >
      {shown.map((p, i) => (
        <div
          key={p._id}
          title={p.displayName}
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "1.5px solid #0f172a",
            marginLeft: i === 0 ? 0 : -5,
            overflow: "hidden",
            background: "#334155",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {p.avatarUrl ? (
            <img
              src={p.avatarUrl}
              alt={p.displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 8, color: "#cbd5e1", fontWeight: 700 }}>
              {p.displayName?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{
            marginLeft: -5,
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "1.5px solid #0f172a",
            background: "#475569",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 7, color: "#f1f5f9", fontWeight: 700 }}>
            {overflow}+
          </span>
        </div>
      )}
    </div>
  );
}

// --- SENDER AVATAR (for group chat) ---
interface SenderAvatarProps {
  participant:
    | {
        _id: string;
        displayName: string;
        avatarUrl?: string | null;
        role?: "owner" | "admin" | "member";
      }
    | undefined;
}

function SenderAvatar({ participant }: SenderAvatarProps) {
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
  const name = participant?.displayName || "?";
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];

  return (
    <div
      title={name}
      style={{
        position: "relative",
        width: 28,
        height: 28,
        borderRadius: "50%",
        flexShrink: 0,
        overflow: "visible",
        background: participant?.avatarUrl ? undefined : color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: 11,
        fontWeight: 700,
        alignSelf: "flex-end",
        marginBottom: 2,
      }}
    >
      {participant?.avatarUrl ? (
        <img
          src={participant.avatarUrl}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
          }}
        />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
      {participant?.role === "owner" && (
        <div
          style={{
            position: "absolute",
            bottom: -4,
            right: -4,
            backgroundColor: "#0f172a",
            borderRadius: "50%",
            width: 10,
            height: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 0.5px #0f172a",
            zIndex: 2,
          }}
        >
          <Key size={12} color="#eab308" strokeWidth={3} />
        </div>
      )}

      {participant?.role === "admin" && (
        <div
          style={{
            position: "absolute",
            bottom: -4,
            right: -4,
            backgroundColor: "#0f172a",
            borderRadius: "50%",
            width: 10,
            height: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 0.5px #0f172a",
            zIndex: 2,
          }}
        >
          <Key size={13} color="#f1f5f9" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const {
    conversations,
    fetchConversations,
    fetchMessages,
    messages,
    activeConversationId,
    setActiveConversation,
    updateConversation,
    sendDirectMessage,
    sendGroupMessage,
    recallMessage,
    deleteMessageForMe,
    uploadAttachment,
    typingUsersByConv,
    updateStrangerStatus,
    forwardMessage,
    editMessage,
    addMemberToGroup,
    reviewJoinRequest,
    joinRequests,
    fetchJoinRequests,
  } = useChatStore();

  const socketStore = useSocketStore();

  const [input, setInput] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user, userProfile } = useAuthStore();
  const { socket } = useSocketStore();
  const [sending, setSending] = useState(false);
  const [activePopup, setActivePopup] = useState<PopupType>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [voteViewer, setVoteViewer] = useState<{
    x: number;
    y: number;
    optionLabel: string;
    users: Array<{ id: string; name: string; avatarUrl?: string }>;
    totalVotes: number;
  } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const [expandedMessageKey, setExpandedMessageKey] = useState<string | null>(
    null,
  );
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(
    null,
  );
  const [forwardSearch, setForwardSearch] = useState("");
  const [selectedConvs, setSelectedConvs] = useState<string[]>([]);
  // Edit message
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editInput, setEditInput] = useState("");
  // Info panel
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callKind, setCallKind] = useState<CallKind | null>(null);
  const [callConversationId, setCallConversationId] = useState<string | null>(
    null,
  );
  const [incomingCallerName, setIncomingCallerName] = useState<string>("");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callConnectedAt, setCallConnectedAt] = useState<number | null>(null);
  const [callElapsedSeconds, setCallElapsedSeconds] = useState(0);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(
    null,
  );
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const selectedByConversation = useChatThemeStore(
    (state) => state.selectedByConversation,
  );
  const setThemeForConversation = useChatThemeStore(
    (state) => state.setThemeForConversation,
  );

  // ─── Fetch conversations on mount ───────────────────────────────────────────
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId || !socket) return;

    const joinRoom = () => {
      socket.emit("join-conversation", {
        conversationId: activeConversationId,
      });
    };

    if (socket.connected) {
      joinRoom();
      return;
    }

    socket.once("connect", joinRoom);

    return () => {
      socket.off("connect", joinRoom);
    };
  }, [activeConversationId, socket]);

  useEffect(() => {
    setExpandedMessageKey(null);
  }, [activeConversationId]);

  useEffect(() => {
    setImagePreviewUrl(null);
  }, [activeConversationId]);

  useEffect(() => {
    setShowThemePicker(false);
  }, [activeConversationId]);

  useEffect(() => {
    socketStore.connectSocket();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversationId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
        setContextMenu(null);
      }
      if (popupRef.current && !popupRef.current.contains(target)) {
        setActivePopup(null);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setShowThemePicker(false);
      }
      setVoteViewer(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current)
        window.clearInterval(recordingTimerRef.current);
      recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (callStatus !== "in-call" || !callConnectedAt) {
      setCallElapsedSeconds(0);
      return;
    }

    const tick = () => {
      setCallElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - callConnectedAt) / 1000)),
      );
    };

    tick();
    const timerId = window.setInterval(tick, 1000);
    return () => window.clearInterval(timerId);
  }, [callConnectedAt, callStatus]);

  useEffect(() => {
    if (!activeConversationId || !socket) return;
    const items = messages[activeConversationId]?.items ?? [];
    if (items.length === 0) return;
    const lastMsg = items.at(-1);
    if (!lastMsg || lastMsg.senderId === user?.userId) return;
    socket.emit("mark-read", {
      conversationId: activeConversationId,
      messageId: lastMsg._id,
    });
  }, [activeConversationId, messages, socket, user?.userId]);

  // ─── Memos ───────────────────────────────────────────────────────────────────
  const activeConversation = useMemo(
    () => conversations.find((c) => c._id === activeConversationId),
    [conversations, activeConversationId],
  );

  const isAdminOrOwner = useMemo(() => {
    if (!activeConversation?.group) return false;
    const me = activeConversation.participants.find(
      (p) => p._id === user?.userId,
    );
    return me?.role === "owner" || me?.role === "admin";
  }, [activeConversation, user?.userId]);
  useEffect(() => {
    if (isAdminOrOwner && activeConversationId) {
      fetchJoinRequests(activeConversationId);
    }
  }, [activeConversationId, isAdminOrOwner]);

  const otherUser = useMemo(
    () => activeConversation?.participants.find((p) => p._id !== user?.userId),
    [activeConversation, user?.userId],
  );

  const otherAvatar = otherUser?.avatarUrl || "/miku.png";

  const activeChatTheme = useMemo(
    () =>
      getChatThemeById(
        activeConversationId
          ? selectedByConversation[activeConversationId]
          : undefined,
      ),
    [activeConversationId, selectedByConversation],
  );

  const chatAreaStyle = useMemo<React.CSSProperties>(() => {
    const base: React.CSSProperties = {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      color: "white",
    };

    if (
      activeChatTheme.mode === "image" &&
      activeChatTheme.appBackgroundImage
    ) {
      base.background = `linear-gradient(180deg, rgba(2,6,23,.62) 0%, rgba(2,6,23,.82) 100%), url(${activeChatTheme.appBackgroundImage}) center/cover no-repeat`;
      return base;
    }

    base.background = activeChatTheme.appBackground;
    return base;
  }, [activeChatTheme]);

  const messagesAreaStyle = useMemo<React.CSSProperties>(
    () => ({
      flex: 1,
      padding: 16,
      overflowY: "auto",
      background: activeChatTheme.messageAreaOverlay || "transparent",
    }),
    [activeChatTheme.messageAreaOverlay],
  );

  const cleanupCall = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.onicecandidate = null;
      peerRef.current.ontrack = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    pendingOfferRef.current = null;
    setRemoteStream(null);
    setLocalStreamState(null);
    setCallStatus("idle");
    setCallKind(null);
    setCallConversationId(null);
    setIncomingCallerName("");
    setIsMicMuted(false);
    setIsCameraOff(false);
    setCallConnectedAt(null);
    setCallElapsedSeconds(0);
  }, []);

  const ensureLocalStream = useCallback(async (kind: CallKind) => {
    const existing = localStreamRef.current;
    if (existing) {
      if (kind === "video" && existing.getVideoTracks().length === 0) {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          videoStream
            .getVideoTracks()
            .forEach((track) => existing.addTrack(track));
          setLocalStreamState(existing);
        } catch (error) {
          console.warn("Unable to add video track to existing stream", error);
        }
      }
      return existing;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: kind === "video",
      });
    } catch (error) {
      if (kind !== "video") throw error;
      console.warn(
        "Falling back to audio-only call because video device is unavailable",
        error,
      );
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      setCallKind("voice");
      toast.error("Không thể mở camera, đã chuyển sang gọi thoại");
    }
    localStreamRef.current = stream;
    setLocalStreamState(stream);
    return stream;
  }, []);

  const createPeer = useCallback(
    (conversationId: string) => {
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

      const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      peer.onicecandidate = (event) => {
        if (!event.candidate || !socket) return;
        socket.emit("call:ice-candidate", {
          conversationId,
          candidate: event.candidate,
        });
      };

      peer.ontrack = (event) => {
        if (event.streams?.[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      peerRef.current = peer;
      return peer;
    },
    [socket],
  );

  const startCall = useCallback(
    async (kind: CallKind) => {
      if (!activeConversation || activeConversation.group) {
        toast.error("Hiện chỉ hỗ trợ gọi 1-1");
        return;
      }
      if (!activeConversationId || !socket) {
        toast.error("Không thể bắt đầu cuộc gọi lúc này");
        return;
      }

      try {
        cleanupCall();
        setCallConversationId(activeConversationId);
        setCallKind(kind);
        setCallStatus("outgoing");

        const stream = await ensureLocalStream(kind);
        const peer = createPeer(activeConversationId);

        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });

        const offer = await peer.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: kind === "video",
        });
        await peer.setLocalDescription(offer);

        socket.emit("call:initiate", {
          conversationId: activeConversationId,
          kind,
          offer,
        });
      } catch (error) {
        console.error("startCall error", error);
        toast.error("Không thể bắt đầu cuộc gọi");
        cleanupCall();
      }
    },
    [
      activeConversation,
      activeConversationId,
      cleanupCall,
      createPeer,
      ensureLocalStream,
      socket,
    ],
  );

  const acceptIncomingCall = useCallback(async () => {
    if (!callConversationId || !callKind || !pendingOfferRef.current || !socket)
      return;
    try {
      setCallStatus("connecting");
      const stream = await ensureLocalStream(callKind);
      const peer = createPeer(callConversationId);

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      await peer.setRemoteDescription(pendingOfferRef.current);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("call:accept", { conversationId: callConversationId });
      socket.emit("call:answer", {
        conversationId: callConversationId,
        answer,
      });
      setCallConnectedAt(Date.now());
      setCallStatus("in-call");
    } catch (error) {
      console.error("acceptIncomingCall error", error);
      toast.error("Không thể nhận cuộc gọi");
      cleanupCall();
    }
  }, [
    callConversationId,
    callKind,
    cleanupCall,
    createPeer,
    ensureLocalStream,
    socket,
  ]);

  const rejectIncomingCall = useCallback(() => {
    if (callConversationId && socket) {
      socket.emit("call:reject", { conversationId: callConversationId });
    }
    cleanupCall();
  }, [callConversationId, cleanupCall, socket]);

  const endCall = useCallback(() => {
    if (callConversationId && socket) {
      socket.emit("call:end", { conversationId: callConversationId });
    }
    cleanupCall();
  }, [callConversationId, cleanupCall, socket]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextMuted = !isMicMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMicMuted(nextMuted);
  }, [isMicMuted]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextOff = !isCameraOff;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !nextOff;
    });
    setIsCameraOff(nextOff);
  }, [isCameraOff]);

  const upgradeVoiceToVideo = useCallback(async () => {
    if (
      callStatus !== "in-call" ||
      callKind !== "voice" ||
      !callConversationId ||
      !socket
    ) {
      return;
    }

    try {
      const stream = await ensureLocalStream("video");
      const peer = peerRef.current;
      if (!peer) return;

      setCallKind("video");
      setIsCameraOff(false);

      const existingVideoTracks = stream.getVideoTracks();
      existingVideoTracks.forEach((track) => {
        const alreadySent = peer
          .getSenders()
          .some((sender) => sender.track?.id === track.id);
        if (!alreadySent) {
          peer.addTrack(track, stream);
        }
      });

      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peer.setLocalDescription(offer);
      socket.emit("call:upgrade-offer", {
        conversationId: callConversationId,
        kind: "video",
        offer,
      });
    } catch (error) {
      console.error("upgradeVoiceToVideo error", error);
      toast.error("Không thể nâng cấp lên video");
    }
  }, [callConversationId, callKind, callStatus, ensureLocalStream, socket]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamState;
      void localVideoRef.current.play().catch(() => undefined);
    }
  }, [localStreamState]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      void remoteVideoRef.current.play().catch(() => undefined);
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      void remoteAudioRef.current.play().catch(() => undefined);
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!socket) return;

    const onIncoming = (payload: {
      conversationId: string;
      kind: CallKind;
      offer: RTCSessionDescriptionInit;
      fromDisplayName?: string;
    }) => {
      if (callStatus !== "idle") {
        socket.emit("call:reject", { conversationId: payload.conversationId });
        return;
      }
      pendingOfferRef.current = payload.offer;
      setCallConversationId(payload.conversationId);
      setCallKind(payload.kind);
      setIncomingCallerName(payload.fromDisplayName || "Người dùng");
      setCallStatus("incoming");
    };

    const onAccepted = () => {
      setCallStatus((prev) => (prev === "outgoing" ? "connecting" : prev));
    };

    const onRejected = () => {
      toast.error("Cuộc gọi đã bị từ chối");
      cleanupCall();
    };

    const onAnswer = async (payload: { answer: RTCSessionDescriptionInit }) => {
      try {
        if (!peerRef.current) return;
        await peerRef.current.setRemoteDescription(payload.answer);
        setCallConnectedAt((prev) => prev || Date.now());
        setCallStatus("in-call");
      } catch (error) {
        console.error("onAnswer error", error);
        cleanupCall();
      }
    };

    const onUpgradeOffer = async (payload: {
      conversationId: string;
      kind: CallKind;
      offer: RTCSessionDescriptionInit;
    }) => {
      if (payload.conversationId !== callConversationId) return;
      try {
        if (!peerRef.current) return;
        setCallStatus("connecting");
        setCallKind(payload.kind);
        const stream = await ensureLocalStream(payload.kind);
        if (payload.kind === "video") {
          const peer = peerRef.current;
          stream.getVideoTracks().forEach((track) => {
            const alreadyAdded = peer
              .getSenders()
              .some((sender) => sender.track?.id === track.id);
            if (!alreadyAdded) {
              peer.addTrack(track, stream);
            }
          });
        }
        await peerRef.current.setRemoteDescription(payload.offer);
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit("call:upgrade-answer", {
          conversationId: payload.conversationId,
          answer,
        });
        setCallStatus("in-call");
      } catch (error) {
        console.error("onUpgradeOffer error", error);
        toast.error("Không thể nâng cấp lên video");
      }
    };

    const onUpgradeAnswer = async (payload: {
      conversationId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      if (payload.conversationId !== callConversationId) return;
      try {
        if (!peerRef.current) return;
        await peerRef.current.setRemoteDescription(payload.answer);
        setCallKind("video");
        setCallStatus("in-call");
      } catch (error) {
        console.error("onUpgradeAnswer error", error);
      }
    };

    const onIceCandidate = async (payload: {
      candidate: RTCIceCandidateInit;
    }) => {
      try {
        if (!peerRef.current) return;
        await peerRef.current.addIceCandidate(payload.candidate);
      } catch (error) {
        console.error("addIceCandidate error", error);
      }
    };

    const onEnded = () => {
      toast("Cuộc gọi đã kết thúc");
      cleanupCall();
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onRejected);
    socket.on("call:answer", onAnswer);
    socket.on("call:upgrade-offer", onUpgradeOffer);
    socket.on("call:upgrade-answer", onUpgradeAnswer);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onRejected);
      socket.off("call:answer", onAnswer);
      socket.off("call:upgrade-offer", onUpgradeOffer);
      socket.off("call:upgrade-answer", onUpgradeAnswer);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:ended", onEnded);
    };
  }, [callStatus, cleanupCall, socket]);

  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  const currentMessages = useMemo(() => {
    if (!activeConversationId) return [];
    const data = messages[activeConversationId];
    if (!data) return [];
    return Array.isArray(data) ? data : (data.items ?? []);
  }, [messages, activeConversationId]);

  const otherLastReadMessageId = useMemo(
    () =>
      activeConversation?.participants.find((p) => p._id !== user?.userId)
        ?.lastReadMessageId ?? null,
    [activeConversation, user?.userId],
  );

  const typingUsers = useMemo(() => {
    if (!activeConversationId) return [];
    return (typingUsersByConv[activeConversationId] || []).filter(
      (id) => id !== user?.userId,
    );
  }, [typingUsersByConv, activeConversationId, user?.userId]);

  const conversationListItems: ConversationListItem[] = useMemo(
    () =>
      conversations.map((c: Conversation) => ({
        _id: c._id,
        group: c.group,
        participants: c.participants.map((p) => ({
          _id: p._id,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl || undefined,
        })),
        lastMessage: c.lastMessage
          ? {
              content: c.lastMessage.content,
              createdAt: c.lastMessage.createdAt,
            }
          : undefined,
        unread: c.unreadCounts?.[user?.userId || ""] || 0,
        pinned: false,
        isStranger: c.isStranger,
        strangerStatus: c.strangerStatus,
      })),
    [conversations, user?.userId],
  );

  const pollAggregates = useMemo(() => {
    const map = new Map<string, PollAggregate>();
    currentMessages.forEach((message) => {
      const payload = decodeChatPayload(message.content);
      if (!payload) return;

      if (payload.kind === "poll" && payload.poll) {
        const existing = map.get(payload.poll.id);
        const latestActivityAt = existing?.latestActivityAt
          ? new Date(existing.latestActivityAt).getTime() >
            new Date(message.createdAt).getTime()
            ? existing.latestActivityAt
            : message.createdAt
          : message.createdAt;
        map.set(payload.poll.id, {
          question: payload.poll.question,
          options: payload.poll.options,
          createdBy: payload.poll.createdBy,
          votes: existing?.votes || [],
          latestActivityAt,
        });
      }

      if (payload.kind === "poll_vote" && payload.pollVote) {
        const aggregate = map.get(payload.pollVote.pollId) || {
          question: "Bình chọn",
          options: [],
          createdBy: payload.pollVote.userId,
          votes: [] as Array<PollVote & { createdAt: string }>,
          latestActivityAt: message.createdAt,
        };
        const voteIndex = aggregate.votes.findIndex(
          (v) => v.userId === payload.pollVote?.userId,
        );
        const nextVote = { ...payload.pollVote, createdAt: message.createdAt };
        if (voteIndex >= 0) {
          const oldTime = new Date(
            aggregate.votes[voteIndex].createdAt,
          ).getTime();
          const newTime = new Date(message.createdAt).getTime();
          if (newTime >= oldTime) aggregate.votes[voteIndex] = nextVote;
        } else {
          aggregate.votes.push(nextVote);
        }
        aggregate.latestActivityAt = new Date(
          Math.max(
            new Date(aggregate.latestActivityAt).getTime(),
            new Date(message.createdAt).getTime(),
          ),
        ).toISOString();
        map.set(payload.pollVote.pollId, aggregate);
      }
    });
    return map;
  }, [currentMessages]);

  const displayMessages = useMemo(() => {
    const pollActivityOrder = new Map<string, number>();
    pollAggregates.forEach((aggregate, pollId) => {
      pollActivityOrder.set(
        pollId,
        new Date(aggregate.latestActivityAt).getTime(),
      );
    });

    return currentMessages
      .filter((message) => {
        const payload = decodeChatPayload(message.content);
        return payload?.kind !== "poll_vote";
      })
      .map((message, index) => {
        const payload = decodeChatPayload(message.content);
        let displayTime = new Date(message.createdAt).getTime();
        if (payload?.kind === "poll" && payload.poll) {
          const latestPollActivity = pollActivityOrder.get(payload.poll.id);
          if (latestPollActivity)
            displayTime = Math.max(displayTime, latestPollActivity);
        }
        return { message, index, displayTime };
      })
      .sort((a, b) => {
        if (a.displayTime !== b.displayTime)
          return a.displayTime - b.displayTime;
        return a.index - b.index;
      })
      .map((item) => item.message);
  }, [currentMessages, pollAggregates]);

  // For group seen: build a map of messageId -> list of participants who have read up to that message
  const groupSeenMap = useMemo(() => {
    if (!activeConversation?.group)
      return new Map<string, Conversation["participants"]>();
    const map = new Map<string, Conversation["participants"]>();
    // For each participant (not me), find their lastReadMessageId and mark that message
    activeConversation.participants.forEach((p) => {
      if (p._id === user?.userId) return;
      if (!p.lastReadMessageId) return;
      const existing = map.get(p.lastReadMessageId) || [];
      map.set(p.lastReadMessageId, [...existing, p]);
    });
    return map;
  }, [activeConversation, user?.userId]);

  // ─── Callbacks ───────────────────────────────────────────────────────────────
  const canRecall = useCallback(
    (message: Message) => {
      if (message.senderId !== user?.userId) return false;
      if (message.isRecalled) return false;
      return (
        Date.now() - new Date(message.createdAt).getTime() <=
        24 * 60 * 60 * 1000
      );
    },
    [user?.userId],
  );

  const sendStructuredMessage = useCallback(
    async (payload: ChatStructuredPayload, imgUrl?: string) => {
      if (!activeConversationId) return;
      const encoded = encodeChatPayload(payload);
      if (activeConversation?.group) {
        await sendGroupMessage(activeConversationId, {
          content: encoded,
          imgUrl,
        });
      } else {
        if (!otherUser?._id) return;
        await sendDirectMessage(otherUser._id, { content: encoded, imgUrl });
      }
    },
    [
      activeConversation?.group,
      activeConversationId,
      otherUser?._id,
      sendDirectMessage,
      sendGroupMessage,
    ],
  );

  const sendTextMessage = useCallback(async () => {
    if (!input.trim() || !activeConversationId || sending) return;
    try {
      setSending(true);
      const payload: ChatStructuredPayload = {
        version: 1,
        kind: replyingTo ? "reply" : "text",
        text: input.trim(),
        reply: replyingTo
          ? {
              messageId: replyingTo._id,
              senderName: getSenderName(
                replyingTo,
                user?.userId,
                activeConversation?.participants || [],
              ),
              preview: getSafeMessagePreview(replyingTo.content),
            }
          : undefined,
      };
      await sendStructuredMessage(payload);
      setInput("");
      setReplyingTo(null);
      if (socket?.connected) {
        socket.emit("stop-typing", { conversationId: activeConversationId });
      }
    } catch (error) {
      console.error("Send message error", error);
      alert("Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  }, [
    activeConversation?.participants,
    activeConversationId,
    input,
    replyingTo,
    sendStructuredMessage,
    sending,
    socket,
    user?.userId,
  ]);

  const sendAttachmentMessage = useCallback(
    async (file: File, kind: "image" | "file" | "audio") => {
      try {
        setSending(true);
        const uploaded = await uploadAttachment(file);
        await sendStructuredMessage(
          {
            version: 1,
            kind,
            attachment: {
              name: uploaded.fileName,
              url: uploaded.url,
              mimeType: uploaded.mimeType,
              size: uploaded.size,
            },
          },
          kind === "image" ? uploaded.url : undefined,
        );
      } catch (error) {
        console.error("Upload chat attachment error", error);
        alert("Upload thất bại");
      } finally {
        setSending(false);
        setActivePopup(null);
      }
    },
    [sendStructuredMessage, uploadAttachment],
  );
  const MAX_FILES = 10;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const handleSelectImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;
    if (files.length > MAX_FILES) {
      alert("Tối đa 10 ảnh");
      return;
    }
    const invalid = files.find((f) => f.size > MAX_SIZE);
    if (invalid) {
      toast.error(`File ${invalid.name} vượt quá 10MB`);
      return;
    }

    try {
      setSending(true);

      const uploadedList = await Promise.all(
        files.map((file) => uploadAttachment(file)),
      );
      const attachments = uploadedList.map((u) => ({
        name: u.fileName,
        url: u.url,
        mimeType: u.mimeType,
        size: u.size,
      }));

      // 👉 gửi 1 message duy nhất
      await sendStructuredMessage({
        version: 1,
        kind: "image",
        attachments,
      });
    } catch (err) {
      console.error(err);
      alert("Upload nhiều ảnh thất bại");
    } finally {
      setSending(false);
      setActivePopup(null);
      e.target.value = "";
    }
  };
  const stopRecording = useCallback(() => {
    const recorder = recordingRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeCandidates = [
        "audio/mp4;codecs=mp4a.40.2",
        "audio/mp4",
        "audio/webm;codecs=opus",
        "audio/webm",
      ];
      const mimeType =
        mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ||
        "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      recordingChunksRef.current = [];
      recordingStreamRef.current = stream;
      recordingRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        try {
          const blob = new Blob(recordingChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          if (blob.size === 0) return;
          const ext = blob.type.includes("mp4") ? "m4a" : "webm";
          const file = new File([blob], `recording-${Date.now()}.${ext}`, {
            type: blob.type || "audio/webm",
          });
          await sendAttachmentMessage(file, "audio");
        } finally {
          recordingChunksRef.current = [];
          recordingRecorderRef.current = null;
          recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
          recordingStreamRef.current = null;
          if (recordingTimerRef.current) {
            window.clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          setIsRecording(false);
          setRecordSeconds(0);
          setActivePopup(null);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Không thể bắt đầu ghi âm", error);
      alert("Không thể truy cập micro để ghi âm");
    }
  }, [isRecording, sendAttachmentMessage]);

  const handleCreatePoll = useCallback(async () => {
    const q = pollQuestion.trim();
    const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) {
      alert("Cần nhập câu hỏi và tối thiểu 2 lựa chọn");
      return;
    }
    const options: PollOption[] = opts.map((label, i) => ({
      id: `opt_${i + 1}_${Math.random().toString(36).slice(2, 6)}`,
      label,
    }));
    try {
      setSending(true);
      await sendStructuredMessage({
        version: 1,
        kind: "poll",
        poll: {
          id: createPollId(),
          question: q,
          options,
          createdBy: user?.userId || "",
        },
      });
      setPollQuestion("");
      setPollOptions(["", ""]);
      setActivePopup(null);
    } catch (error) {
      console.error("Create poll error", error);
      alert("Không thể tạo bình chọn");
    } finally {
      setSending(false);
    }
  }, [pollOptions, pollQuestion, sendStructuredMessage, user?.userId]);

  const handleVote = useCallback(
    async (pollId: string, optionId: string) => {
      if (!user?.userId) return;
      const aggregate = pollAggregates.get(pollId);
      const voted = aggregate?.votes.find((v) => v.userId === user.userId);
      if (voted?.optionId === optionId) return;
      try {
        await sendStructuredMessage({
          version: 1,
          kind: "poll_vote",
          pollVote: {
            pollId,
            optionId,
            userId: user.userId,
            userName: userProfile?.displayName || user.username || "Người dùng",
          },
        });
      } catch (error) {
        console.error("Vote poll error", error);
        alert("Không thể gửi bình chọn");
      }
    },
    [
      pollAggregates,
      sendStructuredMessage,
      user?.userId,
      user?.username,
      userProfile?.displayName,
    ],
  );

  const handleOpenContextMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, message: Message) => {
      event.stopPropagation();
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const isMine = message.senderId === user?.userId;
      const menuWidth = 220;
      const menuHeight = 172;
      let x = isMine ? rect.left - menuWidth - 6 : rect.right + 6;
      let y = rect.bottom + 4;
      if (x + menuWidth > window.innerWidth - 6)
        x = window.innerWidth - menuWidth - 6;
      if (x < 6) x = 6;
      if (y + menuHeight > window.innerHeight - 6)
        y = window.innerHeight - menuHeight - 6;
      if (y < 6) y = 6;
      setContextMenu({ x, y, message });
    },
    [user?.userId],
  );

  const handleRecall = useCallback(async () => {
    if (!contextMenu || !activeConversationId) return;
    try {
      await recallMessage(contextMenu.message._id, activeConversationId);
    } catch (error) {
      console.error("Recall message error", error);
      alert("Không thể thu hồi tin nhắn này");
    } finally {
      setContextMenu(null);
    }
  }, [activeConversationId, contextMenu, recallMessage]);

  const handleDeleteForMe = useCallback(async () => {
    if (!contextMenu || !activeConversationId) return;
    try {
      await deleteMessageForMe(contextMenu.message._id, activeConversationId);
    } catch (error) {
      console.error("Delete message for me error", error);
      alert("Không thể xóa tin nhắn");
    } finally {
      setContextMenu(null);
    }
  }, [activeConversationId, contextMenu, deleteMessageForMe]);

  const handleEdit = useCallback(async () => {
    if (!editingMessage || !activeConversationId || !editInput.trim()) return;
    if (editInput.trim() === editingMessage.content) {
      setEditingMessage(null);
      return;
    }
    try {
      await editMessage(
        editingMessage._id,
        activeConversationId,
        editInput.trim(),
      );
    } catch {
      alert("Không thể sửa tin nhắn");
    } finally {
      setEditingMessage(null);
      setEditInput("");
    }
  }, [editingMessage, activeConversationId, editInput, editMessage]);

  const renderLinks = useCallback((text: string) => {
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (!part.match(urlRegex))
        return <span key={`${part}-${index}`}>{part}</span>;
      const href = part.startsWith("www.") ? `https://${part}` : part;
      return (
        <a
          key={`${part}-${index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#bfdbfe", textDecoration: "underline" }}
        >
          {part}
        </a>
      );
    });
  }, []);
  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    if (files.length > 10) {
      alert("Tối đa 10 file");
      return;
    }

    const invalid = files.find((f) => f.size > 10 * 1024 * 1024);
    if (invalid) {
      alert(`File ${invalid.name} vượt quá 10MB`);
      return;
    }

    try {
      setSending(true);

      const uploadedList = await Promise.all(
        files.map((file) => uploadAttachment(file)),
      );

      const attachments = uploadedList.map((u) => ({
        name: u.fileName,
        url: u.url,
        mimeType: u.mimeType,
        size: u.size,
      }));

      await sendStructuredMessage({
        version: 1,
        kind: "file",
        attachments, // 👈 nhiều file
      });
    } catch (err) {
      console.error(err);
      alert("Upload file thất bại");
    } finally {
      setSending(false);
      e.target.value = "";
    }
  };

  const renderStructuredMessage = useCallback(
    (message: Message) => {
      if (message.isRecalled) {
        return (
          <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 13 }}>
            Tin nhắn đã được thu hồi
          </span>
        );
      }
      const payload = decodeChatPayload(message.content);
      if (!payload) {
        return <div>{renderLinks(message.content || "")}</div>;
      }

      if (payload.kind === "reply") {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                borderLeft: "3px solid rgba(59,130,246,.9)",
                background: "rgba(2,132,199,.12)",
                borderRadius: 8,
                padding: "7px 9px",
                fontSize: 12,
              }}
            >
              <div style={{ color: "#bfdbfe", fontWeight: 600 }}>
                {payload.reply?.senderName || "Tin nhắn"}
              </div>
              <div style={{ color: "#cbd5e1", marginTop: 2 }}>
                {payload.reply?.preview || "Tin nhắn"}
              </div>
            </div>
            <span>{renderLinks(payload.text || "")}</span>
          </div>
        );
      }

      if (payload.kind === "emoji") {
        return (
          <span style={{ fontSize: 28, lineHeight: "34px" }}>
            {payload.emoji || "🙂"}
          </span>
        );
      }

      if (payload.kind === "image" && payload.attachment?.url) {
        return (
          <img
            src={payload.attachment.url}
            alt={payload.attachment.name || "image"}
            style={{
              width: "100%",
              maxWidth: 280,
              borderRadius: 12,
              cursor: "zoom-in",
              display: "block",
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (payload.attachment?.url)
                setImagePreviewUrl(payload.attachment.url);
            }}
          />
        );
      }

      if (payload.kind === "file" && payload.attachments?.length) {
        return (
          <div style={{ display: "grid", gap: 6 }}>
            {(payload.attachments ?? []).map((file, index) => (
              <a
                key={file.url || index}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#e2e8f0",
                  textDecoration: "underline",
                }}
              >
                {file.name}
              </a>
            ))}
          </div>
        );
      }
      if (payload.kind === "image" && payload.attachments?.length) {
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 4,
              maxWidth: 280,
            }}
          >
            {(payload.attachments ?? []).map((img, index) => (
              <img
                key={img.url || index}
                src={img.url}
                alt={img.name || "image"}
                style={{
                  width: "100%",
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 10,
                  cursor: "zoom-in",
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (img.url) setImagePreviewUrl(img.url);
                }}
              />
            ))}
          </div>
        );
      }

      if (payload.kind === "audio" && payload.attachment?.url) {
        return (
          <div
            style={{
              display: "grid",
              gap: 6,
              background: "rgba(148,163,184,0.1)",
              border: "1px solid rgba(148,163,184,0.3)",
              borderRadius: 10,
              padding: "8px 10px",
              minWidth: 220,
            }}
          >
            <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600 }}>
              Ghi âm
            </div>
            <audio
              controls
              src={payload.attachment.url}
              style={{ width: "100%" }}
            />
          </div>
        );
      }

      if (payload.kind === "sticker" && payload.stickerUrl) {
        return (
          <img
            src={payload.stickerUrl}
            alt="sticker"
            style={{
              width: 148,
              height: 148,
              objectFit: "contain",
              borderRadius: 14,
            }}
          />
        );
      }

      if (payload.kind === "call" && payload.call) {
        const callLabel =
          payload.call.callType === "video"
            ? "Cuộc gọi video"
            : "Cuộc gọi thoại";
        const finishedAt = payload.call.endedAt
          ? formatMessageDateTime(payload.call.endedAt)
          : "Đang diễn ra";

        return (
          <div
            style={{
              minWidth: 250,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(96,165,250,.2)",
              background:
                "linear-gradient(145deg, rgba(15,23,42,.96) 0%, rgba(30,41,59,.96) 100%)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  payload.call.callType === "video"
                    ? "rgba(59,130,246,.15)"
                    : "rgba(16,185,129,.15)",
              }}
            >
              {payload.call.callType === "video" ? (
                <Video size={18} color="#60a5fa" />
              ) : (
                <Phone size={18} color="#34d399" />
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 14 }}>
                {callLabel}
              </div>
              <div style={{ color: "#cbd5e1", fontSize: 12 }}>
                {formatCallDuration(payload.call.durationSeconds || 0)} •{" "}
                {finishedAt}
              </div>
              {payload.call.upgradedFrom === "voice" &&
                payload.call.upgradedTo === "video" && (
                  <div style={{ color: "#93c5fd", fontSize: 11 }}>
                    Đã nâng cấp từ gọi thoại sang video
                  </div>
                )}
            </div>
          </div>
        );
      }

      if (payload.kind === "poll" && payload.poll) {
        const aggregate = pollAggregates.get(payload.poll.id);
        const votedOption = aggregate?.votes.find(
          (v) => v.userId === user?.userId,
        )?.optionId;
        const totalVotes = aggregate?.votes.length || 0;

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minWidth: 280,
              padding: "14px",
              background: "#18181b",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            <div>
              <div
                style={{
                  color: "#fafafa",
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 4,
                }}
              >
                {payload.poll.question}
              </div>
              <div
                style={{
                  color: "#71717a",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {totalVotes} vote
                </span>
                <span>•</span>
                <span>Chọn một câu trả lời</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {payload.poll.options.map((option) => {
                const voters =
                  aggregate?.votes.filter((v) => v.optionId === option.id) ||
                  [];
                const voted = option.id === votedOption;
                const percent = totalVotes
                  ? Math.round((voters.length / totalVotes) * 100)
                  : 0;
                const voterProfiles = voters.map((v) => {
                  const participant = activeConversation?.participants.find(
                    (p) => p._id === v.userId,
                  );
                  return {
                    id: v.userId,
                    name: participant?.displayName || v.userName || "User",
                    avatarUrl: participant?.avatarUrl || undefined,
                  };
                });

                return (
                  <button
                    key={option.id}
                    onClick={() => void handleVote(payload.poll!.id, option.id)}
                    style={{
                      position: "relative",
                      width: "100%",
                      border: voted ? "1px solid #6366f1" : "1px solid #27272a",
                      background: voted ? "rgba(99,102,241,0.05)" : "#09090b",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      overflow: "hidden",
                      transition: "all .2s ease",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${percent}%`,
                        background: voted
                          ? "rgba(99,102,241,0.15)"
                          : "rgba(255,255,255,0.03)",
                        transition: "width .4s ease",
                        zIndex: 0,
                      }}
                    />
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: voted ? "#818cf8" : "#e4e4e7",
                            fontSize: 14,
                          }}
                        >
                          {option.label}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: voted ? "#818cf8" : "#71717a",
                          }}
                        >
                          {percent}%
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {voterProfiles.slice(0, 3).map((v, i) => (
                            <div
                              key={i}
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                border: "2px solid #18181b",
                                background: "#27272a",
                                marginLeft: i === 0 ? 0 : -8,
                                overflow: "hidden",
                              }}
                            >
                              {v.avatarUrl ? (
                                <img
                                  src={v.avatarUrl}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <UserIcon
                                  size={12}
                                  style={{
                                    margin: "auto",
                                    display: "block",
                                    marginTop: 2,
                                    color: "#a1a1aa",
                                  }}
                                />
                              )}
                            </div>
                          ))}
                          {voterProfiles.length > 3 && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: 11,
                                color: "#52525b",
                              }}
                            >
                              +{voterProfiles.length - 3}
                            </span>
                          )}
                        </div>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            setVoteViewer({
                              x: Math.min(
                                rect.left - 18,
                                window.innerWidth - 310,
                              ),
                              y: rect.bottom + 10,
                              optionLabel: option.label,
                              users: voterProfiles,
                              totalVotes: voters.length,
                            });
                          }}
                          style={{
                            fontSize: 11,
                            color: "#6366f1",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Chi tiết
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!votedOption && (
              <button
                onClick={() => {
                  if (payload.poll?.options[0])
                    void handleVote(
                      payload.poll.id,
                      payload.poll.options[0].id,
                    );
                }}
                style={{
                  marginTop: 4,
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#6366f1",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Gửi bình chọn
              </button>
            )}
          </div>
        );
      }

      if (payload.kind === "poll_vote") {
        return <span style={{ color: "#cbd5e1" }}>Đã cập nhật bình chọn</span>;
      }

      return (
        <div>
          {renderLinks(
            payload?.text || payload?.emoji || message.content || "",
          )}
        </div>
      );
    },
    [
      activeConversation?.participants,
      handleVote,
      pollAggregates,
      renderLinks,
      user?.userId,
    ],
  );

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", background: "#040a18" }}>
      <style>{`
        .sticker-btn:hover { background: rgba(255,255,255,0.08) !important; transform: translateY(-2px); }
        .action-btn:hover { background: rgba(148,163,184,0.15) !important; color: #f8fafc !important; }
        .menu-item:hover { background: rgba(148,163,184,0.12) !important; }
        .theme-option:hover { border-color: rgba(96,165,250,.55) !important; transform: translateY(-1px); }
        @media (max-width: 1400px) { .info-panel-responsive { display: none !important; } }
        @media (max-width: 768px) { .conversation-list-responsive { display: none !important; } }
      `}</style>

      <SideNav onNewMessage={() => undefined} />

      <ConversationList
        conversations={conversationListItems}
        activeId={activeConversationId}
        onSelectConversation={(conversationId) => {
          setActiveConversation(conversationId);
          fetchMessages(conversationId);
          setReplyingTo(null);
          setContextMenu(null);
          const selectedConv = conversations.find(
            (c) => c._id === conversationId,
          );
          if (selectedConv && user?.userId) {
            updateConversation({
              ...selectedConv,
              unreadCounts: {
                ...selectedConv.unreadCounts,
                [user.userId]: 0, // Reset số tin nhắn chưa đọc của user hiện tại về 0
              },
            });
          }
        }}
        isOpen={true}
        onClose={() => undefined}
      />

      {/* Main Chat Area + Info Panel Container */}
      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        {/* Chat Area */}
        <div style={chatAreaStyle}>
          {activeConversation ? (
            <>
              {/* Header */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {/* Left: Avatar + Name + Status */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Avatar */}
                  {activeConversation.group ? (
                    <div
                      style={{ position: "relative", width: 40, height: 40 }}
                    >
                      {activeConversation.participants
                        .slice(0, 3)
                        .map((p, idx) => {
                          const positions = [
                            { top: 0, left: 0, zIndex: 3 },
                            { top: 0, right: 0, zIndex: 2 },
                            {
                              bottom: 0,
                              left: "50%",
                              transform: "translateX(-50%)",
                              zIndex: 1,
                            },
                          ];
                          const pos = positions[idx];
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
                          for (let i = 0; i < p.displayName.length; i++)
                            hash =
                              p.displayName.charCodeAt(i) +
                              ((hash << 5) - hash);
                          const avatarColor =
                            colors[Math.abs(hash) % colors.length];
                          return (
                            <div
                              key={p._id}
                              style={{
                                position: "absolute",
                                width: idx === 0 ? 28 : 22,
                                height: idx === 0 ? 28 : 22,
                                borderRadius: "50%",
                                border: "2px solid #0f172a",
                                overflow: "hidden",
                                background: p.avatarUrl
                                  ? undefined
                                  : avatarColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: 700,
                                fontSize: idx === 0 ? 10 : 8,
                                ...pos,
                              }}
                            >
                              {p.avatarUrl ? (
                                <img
                                  src={p.avatarUrl}
                                  alt={p.displayName}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                p.displayName?.slice(0, 2).toUpperCase()
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: otherUser?.avatarUrl
                          ? `url(${otherUser.avatarUrl}) center/cover`
                          : "#2563eb",
                        border: "2px solid rgba(37,99,235,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: 16,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {!otherUser?.avatarUrl &&
                        otherUser?.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Name + Status */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <strong style={{ color: "#f1f5f9", fontSize: 16 }}>
                      {activeConversation.group?.name ||
                        otherUser?.displayName ||
                        "Đoạn chat"}
                    </strong>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        color: activeConversation.group
                          ? "#94a3b8"
                          : socketStore.onlineUsers.some(
                                (id) => String(id) === String(otherUser?._id),
                              )
                            ? "#10b981"
                            : "#64748b",
                      }}
                    >
                      {activeConversation.group ? (
                        <span>
                          {activeConversation.participants.length} thành viên
                        </span>
                      ) : activeConversation.isStranger ? (
                        <span style={{ color: "#94a3b8" }}></span>
                      ) : (
                        <>
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: socketStore.onlineUsers.some(
                                (id) => String(id) === String(otherUser?._id),
                              )
                                ? "#10b981"
                                : "#64748b",
                              display: "inline-block",
                            }}
                          />
                          {socketStore.onlineUsers.some(
                            (id) => String(id) === String(otherUser?._id),
                          )
                            ? "Đang hoạt động"
                            : "Ngoại tuyến"}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stranger badge */}
                  {!activeConversation.group &&
                    activeConversation.strangerStatus === "accepted" &&
                    activeConversation.isStranger === true && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "rgba(148,163,184,0.1)",
                          border: "1px solid rgba(148,163,184,0.2)",
                          borderRadius: 20,
                          padding: "2px 8px",
                          fontSize: 10,
                          color: "#94a3b8",
                          marginLeft: 8,
                        }}
                      >
                        <UserIcon size={13} /> Người lạ
                      </span>
                    )}
                </div>

                {/* Right: Action buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div ref={themeMenuRef} style={{ position: "relative" }}>
                    <button
                      title="Đổi giao diện chat"
                      onClick={() => setShowThemePicker((prev) => !prev)}
                      style={{
                        ...actionIconStyle,
                        width: 36,
                        height: 36,
                        color: showThemePicker ? "#60a5fa" : "#94a3b8",
                      }}
                      className="action-btn"
                    >
                      <Palette size={18} />
                    </button>

                    {showThemePicker && activeConversationId && (
                      <div
                        style={{
                          position: "absolute",
                          top: 44,
                          right: 0,
                          width: 240,
                          borderRadius: 14,
                          border: "1px solid rgba(148,163,184,.3)",
                          background:
                            "linear-gradient(160deg, rgba(7,16,36,.95) 0%, rgba(15,23,42,.95) 100%)",
                          boxShadow: "0 16px 36px rgba(0,0,0,.45)",
                          padding: 10,
                          display: "grid",
                          gap: 8,
                          zIndex: 50,
                        }}
                      >
                        {CHAT_THEME_OPTIONS.map((theme) => {
                          const isActive = theme.id === activeChatTheme.id;
                          const swatch =
                            theme.mode === "image" && theme.appBackgroundImage
                              ? `linear-gradient(180deg, rgba(15,23,42,.25) 0%, rgba(15,23,42,.55) 100%), url(${theme.appBackgroundImage}) center/cover no-repeat`
                              : theme.appBackground;

                          return (
                            <button
                              key={theme.id}
                              className="theme-option"
                              onClick={() => {
                                setThemeForConversation(
                                  activeConversationId,
                                  theme.id,
                                );
                                setShowThemePicker(false);
                              }}
                              style={{
                                border: isActive
                                  ? "1px solid rgba(96,165,250,.85)"
                                  : "1px solid rgba(148,163,184,.25)",
                                background: "rgba(15,23,42,.35)",
                                borderRadius: 11,
                                padding: "8px 10px",
                                color: "#e2e8f0",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                transition: "all .16s",
                              }}
                            >
                              <span
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 8,
                                  background: swatch,
                                  border: "1px solid rgba(255,255,255,.2)",
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: isActive ? 700 : 600,
                                  textAlign: "left",
                                }}
                              >
                                {theme.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {activeConversation.group && (
                    <button
                      title="Thêm thành viên"
                      onClick={() => setShowAddMemberModal(true)}
                      style={{ ...actionIconStyle, width: 36, height: 36 }}
                      className="action-btn"
                    >
                      <UserPlus size={18} />
                    </button>
                  )}
                  <button
                    title="Gọi"
                    onClick={() => startCall("voice")}
                    style={{ ...actionIconStyle, width: 36, height: 36 }}
                    className="action-btn"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    title="Gọi video"
                    onClick={() => startCall("video")}
                    style={{ ...actionIconStyle, width: 36, height: 36 }}
                    className="action-btn"
                  >
                    <Video size={18} />
                  </button>
                  <button
                    title="Tìm kiếm"
                    style={{ ...actionIconStyle, width: 36, height: 36 }}
                    className="action-btn"
                  >
                    <Search size={18} />
                  </button>
                  <button
                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                    title={showInfoPanel ? "Ẩn thông tin" : "Hiện thông tin"}
                    style={{
                      ...actionIconStyle,
                      width: 36,
                      height: 36,
                      color: showInfoPanel ? "#2563eb" : "#94a3b8",
                    }}
                    className="action-btn"
                  >
                    {showInfoPanel ? (
                      <PanelRightClose size={18} />
                    ) : (
                      <PanelRight size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} style={messagesAreaStyle}>
                {displayMessages.map((message, index) => {
                  const isMine = message.senderId === user?.userId;
                  const isGroup = !!activeConversation.group;
                  const payload = decodeChatPayload(message.content);
                  const messageKey =
                    message._id?.toString() || `${message.createdAt}-${index}`;
                  // Sender participant (for group avatar)
                  const senderParticipant = !isMine
                    ? isGroup
                      ? activeConversation.participants.find(
                          (p) => p._id === message.senderId,
                        )
                      : otherUser
                    : undefined;

                  // Direct chat: single seen avatar
                  const isLastRead =
                    !isGroup &&
                    otherLastReadMessageId &&
                    message._id?.toString() ===
                      otherLastReadMessageId.toString();

                  // Group chat: who has read up to this message
                  const groupSeenParticipants = isGroup
                    ? groupSeenMap.get(message._id?.toString()) || []
                    : [];

                  if (
                    message.type === "system" ||
                    message.content?.startsWith("{{system}}")
                  ) {
                    const text = message.content.replace("{{system}}", "");
                    return (
                      <div
                        key={messageKey}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          marginBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "#94a3b8",
                            background: "rgba(148,163,184,0.1)",
                            border: "1px solid rgba(148,163,184,0.15)",
                            borderRadius: 20,
                            padding: "4px 14px",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={messageKey}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        marginBottom: 10,
                      }}
                    >
                      {/* Sender name for group (not mine) */}
                      {isGroup && !isMine && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            marginBottom: 2,
                            marginLeft: 36,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {senderParticipant?.displayName || "Người dùng"}
                        </div>
                      )}

                      {/* Bubble row */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: isMine ? "flex-end" : "flex-start",
                          gap: 6,
                          alignItems: "flex-end",
                        }}
                      >
                        {/* Group: sender avatar on the left (only for others) */}
                        {!isMine && senderParticipant && (
                          <SenderAvatar participant={senderParticipant} />
                        )}

                        {/* Spacer to align my messages in group (no avatar on right) */}
                        {isGroup && isMine && <div style={{ width: 0 }} />}

                        {isMine && !message.isRecalled && (
                          <button
                            onClick={(e) => handleOpenContextMenu(e, message)}
                            style={actionDotsStyle}
                            className="action-btn"
                            title="Tùy chọn tin nhắn"
                          >
                            <Ellipsis size={16} />
                          </button>
                        )}

                        <div
                          onClick={() =>
                            setExpandedMessageKey((prev) =>
                              prev === messageKey ? null : messageKey,
                            )
                          }
                          style={{
                            maxWidth: "72%",
                            borderRadius: 14,
                            cursor: "pointer",
                            padding:
                              payload?.kind === "image" ||
                              payload?.kind === "file" ||
                              payload?.kind === "poll"
                                ? 0
                                : "10px 12px",
                            background:
                              payload?.kind === "image" ||
                              payload?.kind === "file" ||
                              payload?.kind === "poll"
                                ? "transparent"
                                : message.isRecalled
                                  ? "rgba(15,23,42,.4)"
                                  : isMine
                                    ? activeChatTheme.mineBubble
                                    : "linear-gradient(145deg, #0f172a 0%, #1f2937 100%)",
                            border:
                              payload?.kind === "image" ||
                              payload?.kind === "file" ||
                              payload?.kind === "poll"
                                ? "none"
                                : isMine
                                  ? "none"
                                  : "1px solid rgba(148,163,184,.18)",
                            boxShadow:
                              payload?.kind === "image" ||
                              payload?.kind === "file" ||
                              payload?.kind === "poll"
                                ? "none"
                                : "0 8px 20px rgba(0,0,0,.25)",
                            overflow: "hidden",
                          }}
                        >
                          {renderStructuredMessage(message)}
                        </div>

                        {!isMine && !message.isRecalled && (
                          <button
                            onClick={(e) => handleOpenContextMenu(e, message)}
                            style={actionDotsStyle}
                            className="action-btn"
                            title="Tùy chọn tin nhắn"
                          >
                            <Ellipsis size={16} />
                          </button>
                        )}
                      </div>

                      {/* Edited + timestamp */}
                      {expandedMessageKey === messageKey && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: isMine ? "flex-end" : "flex-start",
                            marginTop: 4,
                            padding: isMine ? "0 4px 0 0" : "0 0 0 4px",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          {message.isEdited && !message.isRecalled && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "#94a3b8",
                                fontStyle: "italic",
                              }}
                            >
                              (đã chỉnh sửa)
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              color: "#94a3b8",
                              lineHeight: 1.3,
                            }}
                          >
                            {formatMessageDateTime(message.createdAt)}
                          </span>
                        </div>
                      )}

                      {/* Direct chat: avatar seen */}
                      {isMine &&
                        !message.isRecalled &&
                        isLastRead &&
                        !isGroup && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              paddingRight: 4,
                              marginTop: 2,
                            }}
                          >
                            <img
                              src={otherAvatar}
                              alt="seen"
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                border: "1.5px solid #60a5fa",
                              }}
                              title={`${otherUser?.displayName} đã xem`}
                            />
                          </div>
                        )}

                      {/* Group chat: seen avatars stack */}
                      {isMine &&
                        !message.isRecalled &&
                        isGroup &&
                        groupSeenParticipants.length > 0 && (
                          <GroupSeenAvatars
                            seenParticipants={groupSeenParticipants}
                          />
                        )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Stranger pending banners */}
              {activeConversation.isStranger &&
                activeConversation.strangerStatus === "pending" &&
                activeConversation.initiatorId === user?.userId && (
                  <div
                    style={{
                      margin: "0 16px 8px",
                      padding: "10px 14px",
                      background: "rgba(37,99,235,0.08)",
                      border: "1px solid rgba(37,99,235,0.2)",
                      borderRadius: 12,
                      color: "#94a3b8",
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    ⏳ Đang chờ{" "}
                    <strong style={{ color: "#f1f5f9" }}>
                      {otherUser?.displayName}
                    </strong>{" "}
                    chấp nhận tin nhắn của bạn
                  </div>
                )}

              {activeConversation.isStranger &&
                activeConversation.strangerStatus === "pending" &&
                activeConversation.initiatorId !== user?.userId && (
                  <div
                    style={{
                      margin: "0 16px 8px",
                      background: "rgba(30,41,59,0.9)",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: 14,
                      padding: "14px 16px",
                    }}
                  >
                    {(() => {
                      const sender = activeConversation.participants.find(
                        (p) => p._id !== user?.userId,
                      );
                      return (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 10,
                          }}
                        >
                          {sender?.avatarUrl ? (
                            <img
                              src={sender.avatarUrl}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "#2563eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: 14,
                              }}
                            >
                              {sender?.displayName?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div
                              style={{
                                color: "#f1f5f9",
                                fontWeight: 600,
                                fontSize: 14,
                              }}
                            >
                              {sender?.displayName}
                            </div>
                            <div style={{ color: "#94a3b8", fontSize: 12 }}>
                              Muốn nhắn tin với bạn
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: 13,
                        marginBottom: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      Đây là người chưa kết bạn với bạn. Bạn có muốn nhận tin
                      nhắn từ họ không?
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() =>
                          updateStrangerStatus(
                            activeConversation._id,
                            "accepted",
                          )
                        }
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: 10,
                          border: "none",
                          background: "#2563eb",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        ✓ Chấp nhận
                      </button>
                      <button
                        onClick={() =>
                          updateStrangerStatus(
                            activeConversation._id,
                            "declined",
                          )
                        }
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: 10,
                          border: "1px solid rgba(248,113,113,0.4)",
                          background: "rgba(248,113,113,0.1)",
                          color: "#fca5a5",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        ✗ Từ chối
                      </button>
                    </div>
                  </div>
                )}

              {/* Typing indicator */}
              <div
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  height: 18,
                  marginBottom: 4,
                  paddingLeft: 16,
                }}
              >
                {typingUsers.length > 0 && (
                  <span>
                    {typingUsers
                      .map(
                        (id) =>
                          activeConversation.participants.find(
                            (p) => p._id === id,
                          )?.displayName,
                      )
                      .filter(Boolean)
                      .join(", ")}{" "}
                    đang soạn...
                  </span>
                )}
              </div>

              {/* Input area */}
              <div
                style={{
                  padding: "10px 14px 14px",
                  borderTop: "1px solid rgba(255,255,255,.08)",
                }}
              >
                {/* Reply banner */}
                {replyingTo && (
                  <div
                    style={{
                      marginBottom: 8,
                      background: "rgba(30,64,175,.22)",
                      border: "1px solid rgba(96,165,250,.4)",
                      borderRadius: 12,
                      padding: "8px 10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: "#bfdbfe",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Đang trả lời{" "}
                        {getSenderName(
                          replyingTo,
                          user?.userId,
                          activeConversation.participants,
                        )}
                      </div>
                      <div
                        style={{
                          color: "#cbd5e1",
                          fontSize: 12,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getSafeMessagePreview(replyingTo.content)}
                      </div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#e2e8f0",
                        cursor: "pointer",
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Edit banner */}
                {editingMessage && (
                  <div
                    style={{
                      marginBottom: 8,
                      background: "rgba(234,179,8,.1)",
                      border: "1px solid rgba(234,179,8,.35)",
                      borderRadius: 12,
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          color: "#fde047",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        ✏️ Đang chỉnh sửa tin nhắn
                      </span>
                      <button
                        onClick={() => {
                          setEditingMessage(null);
                          setEditInput("");
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#94a3b8",
                          cursor: "pointer",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleEdit();
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          border: "0.5px solid rgba(234,179,8,.4)",
                          background: "rgba(234,179,8,.05)",
                          color: "#f1f5f9",
                          borderRadius: 10,
                          padding: "7px 10px",
                          outline: "none",
                          fontSize: 14,
                        }}
                      />
                      <button
                        onClick={() => void handleEdit()}
                        disabled={!editInput.trim()}
                        style={{
                          border: "none",
                          borderRadius: 10,
                          padding: "7px 14px",
                          background: editInput.trim() ? "#ca8a04" : "#334155",
                          color: "white",
                          cursor: editInput.trim() ? "pointer" : "not-allowed",
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ position: "relative" }} ref={popupRef}>
                  {/* Media popup */}
                  {activePopup === "media" && (
                    <div style={popupBoxStyle}>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 10,
                          color: "#f1f5f9",
                        }}
                      >
                        Gửi tệp hoặc hình ảnh
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        <button
                          style={popupActionStyle}
                          className="menu-item"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          <ImagePlus size={16} /> Chọn ảnh
                        </button>
                        <button
                          style={popupActionStyle}
                          className="menu-item"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FileUp size={16} /> Chọn tệp
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Audio popup */}
                  {activePopup === "audio" && (
                    <div style={popupBoxStyle}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "#f1f5f9" }}>
                          Ghi âm
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: isRecording ? "#fca5a5" : "#64748b",
                            background: isRecording
                              ? "rgba(252,165,165,.1)"
                              : "rgba(100,116,139,.1)",
                            border: `0.5px solid ${isRecording ? "rgba(252,165,165,.25)" : "rgba(100,116,139,.2)"}`,
                            borderRadius: 20,
                            padding: "4px 10px",
                          }}
                        >
                          {isRecording
                            ? `● ${String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:${String(recordSeconds % 60).padStart(2, "0")}`
                            : "Sẵn sàng"}
                        </div>
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {!isRecording ? (
                          <button
                            style={{
                              ...popupActionStyle,
                              borderColor: "rgba(37,99,235,.45)",
                              background: "rgba(37,99,235,.1)",
                            }}
                            onClick={() => void startRecording()}
                          >
                            <Mic size={16} /> Bắt đầu ghi âm
                          </button>
                        ) : (
                          <button
                            style={{
                              ...popupActionStyle,
                              borderColor: "rgba(248,113,113,.45)",
                              background: "rgba(248,113,113,.15)",
                            }}
                            onClick={() => stopRecording()}
                          >
                            <Mic size={16} /> Dừng và gửi
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sticker popup */}
                  {activePopup === "sticker" && (
                    <div style={{ ...popupBoxStyle, width: 340 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <strong style={{ color: "#f1f5f9" }}>Nhãn dán</strong>
                        <a
                          href="https://chatsticker.com"
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#3b82f6",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          Xem thêm
                        </a>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 10,
                        }}
                      >
                        {CHAT_STICKER_LIST.map((stickerUrl, index) => (
                          <button
                            key={`sticker-${index}`}
                            className="sticker-btn"
                            onClick={() => {
                              void sendStructuredMessage({
                                version: 1,
                                kind: "sticker",
                                stickerUrl,
                              });
                              setActivePopup(null);
                            }}
                            style={{
                              border: "0.5px solid rgba(148,163,184,.15)",
                              background: "rgba(255,255,255,.03)",
                              borderRadius: 12,
                              padding: 6,
                              cursor: "pointer",
                              transition: "all .2s ease",
                            }}
                          >
                            <img
                              src={stickerUrl}
                              alt="sticker"
                              style={{
                                width: "100%",
                                height: 80,
                                objectFit: "contain",
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Poll popup */}
                  {activePopup === "poll" && (
                    <div style={{ ...popupBoxStyle, width: 340 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 12,
                          color: "#f1f5f9",
                        }}
                      >
                        Tạo cuộc thăm dò
                      </div>
                      <input
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="Câu hỏi bình chọn"
                        style={pollInputStyle}
                      />
                      {pollOptions.map((option, index) => (
                        <input
                          key={`poll-opt-${index}`}
                          value={option}
                          onChange={(e) => {
                            const next = [...pollOptions];
                            next[index] = e.target.value;
                            setPollOptions(next);
                          }}
                          placeholder={`Lựa chọn ${index + 1}`}
                          style={pollInputStyle}
                        />
                      ))}
                      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                        <button
                          onClick={() => setPollOptions((p) => [...p, ""])}
                          style={miniButtonStyle}
                        >
                          + Thêm
                        </button>
                        <button
                          onClick={() => void handleCreatePoll()}
                          style={miniButtonPrimaryStyle}
                        >
                          Tạo bình chọn
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hidden file inputs */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleSelectImages}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={handleSelectFiles}
                  />

                  {/* Input bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: "1px solid rgba(148,163,184,.25)",
                      background: "rgba(8,15,35,.85)",
                      borderRadius: 16,
                      padding: "6px 10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        paddingRight: 4,
                        borderRight: "1px solid rgba(148,163,184,.12)",
                      }}
                    >
                      <button
                        title="Ảnh / Tệp"
                        style={actionIconStyle}
                        className="action-btn"
                        onClick={() =>
                          setActivePopup((p) =>
                            p === "media" ? null : "media",
                          )
                        }
                      >
                        <ImagePlus size={18} />
                      </button>
                      <button
                        title="Nhãn dán"
                        style={actionIconStyle}
                        className="action-btn"
                        onClick={() =>
                          setActivePopup((p) =>
                            p === "sticker" ? null : "sticker",
                          )
                        }
                      >
                        <Sticker size={18} />
                      </button>
                      <button
                        title="Ghi âm"
                        style={actionIconStyle}
                        className="action-btn"
                        onClick={() =>
                          setActivePopup((p) =>
                            p === "audio" ? null : "audio",
                          )
                        }
                      >
                        <Mic size={18} />
                      </button>
                      <button
                        title="Thăm dò"
                        style={actionIconStyle}
                        className="action-btn"
                        onClick={() =>
                          setActivePopup((p) => (p === "poll" ? null : "poll"))
                        }
                      >
                        <BarChart3 size={18} />
                      </button>
                    </div>

                    <input
                      value={input}
                      onChange={(event) => {
                        setInput(event.target.value);
                        if (socket?.connected && activeConversationId) {
                          socket.emit("typing", {
                            conversationId: activeConversationId,
                          });
                          if (typingTimeoutRef.current)
                            clearTimeout(typingTimeoutRef.current);
                          typingTimeoutRef.current = setTimeout(() => {
                            socket.emit("stop-typing", {
                              conversationId: activeConversationId,
                            });
                          }, 1200);
                        }
                      }}
                      placeholder="Nhập tin nhắn..."
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void sendTextMessage();
                        }
                      }}
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        color: "#f8fafc",
                        padding: "0 8px",
                        fontSize: 15,
                      }}
                    />

                    {/* Emoji picker */}
                    <div
                      style={{ position: "relative", display: "inline-flex" }}
                    >
                      {activePopup === "emoji" && (
                        <div
                          style={{
                            position: "absolute",
                            right: 0,
                            bottom: 46,
                            zIndex: 40,
                          }}
                        >
                          <Picker
                            data={data}
                            theme="dark"
                            onEmojiSelect={(emoji: EmojiSelectEvent) => {
                              if (!emoji.native) return;
                              setInput((prev) => prev + emoji.native);
                            }}
                            previewPosition="none"
                            skinTonePosition="none"
                          />
                        </div>
                      )}
                      <button
                        title="Emoji"
                        style={actionIconStyle}
                        className="action-btn"
                        onClick={() =>
                          setActivePopup((p) =>
                            p === "emoji" ? null : "emoji",
                          )
                        }
                      >
                        <Smile size={18} />
                      </button>
                    </div>

                    {/* Send button */}
                    <button
                      onClick={() => void sendTextMessage()}
                      disabled={sending || !input.trim()}
                      style={{
                        border: "none",
                        borderRadius: 12,
                        width: 38,
                        height: 38,
                        background:
                          sending || !input.trim() ? "#334155" : "#2563eb",
                        color: "white",
                        cursor:
                          sending || !input.trim() ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform .15s, background .15s",
                      }}
                      title="Gửi"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#94a3b8",
                fontWeight: 500,
              }}
            >
              Chọn cuộc trò chuyện để bắt đầu
            </div>
          )}
        </div>

        {/* Right Info Panel */}
        {activeConversation &&
          showInfoPanel &&
          (activeConversation.group ? (
            <GroupConversationInfoPanel
              conversation={activeConversation}
              messages={displayMessages}
              currentUserId={user?.userId}
              isAdminOrOwner={isAdminOrOwner}
              pendingRequests={
                activeConversationId
                  ? (joinRequests[activeConversationId] ?? [])
                  : []
              }
              onDeleteConversation={() => {
                setActiveConversation(null);
                alert("Xóa lịch sử trò chuyện thành công");
              }}
              onManageGroup={() => {
                alert("Tính năng quản lý nhóm sẽ được triển khai");
              }}
              onLeaveGroup={() => {
                setActiveConversation(null);
                alert("Bạn đã rời khỏi nhóm");
              }}
              onUpdateMemberRole={async (targetUserId, role) => {
                if (!activeConversationId) return;
                try {
                  await chatService.updateMemberRole(
                    activeConversationId,
                    targetUserId,
                    role,
                  );
                } catch (error) {
                  console.error("Lỗi khi cập nhật role:", error);
                  alert("Không thể cập nhật quyền thành viên");
                }
              }}
              onAddMember={async (targetUserId) => {
                if (!activeConversationId) return;
                try {
                  const result = await addMemberToGroup(
                    activeConversationId,
                    targetUserId,
                  );
                  if (result.needsApproval) {
                    toast("Yêu cầu đã gửi, chờ trưởng/phó nhóm duyệt");
                  } else {
                    toast.success("Đã thêm thành viên vào nhóm");
                  }
                } catch {
                  toast.error("Không thể thêm thành viên");
                }
              }}
              onReviewRequest={async (requestId, action) => {
                if (!activeConversationId) return;
                try {
                  await reviewJoinRequest(
                    activeConversationId,
                    requestId,
                    action,
                  );
                  toast.success(
                    action === "approved"
                      ? "Đã duyệt thành viên"
                      : "Đã từ chối",
                  );
                } catch {
                  toast.error("Không thể xử lý yêu cầu");
                }
              }}
              onUpdateSettings={async (settings) => {
                if (!activeConversationId) return;
                try {
                  await chatService.updateGroupSettings(
                    activeConversationId,
                    settings,
                  );
                  toast.success("Đã cập nhật cài đặt nhóm");
                } catch (error) {
                  toast.error("Không thể cập nhật cài đặt");
                }
              }}
            />
          ) : (
            <ConversationInfoPanel
              conversation={activeConversation}
              messages={displayMessages}
              currentUserId={user?.userId}
              onDeleteConversation={() => {
                setActiveConversation(null);
                alert("Xóa lịch sử trò chuyện thành công");
              }}
            />
          ))}
      </div>

      {callStatus !== "idle" && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            width: 340,
            borderRadius: 16,
            border: "1px solid rgba(148,163,184,.32)",
            background: "linear-gradient(165deg, #0b1220 0%, #16243f 100%)",
            boxShadow: "0 20px 48px rgba(0,0,0,.55)",
            padding: 14,
            zIndex: 60,
            color: "#e2e8f0",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {callStatus === "incoming"
              ? `${incomingCallerName || "Người dùng"} đang gọi`
              : `Đang gọi ${otherUser?.displayName || "Người dùng"}`}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
            {callKind === "video" ? "Cuộc gọi video" : "Cuộc gọi thoại"} •{" "}
            {callStatus === "outgoing"
              ? "Đang đổ chuông"
              : callStatus === "connecting"
                ? "Đang kết nối"
                : callStatus === "in-call"
                  ? "Đang trong cuộc gọi"
                  : "Đang chờ phản hồi"}
          </div>
          {callStatus === "in-call" && (
            <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 10 }}>
              Thời lượng: {formatCallDuration(callElapsedSeconds)}
            </div>
          )}

          {callKind === "video" && (
            <div
              style={{
                position: "relative",
                height: 180,
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid rgba(148,163,184,.25)",
                background: "#020617",
                marginBottom: 10,
              }}
            >
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: "absolute",
                  width: 110,
                  height: 74,
                  right: 10,
                  bottom: 10,
                  borderRadius: 10,
                  objectFit: "cover",
                  border: "1px solid rgba(148,163,184,.35)",
                  background: "#0f172a",
                }}
              />
            </div>
          )}

          {callKind === "voice" && <audio ref={remoteAudioRef} autoPlay />}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {callStatus === "incoming" ? (
              <>
                <button
                  onClick={rejectIncomingCall}
                  style={{
                    border: "1px solid rgba(248,113,113,.35)",
                    background: "rgba(248,113,113,.12)",
                    color: "#fca5a5",
                    borderRadius: 10,
                    padding: "7px 12px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Từ chối
                </button>
                <button
                  onClick={() => void acceptIncomingCall()}
                  style={{
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    borderRadius: 10,
                    padding: "7px 12px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Nhận
                </button>
              </>
            ) : (
              <>
                {callStatus === "in-call" && (
                  <>
                    <button
                      onClick={toggleMic}
                      style={{
                        border: "1px solid rgba(148,163,184,.3)",
                        background: "rgba(148,163,184,.12)",
                        color: "#e2e8f0",
                        borderRadius: 10,
                        padding: "7px 10px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {isMicMuted ? "Bật mic" : "Tắt mic"}
                    </button>
                    {callKind === "video" && (
                      <button
                        onClick={toggleCamera}
                        style={{
                          border: "1px solid rgba(148,163,184,.3)",
                          background: "rgba(148,163,184,.12)",
                          color: "#e2e8f0",
                          borderRadius: 10,
                          padding: "7px 10px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {isCameraOff ? "Bật cam" : "Tắt cam"}
                      </button>
                    )}
                    {callKind === "voice" && (
                      <button
                        onClick={() => void upgradeVoiceToVideo()}
                        style={{
                          border: "1px solid rgba(96,165,250,.35)",
                          background: "rgba(59,130,246,.14)",
                          color: "#bfdbfe",
                          borderRadius: 10,
                          padding: "7px 10px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Nâng cấp video
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={endCall}
                  style={{
                    border: "none",
                    background: "#dc2626",
                    color: "white",
                    borderRadius: 10,
                    padding: "7px 12px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Kết thúc
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 40,
            width: 220,
            borderRadius: 16,
            border: "0.5px solid rgba(148,163,184,.22)",
            background: "linear-gradient(165deg, #0f172a 0%, #1e293b 100%)",
            boxShadow: "0 20px 42px rgba(0,0,0,.55)",
            padding: 7,
          }}
        >
          {!contextMenu.message.isRecalled && (
            <button
              onClick={() => {
                setReplyingTo(contextMenu.message);
                setContextMenu(null);
              }}
              style={contextMenuItemStyle}
              className="menu-item"
            >
              <Reply size={15} /> Trả lời
            </button>
          )}
          {contextMenu.message.senderId === user?.userId &&
            !contextMenu.message.isRecalled &&
            canRecall(contextMenu.message) && (
              <button
                onClick={() => {
                  const payload = decodeChatPayload(
                    contextMenu.message.content,
                  );
                  const currentText =
                    payload?.text || contextMenu.message.content || "";
                  setEditInput(currentText);
                  setEditingMessage(contextMenu.message);
                  setContextMenu(null);
                }}
                style={contextMenuItemStyle}
                className="menu-item"
              >
                <Pencil size={15} /> Chỉnh sửa
              </button>
            )}
          {canRecall(contextMenu.message) && (
            <button
              onClick={() => void handleRecall()}
              style={contextMenuItemStyle}
              className="menu-item"
            >
              <RotateCcw size={15} /> Thu hồi
            </button>
          )}
          {!contextMenu.message.isRecalled &&
            canRecall(contextMenu.message) && (
              <div
                style={{
                  height: "0.5px",
                  background: "rgba(148,163,184,.1)",
                  margin: "4px 0",
                }}
              />
            )}
          {!contextMenu.message.isRecalled && (
            <button
              onClick={() => {
                setForwardingMessage(contextMenu.message);
                setIsForwardModalOpen(true);
                setContextMenu(null);
              }}
              style={contextMenuItemStyle}
              className="menu-item"
            >
              <Send size={15} /> Chuyển tiếp
            </button>
          )}
          {!contextMenu.message.isRecalled && (
            <button
              onClick={() => void handleDeleteForMe()}
              style={{ ...contextMenuItemStyle, color: "#fca5a5" }}
              className="menu-item"
            >
              <Trash2 size={15} /> Xóa phía tôi
            </button>
          )}
        </div>
      )}

      {/* Vote viewer popup */}
      {voteViewer && (
        <div
          style={{
            position: "fixed",
            top: voteViewer.y,
            left: voteViewer.x,
            zIndex: 45,
            width: 300,
            borderRadius: 16,
            border: "0.5px solid rgba(96,165,250,.3)",
            background: "rgba(15,23,42,0.95)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 20px 42px rgba(0,0,0,.6)",
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>
                {voteViewer.optionLabel}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>
                {voteViewer.totalVotes} lượt bình chọn
              </div>
            </div>
            <button
              onClick={() => setVoteViewer(null)}
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
          <div style={{ display: "grid", gap: 8 }}>
            {voteViewer.users.map((person, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  background: "rgba(255,255,255,.03)",
                  borderRadius: 12,
                }}
              >
                {person.avatarUrl ? (
                  <img
                    src={person.avatarUrl}
                    style={{ width: 28, height: 28, borderRadius: "50%" }}
                    alt=""
                  />
                ) : (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <UserIcon size={14} />
                  </div>
                )}
                <span style={{ fontSize: 13, color: "#e2e8f0" }}>
                  {person.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image preview */}
      {imagePreviewUrl && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            cursor: "zoom-out",
          }}
          onClick={() => setImagePreviewUrl(null)}
        >
          <button
            onClick={() => setImagePreviewUrl(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={24} />
          </button>
          <img
            src={imagePreviewUrl}
            alt="Preview"
            style={{
              maxHeight: "90vh",
              maxWidth: "90vw",
              objectFit: "contain",
              borderRadius: 8,
              boxShadow: "0 0 30px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {showAddMemberModal && activeConversation?.group && (
        <AddMemberModal
          conversationId={activeConversationId!}
          currentParticipantIds={activeConversation.participants.map(
            (p) => p._id,
          )}
          onClose={() => setShowAddMemberModal(false)}
          onAdd={async (targetUserId) => {
            if (!activeConversationId) return;
            try {
              const result = await addMemberToGroup(
                activeConversationId,
                targetUserId,
              );
              if (result.needsApproval) {
                toast("Yêu cầu đã gửi, chờ trưởng/phó nhóm duyệt");
              } else {
                toast.success("Đã thêm thành viên vào nhóm");
              }
              setShowAddMemberModal(false);
            } catch {
              toast.error("Không thể thêm thành viên");
            }
          }}
        />
      )}

      {/* Forward modal */}
      {isForwardModalOpen && forwardingMessage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#1e293b",
              width: 400,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <h3 style={{ color: "white", marginBottom: 15 }}>
              Chuyển tiếp tin nhắn
            </h3>
            <input
              placeholder="Tìm hội thoại..."
              value={forwardSearch}
              onChange={(e) => setForwardSearch(e.target.value)}
              style={pollInputStyle}
            />
            <div style={{ maxHeight: 300, overflowY: "auto", marginTop: 15 }}>
              {conversations
                .filter((c) => {
                  const name =
                    c.group?.name ||
                    c.participants.find((p) => p._id !== user?.userId)
                      ?.displayName ||
                    "Người dùng";
                  return name
                    .toLowerCase()
                    .includes(forwardSearch.toLowerCase());
                })
                .map((conv) => {
                  const isSelected = selectedConvs.includes(conv._id);
                  const chatName =
                    conv.group?.name ||
                    conv.participants.find((p) => p._id !== user?.userId)
                      ?.displayName ||
                    "Đoạn chat";
                  return (
                    <label
                      key={conv._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        cursor: "pointer",
                        background: isSelected
                          ? "rgba(37,99,235,0.1)"
                          : "transparent",
                        borderRadius: 8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedConvs((prev) => [...prev, conv._id]);
                          } else {
                            setSelectedConvs((prev) =>
                              prev.filter((id) => id !== conv._id),
                            );
                          }
                        }}
                      />
                      <span style={{ color: "white", fontSize: 14 }}>
                        {chatName}
                      </span>
                    </label>
                  );
                })}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => {
                  setIsForwardModalOpen(false);
                  setSelectedConvs([]);
                }}
                style={miniButtonStyle}
              >
                Hủy
              </button>
              <button
                disabled={selectedConvs.length === 0 || sending}
                onClick={async () => {
                  setSending(true);
                  await forwardMessage(forwardingMessage, selectedConvs);
                  setIsForwardModalOpen(false);
                  setSelectedConvs([]);
                  setForwardingMessage(null);
                  setSending(false);
                }}
                style={miniButtonPrimaryStyle}
              >
                Gửi ({selectedConvs.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
