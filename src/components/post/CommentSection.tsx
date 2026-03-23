import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { usePostStore } from "../../stores/usePostStore";
import type { Comment } from "../../types/post";
import toast from "react-hot-toast";

interface Props {
  postId: string;
  commentsCount: number;
  currentUserId: string;
  isInDetail?: boolean;
}

export const CommentSection = ({
  postId,
  commentsCount,
  currentUserId,
  isInDetail = false,
}: Props) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const { addComment, deleteComment, getCommentsForPost } = usePostStore();

  const loadComments = async () => {
    try {
      const data = await getCommentsForPost(postId);
      setComments(data);
    } catch {
      setComments([]);
    }
  };

  useEffect(() => {
    if (isInDetail || commentsCount > 0) {
      loadComments();
    }
  }, [postId]);

  const handlePostComment = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await addComment(postId, content);
      setContent("");
      await loadComments();
      toast.success("Bình luận đã được đăng");
    } catch {
      toast.error("Không thể đăng bình luận");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Xóa bình luận này thật chứ?")) return;
    try {
      await deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Đã xóa bình luận");
    } catch {
      toast.error("Không thể xóa");
    }
  };

  return (
    <div className="px-4 pb-4 mt-3 bg-white/95 rounded-2xl border border-gray-200 shadow-sm">
      
      {/* INPUT */}
      <div className="flex gap-3 mt-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {currentUserId ? "U" : "👤"}
        </div>

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết bình luận của bạn..."
            className="w-full bg-white text-black border border-gray-300 rounded-2xl px-4 py-3 text-sm resize-y min-h-[48px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--loza-accent)]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePostComment();
              }
            }}
          />

          <button
            onClick={handlePostComment}
            disabled={!content.trim() || loading}
            className="mt-2 px-5 py-2 bg-[var(--loza-accent)] hover:opacity-90 text-white rounded-xl font-medium disabled:opacity-50 transition"
          >
            {loading ? "Đang gửi..." : "Gửi"}
          </button>
        </div>
      </div>

      {/* LIST COMMENT */}
      <div className="mt-6 space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-6">
            Chưa có bình luận nào. Hãy là người đầu tiên 💬
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c._id}
              className="flex gap-3 group bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />

              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 text-sm">
                    {c.author.displayName}
                  </span>

                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(c.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>

                <p className="mt-1 text-[15px] leading-relaxed text-gray-800">
                  {c.content}
                </p>

                {c.author._id === currentUserId && (
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="text-xs text-red-500 hover:underline mt-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* LOAD MORE */}
      {commentsCount > comments.length && (
        <button className="text-sm text-blue-600 mt-4 hover:underline">
          Xem thêm bình luận
        </button>
      )}
    </div>
  );
};