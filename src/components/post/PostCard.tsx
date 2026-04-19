import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { Post, ReactionType, Visibility } from "../../types/post";
import { EditPostModal } from "./EditPostModal";
import { PostDetailModal } from "./PostDetailModal";
import { PostActions } from "./PostActions";
import { CommentSection } from "./CommentSection";

interface Props {
  post: Post;
  currentUserId: string;
  onDelete: (id: string) => void;
  onReact: (postId: string, type: ReactionType) => void;
  style?: React.CSSProperties;
}

const getVisibilityInfo = (v: Visibility) => {
  switch (v) {
    case "public":  return { icon: "🌎", label: "Mọi người" };
    case "friends": return { icon: "👥", label: "Bạn bè" };
    case "private": return { icon: "🔒", label: "Chỉ mình tôi" };
    default:        return { icon: "🌎", label: "Mọi người" };
  }
};

// ─── ImageGrid ────────────────────────────────────────────────
const ImageGrid = ({
  images,
  onClickImage,
}: {
  images: string[];
  onClickImage: (idx: number) => void;
}) => {
  const n = images.length;

  const cellBase: React.CSSProperties = {
    overflow: "hidden",
    position: "relative",
    cursor: "pointer",
    background: "var(--loza-bg-base)",
  };
  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "center",
    display: "block",
    background: "var(--loza-bg-base)",
    transition: "transform 0.2s ease",
  };

  const cell = (src: string, idx: number, extra?: React.CSSProperties) => (
    <div key={idx} style={{ ...cellBase, ...extra }} onClick={() => onClickImage(idx)}>
      <img
        src={src}
        alt={`img-${idx}`}
        style={imgStyle}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      />
    </div>
  );

  if (n === 1)
    return (
      <div
        style={{ background: "var(--loza-bg-base)", cursor: "pointer" }}
        onClick={() => onClickImage(0)}
      >
        <img
          src={images[0]}
          alt="img-0"
          style={{
            width: "100%",
            maxHeight: "520px",
            objectFit: "contain",
            objectPosition: "center",
            display: "block",
            background: "var(--loza-bg-base)",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />
      </div>
    );

  if (n === 2)
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", height: "320px" }}>
        {images.map((src, i) => cell(src, i))}
      </div>
    );

  if (n === 3)
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", height: "380px" }}>
        {cell(images[0], 0, { gridRow: "span 2" })}
        {cell(images[1], 1)}
        {cell(images[2], 2)}
      </div>
    );

  if (n === 4)
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", height: "380px" }}>
        {images.map((src, i) => cell(src, i))}
      </div>
    );

  // 5+
  const visible = images.slice(0, 5);
  const remaining = n - 5;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: "2px",
        height: "380px",
      }}
    >
      {cell(visible[0], 0, { gridColumn: "span 2" })}
      {cell(visible[1], 1)}
      {cell(visible[2], 2)}
      {cell(visible[3], 3)}
      <div style={{ ...cellBase }} onClick={() => onClickImage(4)}>
        <img src={visible[4]} alt="more" style={{ ...imgStyle, filter: "brightness(0.4)" }} />
        {remaining > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "26px",
              fontWeight: 700,
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── PostCard ─────────────────────────────────────────────────
export const PostCard = ({ post, currentUserId, onDelete, onReact, style }: Props) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [detailImg, setDetailImg] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(false);

  if (!post.author) return null;

  const isOwner = post.author._id === currentUserId;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: vi,
  });
  const initials = post.author.displayName
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  const visInfo = getVisibilityInfo(post.visibility);

  return (
    <>
      <div
        className="loza-card loza-slide-up overflow-hidden"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.4)", ...style }}
      >
        {/* ─── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                style={{
                  outline: "2px solid color-mix(in srgb, var(--loza-accent) 25%, transparent)",
                  outlineOffset: "2px",
                }}
                alt={post.author.displayName}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm"
                style={{
                  background: "var(--loza-accent)",
                  outline: "2px solid color-mix(in srgb, var(--loza-accent) 25%, transparent)",
                  outlineOffset: "2px",
                }}
              >
                {initials}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm leading-tight" style={{ color: "var(--loza-text)" }}>
                {post.author.displayName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-xs" style={{ color: "var(--loza-muted)" }}>
                  {timeAgo}
                </p>
                <span className="text-[10px]" style={{ color: "var(--loza-muted)" }}>•</span>
                <span title={visInfo.label} className="text-[10px] cursor-help">
                  {visInfo.icon}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Owner menu ──────────────────────────────────────── */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--loza-muted)",
                  fontSize: "18px",
                  cursor: "pointer",
                  letterSpacing: "1px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--loza-bg-hover)";
                  e.currentTarget.style.color = "var(--loza-sub)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--loza-muted)";
                }}
              >
                •••
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div
                    className="absolute right-0 top-9 rounded-xl overflow-hidden z-20 min-w-[170px] loza-pop"
                    style={{
                      background: "var(--loza-bg-elevated)",
                      border: "1px solid var(--loza-border-bright)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}
                  >
                    <button
                      onClick={() => { setShowEdit(true); setShowMenu(false); }}
                      className="w-full text-left flex items-center gap-2 text-sm transition-colors"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--loza-text)",
                        padding: "10px 16px",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--loza-bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>✏️</span> Chỉnh sửa
                    </button>
                    <button
                      onClick={() => { onDelete(post._id); setShowMenu(false); }}
                      className="w-full text-left flex items-center gap-2 text-sm transition-colors"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "oklch(0.704 0.191 22.216)",
                        padding: "10px 16px",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "color-mix(in srgb, oklch(0.704 0.191 22.216) 10%, transparent)")
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>🗑️</span> Xoá bài viết
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── Content ─────────────────────────────────────────── */}
        {post.content && (
          <p
            className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--loza-text)" }}
          >
            {post.content}
          </p>
        )}

        {/* ─── Images ──────────────────────────────────────────── */}
        {post.images.length > 0 && (
          <ImageGrid images={post.images} onClickImage={(idx) => setDetailImg(idx)} />
        )}

        {/* ─── Actions + Comments ───────────────────────────────── */}
        <PostActions
          postId={post._id}
          reactions={post.reactions}
          commentsCount={post.commentsCount || 0}
          currentUserId={currentUserId}
          onReact={onReact}
          showComments={showComments}
          onCommentClick={() => setShowComments((v) => !v)}
        />

        {showComments && (
          <div className="px-4 pb-4">
            <CommentSection
              postId={post._id}
              commentsCount={post.commentsCount || 0}
              currentUserId={currentUserId}
            />
          </div>
        )}
      </div>

      {/* ─── Modals ──────────────────────────────────────────────── */}
      {showEdit && (
        <EditPostModal post={post} onClose={() => setShowEdit(false)} />
      )}

      {detailImg !== null && (
        <PostDetailModal
          post={post}
          initialImageIndex={detailImg}
          currentUserId={currentUserId}
          onClose={() => setDetailImg(null)}
          onReact={onReact}
          onDelete={onDelete}
          onEdit={() => {
            setDetailImg(null);
            setShowEdit(true);
          }}
        />
      )}
    </>
  );
};
