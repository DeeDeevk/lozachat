import axiosInstance from "../lib/axios";
import type { Post, PostsResponse, Visibility } from "../types/post";
import type { ReactionType } from "../types/post";


export const postService = {
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
    visibility: Visibility = "public"
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
    visibility?: Visibility
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
  //comment
addComment: async (
    postId: string,
    content: string,
    parentId: string | null = null,
    files: File[] = []
  ): Promise<any> => {
    const formData = new FormData();

    if (content?.trim()) {
      formData.append("content", content.trim());
    }
    if (parentId) {
      formData.append("parentId", parentId);
    }
    files.forEach((file) => {
      formData.append("images", file);
    });

    // Debug log (bạn có thể xóa sau khi test ổn)
    console.log("🚀 Sending comment with FormData");
    console.log("   content:", content?.slice(0, 50) || "(chỉ ảnh)");
    console.log("   parentId:", parentId);
    console.log("   files:", files.length);

    const { data } = await axiosInstance.post(`/posts/${postId}/comments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },   // ← quan trọng nhất
    });

    console.log("✅ addComment success:", data);
    return data;
  },

  getComments: async (postId: string, page = 1): Promise<{ comments: Comment[]; pagination: any }> => {
    const { data } = await axiosInstance.get(`/posts/${postId}/comments`, { params: { page } });
    return data;
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await axiosInstance.delete(`/posts/${postId}/comments/${commentId}`);
  },

};