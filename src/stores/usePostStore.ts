import { create } from "zustand";
import type { Post, PostImage, Visibility, ReactionType, Comment } from "../types/post";
import { postService } from "../services/postService";
import { normalizePost, normalizePosts } from "../utils/normalizePost";
import toast from "react-hot-toast";

interface PostStore {
  // ─── Posts ───────────────────────────────────────────────────
  posts: Post[];
  loading: boolean;
  hasMore: boolean;
  page: number;
  fetchPosts: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  createPost: (content: string, images?: File[], visibility?: Visibility) => Promise<void>;
  updatePost: (
    id: string,
    content: string,
    newImages?: File[],
    removeImages?: string[],
    visibility?: Visibility,
  ) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  reactToPost: (postId: string, type: ReactionType) => Promise<void>;
  sharePost: (postId: string, content?: string, visibility?: Visibility) => Promise<void>;
  ensurePostInFeed: (postId: string) => Promise<Post | null>;

  // ─── Images ──────────────────────────────────────────────────
  getPostImages: (postId: string) => Promise<PostImage[]>;
  reactToImage: (postId: string, imageId: string, type: ReactionType) => Promise<PostImage>;

  // ─── Comments ────────────────────────────────────────────────
  getCommentsForPost: (postId: string, imageId?: string) => Promise<Comment[]>;
  addComment: (
    postId: string,
    content: string,
    parentId?: string | null,
    files?: File[],
    imageId?: string | null,
    audioFile?: File | null,
  ) => Promise<Comment>;
  deleteComment: (postId: string, commentId: string, isReply?: boolean) => Promise<void>;
  reactToComment: (postId: string, commentId: string, type: ReactionType) => Promise<Comment>;
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  loading: false,
  hasMore: true,
  page: 1,

  fetchPosts: async (reset = false) => {
    const { loading, page } = get();
    if (loading) return;
    const currentPage = reset ? 1 : page;
    set({ loading: true });
    try {
      const res = await postService.getPosts(currentPage);
      let newPosts = normalizePosts(res.posts);
      if (reset && newPosts.length > 1) {
        const pivot = Math.floor(Math.random() * newPosts.length);
        newPosts = [...newPosts.slice(pivot), ...newPosts.slice(0, pivot)];
      }
      set((state) => ({
        posts: reset ? newPosts : [...state.posts, ...newPosts],
        hasMore: res.pagination.hasMore,
        page: currentPage,
        loading: false,
      }));
    } catch {
      toast.error("Không thể tải bài viết");
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { loading, hasMore, page } = get();
    if (loading || !hasMore) return;
    set({ page: page + 1 });
    await get().fetchPosts();
  },

  createPost: async (content, images = [], visibility = "public") => {
    try {
      const post = normalizePost(await postService.createPost(content, images, visibility));
      set((state) => ({ posts: [post, ...state.posts] }));
      toast.success("Đã đăng bài viết!");
    } catch {
      toast.error("Đăng bài thất bại!");
      throw new Error("Create post failed");
    }
  },

  updatePost: async (id, content, newImages = [], removeImages = [], visibility) => {
    try {
      const updated = normalizePost(
        await postService.updatePost(id, content, newImages, removeImages, visibility),
      );
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
      throw new Error("Delete post failed");
    }
  },

  reactToPost: async (postId, type) => {
    try {
      const updated = normalizePost(await postService.reactToPost(postId, type));
      set((state) => ({
        posts: state.posts.map((p) => (p._id === postId ? updated : p)),
      }));
    } catch {
      toast.error("Không thể thả reaction");
    }
  },

  ensurePostInFeed: async (postId) => {
    const existing = get().posts.find((p) => p._id === postId);
    if (existing) return existing;
    try {
      const post = normalizePost(await postService.getById(postId));
      set((state) => ({
        posts: state.posts.some((p) => p._id === postId)
          ? state.posts
          : [post, ...state.posts],
      }));
      return post;
    } catch {
      return null;
    }
  },

  sharePost: async (postId, content = "", visibility = "public") => {
    try {
      const shared = normalizePost(await postService.sharePost(postId, content, visibility));
      set((state) => ({
        posts: [shared, ...state.posts.map((p) =>
          p._id === postId
            ? { ...p, sharesCount: (p.sharesCount || 0) + 1 }
            : p,
        )],
      }));
      toast.success("Đã chia sẻ bài viết");
    } catch {
      toast.error("Chia sẻ thất bại");
      throw new Error("Share post failed");
    }
  },

  getPostImages: async (postId) => postService.getPostImages(postId),

  reactToImage: async (postId, imageId, type) =>
    postService.reactToImage(postId, imageId, type),

  getCommentsForPost: async (postId, imageId) => {
    try {
      const res = await postService.getComments(postId, imageId);
      return res.comments;
    } catch {
      return [];
    }
  },

  addComment: async (
    postId,
    content,
    parentId = null,
    files = [],
    imageId = null,
    audioFile = null,
  ) => {
    try {
      const newComment = await postService.addComment(
        postId,
        content,
        parentId,
        files,
        imageId,
        audioFile,
      );

      // Chỉ tăng commentsCount khi là comment gốc của bài (không reply, không comment ảnh)
      if (!parentId && !imageId) {
        set((state) => ({
          posts: state.posts.map((p) =>
            p._id === postId
              ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
              : p,
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

  deleteComment: async (postId, commentId, isReply = false) => {
    try {
      await postService.deleteComment(postId, commentId);
      if (!isReply) {
        set((state) => ({
          posts: state.posts.map((p) =>
            p._id === postId
              ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) }
              : p,
          ),
        }));
      }
      toast.success("Đã xóa bình luận");
    } catch {
      toast.error("Không thể xóa bình luận");
      throw new Error("Delete comment failed");
    }
  },

  reactToComment: async (postId, commentId, type) => {
    try {
      return await postService.reactToComment(postId, commentId, type);
    } catch {
      toast.error("Không thể thả reaction");
      throw new Error("React to comment failed");
    }
  },
}));