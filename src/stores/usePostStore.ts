import { create } from "zustand";
import type { Post } from "../types/post";
import type { ReactionType } from "../types/post";
import type { Comment } from "../types/post";
import { postService } from "../services/postService";
import toast from "react-hot-toast";

interface PostStore {
  posts: Post[];
  loading: boolean;
  hasMore: boolean;
  page: number;
  fetchPosts: (reset?: boolean) => Promise<void>;
  loadMore: () => void;
  createPost: (content: string, images?: File[]) => Promise<void>;
  updatePost: (id: string, content: string, newImages?: File[], removeImages?: string[]) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  reactToPost: (postId: string, type: ReactionType) => Promise<void>;
  
  //comment
  addComment: (
    postId: string,
    content: string,
    parentId?: string | null,
    files?: File[]
  ) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  getCommentsForPost: (postId: string) => Promise<Comment[]>;
  
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  loading: false,
  hasMore: true,
  page: 1,

  fetchPosts: async (reset = false) => {
    const currentPage = reset ? 1 : get().page;
    set({ loading: true });
    try {
      const res = await postService.getPosts(currentPage);
      set((state) => ({
        posts: reset ? res.posts : [...state.posts, ...res.posts],
        hasMore: res.pagination.hasMore,
        page: currentPage,
        loading: false,
      }));
    } catch {
      toast.error("Không thể tải bài viết");
      set({ loading: false });
    }
  },

  loadMore: () => {
    const { loading, hasMore, page } = get();
    if (!loading && hasMore) {
      set({ page: page + 1 });
      get().fetchPosts();
    }
  },

  createPost: async (content, images = []) => {
    try {
      const post = await postService.createPost(content, images);
      set((state) => ({ posts: [post, ...state.posts] }));
      toast.success("Đã đăng bài viết!");
    } catch {
      toast.error("Đăng bài thất bại!");
      throw new Error("Create post failed");
    }
  },

  updatePost: async (id, content, newImages = [], removeImages = []) => {
    try {
      const updated = await postService.updatePost(id, content, newImages, removeImages);
      set((state) => ({
        posts: state.posts.map((p) => (p._id === id ? updated : p)),
      }));
      toast.success("Đã cập nhật bài viết!");
    } catch {
      toast.error("Cập nhật thất bại!");
      throw new Error("Update post failed");
    }
  },

  deletePost: async (id) => {
    try {
      await postService.deletePost(id);
      set((state) => ({ posts: state.posts.filter((p) => p._id !== id) }));
      toast.success("Đã xoá bài viết");
    } catch {
      toast.error("Xoá thất bại!");
    }
  },

  reactToPost: async (postId, type) => {
    try {
      const updated = await postService.reactToPost(postId, type);
      set((state) => ({
        posts: state.posts.map((p) => (p._id === postId ? updated : p)),
      }));
    } catch {
      toast.error("Không thể thả reaction");
    }
  },
  addComment: async (postId, content, parentId = null, files = []) => {
    try {
      const newComment = await postService.addComment(postId, content, parentId, files);

      // Chỉ tăng commentsCount của Post khi là comment gốc (không phải reply)
      if (!parentId) {
        set((state) => ({
          posts: state.posts.map((p) =>
            p._id === postId
              ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
              : p
          ),
        }));
      }

      toast.success(parentId ? "Đã trả lời" : "Đã bình luận 👍");
      return newComment;
    } catch {
      toast.error(parentId ? "Trả lời thất bại" : "Bình luận thất bại");
      throw new Error("Add comment failed");
    }
  },

  deleteComment: async (postId, commentId) => {
    try {
      await postService.deleteComment(postId, commentId);
      set((state) => ({
        posts: state.posts.map((p) =>
          p._id === postId
            ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) }
            : p
        ),
      }));
      toast.success("Đã xóa bình luận");
    } catch {
      toast.error("Không thể xóa bình luận");
    }
  },

  getCommentsForPost: async (postId) => {
    try {
      const res = await postService.getComments(postId);
      return res.comments;
    } catch {
      return [];
    }
  },
}));