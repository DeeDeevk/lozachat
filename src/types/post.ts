export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";
export type Visibility = "public" | "friends" | "private";

export interface Author {
  _id: string;
  displayName: string;
  avatarUrl?: string;
}

export interface Reaction {
  userId: string;
  type: ReactionType;
  createdAt: string;
}

export interface Post {
  _id: string;
  author: Author;
  content: string;
  images: string[];
  reactions: Reaction[];
  //comment
  commentsCount: number;
  //
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasMore: boolean;
}

export interface PostsResponse {
  posts: Post[];
  pagination: Pagination;
}

export const REACTION_EMOJI: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
};

export const REACTION_LABEL: Record<ReactionType, string> = {
  like: "Thích",
  love: "Yêu thích",
  haha: "Haha",
  wow: "Wow",
  sad: "Buồn",
  angry: "Phẫn nộ",
};

//comment
export interface Comment {
  _id: string;
  author: Author;           
  content: string;
  createdAt: string;
}
export const COMMENT_PLACEHOLDER = "Viết bình luận...";