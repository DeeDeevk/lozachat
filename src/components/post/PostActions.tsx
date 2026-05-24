import { useState } from "react";
import { REACTION_EMOJI, REACTION_LABEL } from "../../types/post";
import type { ReactionType, Reaction, Visibility } from "../../types/post";
import toast from "react-hot-toast";

const REACTION_TYPES: ReactionType[] = [
  "like",
  "love",
  "haha",
  "wow",
  "sad",
  "angry",
];

interface Props {
  postId: string;
  reactions: Reaction[];
  commentsCount: number;
  sharesCount?: number;
  currentUserId: string;
  onReact: (postId: string, type: ReactionType) => void;
  onCommentClick: () => void;
  showComments?: boolean;
  onOpenReactionStats?: () => void;
}

export const PostActions = ({
  postId,
  reactions,
  commentsCount,
  sharesCount = 0,
  currentUserId,
  onReact,
  onCommentClick,
  showComments = false,
  onOpenReactionStats,
}: Props) => {
  const [showPicker, setShowPicker] = useState(false);
  const [openShare, setOpenShare] = useState(false);
  const [shareText, setShareText] = useState("");
  const [shareVisibility, setShareVisibility] = useState<Visibility>("public");
  const [sharing, setSharing] = useState(false);

  const myReaction = reactions.find((r) => r.userId === currentUserId);
  const totalReactions = reactions.length;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/social?post=${postId}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Đã sao chép liên kết bài viết!"),
      () => toast.error("Không thể sao chép liên kết"),
    );
  };

  const handleShareToFeed = async () => {
    setSharing(true);
    try {
      const { usePostStore } = await import("../../stores/usePostStore");
      await usePostStore
        .getState()
        .sharePost(postId, shareText.trim(), shareVisibility);
      setOpenShare(false);
      setShareText("");
      setShareVisibility("public");
    } catch {
      // Toast handled in store
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06]">
      {/* Left: action buttons */}
      <div className="relative flex items-center gap-2">
        {/* ── Nút Thích ── */}
        <button
  onClick={() => onReact(postId, "like")}
  onMouseEnter={() => setShowPicker(true)}
  onMouseLeave={() => setTimeout(() => setShowPicker(false), 900)}
  className={`
    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
    border backdrop-blur-md transition-all duration-200 select-none

    ${
      myReaction
        ? `
          bg-[color:var(--loza-accent)/15]
          border-[color:var(--loza-accent)/40]
          text-[color:var(--loza-accent-light)]
          shadow-[0_0_12px_var(--loza-accent-glow)]
        `
        : `
          bg-transparent
          border-[color:var(--loza-border)]
          text-[color:var(--loza-sub)]
          hover:bg-[color:var(--loza-bg-hover)]
          hover:border-[color:var(--loza-accent)]
          hover:text-[color:var(--loza-text)]
        `
    }
  `}
>
  <span className="text-base leading-none">
    {myReaction ? REACTION_EMOJI[myReaction.type] : "👍"}
  </span>
  <span>{myReaction ? REACTION_LABEL[myReaction.type] : "Thích"}</span>
</button>

{/* Reaction picker */}
{showPicker && (
  <div
    onMouseEnter={() => setShowPicker(true)}
    onMouseLeave={() => setShowPicker(false)}
    className="
      absolute bottom-full left-0 mb-2 flex gap-1 p-2 z-50
      rounded-2xl backdrop-blur-xl

      bg-[color:var(--loza-bg-elevated)/70]
      border border-[color:var(--loza-border)]
      shadow-[0_10px_30px_rgba(0,0,0,0.4)]
    "
  >
    {REACTION_TYPES.map((type) => (
      <button
        key={type}
        title={REACTION_LABEL[type]}
        onClick={() => {
          onReact(postId, type);
          setShowPicker(false);
        }}
        className="
          text-2xl p-1.5 rounded-xl
          transition-all duration-150
          hover:scale-125 active:scale-110
          hover:bg-[color:var(--loza-bg-hover)]
        "
      >
        {REACTION_EMOJI[type]}
      </button>
    ))}
  </div>
)}

{/* ── Nút Bình luận ── */}
<button
  onClick={onCommentClick}
  className={`
    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
    border backdrop-blur-md transition-all duration-200 select-none

    ${
      showComments
        ? `
          bg-[color:var(--loza-accent)/15]
          border-[color:var(--loza-accent)/40]
          text-[color:var(--loza-accent-light)]
        `
        : `
          bg-transparent
          border-[color:var(--loza-border)]
          text-[color:var(--loza-sub)]
          hover:bg-[color:var(--loza-bg-hover)]
          hover:border-[color:var(--loza-accent)]
          hover:text-[color:var(--loza-text)]
        `
    }
  `}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>

  <span>Bình luận</span>

  {commentsCount > 0 && (
    <span
      className={`
        px-1.5 py-0.5 rounded-full text-[11px] font-bold min-w-[18px]
        text-center leading-none
        ${
          showComments
            ? "bg-[color:var(--loza-accent)/25] text-[color:var(--loza-accent-light)]"
            : "bg-[color:var(--loza-bg-hover)] text-[color:var(--loza-sub)]"
        }
      `}
    >
      {commentsCount}
    </span>
  )}
</button>

{/* ── Nút Chia sẻ ── */}
<button
  onClick={() => setOpenShare(true)}
  className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border bg-transparent text-[color:var(--loza-sub)] hover:bg-[color:var(--loza-bg-hover)]"
>
  <span>🔁</span>
  <span>Chia sẻ</span>
  {sharesCount > 0 && (
    <span
      className="px-1.5 py-0.5 rounded-full text-[11px] font-bold min-w-[18px] text-center leading-none bg-[color:var(--loza-bg-hover)] text-[color:var(--loza-sub)]"
    >
      {sharesCount}
    </span>
  )}
</button>
      </div>

      {/* Right: thống kê react của bài viết (không gộp ảnh) */}
      {totalReactions > 0 && (
        <button
          type="button"
          onClick={() => onOpenReactionStats?.()}
          className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-indigo-300 transition-colors cursor-pointer rounded-lg px-2 py-1 hover:bg-white/5"
          title="Xem thống kê cảm xúc bài viết"
        >
          <div className="flex -space-x-1">
            {[...new Set(reactions.map((r) => r.type))]
              .slice(0, 3)
              .map((type) => (
                <span key={type} className="text-sm">
                  {REACTION_EMOJI[type as ReactionType]}
                </span>
              ))}
          </div>
          <span className="font-semibold">{totalReactions}</span>
        </button>
      )}

      {/* ── Share Modal ── */}
      {openShare && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/60" onClick={() => !sharing && setOpenShare(false)} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-2xl border p-5"
              style={{
                background: "var(--loza-bg-elevated)",
                borderColor: "var(--loza-border)",
                boxShadow: "0 22px 60px rgba(0,0,0,0.55)",
              }}
            >
              <h3 className="text-base font-bold" style={{ color: "var(--loza-text)" }}>
                Chia sẻ bài viết
              </h3>
              <p className="text-xs mt-1" style={{ color: "var(--loza-muted)" }}>
                Chọn cách bạn muốn chia sẻ bài viết này
              </p>

              {/* ── Share options ── */}
              <div
                className="flex gap-2 mt-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}
              >
                {/* Copy link */}
                <button
                  onClick={() => {
                    handleCopyLink();
                    setOpenShare(false);
                  }}
                  className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-colors"
                  style={{
                    background: "var(--loza-bg-base)",
                    border: "1px solid var(--loza-border)",
                    color: "var(--loza-text)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--loza-bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--loza-bg-base)")}
                >
                  <span className="text-xl">🔗</span>
                  <span className="text-xs font-medium">Sao chép liên kết</span>
                </button>
              </div>

              {/* ── Share to feed ── */}
              <p
                className="text-xs font-semibold mt-4 mb-2"
                style={{ color: "var(--loza-sub)" }}
              >
                Chia sẻ lên trang cá nhân
              </p>

              <textarea
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                maxLength={500}
                placeholder="Viết gì đó về bài chia sẻ này..."
                className="w-full rounded-xl p-3 text-sm outline-none"
                style={{
                  minHeight: "80px",
                  resize: "vertical",
                  background: "var(--loza-bg-base)",
                  border: "1px solid var(--loza-border)",
                  color: "var(--loza-text)",
                }}
              />

              <label className="block text-xs mt-3 mb-1" style={{ color: "var(--loza-muted)" }}>
                Quyền riêng tư
              </label>
              <select
                value={shareVisibility}
                onChange={(e) => setShareVisibility(e.target.value as Visibility)}
                className="w-full rounded-xl px-3 py-2 text-sm"
                style={{
                  background: "var(--loza-bg-base)",
                  border: "1px solid var(--loza-border)",
                  color: "var(--loza-text)",
                }}
              >
                <option value="public">🌎 Mọi người</option>
                <option value="friends">👥 Bạn bè</option>
                <option value="private">🔒 Riêng tư (chỉ mình tôi)</option>
              </select>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  disabled={sharing}
                  onClick={() => setOpenShare(false)}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--loza-border)",
                    color: "var(--loza-sub)",
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  disabled={sharing}
                  onClick={handleShareToFeed}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
                  style={{
                    background: "var(--loza-accent)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    opacity: sharing ? 0.7 : 1,
                  }}
                >
                  {sharing ? "Đang chia sẻ..." : "Đăng chia sẻ"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
