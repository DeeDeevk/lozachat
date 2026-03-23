import { useState, useEffect } from "react";
import { usePostStore } from "../../stores/usePostStore";
import type { Comment } from "../../types/post";
import { CommentItem } from "./CommentItem";
import toast from "react-hot-toast";

type CommentWithReplies = Comment & { replies: CommentWithReplies[] };

function buildTree(flat: Comment[]): CommentWithReplies[] {
  const map = new Map<string, CommentWithReplies>();
  const roots: CommentWithReplies[] = [];

  flat.forEach((c) => map.set(c._id, { ...c, replies: [] }));

  flat.forEach((c) => {
    const parentId =
      typeof c.parentId === "object" && c.parentId !== null
        ? (c.parentId as any)._id
        : c.parentId;

    if (parentId && map.has(parentId)) {
      map.get(parentId)!.replies.push(map.get(c._id)!);
    } else {
      roots.push(map.get(c._id)!);
    }
  });

  return roots;
}

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
}: Props) => {
  const [tree, setTree] = useState<CommentWithReplies[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const { addComment, deleteComment, getCommentsForPost } = usePostStore();

  const loadComments = async () => {
    setFetching(true);
    try {
      const data = await getCommentsForPost(postId);
      setTree(buildTree(data));
    } catch {
      setTree([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handlePostComment = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await addComment(postId, content);
      setContent("");
      await loadComments();
    } catch {
      toast.error("Không thể đăng bình luận");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(postId, commentId);
      await loadComments();
    } catch {
      toast.error("Không thể xóa");
    }
  };

  return (
    <div className="mt-3 bg-[#0d1b2e] border border-white/[0.07] rounded-2xl p-5">
      {/* Input area */}
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3b6ef5] to-[#6a3bf5] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          U
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết bình luận của bạn..."
            rows={2}
            className="w-full bg-[#0a1422] text-[#e8eaf0] border border-white/[0.08] focus:border-[#3b6ef5]/60 rounded-xl px-4 py-3 text-sm resize-none placeholder:text-[#3a4a60] outline-none transition-colors leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePostComment();
              }
            }}
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handlePostComment}
              disabled={!content.trim() || loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold
    bg-[#131f35] text-[#3b8aff] border border-white/[0.06]
    hover:bg-[#1a2a45] hover:text-[#5b9fff]
    disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Đang gửi..." : "Gửi"}
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-5 border-t border-white/[0.06]" />

      {/* Comment list */}
      {fetching ? (
        <div className="py-8 text-center text-[#4a5a70] text-sm animate-pulse">
          Đang tải bình luận...
        </div>
      ) : tree.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-[#4a5a70] text-sm">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tree.map((c) => (
            <CommentItem
              key={c._id}
              comment={c}
              postId={postId}
              currentUserId={currentUserId}
              onDelete={handleDelete}
              onReplySuccess={loadComments}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {commentsCount > tree.length && tree.length > 0 && (
        <button
          onClick={loadComments}
          className="mt-4 w-full py-2.5 text-sm text-[#3b6ef5] hover:text-[#5080ff] bg-[#3b6ef5]/5 hover:bg-[#3b6ef5]/10 border border-[#3b6ef5]/15 rounded-xl font-medium transition-colors"
        >
          Xem thêm bình luận
        </button>
      )}
    </div>
  );
};
