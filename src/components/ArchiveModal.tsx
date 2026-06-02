import { useState, useEffect, useCallback } from "react";
import {
  File,
  Link as LinkIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

interface LightboxState {
  isOpen: boolean;
  currentIndex: number;
  scale: number;
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
  const [lightbox, setLightbox] = useState<LightboxState>({
    isOpen: false,
    currentIndex: 0,
    scale: 1,
  });

  // Only image files for lightbox navigation
  const imageFiles = mediaFiles.filter((m) => m.type === "image");

  const openLightbox = (url: string) => {
    const idx = imageFiles.findIndex((m) => m.url === url);
    setLightbox({ isOpen: true, currentIndex: idx >= 0 ? idx : 0, scale: 1 });
  };

  const closeLightbox = () => {
    setLightbox((prev) => ({ ...prev, isOpen: false, scale: 1 }));
  };

  const goNext = useCallback(() => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % imageFiles.length,
      scale: 1,
    }));
  }, [imageFiles.length]);

  const goPrev = useCallback(() => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex:
        (prev.currentIndex - 1 + imageFiles.length) % imageFiles.length,
      scale: 1,
    }));
  }, [imageFiles.length]);

  const zoomIn = () =>
    setLightbox((prev) => ({ ...prev, scale: Math.min(prev.scale + 0.5, 4) }));
  const zoomOut = () =>
    setLightbox((prev) => ({
      ...prev,
      scale: Math.max(prev.scale - 0.5, 0.5),
    }));

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox.isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "+") zoomIn();
      if (e.key === "-") zoomOut();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox.isOpen, goNext, goPrev]);

  if (!isOpen) return null;

  const currentImage = imageFiles[lightbox.currentIndex];

  return (
    <>
      {/* Archive Modal */}
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
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 20,
                    }}
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
                                onClick={() =>
                                  media.type === "image" &&
                                  openLightbox(media.url)
                                }
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
                                  cursor:
                                    media.type === "image"
                                      ? "pointer"
                                      : "default",
                                  transition: "transform 0.2s, box-shadow 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  if (media.type === "image") {
                                    (
                                      e.currentTarget as HTMLDivElement
                                    ).style.transform = "scale(1.05)";
                                    (
                                      e.currentTarget as HTMLDivElement
                                    ).style.boxShadow =
                                      "0 8px 24px rgba(0,0,0,0.5)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLDivElement
                                  ).style.transform = "scale(1)";
                                  (
                                    e.currentTarget as HTMLDivElement
                                  ).style.boxShadow = "none";
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
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 20,
                    }}
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
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 20,
                    }}
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

      {/* ─── Lightbox Overlay ─── */}
      {lightbox.isOpen && currentImage && (
        <div
          onClick={closeLightbox}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.18s ease",
          }}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes scaleIn { from { opacity: 0; transform: scale(0.93) } to { opacity: 1; transform: scale(1) } }
          `}</style>

          {/* Close button */}
          <button
            onClick={closeLightbox}
            style={{
              position: "fixed",
              top: 18,
              right: 18,
              background: "rgba(255,255,255,0.12)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              zIndex: 101,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.22)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.12)")
            }
          >
            <X size={18} />
          </button>

          {/* Prev button */}
          {imageFiles.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              style={{
                position: "fixed",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.12)",
                border: "none",
                borderRadius: "50%",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                zIndex: 101,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.25)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.12)")
              }
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Next button */}
          {imageFiles.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              style={{
                position: "fixed",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.12)",
                border: "none",
                borderRadius: "50%",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                zIndex: 101,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.25)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.12)")
              }
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "95vw",
              maxHeight: "90vh",
              overflow: lightbox.scale > 1 ? "auto" : "hidden",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "scaleIn 0.2s ease",
            }}
          >
            <img
              src={currentImage.url}
              alt=""
              draggable={false}
              style={{
                display: "block",
                maxWidth: lightbox.scale === 1 ? "95vw" : "none",
                maxHeight: lightbox.scale === 1 ? "90vh" : "none",
                width: lightbox.scale > 1 ? `${lightbox.scale * 100}%` : "auto",
                height: "auto",
                borderRadius: 6,
                objectFit: "contain",
                transition: "transform 0.2s ease, width 0.2s ease",
                userSelect: "none",
              }}
            />
          </div>

          {/* Counter */}
          {imageFiles.length > 1 && (
            <div
              style={{
                position: "fixed",
                top: 22,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                borderRadius: 20,
                padding: "5px 16px",
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                zIndex: 101,
              }}
            >
              {lightbox.currentIndex + 1} / {imageFiles.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
