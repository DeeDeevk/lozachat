import { useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Comment, ReactionType } from "../../types/post";
import { REACTION_EMOJI, REACTION_LABEL } from "../../types/post";
import { usePostStore } from "../../stores/usePostStore";
import { CommentInput } from "./Commentinput";
import toast from "react-hot-toast";

type CommentWithReplies = Comment & { replies?: CommentWithReplies[] };

const REACTION_TYPES: ReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"];

// Detect sticker content
const isStickerContent = (content: string) => content.startsWith("[sticker]:");
const getStickerUrl = (content: string) => content.replace("[sticker]:", "");

interface CommentItemProps {
  comment: CommentWithReplies;
  postId: string;
  currentUserId: string;
  level?: number;
  onDelete: (commentId: string, isReply: boolean) => void;
  onReplySuccess: () => void;
}

export const CommentItem = ({
  comment,
  postId,
  currentUserId,
  level = 0,
  onDelete,
  onReplySuccess,
}: CommentItemProps) => {
  const [replying, setReplying] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const pickerHideTimer = useRef<ReturnType<typeof setTimeout>>();

  const { userProfile } = useAuthStore();
  const { addComment, reactToComment } = usePostStore();

  const isOwner = comment.author?._id === currentUserId;
  const isReply = !!comment.parentId;
  const indent = Math.min(level, 3) * 20;
  const avatarSize = level === 0 ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";

  const myReaction = comment.reactions?.find((r) => r.userId === currentUserId);
  const totalReactions = comment.reactions?.length ?? 0;

  // ─── React ────────────────────────────────────────────────────
  const handleReact = async (type: ReactionType) => {
    try {
      await reactToComment(postId, comment._id, type);
      onReplySuccess(); // reload để cập nhật reactions
    } catch {
      toast.error("Không thể thả reaction");
    }
  };

  // ─── Reply submit ─────────────────────────────────────────────
  const handleReplySubmit = async (
    content: string,
    imageFiles: File[],
    audioFile: File | null,
  ) => {
    setReplySubmitting(true);
    try {
      await addComment(
        postId,
        content,
        comment._id,
        imageFiles,
        comment.imageId ?? null,
        audioFile,
      );
      setReplying(false);
      onReplySuccess();
    } catch {
      toast.error("Không thể gửi trả lời");
    } finally {
      setReplySubmitting(false);
    }
  };

  // ─── Render deleted ───────────────────────────────────────────
  if (comment.isDeleted) {
    return (
      <div style={{ marginLeft: `${indent}px` }}>
        <div className="bg-[#111d30]/60 border border-white/[0.04] rounded-2xl px-4 py-3">
          <p className="text-[#3a4a60] text-[13px] italic">Bình luận đã bị xóa.</p>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 ml-5 pl-3 border-l-2 border-[#3b6ef5]/20 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                postId={postId}
                currentUserId={currentUserId}
                level={level + 1}
                onDelete={onDelete}
                onReplySuccess={onReplySuccess}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginLeft: `${indent}px` }}>
      {/* Comment card */}
      <div className="group bg-[#111d30] hover:bg-[#162036] border border-white/[0.07] hover:border-[#3b6ef5]/20 rounded-2xl p-4 transition-all duration-150">
        <div className="flex gap-3">
          {/* Avatar */}
          <div
            className={`${avatarSize} rounded-full flex-shrink-0 bg-gradient-to-br from-[#3b6ef5] to-[#6a3bf5] flex items-center justify-center text-white font-semibold overflow-hidden`}
          >
            {comment.author?.avatarUrl ? (
              <img src={comment.author.avatarUrl} alt={comment.author.displayName} className="w-full h-full object-cover" />
            ) : (
              comment.author?.displayName?.[0]?.toUpperCase() ?? "U"
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-[#e8eaf0] font-semibold text-sm truncate">
                {comment.author?.displayName ?? "Người dùng"}
              </span>
              <span className="text-[#4a5a70] text-[11px] flex-shrink-0">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
              </span>
            </div>

            {/* Content */}
            {comment.content && !isStickerContent(comment.content) && (
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#c8cdd8]">
                {comment.content}
              </p>
            )}

            {/* Sticker */}
            {comment.content && isStickerContent(comment.content) && (
              <div className="mt-2">
                <img
                  src={getStickerUrl(comment.content)}
                  alt="sticker"
                  className="w-28 h-28 object-contain"
                />
              </div>
            )}

            {/* Ảnh đính kèm */}
            {comment.images && comment.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {comment.images.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-36 h-36 rounded-2xl overflow-hidden border border-white/10 bg-[#0a1422]"
                  >
                    <img
                      src={url}
                      alt={`comment-img-${idx}`}
                      className="w-full h-full object-cover cursor-pointer hover:brightness-110 transition-all"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Voice message */}
            {comment.audioUrl && (
              <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/[0.07] max-w-xs">
                <audio controls src={comment.audioUrl} className="flex-1 h-8" style={{ minWidth: 0 }} />
              </div>
            )}

            {/* ─── Actions ─────────────────────────────────────────── */}
            <div className="mt-2.5 flex items-center gap-1 flex-wrap">
              {/* React button */}
              <div
                className="relative"
                onMouseEnter={() => {
                  clearTimeout(pickerHideTimer.current);
                  setShowReactionPicker(true);
                }}
                onMouseLeave={() => {
                  pickerHideTimer.current = setTimeout(() => setShowReactionPicker(false), 200);
                }}
              >
                <button
                  onClick={() => handleReact(myReaction?.type ?? "like")}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all flex items-center gap-1.5
                    ${myReaction
                      ? "bg-[#3b6ef5]/15 border-[#3b6ef5]/40 text-[#7aa3ff]"
                      : "bg-white/5 border-white/10 text-[#7a8aa8] hover:bg-white/10 hover:text-[#e8eaf0]"}`}
                >
                  <span>{myReaction ? REACTION_EMOJI[myReaction.type] : "👍"}</span>
                  <span>{myReaction ? REACTION_LABEL[myReaction.type] : "Thích"}</span>
                  {totalReactions > 0 && (
                    <span className="text-[10px] opacity-70">{totalReactions}</span>
                  )}
                </button>

                {showReactionPicker && (
                  <div
                    className="absolute bottom-full left-0 mb-1 z-50 flex gap-1 p-2 rounded-2xl"
                    style={{
                      background: "var(--loza-bg-elevated, #1a2a45)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    }}
                    onMouseEnter={() => clearTimeout(pickerHideTimer.current)}
                    onMouseLeave={() => {
                      pickerHideTimer.current = setTimeout(() => setShowReactionPicker(false), 200);
                    }}
                  >
                    {REACTION_TYPES.map((type) => (
                      <button
                        key={type}
                        title={REACTION_LABEL[type]}
                        onClick={() => { void handleReact(type); setShowReactionPicker(false); }}
                        className="text-xl p-1.5 rounded-xl transition-all hover:scale-125 active:scale-110"
                      >
                        {REACTION_EMOJI[type]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply button (chỉ hiện đến level 1) */}
              {level < 2 && (
                <button
                  onClick={() => setReplying((v) => !v)}
                  className="px-3 py-1.5 rounded-xl text-[12px] font-semibold
                    bg-white/5 border border-white/10 text-[#3b8aff]
                    hover:bg-white/10 hover:text-[#5b9fff] transition-all"
                >
                  ↩ Trả lời
                  {comment.repliesCount > 0 && (
                    <span className="ml-1 opacity-60">({comment.repliesCount})</span>
                  )}
                </button>
              )}

              {/* Delete */}
              {isOwner && (
                <button
                  onClick={() => { if (confirm("Xóa bình luận này?")) onDelete(comment._id, isReply); }}
                  className="px-3 py-1.5 rounded-xl text-[12px] font-semibold
                    bg-white/5 border border-white/10 text-[#e05a5a]
                    hover:bg-red-500/10 hover:text-[#ff6b6b] transition-all"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Reply input — dùng CommentInput compact */}
            {replying && (
              <div className="mt-3">
                <CommentInput
                  avatarUrl={userProfile?.avatarUrl}
                  displayName={userProfile?.displayName}
                  placeholder={`Trả lời ${comment.author?.displayName ?? ""}...`}
                  onSubmit={handleReplySubmit}
                  loading={replySubmitting}
                  autoFocus
                  compact
                  onCancel={() => setReplying(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 ml-5 pl-3 border-l-2 border-[#3b6ef5]/20 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              level={level + 1}
              onDelete={onDelete}
              onReplySuccess={onReplySuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
};
