import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  File,
  Link as LinkIcon,
  Trash2,
  Pin,
  Bell,
  MessageSquare,
} from "lucide-react";
import type { Conversation, Message } from "@/types/chat";
import { decodeChatPayload } from "@/utils/chatMessageCodec";
import ArchiveModal from "@/components/ArchiveModal";
import CreateGroupModal from "./CreateGroupModal";
import { useFriendStore } from "@/stores/useFriendStore";

interface ConversationInfoPanelProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId?: string;
  onDeleteConversation?: () => void;
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

export default function ConversationInfoPanel({
  conversation,
  messages,
  currentUserId,
  onDeleteConversation,
  isPinned,
  onTogglePin,
}: ConversationInfoPanelProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    media: true,
    files: true,
    links: true,
  });
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  const otherUser = useMemo(
    () => conversation.participants.find((p) => p._id !== currentUserId),
    [conversation.participants, currentUserId],
  );

  const { friends, getFriends } = useFriendStore();

  useEffect(() => {
    getFriends();
  }, []);

  const isStranger =
    !!otherUser && !friends.some((f) => f._id === otherUser._id);

  const mediaFiles = useMemo(() => {
    const media: Array<{
      type: "image" | "audio";
      url: string;
      name?: string;
      timestamp: string;
    }> = [];

    messages.forEach((msg) => {
      const payload = decodeChatPayload(msg.content);
      if (!payload) return;

      if (payload.kind === "image" && payload.attachment) {
        media.push({
          type: "image",
          url: payload.attachment.url,
          timestamp: msg.createdAt,
        });
      } else if (payload.kind === "audio" && payload.attachment) {
        media.push({
          type: "audio",
          url: payload.attachment.url,
          name: payload.attachment.name,
          timestamp: msg.createdAt,
        });
      } else if (payload.kind === "file" && payload.attachment) {
        if (isImageFile(payload.attachment.name)) {
          media.push({
            type: "image",
            url: payload.attachment.url,
            timestamp: msg.createdAt,
          });
        }
      }

      if (payload.kind === "image" && payload.attachments?.length) {
        payload.attachments.forEach((att) => {
          media.push({ type: "image", url: att.url, timestamp: msg.createdAt });
        });
      }
      if (payload.kind === "file" && payload.attachments?.length) {
        payload.attachments.forEach((att) => {
          if (isImageFile(att.name)) {
            media.push({
              type: "image",
              url: att.url,
              timestamp: msg.createdAt,
            });
          }
        });
      }
    });

    return media.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [messages]);

  const fileList = useMemo(() => {
    const files: Array<{ url: string; name: string; timestamp: string }> = [];

    messages.forEach((msg) => {
      const payload = decodeChatPayload(msg.content);
      if (!payload) return;

      if (payload.kind === "file" && payload.attachment) {
        if (!isImageFile(payload.attachment.name)) {
          files.push({
            url: payload.attachment.url,
            name: payload.attachment.name,
            timestamp: msg.createdAt,
          });
        }
      }

      if (payload.kind === "file" && payload.attachments?.length) {
        payload.attachments.forEach((att) => {
          if (!isImageFile(att.name)) {
            files.push({
              url: att.url,
              name: att.name,
              timestamp: msg.createdAt,
            });
          }
        });
      }
    });

    return files.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [messages]);

  const links = useMemo(() => {
    const linkList: Array<{
      url: string;
      preview: string;
      timestamp: string;
    }> = [];

    messages.forEach((msg) => {
      const payload = decodeChatPayload(msg.content);
      if (!payload) return;

      if (payload.kind === "text" && payload.text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = payload.text.match(urlRegex);
        if (matches) {
          matches.forEach((url) => {
            linkList.push({
              url,
              preview: url.length > 40 ? url.substring(0, 40) + "..." : url,
              timestamp: msg.createdAt,
            });
          });
        }
      }
    });

    return linkList.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [messages]);

  const mediaFilesDisplay = useMemo(() => mediaFiles.slice(0, 6), [mediaFiles]);
  const fileListDisplay = useMemo(() => fileList.slice(0, 3), [fileList]);
  const linksDisplay = useMemo(() => links.slice(0, 3), [links]);

  if (conversation.type !== "direct") {
    return null;
  }

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
      {/* Profile Section */}
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
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundImage: otherUser?.avatarUrl
              ? `url(${otherUser.avatarUrl})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          {!otherUser?.avatarUrl && otherUser?.displayName?.[0]?.toUpperCase()}
        </div>

        {/* Name */}
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            color: "#f1f5f9",
          }}
        >
          {otherUser?.displayName || "Người dùng"}
        </h3>

        {/* Action Buttons */}
        {!isStranger && (
          <div style={{ display: "flex", gap: 8, width: "100%" }}>
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
            <button
              title="Tắt thông báo"
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
              title="Tạo nhóm chat"
              onClick={() => setShowCreateGroupModal(true)} // 👈 thêm dòng này
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
              <MessageSquare size={16} />
              <span>Tạo nhóm</span>
            </button>
          </div>
        )}
      </div>

      {/* Media Section */}
      <ExpandableSection
        title="Ảnh/Video"
        sectionKey="media"
        isEmpty={mediaFiles.length === 0}
        emptyMessage="Chưa có Ảnh/Video được chia sẻ trong hội thoại này"
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
                if (media.type === "image") {
                  setSelectedImage(media.url);
                }
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
        emptyMessage="Chưa có File được chia sẻ trong hội thoại này"
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
            >
              <File size={14} style={{ color: "#8b5cf6", flexShrink: 0 }} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
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
        emptyMessage="Chưa có Link được chia sẻ trong hội thoại này"
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
            >
              <LinkIcon size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={link.url}
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

      {/* Delete Conversation */}
      <div style={{ padding: "16px", marginTop: "auto" }}>
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
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Preview"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                width: "auto",
                height: "auto",
                borderRadius: 24,
                border: "2px solid rgba(148,163,184,0.3)",
                backgroundColor: "#000",
              }}
            />
          </div>

          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "rgba(0,0,0,0.6)",
              border: "none",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              fontSize: 24,
              lineHeight: 1,
              transition: "background 0.2s",
              zIndex: 101,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(0,0,0,0.8)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(0,0,0,0.6)";
            }}
          >
            ✕
          </button>
        </div>
      )}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        initialMemberIds={otherUser ? [otherUser._id] : []} // 👈 pre-select người đang chat
      />
    </div>
  );
}
