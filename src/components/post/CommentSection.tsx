import { useState, useEffect, useRef } from "react";
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
  //image
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );

    if (selectedFiles.length + newFiles.length > 4) {
      toast.error("Tối đa 4 ảnh mỗi bình luận");
      return;
    }

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = ""; // reset input
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePostComment = async () => {
    if (!content.trim() && selectedFiles.length === 0) {
      toast.error("Bình luận phải có nội dung hoặc ảnh");
      return;
    }

    setLoading(true);
    try {
      await addComment(postId, content.trim(), undefined, selectedFiles);
      // cleanup
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setContent("");
      setImagePreviews([]);
      setSelectedFiles([]);

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
          
          {/* ─── Attach button + Send ───────────────────────────────── */}
          <div className="mt-2 flex gap-2 items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-sm font-semibold
                bg-white/5 backdrop-blur-sm border border-white/10
                text-[#7a8aa8] hover:bg-white/10 hover:text-[#e8eaf0]
                transition-all flex items-center gap-1"
            >
              📸
            </button>

            <button
              onClick={handlePostComment}
              disabled={(!content.trim() && selectedFiles.length === 0) || loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold
                bg-[#131f35] text-[#3b8aff] border border-white/[0.06]
                hover:bg-[#1a2a45] hover:text-[#5b9fff]
                disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Đang gửi..." : "Gửi"}
            </button>
          </div>

          {/* ─── Image previews ─────────────────────────────────────── */}
          {imagePreviews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-[#0a1422]"
                >
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

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
