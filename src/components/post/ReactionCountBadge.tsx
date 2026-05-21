import type { Reaction, ReactionType } from "../../types/post";
import { REACTION_EMOJI } from "../../types/post";

interface Props {
  reactions: Reaction[];
  onClick?: () => void;
  className?: string;
  label?: string;
}

export function ReactionCountBadge({
  reactions,
  onClick,
  className = "",
  label,
}: Props) {
  const total = reactions.length;
  if (total === 0) return null;

  const types = [...new Set(reactions.map((r) => r.type))].slice(0, 3);

  const inner = (
    <>
      <div className="flex -space-x-0.5">
        {types.map((type) => (
          <span key={type} className="text-sm leading-none">
            {REACTION_EMOJI[type as ReactionType]}
          </span>
        ))}
      </div>
      <span className="text-xs font-semibold tabular-nums">{total}</span>
      {label ? <span className="text-[10px] opacity-70">{label}</span> : null}
    </>
  );

  const cls = `inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-slate-100 ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`${cls} hover:bg-black/65 transition-colors cursor-pointer`}
        title="Xem ai đã bày tỏ cảm xúc"
      >
        {inner}
      </button>
    );
  }

  return <div className={cls}>{inner}</div>;
}
