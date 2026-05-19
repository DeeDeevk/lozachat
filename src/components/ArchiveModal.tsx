import { useState } from "react";
import { File, Link as LinkIcon, X } from "lucide-react";

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaFiles: Array<{
    type: "image" | "audio";
    url: string;
    timestamp: string;
  }>;
  fileList: Array<{ url: string; name: string; timestamp: string }>;
  links: Array<{ url: string; preview: string; timestamp: string }>;
}

export default function ArchiveModal({
  isOpen,
  onClose,
  mediaFiles,
  fileList,
  links,
}: ArchiveModalProps) {
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
        {/* <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(148,163,184,0.15)",
            display: "flex",
            gap: 12,
          }}
        >
          {activeTab !== "links" && (
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
          )}
        </div> */}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
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
