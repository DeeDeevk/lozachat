import type { Post, Author } from "../types/post";

function toId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return toId((value as { _id: unknown })._id);
  }
  return String(value);
}

function normalizeAuthor(author: Author | undefined | null): Author | undefined {
  if (!author) return undefined;
  return {
    ...author,
    _id: toId(author._id),
  };
}

export function normalizePost(post: Post): Post {
  let sharedFromAuthorId = post.sharedFromAuthorId;
  let sharedFromAuthorName = post.sharedFromAuthorName;
  let sharedFromAuthorAvatarUrl = post.sharedFromAuthorAvatarUrl;

  // Backend có thể populate sharedFromAuthorId thành user object
  const maybeUser = post.sharedFromAuthorId as unknown as Author | string | undefined;
  if (maybeUser && typeof maybeUser === "object" && "displayName" in maybeUser) {
    sharedFromAuthorId = toId(maybeUser._id);
    sharedFromAuthorName =
      sharedFromAuthorName || maybeUser.displayName || "";
    sharedFromAuthorAvatarUrl =
      sharedFromAuthorAvatarUrl || maybeUser.avatarUrl;
  } else if (sharedFromAuthorId) {
    sharedFromAuthorId = toId(sharedFromAuthorId);
  }

  return {
    ...post,
    _id: toId(post._id),
    author: normalizeAuthor(post.author) as Author,
    sharedFromAuthorId,
    sharedFromAuthorName,
    sharedFromAuthorAvatarUrl,
    sharedFrom: post.sharedFrom
      ? {
          ...post.sharedFrom,
          _id: toId(post.sharedFrom._id),
          author: normalizeAuthor(post.sharedFrom.author),
        }
      : post.sharedFrom,
    reactions: (post.reactions || []).map((r) => ({
      ...r,
      userId: toId(r.userId),
    })),
  };
}

export function normalizePosts(posts: Post[]): Post[] {
  return posts.map(normalizePost);
}
