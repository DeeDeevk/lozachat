import { useMemo, useState } from "react";
import {
  ChevronDown,
  File,
  Link as LinkIcon,
  Trash2,
  X,
  Pin,
  Bell,
  MessageSquare,
} from "lucide-react";
import type { Conversation, Message } from "@/types/chat";
import { decodeChatPayload } from "@/utils/chatMessageCodec";

interface ConversationInfoPanelProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId?: string;
  onDeleteConversation?: () => void;
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

// Archive Modal Component
function ArchiveModal({
  isOpen,
  onClose,
  mediaFiles,
  fileList,
  links,
}: {
  isOpen: boolean;
  onClose: () => void;
  mediaFiles: Array<{
    type: "image" | "audio";
    url: string;
    timestamp: string;
  }>;
  fileList: Array<{ url: string; name: string; timestamp: string }>;
  links: Array<{ url: string; preview: string; timestamp: string }>;
}) {
  const [activeTab, setActiveTab] = useState<"media" | "files" | "links">(
    "media",
  );
  const [mediaFilter, setMediaFilter] = useState<"all" | "sender" | "date">(
    "all",
  );
  const [fileFilter, setFileFilter] = useState<"all" | "sender" | "date">(
    "all",
  );

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #1a1f3a 100%)",
          borderRadius: 16,
          width: "90%",
          maxWidth: 800,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          color: "white",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(148,163,184,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            Kho lưu trữ
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(148,163,184,0.15)",
            padding: "0 24px",
          }}
        >
          {[
            { id: "media", label: "Ảnh/Video" },
            { id: "files", label: "Files" },
            { id: "links", label: "Links" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as "media" | "files" | "links")
              }
              style={{
                padding: "16px 0",
                marginRight: 32,
                background: "transparent",
                border: "none",
                color: activeTab === tab.id ? "#2563eb" : "#94a3b8",
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: "pointer",
                borderBottom:
                  activeTab === tab.id ? "3px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(148,163,184,0.15)",
            display: "flex",
            gap: 12,
          }}
        >
          {activeTab !== "links" && (
            <>
              <select
                value={activeTab === "media" ? mediaFilter : fileFilter}
                onChange={(e) => {
                  if (activeTab === "media") {
                    setMediaFilter(e.target.value as "all" | "sender" | "date");
                  } else {
                    setFileFilter(e.target.value as "all" | "sender" | "date");
                  }
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.2)",
                  background: "rgba(148,163,184,0.05)",
                  color: "#f1f5f9",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <option value="all">Người gửi</option>
                <option value="sender">Bạn</option>
                <option value="date">Ngày gửi</option>
              </select>
            </>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
          }}
        >
          {activeTab === "media" && (
            <div>
              {mediaFiles.length === 0 ? (
                <p style={{ color: "#94a3b8", textAlign: "center" }}>
                  Chưa có ảnh/video
                </p>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  {[...mediaFiles]
                    .reverse()
                    .reduce(
                      (acc, media) => {
                        const date = new Date(
                          media.timestamp,
                        ).toLocaleDateString("vi-VN");
                        const lastGroup = acc[acc.length - 1];
                        if (lastGroup && lastGroup.date === date) {
                          lastGroup.items.push(media);
                        } else {
                          acc.push({ date, items: [media] });
                        }
                        return acc;
                      },
                      [] as Array<{ date: string; items: typeof mediaFiles }>,
                    )
                    .map((group) => (
                      <div key={group.date}>
                        <p
                          style={{
                            color: "#94a3b8",
                            fontSize: 12,
                            fontWeight: 600,
                            marginBottom: 12,
                          }}
                        >
                          {group.date}
                        </p>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 12,
                          }}
                        >
                          {group.items.map((media, idx) => (
                            <div
                              key={idx}
                              style={{
                                width: "100%",
                                paddingBottom: "100%",
                                position: "relative",
                                borderRadius: 10,
                                overflow: "hidden",
                                background:
                                  media.type === "image"
                                    ? "#3b82f6"
                                    : "#f59e0b",
                                cursor: "pointer",
                                transition: "transform 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLDivElement
                                ).style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLDivElement
                                ).style.transform = "scale(1)";
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
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "files" && (
            <div>
              {fileList.length === 0 ? (
                <p style={{ color: "#94a3b8", textAlign: "center" }}>
                  Chưa có file
                </p>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  {[...fileList]
                    .reverse()
                    .reduce(
                      (acc, file) => {
                        const date = new Date(
                          file.timestamp,
                        ).toLocaleDateString("vi-VN");
                        const lastGroup = acc[acc.length - 1];
                        if (lastGroup && lastGroup.date === date) {
                          lastGroup.items.push(file);
                        } else {
                          acc.push({ date, items: [file] });
                        }
                        return acc;
                      },
                      [] as Array<{ date: string; items: typeof fileList }>,
                    )
                    .map((group) => (
                      <div key={group.date}>
                        <p
                          style={{
                            color: "#94a3b8",
                            fontSize: 12,
                            fontWeight: 600,
                            marginBottom: 12,
                          }}
                        >
                          {group.date}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {group.items.map((file, idx) => (
                            <a
                              key={idx}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "12px",
                                borderRadius: 8,
                                background: "rgba(148,163,184,0.08)",
                                color: "#2563eb",
                                textDecoration: "none",
                                fontSize: 13,
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLAnchorElement
                                ).style.background = "rgba(148,163,184,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLAnchorElement
                                ).style.background = "rgba(148,163,184,0.08)";
                              }}
                            >
                              <File
                                size={16}
                                style={{ color: "#8b5cf6", flexShrink: 0 }}
                              />
                              <span
                                style={{
                                  flex: 1,
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
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "links" && (
            <div>
              {links.length === 0 ? (
                <p style={{ color: "#94a3b8", textAlign: "center" }}>
                  Chưa có link
                </p>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  {[...links]
                    .reverse()
                    .reduce(
                      (acc, link) => {
                        const date = new Date(
                          link.timestamp,
                        ).toLocaleDateString("vi-VN");
                        const lastGroup = acc[acc.length - 1];
                        if (lastGroup && lastGroup.date === date) {
                          lastGroup.items.push(link);
                        } else {
                          acc.push({ date, items: [link] });
                        }
                        return acc;
                      },
                      [] as Array<{ date: string; items: typeof links }>,
                    )
                    .map((group) => (
                      <div key={group.date}>
                        <p
                          style={{
                            color: "#94a3b8",
                            fontSize: 12,
                            fontWeight: 600,
                            marginBottom: 12,
                          }}
                        >
                          {group.date}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {group.items.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "12px",
                                borderRadius: 8,
                                background: "rgba(148,163,184,0.08)",
                                color: "#2563eb",
                                textDecoration: "none",
                                fontSize: 13,
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLAnchorElement
                                ).style.background = "rgba(148,163,184,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLAnchorElement
                                ).style.background = "rgba(148,163,184,0.08)";
                              }}
                            >
                              <LinkIcon
                                size={16}
                                style={{ color: "#f59e0b", flexShrink: 0 }}
                              />
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
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConversationInfoPanel({
  conversation,
  messages,
  currentUserId,
  onDeleteConversation,
}: ConversationInfoPanelProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    media: true, // Default open
    files: true, // Default open
    links: true,
  });
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const otherUser = useMemo(
    () => conversation.participants.find((p) => p._id !== currentUserId),
    [conversation.participants, currentUserId],
  );

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
        // Auto-detect image files and add them to media
        if (isImageFile(payload.attachment.name)) {
          media.push({
            type: "image",
            url: payload.attachment.url,
            timestamp: msg.createdAt,
          });
        }
      }
    });

    // Sort by newest first
    return media.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [messages]);

  const fileList = useMemo(() => {
    const files: Array<{
      url: string;
      name: string;
      timestamp: string;
    }> = [];

    messages.forEach((msg) => {
      const payload = decodeChatPayload(msg.content);
      if (!payload) return;

      if (payload.kind === "file" && payload.attachment) {
        // Exclude image files (those are shown in media section)
        if (!isImageFile(payload.attachment.name)) {
          files.push({
            url: payload.attachment.url,
            name: payload.attachment.name,
            timestamp: msg.createdAt,
          });
        }
      }
    });

    // Sort by newest first
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

    // Sort by newest first
    return linkList.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [messages]);

  const mediaFilesDisplay = useMemo(() => mediaFiles.slice(0, 6), [mediaFiles]);

  const fileListDisplay = useMemo(() => fileList.slice(0, 3), [fileList]);

  const linksDisplay = useMemo(() => links.slice(0, 3), [links]);

  // Only show for direct conversations
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
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <button
            title="Ghim hội thoại"
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
      <div
        style={{
          padding: "16px",
          marginTop: "auto",
        }}
      >
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
    </div>
  );
}
