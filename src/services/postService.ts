import axiosInstance from "../lib/axios";
import type {
  Post,
  PostImage,
  PostsResponse,
  CommentsResponse,
  Visibility,
  ReactionType,
  Comment,
} from "../types/post";

export const postService = {
  // ─── Posts ───────────────────────────────────────────────────

  getPosts: async (page = 1, limit = 10): Promise<PostsResponse> => {
    const { data } = await axiosInstance.get("/posts", { params: { page, limit } });
    return data;
  },

  getUserPosts: async (userId: string, page = 1): Promise<PostsResponse> => {
    const { data } = await axiosInstance.get(`/posts/user/${userId}`, { params: { page } });
    return data;
  },

  getById: async (id: string): Promise<Post> => {
    const { data } = await axiosInstance.get(`/posts/${id}`);
    return data;
  },

  createPost: async (
    content: string,
    images: File[] = [],
    visibility: Visibility = "public",
  ): Promise<Post> => {
    const fd = new FormData();
    fd.append("content", content);
    fd.append("visibility", visibility);
    images.forEach((img) => fd.append("images", img));
    const { data } = await axiosInstance.post("/posts", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  updatePost: async (
    id: string,
    content: string,
    newImages: File[] = [],
    removeImages: string[] = [],
    visibility?: Visibility,
  ): Promise<Post> => {
    const fd = new FormData();
    fd.append("content", content);
    if (visibility) fd.append("visibility", visibility);
    newImages.forEach((img) => fd.append("images", img));
    removeImages.forEach((url) => fd.append("removeImages", url));
    const { data } = await axiosInstance.put(`/posts/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deletePost: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/posts/${id}`);
  },

  reactToPost: async (postId: string, type: ReactionType): Promise<Post> => {
    const { data } = await axiosInstance.post(`/posts/${postId}/react`, { type });
    return data;
  },

  // ─── Images ──────────────────────────────────────────────────

  getPostImages: async (postId: string): Promise<PostImage[]> => {
    const { data } = await axiosInstance.get(`/posts/${postId}/images`);
    return data;
  },

  reactToImage: async (
    postId: string,
    imageId: string,
    type: ReactionType,
  ): Promise<PostImage> => {
    const { data } = await axiosInstance.post(
      `/posts/${postId}/images/${imageId}/react`,
      { type },
    );
    return data;
  },

  // ─── Comments ────────────────────────────────────────────────

  getComments: async (
    postId: string,
    imageId?: string,
    page = 1,
  ): Promise<CommentsResponse> => {
    const { data } = await axiosInstance.get(`/posts/${postId}/comments`, {
      params: { page, ...(imageId ? { imageId } : {}) },
    });
    return data;
  },

  /**
   * Thêm comment/reply.
   * - imageFiles: ảnh đính kèm (tối đa 4)
   * - audioFile:  voice message (tối đa 1, backend phân loại theo mimetype)
   * - imageId:    nếu comment gắn vào ảnh cụ thể
   * - parentId:   nếu là reply
   */
  addComment: async (
    postId: string,
    content: string,
    parentId: string | null = null,
    imageFiles: File[] = [],
    imageId: string | null = null,
    audioFile: File | null = null,
  ): Promise<Comment> => {
    const fd = new FormData();
    if (content?.trim()) fd.append("content", content.trim());
    if (parentId)        fd.append("parentId", parentId);
    if (imageId)         fd.append("imageId", imageId);
    // ảnh và audio đều dùng field "images" — backend phân loại theo file.mimetype
    imageFiles.forEach((f) => fd.append("images", f));
    if (audioFile)       fd.append("images", audioFile);

    const { data } = await axiosInstance.post(`/posts/${postId}/comments`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await axiosInstance.delete(`/posts/${postId}/comments/${commentId}`);
  },

  reactToComment: async (
    postId: string,
    commentId: string,
    type: ReactionType,
  ): Promise<Comment> => {
    const { data } = await axiosInstance.post(
      `/posts/${postId}/comments/${commentId}/react`,
      { type },
    );
    return data;
  },

  getReplies: async (
    postId: string,
    commentId: string,
    page = 1,
  ): Promise<CommentsResponse> => {
    const { data } = await axiosInstance.get(
      `/posts/${postId}/comments/${commentId}/replies`,
      { params: { page } },
    );
    return data;
  },
};