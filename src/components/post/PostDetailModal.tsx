import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { UserProfileLink } from "../UserProfileLink";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { Post, PostImage, ReactionType } from "../../types/post";
import { PostActions } from "./PostActions";
import { CommentSection } from "./CommentSection";
import { ReactionCountBadge } from "./ReactionCountBadge";

interface Props {
  post: Post;
  postImages?: PostImage[];
  initialImageIndex?: number;
  currentUserId: string;
  onClose: () => void;
  onReact: (postId: string, type: ReactionType) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  onOpenReactionStats?: (focusImageId?: string) => void;
}

export const PostDetailModal = ({
  post,
  postImages = [],
  initialImageIndex = 0,
  currentUserId,
  onClose,
  onReact,
  onDelete,
  onEdit,
  onOpenReactionStats,
}: Props) => {
  const [imgIdx, setImgIdx] = useState(initialImageIndex);
  const navigate = useNavigate();

  const isOwner = post.author._id === currentUserId;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: vi,
  });
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && imgIdx > 0) setImgIdx((i) => i - 1);
      if (e.key === "ArrowRight" && imgIdx < post.images.length - 1)
        setImgIdx((i) => i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [imgIdx, onClose, post.images.length]);

  const hasImages = post.images.length > 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          width: "100%",
          maxWidth: hasImages ? "1100px" : "560px",
          maxHeight: "92vh",
          borderRadius: "20px",
          overflow: "hidden",
          background: "var(--loza-bg-card)",
          border: "1px solid var(--loza-border-bright)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
        }}
      >
        {hasImages && (
          <div
            style={{
              flex: "0 0 60%",
              background: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              minHeight: "400px",
              maxHeight: "92vh",
            }}
          >
            <img
              src={post.images[imgIdx]}
              alt="post"
              style={{
                maxWidth: "100%",
                maxHeight: "92vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                display: "block",
                userSelect: "none",
              }}
            />

            {postImages[imgIdx]?.reactions?.length ? (
              <div className="absolute bottom-4 left-4 z-10">
                <ReactionCountBadge
                  reactions={postImages[imgIdx].reactions}
                  onClick={() =>
                    onOpenReactionStats?.(postImages[imgIdx]._id)
                  }
                  label={`Ảnh ${imgIdx + 1}`}
                />
              </div>
            ) : null}

            {imgIdx > 0 && (
              <button
                onClick={() => setImgIdx((i) => i - 1)}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)",
                  border: "none",
                  color: "#fff",
                  fontSize: "22px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--loza-accent)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.55)")
                }
              >
                ‹
              </button>
            )}

            {imgIdx < post.images.length - 1 && (
              <button
                onClick={() => setImgIdx((i) => i + 1)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)",
                  border: "none",
                  color: "#fff",
                  fontSize: "22px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--loza-accent)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.55)")
                }
              >
                ›
              </button>
            )}

            {post.images.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "14px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: "6px",
                }}
              >
                {post.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    style={{
                      width: i === imgIdx ? "20px" : "8px",
                      height: "8px",
                      borderRadius: "999px",
                      background:
                        i === imgIdx
                          ? "var(--loza-accent)"
                          : "rgba(255,255,255,0.35)",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </div>
            )}

            {post.images.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backdropFilter: "blur(4px)",
                }}
              >
                {imgIdx + 1} / {post.images.length}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            maxHeight: "92vh",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--loza-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <UserProfileLink
                userId={post.author._id}
                displayName={post.author.displayName}
                avatarUrl={post.author.avatarUrl}
                size="md"
                showName={false}
              />
              <div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "var(--loza-text)",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/profile/${post.author._id}`)}
                >
                  {post.author.displayName}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "var(--loza-muted)",
                    marginTop: "2px",
                  }}
                >
                  {timeAgo}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {isOwner && (
                <>
                  <button
                    onClick={onEdit}
                    title="Chỉnh sửa"
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "transparent",
                      border: "none",
                      color: "var(--loza-sub)",
                      fontSize: "16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--loza-bg-hover)";
                      e.currentTarget.style.color = "var(--loza-text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--loza-sub)";
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      onDelete(post._id);
                      onClose();
                    }}
                    title="Xoá bài"
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "transparent",
                      border: "none",
                      color: "var(--loza-sub)",
                      fontSize: "16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "color-mix(in srgb, oklch(0.704 0.191 22.216) 12%, transparent)";
                      e.currentTarget.style.color = "oklch(0.704 0.191 22.216)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--loza-sub)";
                    }}
                  >
                    🗑️
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "transparent",
                  border: "none",
                  color: "var(--loza-muted)",
                  fontSize: "18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--loza-bg-hover)";
                  e.currentTarget.style.color = "var(--loza-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--loza-muted)";
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
            }}
          >
            {post.content ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  lineHeight: 1.7,
                  color: "var(--loza-text)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {post.content}
              </p>
            ) : (
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "var(--loza-muted)",
                  fontStyle: "italic",
                }}
              >
                Không có nội dung
              </p>
            )}

            {post.images.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginTop: "16px",
                }}
              >
                {post.images.map((src, i) => (
                  <div
                    key={i}
                    onClick={() => setImgIdx(i)}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      cursor: "pointer",
                      flexShrink: 0,
                      outline:
                        i === imgIdx
                          ? "2px solid var(--loza-accent)"
                          : "2px solid transparent",
                      outlineOffset: "2px",
                      transition: "outline 0.15s",
                    }}
                  >
                    <img
                      src={src}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--loza-border)",
              flexShrink: 0,
            }}
          >
            <PostActions
              postId={post._id}
              reactions={post.reactions}
              commentsCount={post.commentsCount || 0}
              currentUserId={currentUserId}
              onReact={onReact}
              onCommentClick={() => {}}
              onOpenReactionStats={() => onOpenReactionStats?.()}
            />

            <CommentSection
              postId={post._id}
              commentsCount={post.commentsCount || 0}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
