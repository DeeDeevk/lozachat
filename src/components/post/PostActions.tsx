import { useState } from "react";
import { REACTION_EMOJI, REACTION_LABEL } from "../../types/post";
import type { ReactionType } from "../../types/post";
import { usePostStore } from "../../stores/usePostStore";

const REACTION_TYPES: ReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"];

interface Props {
  postId: string;
  reactions: any[];
  commentsCount: number;
  currentUserId: string;
  onReact: (postId: string, type: ReactionType) => void;
  onCommentClick: () => void;  
}

export const PostActions = ({
  postId,
  reactions,
  commentsCount,
  currentUserId,
  onReact,
  onCommentClick,
}: Props) => {
  const [showPicker, setShowPicker] = useState(false);
  const reactToPost = usePostStore((s) => s.reactToPost);

  const myReaction = reactions.find((r) => r.userId === currentUserId);
  const totalReactions = reactions.length;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--loza-border)]">
      {/* Reaction */}
      <div className="relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onReact(postId, myReaction?.type === "like" ? "like" : "like")}
            onMouseEnter={() => setShowPicker(true)}
            onMouseLeave={() => setTimeout(() => setShowPicker(false), 200)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: myReaction ? "color-mix(in srgb, var(--loza-accent) 15%, transparent)" : "transparent",
              color: myReaction ? "var(--loza-accent-light)" : "var(--loza-muted)",
            }}
          >
            <span className="text-xl">{myReaction ? REACTION_EMOJI[myReaction.type] : "👍"}</span>
            <span>{myReaction ? REACTION_LABEL[myReaction.type] : "Thích"}</span>
          </button>

          {/* Picker */}
          {showPicker && (
            <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-[var(--loza-bg-elevated)] border border-[var(--loza-border-bright)] rounded-2xl p-2 shadow-xl z-50">
              {REACTION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => { onReact(postId, type); setShowPicker(false); }}
                  className="text-3xl hover:scale-125 transition-transform p-2"
                >
                  {REACTION_EMOJI[type]}
                </button>
              ))}
            </div>
          )}

          {/* Comment Button */}
          <button
            onClick={onCommentClick}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--loza-muted)] hover:text-[var(--loza-text)] transition-colors"
          >
            💬 <span>Bình luận</span>
            {commentsCount > 0 && <span className="text-xs bg-[var(--loza-bg-hover)] px-1.5 py-0.5 rounded-full">{commentsCount}</span>}
          </button>
        </div>
      </div>

      {/* Số reaction */}
      {totalReactions > 0 && (
        <div className="text-xs flex items-center gap-1 text-[var(--loza-muted)]">
          <span>❤️👍😂</span>
          <span>{totalReactions}</span>
        </div>
      )}
    </div>
  );
};