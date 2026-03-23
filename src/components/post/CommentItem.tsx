import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { Comment } from "../../types/post";
import { usePostStore } from "../../stores/usePostStore";
import toast from "react-hot-toast";

type CommentWithReplies = Comment & { replies?: CommentWithReplies[] };

interface CommentItemProps {
  comment: CommentWithReplies;
  postId: string;
  currentUserId: string;
  level?: number;
  onDelete: (commentId: string) => void;
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
  const [replyContent, setReplyContent] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);

  const { addComment } = usePostStore();
  const isOwner = comment.author._id === currentUserId;
  const indent = Math.min(level, 3) * 20;
  const avatarSize = level === 0 ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";

  const handlePostReply = async () => {
    if (!replyContent.trim()) return;
    setLoadingReply(true);
    try {
      await addComment(postId, replyContent, comment._id);
      setReplyContent("");
      setReplying(false);
      onReplySuccess();
    } catch {
      toast.error("Không thể gửi trả lời");
    } finally {
      setLoadingReply(false);
    }
  };

  return (
    <div style={{ marginLeft: `${indent}px` }}>
      {/* Comment card */}
      <div className="group bg-[#111d30] hover:bg-[#162036] border border-white/[0.07] hover:border-[#3b6ef5]/20 rounded-2xl p-4 transition-all duration-150">
        <div className="flex gap-3">
          {/* Avatar */}
          <div
            className={`${avatarSize} rounded-full flex-shrink-0 bg-gradient-to-br from-[#3b6ef5] to-[#6a3bf5] flex items-center justify-center text-white font-semibold`}
          >
            {comment.author.displayName?.[0]?.toUpperCase() ?? "U"}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-[#e8eaf0] font-semibold text-sm truncate">
                {comment.author.displayName}
              </span>
              <span className="text-[#4a5a70] text-[11px] flex-shrink-0">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: vi,
                })}
              </span>
            </div>

            {/* Content */}
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#c8cdd8]">
              {comment.content}
            </p>

            {/* Actions */}
<div className="mt-2.5 flex items-center gap-1">
  <button
    onClick={() => setReplying(!replying)}
    className="px-3 py-1.5 rounded-xl text-[12px] font-semibold
      bg-white/5 backdrop-blur-sm
      text-[#3b8aff]
      border border-white/10
      hover:bg-white/10 hover:text-[#5b9fff]
      transition-all"
  >
    ↩ Trả lời
  </button>

  {isOwner && (
    <button
      onClick={() => {
        if (confirm("Xóa bình luận này?")) onDelete(comment._id);
      }}
      className="px-3 py-1.5 rounded-xl text-[12px] font-semibold
        bg-white/5 backdrop-blur-sm
        text-[#e05a5a]
        border border-white/10
        hover:bg-red-500/10 hover:text-[#ff6b6b]
        transition-all"
    >
      Xóa
    </button>
  )}
</div>

{/* Reply input buttons */}
{replying && (
  <div className="mt-3 bg-white/5 backdrop-blur-md border border-[#3b6ef5]/20 rounded-xl p-3">
    <div className="flex gap-2.5">
      <div
        className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3b6ef5] to-[#6a3bf5]
        flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
      >
        U
      </div>

      <div className="flex-1">
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          autoFocus
          placeholder={`Trả lời ${comment.author.displayName}...`}
          className="w-full bg-transparent text-[#e8eaf0] placeholder:text-[#3a4a60]
            text-sm resize-none min-h-[36px] outline-none leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handlePostReply();
            }
            if (e.key === "Escape") {
              setReplying(false);
              setReplyContent("");
            }
          }}
          rows={2}
        />

        <div className="mt-2 flex gap-2">
          <button
            onClick={handlePostReply}
            disabled={!replyContent.trim() || loadingReply}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold
              bg-white/5 backdrop-blur-sm
              text-[#3b8aff]
              border border-white/10
              hover:bg-white/10 hover:text-[#5b9fff]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all"
          >
            {loadingReply ? "Đang gửi..." : "Gửi"}
          </button>

          <button
            onClick={() => {
              setReplying(false);
              setReplyContent("");
            }}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold
              bg-white/5 backdrop-blur-sm
              text-[#7a8aa8]
              border border-white/10
              hover:bg-white/10 hover:text-[#e8eaf0]
              transition-all"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
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
