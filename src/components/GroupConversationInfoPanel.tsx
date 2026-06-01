import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  File,
  Link as LinkIcon,
  Trash2,
  Bell,
  LogOut,
  Pin,
  Search,
  Settings,
  Edit,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import type { Conversation, Message } from "@/types/chat";
import { decodeChatPayload } from "@/utils/chatMessageCodec";
import type { GroupJoinRequest } from "@/types/store";
import { useFriendStore } from "@/stores/useFriendStore";
import ArchiveModal from "@/components/ArchiveModal";

interface GroupConversationInfoPanelProps {
  visible?: boolean;
  onClose?: () => void;
  conversation: Conversation;
  messages: Message[];
  currentUserId?: string;
  isAdminOrOwner?: boolean;
  onUpdateMemberRole?: (targetUserId: string, role: "admin" | "member") => void;
  onRemoveMember?: (targetUserId: string) => void;
  onDeleteConversation?: () => void;
  onManageGroup?: () => void;
  onAddMember?: (targetUserId: string) => void;
  onLeaveGroup?: () => void;
  onDissolveGroup?: () => void;
  onDeleteHistory?: () => void;
  onReviewRequest?: (
    requestId: string,
    action: "approved" | "rejected",
  ) => Promise<void>;
  onUpdateSettings?: (settings: {
    requireApprovalToJoin?: boolean;
    whoCanEditGroup?: "all" | "admin";
    whoCanSendMessages?: "all" | "admin";
  }) => Promise<void>;
  onUpdateGroupInfo?: (data: { name?: string; avatar?: File }) => Promise<void>;
  pendingRequests?: GroupJoinRequest[];
  isPinned?: boolean;
  onTogglePin?: () => void;
}

interface ExpandableSectionProps {
  title: string;
  sectionKey: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];

function isImageFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.includes(ext);
}

function ExpandableSection({
  title,
  sectionKey,
  isEmpty,
  emptyMessage,
  children,
  expandedSections,
  toggleSection,
}: ExpandableSectionProps) {
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(148,163,184,0.15)",
        paddingBottom: 0,
      }}
    >
      <button
        onClick={() => toggleSection(sectionKey)}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          color: "#f1f5f9",
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(148,163,184,0.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
        }}
      >
        <span>{title}</span>
        <ChevronDown
          size={18}
          style={{
            transform: expandedSections[sectionKey] ? "rotate(180deg)" : "",
            transition: "transform 0.2s",
            color: "#94a3b8",
          }}
        />
      </button>

      {expandedSections[sectionKey] && (
        <div
          style={{
            padding: "0 16px 16px",
            borderTop: "1px solid rgba(148,163,184,0.1)",
          }}
        >
          {isEmpty ? (
            <p
              style={{
                margin: 0,
                color: "#94a3b8",
                fontSize: 12,
                textAlign: "center",
                padding: "12px",
              }}
            >
              {emptyMessage}
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

// ─── Reusable Toggle Row ───────────────────────────────────────────────────────
function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
  disabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderRadius: 12,
        background: "rgba(148,163,184,0.05)",
        border: "1px solid rgba(148,163,184,0.12)",
        gap: 12,
      }}
    >
      <div>
        <p
          style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
        >
          {title}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 11,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          border: "none",
          background: enabled ? "#2563eb" : "rgba(148,163,184,0.3)",
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.2s",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 4,
            left: enabled ? 23 : 4,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "white",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </div>
  );
}

export default function GroupConversationInfoPanel({
  conversation,
  messages,
  currentUserId,
  onDeleteConversation,
  onManageGroup,
  onLeaveGroup,
  onUpdateMemberRole,
  onDissolveGroup,
  onRemoveMember,
  onAddMember: _onAddMember,
  pendingRequests,
  onReviewRequest,
  isAdminOrOwner,
  onUpdateSettings,
  isPinned,
  onTogglePin,
}: GroupConversationInfoPanelProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    media: true,
    files: true,
    members: false,
    links: true,
  });
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const { checkFriendship, addFriend, cancelRequest, getFriendStatus } =
    useFriendStore();
  const targetStatuses = useFriendStore((s) => s.targetStatuses);
  const [friendMap, setFriendMap] = useState<Record<string, boolean>>();
  const [searchMember, setSearchMember] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [pendingMap, setPendingMap] = useState<Record<string, string>>({});

  const [removeConfirm, setRemoveConfirm] = useState<{
    memberId: string;
    memberName: string;
  } | null>(null);

  const [isManageGroupOpen, setIsManageGroupOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const memberIds = conversation.participants
      .filter((p) => p._id !== currentUserId)
      .map((p) => p._id.toString());

    if (memberIds.length === 0) return;

    const fetchStatuses = async () => {
      const friendshipResults = await Promise.all(
        memberIds.map(async (id) => {
          const isFriend = await checkFriendship(id);
          return [id, isFriend] as [string, boolean];
        }),
      );
      setFriendMap(Object.fromEntries(friendshipResults));
      for (const id of memberIds) {
        const status = await getFriendStatus(id);
        if (status === "sent") {
          setPendingMap((prev) => ({ ...prev, [id]: "pending_request_id" }));
        }
      }
    };
    fetchStatuses();
  }, [conversation.participants, currentUserId]);

  const currentParticipant = conversation.participants.find(
    (p) => p._id === currentUserId,
  );
  const isOwner = currentParticipant?.role === "owner";
const isAdmin = currentParticipant?.role === "admin";
  const canManage = isOwner || isAdmin;

  const getDisplayParticipants = useMemo(() => {
    return (conversation.participants || []).slice(0, 3);
  }, [conversation.participants]);

  const getAvatarColor = (name: string) => {
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
    for (let i = 0; i < name.length; i++)
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const mediaFiles = useMemo(() => {
    const media: Array<{
      type: "image" | "audio";
      url: string;
      name?: string;
      timestamp: string;
      senderName?: string;
    }> = [];

    messages.forEach((msg) => {
      const payload = decodeChatPayload(msg.content);
      if (!payload) return;

      const sender = conversation.participants.find(
        (p) => p._id === msg.senderId,
      );

      if (payload.kind === "image" && payload.attachment) {
        media.push({
          type: "image",
          url: payload.attachment.url,
          timestamp: msg.createdAt,
          senderName: sender?.displayName,
        });
      } else if (payload.kind === "audio" && payload.attachment) {
        media.push({
          type: "audio",
          url: payload.attachment.url,
          name: payload.attachment.name,
          timestamp: msg.createdAt,
          senderName: sender?.displayName,
        });
      } else if (payload.kind === "file" && payload.attachment) {
        if (isImageFile(payload.attachment.name)) {
          media.push({
            type: "image",
            url: payload.attachment.url,
            timestamp: msg.createdAt,
            senderName: sender?.displayName,
          });
        }
      }

      if (payload.kind === "image" && payload.attachments?.length) {
        payload.attachments.forEach((att) => {
          media.push({
            type: "image",
            url: att.url,
            timestamp: msg.createdAt,
            senderName: sender?.displayName,
          });
        });
      }
      if (payload.kind === "file" && payload.attachments?.length) {
        payload.attachments.forEach((att) => {
          if (isImageFile(att.name)) {
            media.push({
              type: "image",
              url: att.url,
              timestamp: msg.createdAt,
              senderName: sender?.displayName,
            });
          }
        });
      }
    });

    return media.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [messages, conversation.participants]);

  const fileList = useMemo(() => {
    const files: Array<{
      url: string;
      name: string;
      timestamp: string;
      senderName?: string;
    }> = [];

    messages.forEach((msg) => {
      const payload = decodeChatPayload(msg.content);
      if (!payload) return;

      if (payload.kind === "file" && payload.attachment) {
        if (!isImageFile(payload.attachment.name)) {
          const sender = conversation.participants.find(
            (p) => p._id === msg.senderId,
          );
          files.push({
            url: payload.attachment.url,
            name: payload.attachment.name,
            timestamp: msg.createdAt,
            senderName: sender?.displayName,
          });
        }
      }

      if (payload.kind === "file" && payload.attachments?.length) {
        const sender = conversation.participants.find(
          (p) => p._id === msg.senderId,
        );
        payload.attachments.forEach((att) => {
          if (!isImageFile(att.name)) {
            files.push({
              url: att.url,
              name: att.name,
              timestamp: msg.createdAt,
              senderName: sender?.displayName,
            });
          }
        });
      }
    });

    return files.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [messages, conversation.participants]);

  const links = useMemo(() => {
    const linkList: Array<{
      url: string;
      preview: string;
      timestamp: string;
      senderName?: string;
    }> = [];

    messages.forEach((msg) => {
      const payload = decodeChatPayload(msg.content);
      if (!payload) return;

      if (payload.kind === "text" && payload.text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = payload.text.match(urlRegex);
        if (matches) {
          const sender = conversation.participants.find(
            (p) => p._id === msg.senderId,
          );
          matches.forEach((url) => {
            linkList.push({
              url,
              preview: url.length > 40 ? url.substring(0, 40) + "..." : url,
              timestamp: msg.createdAt,
              senderName: sender?.displayName,
            });
          });
        }
      }
    });

    return linkList.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [messages, conversation.participants]);

  const fileListDisplay = useMemo(() => fileList.slice(0, 3), [fileList]);
  const mediaFilesDisplay = useMemo(() => mediaFiles.slice(0, 6), [mediaFiles]);
  const linksDisplay = useMemo(() => links.slice(0, 3), [links]);

  const filteredMembers = useMemo(() => {
    if (!searchMember.trim()) return conversation.participants;
    return conversation.participants.filter((p) =>
      p.displayName.toLowerCase().includes(searchMember.toLowerCase()),
    );
  }, [conversation.participants, searchMember]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const uniquePendingRequests = useMemo(() => {
    if (!pendingRequests) return [];
    const map = new Map();
    pendingRequests.forEach((req) => {
      const uId = req.invitedUserId?._id || req.invitedUserId;
      map.set(uId, req);
    });
    return Array.from(map.values());
  }, [pendingRequests]);

  // Settings shorthand
  // Settings với local state để toggle hoạt động ngay lập tức
  const settings = conversation.group?.settings as any;

  const [requireApproval, setRequireApproval] = useState(
    settings?.requireApprovalToJoin ?? false,
  );
  const [allowMembersEditInfo, setAllowMembersEditInfo] = useState(
    settings?.whoCanEditGroup === "all",
  );
  const [allowMembersChat, setAllowMembersChat] = useState(
    settings?.whoCanSendMessages === "all",
  );

  // Đồng bộ khi conversation thay đổi từ bên ngoài
  useEffect(() => {
    console.log("Settings changed:", settings);
    if (!settings) return;
    setRequireApproval(settings.requireApprovalToJoin ?? false);
    setAllowMembersEditInfo(settings.whoCanEditGroup === "all");
    setAllowMembersChat(settings.whoCanSendMessages === "all");
  }, [
    settings?.requireApprovalToJoin,
    settings?.whoCanEditGroup,
    settings?.whoCanSendMessages,
  ]);

  return (
    <div
      style={{
        width: "320px",
        background: "linear-gradient(180deg, #0f172a 0%, #1a1f3a 100%)",
        borderLeft: "1px solid rgba(148,163,184,0.15)",
        display: "flex",
        flexDirection: "column",
        color: "white",
        overflowY: "auto",
      }}
    >
      {/* Group Info Header */}
      <div
        style={{
          padding: "20px 16px",
          borderBottom: "1px solid rgba(148,163,184,0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Avatar */}
        <div style={{ position: "relative", width: 80, height: 80 }}>
          {conversation.group?.avatar ? (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid rgba(99,102,241,0.3)",
                boxShadow: "0 0 0 3px rgba(99,102,241,0.1)",
              }}
            >
              <img
                src={conversation.group.avatar}
                alt={conversation.group?.name || "Nhóm"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : (
            getDisplayParticipants.slice(0, 3).map((p, idx) => {
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

              return (
                <div
                  key={p._id}
                  style={{
                    position: "absolute",
                    width: idx === 0 ? 50 : 40,
                    height: idx === 0 ? 50 : 40,
                    borderRadius: "50%",
                    border: "2px solid #0f172a",
                    overflow: "hidden",
                    background: p.avatarUrl
                      ? undefined
                      : getAvatarColor(p.displayName),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: idx === 0 ? 16 : 12,
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
            })
          )}
        </div>

        {/* Name + Edit button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
              maxWidth: "calc(100% - 16px)",
            }}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: "#f1f5f9",
                textAlign: "center",
                lineHeight: 1.4,
                wordBreak: "break-word",
              }}
            >
              {conversation.group?.name || "Nhóm chat"}
            </h3>
            {(canManage || allowMembersEditInfo) && (
              <button
                title="Chỉnh sửa nhóm"
                onClick={onManageGroup}
                style={{
                  marginTop: 3,
                  padding: "4px 6px",
                  borderRadius: 6,
                  border: "1px solid rgba(148,163,184,0.2)",
                  background: "rgba(148,163,184,0.05)",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(148,163,184,0.1)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(148,163,184,0.05)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#94a3b8";
                }}
              >
                <Edit size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          {/* Pin */}
          <button
            title={isPinned ? "Bỏ ghim hội thoại" : "Ghim hội thoại"}
            onClick={onTogglePin}
            style={{
              flex: 1,
              padding: "10px 6px",
              borderRadius: 10,
              border: isPinned
                ? "1px solid rgba(245,158,11,0.4)"
                : "1px solid rgba(148,163,184,0.2)",
              background: isPinned
                ? "rgba(245,158,11,0.12)"
                : "rgba(148,163,184,0.05)",
              color: isPinned ? "#f59e0b" : "#94a3b8",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              cursor: "pointer",
              fontSize: 10,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = isPinned
                ? "rgba(245,158,11,0.2)"
                : "rgba(148,163,184,0.1)";
              btn.style.color = isPinned ? "#f59e0b" : "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = isPinned
                ? "rgba(245,158,11,0.12)"
                : "rgba(148,163,184,0.05)";
              btn.style.color = isPinned ? "#f59e0b" : "#94a3b8";
            }}
          >
            <Pin size={16} style={{ fill: isPinned ? "#f59e0b" : "none" }} />
            <span>{isPinned ? "Bỏ ghim" : "Ghim hội thoại"}</span>
          </button>

          {/* Bell */}
          <button
            title="Tắt thông báo"
            onClick={() => {}}
            style={{
              flex: 1,
              padding: "10px 6px",
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.2)",
              background: "rgba(148,163,184,0.05)",
              color: "#94a3b8",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              cursor: "pointer",
              fontSize: 10,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(148,163,184,0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(148,163,184,0.05)";
              (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
            }}
          >
            <Bell size={16} />
            <span>Tắt thông báo</span>
          </button>

          {/* Manage Group — same style always, disabled if not admin/owner */}
          <button
            title={
              canManage
                ? "Quản lý nhóm"
                : "Chỉ trưởng nhóm/phó nhóm mới có thể quản lý"
            }
            onClick={() => {
              if (canManage) setIsManageGroupOpen(true);
            }}
            disabled={!canManage}
            style={{
              flex: 1,
              padding: "10px 6px",
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.2)",
              background: "rgba(148,163,184,0.05)",
              color: "#94a3b8",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              cursor: canManage ? "pointer" : "not-allowed",
              fontSize: 10,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!canManage) return;
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(148,163,184,0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              if (!canManage) return;
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(148,163,184,0.05)";
              (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
            }}
          >
            <Settings size={16} />
            <span>Quản lý nhóm</span>
          </button>
        </div>
      </div>

      {/* Members Section */}
      <ExpandableSection
        title={`Thành viên (${conversation.participants.length})`}
        sectionKey="members"
        isEmpty={conversation.participants.length === 0}
        emptyMessage="Không có thành viên nào"
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Search */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder="Tìm thành viên..."
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 8px 8px 32px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.2)",
                background: "rgba(148,163,184,0.05)",
                color: "#f1f5f9",
                fontSize: 12,
              }}
            />
          </div>

          {/* Pending requests (inline in members list) */}
          {isAdminOrOwner &&
            uniquePendingRequests &&
            uniquePendingRequests.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    margin: "0 0 6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: 600,
                  }}
                >
                  Chờ duyệt ({uniquePendingRequests.length})
                </p>
                {uniquePendingRequests.map((req) => (
                  <div
                    key={req._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: "rgba(15,23,42,0.6)",
                      border: "1px solid rgba(148,163,184,0.12)",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: req.invitedUserId.avatarUrl
                          ? "transparent"
                          : "#1e293b",
                        border: "1px solid rgba(148,163,184,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#94a3b8",
                        flexShrink: 0,
                        overflow: "hidden",
                      }}
                    >
                      {req.invitedUserId.avatarUrl ? (
                        <img
                          src={req.invitedUserId.avatarUrl}
                          alt={req.invitedUserId.displayName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        req.invitedUserId.displayName?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "#f1f5f9",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {req.invitedUserId.displayName}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
                        mời bởi {req.invitedBy.displayName}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={async () => {
                          await onReviewRequest?.(req._id, "approved");
                        }}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 7,
                          border: "1px solid rgba(37,99,235,0.4)",
                          background: "rgba(37,99,235,0.15)",
                          color: "#93c5fd",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Duyệt
                      </button>
                      <button
                        onClick={() => onReviewRequest?.(req._id, "rejected")}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 7,
                          border: "1px solid rgba(148,163,184,0.2)",
                          background: "rgba(148,163,184,0.08)",
                          color: "#64748b",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* Members list */}
          {filteredMembers.map((member) => {
            const isMe = member._id === currentUserId;
            const targetStatus = targetStatuses[member._id];
            const isFriend =
              targetStatus === "friend" || friendMap?.[member._id.toString()];
            const requestId = targetStatus === "sent" || pendingMap[member._id];
            return (
              <div
                key={member._id}
                style={{ position: "relative" }}
                onMouseEnter={() => setHoveredMemberId(member._id)}
                onMouseLeave={() => {
                  if (menuOpenId !== member._id) {
                    setHoveredMemberId(null);
                  }
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px",
                    borderRadius: 8,
                    background: "rgba(148,163,184,0.08)",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: member.avatarUrl
                        ? `url(${member.avatarUrl}) center/cover`
                        : "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {!member.avatarUrl &&
                      member.displayName?.[0]?.toUpperCase()}
                  </div>

                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: "#f1f5f9",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {member.displayName}
                      {member._id === currentUserId && (
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          {" "}
                          (Bạn)
                        </span>
                      )}
                    </p>
                    {member.role && member.role !== "member" && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color:
                            member.role === "owner" ? "#eab308" : "#94a3b8",
                          background:
                            member.role === "owner"
                              ? "rgba(234,179,8,0.1)"
                              : "rgba(148,163,184,0.1)",
                          border: `1px solid ${member.role === "owner" ? "rgba(234,179,8,0.25)" : "rgba(148,163,184,0.2)"}`,
                          padding: "1px 6px",
                          borderRadius: 5,
                        }}
                      >
                        {member.role === "owner" ? "Trưởng nhóm" : "Phó nhóm"}
                      </span>
                    )}
                  </div>

                  {!isMe && (
                    <div style={{ marginLeft: "auto" }}>
                      {isFriend ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#10b981",
                            background: "rgba(16,185,129,0.1)",
                            padding: "2px 6px",
                            borderRadius: 5,
                          }}
                        >
                          Bạn bè
                        </span>
                      ) : requestId ? (
                        <button
                          onClick={async () => {
                            if (typeof requestId === "string") {
                              await cancelRequest(requestId);
                            }
                            setPendingMap((prev) => {
                              const next = { ...prev };
                              delete next[member._id];
                              return next;
                            });
                          }}
                          title="Hủy yêu cầu"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "2px 7px",
                            borderRadius: 5,
                            border: "1px solid rgba(148,163,184,0.3)",
                            background: "rgba(148,163,184,0.08)",
                            color: "#94a3b8",
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Hủy yêu cầu
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            const newRequestId = await addFriend(member._id);
                            if (newRequestId) {
                              setPendingMap((prev) => ({
                                ...prev,
                                [member._id]: newRequestId,
                              }));
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "2px 7px",
                            borderRadius: 5,
                            border: "1px solid rgba(59,130,246,0.3)",
                            background: "rgba(59,130,246,0.08)",
                            color: "#60a5fa",
                            fontSize: 10,
                            cursor: "pointer",
                          }}
                        >
                          <UserPlus size={11} />
                          Kết bạn
                        </button>
                      )}
                    </div>
                  )}

                  {(isOwner || isAdmin) &&
                    member._id !== currentUserId &&
                    member.role !== "owner" &&
                    !(isAdmin && member.role === "admin") &&
                    hoveredMemberId === member._id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(
                            menuOpenId === member._id ? null : member._id,
                          );
                        }}
                        style={{
                          background: "rgba(148,163,184,0.15)",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 16,
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        ···
                      </button>
                    )}
                </div>

                {/* Dropdown menu */}
                {menuOpenId === member._id && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      background: "#1e293b",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: 10,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                      zIndex: 10,
                      minWidth: 180,
                      overflow: "hidden",
                    }}
                    onMouseEnter={() => setHoveredMemberId(member._id)}
                  >
                    {isOwner &&
                      (member.role === "member" || member.role === "admin" || !member.role ? (
                        <button
                          onClick={() => {
                            onUpdateMemberRole?.(member._id, "admin");
                            setMenuOpenId(null);
                          }}
                          style={{
                            width: "100%",
                            padding: "11px 16px",
                            background: "transparent",
                            border: "none",
                            color: "#f1f5f9",
                            fontSize: 13,
                            fontWeight: 500,
                            textAlign: "left",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          Thêm phó nhóm
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onUpdateMemberRole?.(member._id, "member");
                            setMenuOpenId(null);
                          }}
                          style={{
                            width: "100%",
                            padding: "11px 16px",
                            background: "transparent",
                            border: "none",
                            color: "#f87171",
                            fontSize: 13,
                            fontWeight: 500,
                            textAlign: "left",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          ✕ Xóa phó nhóm
                        </button>
                      ))}

                    {isOwner && (
                      <div
                        style={{
                          height: 1,
                          background: "rgba(148,163,184,0.1)",
                          margin: "2px 0",
                        }}
                      />
                    )}

                    <button
                      onClick={() => {
                        setRemoveConfirm({
                          memberId: member._id,
                          memberName: member.displayName,
                        });
                        setMenuOpenId(null);
                      }}
                      style={{
                        width: "100%",
                        padding: "11px 16px",
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        fontSize: 13,
                        fontWeight: 500,
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      🚫 Xóa khỏi nhóm
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ExpandableSection>

      {/* Media Section */}
      <ExpandableSection
        title="Ảnh/Video"
        sectionKey="media"
        isEmpty={mediaFiles.length === 0}
        emptyMessage="Chưa có Ảnh/Video được chia sẻ"
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {mediaFilesDisplay.map((media, index) => (
            <div
              key={index}
              onClick={() => {
                if (media.type === "image") setSelectedImage(media.url);
              }}
              style={{
                width: "100%",
                paddingBottom: "100%",
                position: "relative",
                borderRadius: 10,
                overflow: "hidden",
                background: media.type === "image" ? "#3b82f6" : "#f59e0b",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              title={media.senderName ? `Từ ${media.senderName}` : ""}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  "scale(1)";
              }}
            >
              {media.type === "image" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${media.url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </ExpandableSection>

      {/* Files Section */}
      <ExpandableSection
        title="File"
        sectionKey="files"
        isEmpty={fileList.length === 0}
        emptyMessage="Chưa có File được chia sẻ"
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {fileListDisplay.map((file, index) => (
            <a
              key={index}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px",
                borderRadius: 8,
                background: "rgba(148,163,184,0.08)",
                color: "#2563eb",
                textDecoration: "none",
                fontSize: 12,
                transition: "background 0.2s",
              }}
              title={file.senderName ? `Từ ${file.senderName}` : ""}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(148,163,184,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(148,163,184,0.08)";
              }}
            >
              <File size={14} style={{ color: "#8b5cf6", flexShrink: 0 }} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                {file.name}
              </span>
            </a>
          ))}
        </div>
      </ExpandableSection>

      {/* Links Section */}
      <ExpandableSection
        title="Link"
        sectionKey="links"
        isEmpty={links.length === 0}
        emptyMessage="Chưa có Link được chia sẻ"
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {linksDisplay.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px",
                borderRadius: 8,
                background: "rgba(148,163,184,0.08)",
                color: "#2563eb",
                textDecoration: "none",
                fontSize: 12,
                transition: "background 0.2s",
              }}
              title={link.senderName ? `Từ ${link.senderName}` : ""}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(148,163,184,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(148,163,184,0.08)";
              }}
            >
              <LinkIcon size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {link.preview}
              </span>
            </a>
          ))}
        </div>
      </ExpandableSection>

      {/* View All Button */}
      <button
        onClick={() => setIsArchiveOpen(true)}
        style={{
          margin: "16px",
          padding: "12px",
          borderRadius: 10,
          border: "1px solid rgba(37,99,235,0.3)",
          background: "rgba(37,99,235,0.08)",
          color: "#2563eb",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(37,99,235,0.15)";
          (e.currentTarget as HTMLButtonElement).style.color = "#3b82f6";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(37,99,235,0.08)";
          (e.currentTarget as HTMLButtonElement).style.color = "#2563eb";
        }}
      >
        Xem tất cả
      </button>

      {/* Leave & Delete Buttons */}
      <div
        style={{
          padding: "16px",
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <button
          onClick={onLeaveGroup}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            border: "1px solid rgba(248,113,113,0.3)",
            background: "rgba(248,113,113,0.08)",
            color: "#f87171",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(248,113,113,0.15)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(248,113,113,0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
          }}
        >
          <LogOut size={16} />
          Rời khỏi nhóm
        </button>
        <button
          onClick={onDeleteConversation}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            border: "1px solid rgba(248,113,113,0.3)",
            background: "rgba(248,113,113,0.08)",
            color: "#f87171",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(248,113,113,0.15)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(248,113,113,0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
          }}
        >
          <Trash2 size={16} />
          Xóa lịch sử trò chuyện
        </button>

        {isOwner && (
          <button
            onClick={onDissolveGroup}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "1px solid rgba(239,68,68,0.4)",
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,0.18)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
            }}
          >
            <Trash2 size={16} />
            Giải tán nhóm
          </button>
        )}
      </div>

      {/* ─── Manage Group Modal (single tab, 3 toggles) ─── */}
      {isManageGroupOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 400,
          }}
          onClick={() => setIsManageGroupOpen(false)}
        >
          <div
            style={{
              background: "linear-gradient(145deg, #0f172a 0%, #1a1f3a 100%)",
              borderRadius: 18,
              width: "100%",
              maxWidth: 440,
              border: "1px solid rgba(148,163,184,0.15)",
              boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 20px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(148,163,184,0.1)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#f1f5f9",
                }}
              >
                Quản lý nhóm
              </h2>
              <button
                onClick={() => setIsManageGroupOpen(false)}
                style={{
                  background: "rgba(148,163,184,0.1)",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(148,163,184,0.2)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(148,163,184,0.1)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#94a3b8";
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Settings Content */}
            <div
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* 1. Phê duyệt thành viên mới */}
              <ToggleRow
                title="Phê duyệt thành viên mới"
                description="Thành viên mới cần được duyệt trước khi vào nhóm"
                enabled={requireApproval}
                onToggle={() => {
                  const next = !requireApproval;
                  setRequireApproval(next);
                  onUpdateSettings?.({ requireApprovalToJoin: next });
                }}
                disabled={!onUpdateSettings}
              />

              {/* Separator */}
              <div
                style={{
                  height: 1,
                  background: "rgba(148,163,184,0.08)",
                  margin: "2px 0",
                }}
              />

              {/* 2. Chỉnh sửa ảnh & tên nhóm */}
              <ToggleRow
                title="Thay đổi ảnh và tên nhóm"
                description={
                  allowMembersEditInfo
                    ? "Tất cả thành viên có thể thay đổi ảnh và tên nhóm"
                    : "Chỉ trưởng nhóm và phó nhóm mới có thể thay đổi"
                }
                enabled={allowMembersEditInfo}
                onToggle={() => {
                  const next = !allowMembersEditInfo;
                  setAllowMembersEditInfo(next);
                  onUpdateSettings?.({
                    whoCanEditGroup: next ? "all" : "admin",
                  });
                }}
                disabled={!onUpdateSettings}
              />

              {/* 3. Gửi tin nhắn */}
              <ToggleRow
                title="Gửi tin nhắn"
                description={
                  allowMembersChat
                    ? "Tất cả thành viên có thể nhắn tin trong nhóm"
                    : "Chỉ trưởng nhóm và phó nhóm mới được nhắn tin"
                }
                enabled={allowMembersChat}
                onToggle={() => {
                  const next = !allowMembersChat;
                  setAllowMembersChat(next);
                  onUpdateSettings?.({
                    whoCanSendMessages: next ? "all" : "admin",
                  });
                }}
                disabled={!onUpdateSettings}
              />
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirm Modal */}
      {removeConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
          }}
          onClick={() => setRemoveConfirm(null)}
        >
          <div
            style={{
              background: "linear-gradient(145deg, #111827 0%, #1a1f3a 100%)",
              borderRadius: 16,
              padding: "28px 24px",
              width: "100%",
              maxWidth: 360,
              border: "1px solid rgba(239,68,68,0.2)",
              boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <UserMinus size={22} color="#ef4444" />
            </div>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 17,
                fontWeight: 700,
                color: "#f1f5f9",
                textAlign: "center",
              }}
            >
              Xóa thành viên
            </h3>
            <p
              style={{
                margin: "0 0 24px",
                fontSize: 13,
                color: "#94a3b8",
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              Bạn có chắc muốn xóa{" "}
              <strong style={{ color: "#f1f5f9" }}>
                {removeConfirm.memberName}
              </strong>{" "}
              khỏi nhóm không?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setRemoveConfirm(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.2)",
                  background: "transparent",
                  color: "#94a3b8",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onRemoveMember?.(removeConfirm.memberId);
                  setRemoveConfirm(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#dc2626",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        mediaFiles={mediaFiles}
        fileList={fileList}
        links={links}
      />

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "20px",
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Preview"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 16,
              border: "2px solid rgba(148,163,184,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              background: "rgba(0,0,0,0.6)",
              border: "none",
              color: "white",
              cursor: "pointer",
              width: 40,
              height: 40,
              borderRadius: "50%",
              fontSize: 20,
              zIndex: 201,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
