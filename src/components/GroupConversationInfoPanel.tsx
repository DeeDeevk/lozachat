import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  File,
  Link as LinkIcon,
  Trash2,
  X,
  Bell,
  LogOut,
  Pin,
  Search,
  Settings,
  ImagePlus,
  Edit,
} from "lucide-react";
import type { Conversation, Message } from "@/types/chat";
import { decodeChatPayload } from "@/utils/chatMessageCodec";

interface GroupConversationInfoPanelProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId?: string;
  onDeleteConversation?: () => void;
  onManageGroup?: () => void;
  onLeaveGroup?: () => void;
  onUpdateMemberRole?: (targetUserId: string, role: "admin" | "member") => void;
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

// Image file extensions
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

export default function GroupConversationInfoPanel({
  conversation,
  messages,
  currentUserId,
  onDeleteConversation,
  onManageGroup,
  onLeaveGroup,
  onUpdateMemberRole,
}: GroupConversationInfoPanelProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    media: true,
    files: true,
    members: false, // Mặc định đóng
    links: true,
  });
  const [searchMember, setSearchMember] = useState("");
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const currentParticipant = conversation.participants.find(
    (p) => p._id === currentUserId,
  );
  console.log("participants:", conversation.participants);
  console.log("currentUserId:", currentUserId);
  console.log("currentParticipant:", currentParticipant);
  const isOwner = currentParticipant?.role === "owner";
  console.log("isOwner:", isOwner);
  // Helper: Get display participants (first 3)
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
        {/* Avatar - Group with 2-3 members */}
        <div
          style={{
            position: "relative",
            width: 80,
            height: 80,
          }}
        >
          {getDisplayParticipants.slice(0, 3).map((p, idx) => {
            const size = 80;
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
          })}
        </div>

        {/* Name + Edit button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              color: "#f1f5f9",
            }}
          >
            {conversation.group?.name || "Nhóm chat"}
          </h3>
          <button
            title="Chỉnh sửa nhóm"
            onClick={onManageGroup}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid rgba(148,163,184,0.2)",
              background: "rgba(148,163,184,0.05)",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
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
            <Edit size={14} />
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <button
            title="Ghim hội thoại"
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
            <Pin size={16} />
            <span>Ghim hội thoại</span>
          </button>
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
          <button
            title="Quản lý nhóm"
            onClick={onManageGroup}
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
          <div
            style={{
              position: "relative",
              marginBottom: 8,
            }}
          >
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

          {/* Members list */}
          {filteredMembers.map((member) => (
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
                {/* Avatar */}
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
                  {!member.avatarUrl && member.displayName?.[0]?.toUpperCase()}
                </div>

                {/* Name + badge */}
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
                        color: member.role === "owner" ? "#f59e0b" : "#3b82f6",
                        background:
                          member.role === "owner"
                            ? "rgba(245,158,11,0.15)"
                            : "rgba(59,130,246,0.15)",
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {member.role === "owner" ? "Trưởng nhóm" : "Phó nhóm"}
                    </span>
                  )}
                </div>

                {/* Nút "..." — chỉ owner thấy, không hiện trên chính mình và trên owner khác */}
                {isOwner &&
                  member._id !== currentUserId &&
                  member.role !== "owner" &&
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
                  // Giữ menu mở khi hover vào chính nó
                  onMouseEnter={() => setHoveredMemberId(member._id)}
                >
                  {member.role === "member" ? (
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
                        fontSize: 13,
                        fontWeight: 500,
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(59,130,246,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
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
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(248,113,113,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                      }}
                    >
                      ✕ Xóa phó nhóm
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
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
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  "scale(1)";
              }}
              title={media.senderName ? `Từ ${media.senderName}` : ""}
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
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(148,163,184,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(148,163,184,0.08)";
              }}
              title={file.senderName ? `Từ ${file.senderName}` : ""}
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
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(148,163,184,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(148,163,184,0.08)";
              }}
              title={link.senderName ? `Từ ${link.senderName}` : ""}
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
      </div>
    </div>
  );
}
