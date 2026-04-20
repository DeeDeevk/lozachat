import { useState, useRef } from "react";
import { REACTION_EMOJI, REACTION_LABEL } from "../../types/post";
import type { ReactionType } from "../../types/post";

interface Props {
  postId: string;
  reactions: { userId: string; type: ReactionType }[];
  currentUserId: string;
  onReact: (postId: string, type: ReactionType) => void;
}

const REACTION_TYPES: ReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"];

export const ReactionBar = ({ postId, reactions, currentUserId, onReact }: Props) => {
  const [showPicker, setShowPicker] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myReaction = reactions.find((r) => r.userId === currentUserId);
  const totalCount = reactions.length;

  // Nhóm reactions theo type, sắp xếp theo số lượng giảm dần
  const grouped = REACTION_TYPES.reduce(
    (acc, type) => {
      const count = reactions.filter((r) => r.type === type).length;
      if (count > 0) acc[type] = count;
      return acc;
    },
    {} as Partial<Record<ReactionType, number>>,
  );

  const handleWrapperEnter = () => {
  if (hideTimer.current) {
    clearTimeout(hideTimer.current);
  }
  showTimer.current = setTimeout(() => setShowPicker(true), 350);
};

const handleWrapperLeave = () => {
  if (showTimer.current) {
    clearTimeout(showTimer.current);
  }
  hideTimer.current = setTimeout(() => setShowPicker(false), 150);
};

  const handleMainClick = () => {
    if (myReaction) {
      // Đã react → click để bỏ react (gửi cùng type để toggle)
      onReact(postId, myReaction.type);
    } else {
      // Chưa react → mặc định like
      onReact(postId, "like");
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative inline-block"
        onMouseEnter={handleWrapperEnter}
        onMouseLeave={handleWrapperLeave}
      >
        {/* ─── Reaction picker ──────────────────────────────────── */}
        {showPicker && (
          <div
            className="absolute bottom-full left-0 mb-1"
            style={{
              background: "var(--loza-bg-elevated)",
              border: "1px solid var(--loza-border-bright)",
              boxShadow: "0 0 24px var(--loza-accent-glow)",
              borderRadius: "999px",
              padding: "6px 10px",
              display: "flex",
              gap: "4px",
              zIndex: 50,
              whiteSpace: "nowrap",
            }}
          >
            {REACTION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => {
                  onReact(postId, type);
                  setShowPicker(false);
                }}
                title={REACTION_LABEL[type]}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  fontSize: "22px",
                  lineHeight: 1,
                  borderRadius: "8px",
                  transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.35)";
                  e.currentTarget.style.background = "var(--loza-bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {REACTION_EMOJI[type]}
              </button>
            ))}
          </div>
        )}

        {/* ─── Main react button ────────────────────────────────── */}
        <button
          onClick={handleMainClick}
          style={{
            background: myReaction
              ? "color-mix(in srgb, var(--loza-accent) 14%, transparent)"
              : "transparent",
            color: myReaction ? "var(--loza-accent-light)" : "var(--loza-muted)",
            border: "none",
            padding: "6px 12px",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 600,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!myReaction) e.currentTarget.style.color = "var(--loza-sub)";
            e.currentTarget.style.background = myReaction
              ? "color-mix(in srgb, var(--loza-accent) 20%, transparent)"
              : "var(--loza-bg-hover)";
          }}
          onMouseLeave={(e) => {
            if (!myReaction) e.currentTarget.style.color = "var(--loza-muted)";
            e.currentTarget.style.background = myReaction
              ? "color-mix(in srgb, var(--loza-accent) 14%, transparent)"
              : "transparent";
          }}
        >
          <span style={{ fontSize: "16px", lineHeight: 1 }}>
            {myReaction ? REACTION_EMOJI[myReaction.type] : "👍"}
          </span>
          <span>{myReaction ? REACTION_LABEL[myReaction.type] : "Thích"}</span>
        </button>
      </div>

      {/* ─── Reaction summary ─────────────────────────────────────── */}
      {totalCount > 0 && (
        <div
          className="flex items-center gap-1.5"
          style={{ color: "var(--loza-muted)", fontSize: "12px" }}
        >
          <div className="flex">
            {(Object.entries(grouped) as [ReactionType, number][])
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([type]) => (
                <span
                  key={type}
                  style={{ fontSize: "14px", lineHeight: 1, marginRight: "-2px" }}
                >
                  {REACTION_EMOJI[type]}
                </span>
              ))}
          </div>
          <span style={{ marginLeft: "4px" }}>{totalCount}</span>
        </div>
      )}
    </div>
  );
};
