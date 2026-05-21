import axiosInstance from "../lib/axios";
import type { Post } from "../types/post";

export interface SearchUser {
  _id: string;
  displayName: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
}

export interface SearchResponse {
  posts: Post[];
  users: SearchUser[];
  query?: string;
}

export const searchService = {
  search: async (q: string): Promise<SearchResponse> => {
    const { data } = await axiosInstance.get("/search", {
      params: { q: q.trim() },
    });
    return data;
  },
};
