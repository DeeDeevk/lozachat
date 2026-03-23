import { useState } from "react";
import { REACTION_EMOJI, REACTION_LABEL } from "../../types/post";
import type { ReactionType } from "../../types/post";

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
  reactions: any[];
  commentsCount: number;
  currentUserId: string;
  onReact: (postId: string, type: ReactionType) => void;
  onCommentClick: () => void;
  showComments?: boolean; // thêm prop này để biết đang mở/đóng
}

export const PostActions = ({
  postId,
  reactions,
  commentsCount,
  currentUserId,
  onReact,
  onCommentClick,
  showComments = false,
}: Props) => {
  const [showPicker, setShowPicker] = useState(false);

  const myReaction = reactions.find((r) => r.userId === currentUserId);
  const totalReactions = reactions.length;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06]">
      {/* Left: action buttons */}
      <div className="relative flex items-center gap-2">
        {/* ── Nút Thích ── */}
        <button
  onClick={() => onReact(postId, "like")}
  onMouseEnter={() => setShowPicker(true)}
  onMouseLeave={() => setTimeout(() => setShowPicker(false), 300)}
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
      </div>

      {/* Right: tổng reaction */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-[#4a5a70]">
          <div className="flex -space-x-1">
            {/* Hiện top 3 emoji reaction unique */}
            {[...new Set(reactions.map((r) => r.type))]
              .slice(0, 3)
              .map((type) => (
                <span key={type} className="text-sm">
                  {REACTION_EMOJI[type as ReactionType]}
                </span>
              ))}
          </div>
          <span>{totalReactions}</span>
        </div>
      )}
    </div>
  );
};
