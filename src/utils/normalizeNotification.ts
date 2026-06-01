import type { NotificationItem } from "../types/post";

function toId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return toId((value as { _id: unknown })._id);
  }
  return String(value);
}

export function normalizeNotification(raw: unknown): NotificationItem {
  const n = raw as NotificationItem;
  const actor = n.actorId;

  return {
    ...n,
    _id: toId(n._id),
    userId: toId(n.userId),
    actorId: {
      _id: toId(actor?._id || actor),
      displayName: actor?.displayName || "Người dùng",
      avatarUrl: actor?.avatarUrl,
    },
    postId: n.postId
      ? {
          _id: toId(n.postId._id || n.postId),
          content: n.postId.content || "",
          author: toId(n.postId.author),
          images: n.postId.images,
        }
      : undefined,
    commentId: n.commentId
      ? {
          _id: toId(n.commentId._id || n.commentId),
          content: n.commentId.content || "",
        }
      : undefined,
    meta: n.meta || {},
    read: Boolean(n.read),
  };
}
