import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { postService } from "../../services/postService";
import type {
  PostReactionsDetailResponse,
  ReactionDetailItem,
  ReactionType,
} from "../../types/post";
import { REACTION_EMOJI, REACTION_LABEL } from "../../types/post";

interface Props {
  postId: string;
  /** Chỉ hiển thị một ảnh (theo imageId), hoặc toàn bộ */
  focusImageId?: string | null;
  onClose: () => void;
}

function groupByType(reactions: ReactionDetailItem[]) {
  const map = new Map<ReactionType, ReactionDetailItem[]>();
  for (const r of reactions) {
    const list = map.get(r.type) || [];
    list.push(r);
    map.set(r.type, list);
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}

function Section({
  title,
  reactions,
  onUserClick,
}: {
  title: string;
  reactions: ReactionDetailItem[];
  onUserClick: (userId: string) => void;
}) {
  if (reactions.length === 0) {
    return (
      <div className="mb-5">
        <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          {title}
          <span className="text-xs font-normal text-slate-500">(0)</span>
        </h4>
        <p className="text-xs text-slate-500 pl-4">Chưa có cảm xúc</p>
      </div>
    );
  }
  const groups = groupByType(reactions);

  return (
    <div className="mb-5">
      <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        {title}
        <span className="text-xs font-normal text-slate-500">({reactions.length})</span>
      </h4>

      {groups.map(([type, list]) => (
        <div key={type} className="mb-3">
          <p className="text-xs text-indigo-300 font-semibold mb-2 flex items-center gap-1">
            <span>{REACTION_EMOJI[type]}</span>
            {REACTION_LABEL[type]} · {list.length}
          </p>
          <div className="space-y-2">
            {list.map((r) => (
              <button
                key={`${r.userId}-${type}`}
                type="button"
                onClick={() => onUserClick(r.userId)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                {r.avatarUrl ? (
                  <img
                    src={r.avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {(r.displayName || "?")[0]}
                  </div>
                )}
                <span className="text-sm text-slate-200 font-medium flex-1 truncate">
                  {r.displayName}
                </span>
                <span className="text-lg">{REACTION_EMOJI[r.type]}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReactionStatsModal({ postId, focusImageId, onClose }: Props) {
  const [data, setData] = useState<PostReactionsDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    postService
      .getReactionsDetail(postId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    return () => {
      document.body.style.overflow = "";
    };
  }, [postId]);

  const goProfile = (userId: string) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  const title = focusImageId
    ? `Thống kê cảm xúc · Ảnh`
    : "Thống kê cảm xúc bài viết";

  return (
    <div
      className="fixed inset-0 z-2147483647 flex items-center justify-center p-4 bg-black/75 backdrop-blur-[6px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md max-h-[85vh] rounded-2xl overflow-hidden flex flex-col bg-(--loza-bg-elevated,#0d1425) border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-slate-300 hover:bg-white/15"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-center text-slate-400 text-sm py-8">Đang tải...</p>
          ) : !data ? (
            <p className="text-center text-slate-400 text-sm py-8">Không tải được dữ liệu</p>
          ) : focusImageId ? (
            (() => {
              const img = data.images.find((i) => i.imageId === focusImageId);
              if (!img || img.reactions.length === 0) {
                return (
                  <p className="text-center text-slate-400 text-sm py-8">
                    Ảnh này chưa có cảm xúc
                  </p>
                );
              }
              return (
                <Section
                  title={`Media ${img.index}`}
                  reactions={img.reactions}
                  onUserClick={goProfile}
                />
              );
            })()
          ) : (
            <Section
              title="Bài viết"
              reactions={data.post.reactions}
              onUserClick={goProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
}
