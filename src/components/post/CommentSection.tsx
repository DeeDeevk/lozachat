import { useState, useEffect } from "react";
import { usePostStore } from "../../stores/usePostStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Comment } from "../../types/post";
import { CommentItem } from "./CommentItem";
import { CommentInput } from "./Commentinput";
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
  imageId?: string;
}

export const CommentSection = ({
  postId,
  commentsCount,
  currentUserId,
  imageId,
}: Props) => {
  const [tree, setTree] = useState<CommentWithReplies[]>([]);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const { userProfile } = useAuthStore();
  const { addComment, deleteComment, getCommentsForPost } = usePostStore();

  const loadComments = async () => {
    setFetching(true);
    try {
      const data = await getCommentsForPost(postId, imageId);
      setTree(buildTree(data));
      setHasMore(data.length < commentsCount);
    } catch {
      setTree([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, imageId]);

  const handleSubmit = async (
    content: string,
    imageFiles: File[],
    audioFile: File | null,
  ) => {
    setSubmitting(true);
    try {
      await addComment(postId, content, null, imageFiles, imageId ?? null, audioFile);
      await loadComments();
    } catch {
      toast.error("Không thể đăng bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string, isReply: boolean) => {
    try {
      await deleteComment(postId, commentId, isReply);
      await loadComments();
    } catch {
      toast.error("Không thể xóa");
    }
  };

  return (
    <div className="mt-3 bg-[#0d1b2e] border border-white/[0.07] rounded-2xl p-5">
      <CommentInput
        avatarUrl={userProfile?.avatarUrl}
        displayName={userProfile?.displayName}
        placeholder={imageId ? "Bình luận về ảnh này..." : "Viết bình luận của bạn..."}
        onSubmit={handleSubmit}
        loading={submitting}
      />

      <div className="my-5 border-t border-white/[0.06]" />

      {fetching ? (
        <div className="py-8 text-center text-[#4a5a70] text-sm animate-pulse">
          Đang tải bình luận...
        </div>
      ) : tree.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-[#4a5a70] text-sm">
            {imageId ? "Chưa có bình luận nào cho ảnh này." : "Chưa có bình luận nào. Hãy là người đầu tiên!"}
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

      {hasMore && !fetching && (
        <button
          onClick={loadComments}
          className="mt-4 w-full py-2.5 text-sm text-[#3b6ef5] hover:text-[#5080ff]
            bg-[#3b6ef5]/5 hover:bg-[#3b6ef5]/10 border border-[#3b6ef5]/15
            rounded-xl font-medium transition-colors"
        >
          Xem thêm bình luận
        </button>
      )}
    </div>
  );
};
