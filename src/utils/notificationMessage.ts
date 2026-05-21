import type { NotificationItem, NotificationType, ReactionType } from "../types/post";
import { REACTION_EMOJI, REACTION_LABEL } from "../types/post";

export function clip(text: string, max = 80) {
  const t = text.trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}...` : t;
}

function reactionText(type?: string) {
  const t = type as ReactionType | undefined;
  if (!t || !REACTION_LABEL[t]) return { label: "thích", emoji: "👍" };
  return { label: REACTION_LABEL[t], emoji: REACTION_EMOJI[t] };
}

export function getNotifMessage(n: NotificationItem): string {
  const name = n.actorId?.displayName || "Ai đó";

  switch (n.type) {
    case "react": {
      const { label, emoji } = reactionText(n.meta?.reactionType);
      return `${name} đã ${label} ${emoji} bài viết của bạn`;
    }
    case "comment": {
      const preview = clip(n.commentId?.content || "");
      return preview
        ? `${name} đã bình luận: "${preview}"`
        : `${name} đã bình luận bài viết của bạn`;
    }
    case "reply": {
      const preview = clip(n.commentId?.content || "");
      return preview
        ? `${name} đã trả lời bình luận: "${preview}"`
        : `${name} đã trả lời bình luận của bạn`;
    }
    case "share": {
      const caption = clip(n.meta?.shareCaption || "");
      return caption
        ? `${name} đã đăng lại bài viết của bạn: "${caption}"`
        : `${name} đã đăng lại bài viết của bạn`;
    }
    case "react_comment": {
      const { label, emoji } = reactionText(n.meta?.reactionType);
      const preview = clip(n.commentId?.content || "");
      return preview
        ? `${name} đã ${label} ${emoji} bình luận: "${preview}"`
        : `${name} đã ${label} ${emoji} bình luận của bạn`;
    }
    default:
      return `${name} đã tương tác với bạn`;
  }
}

export function getNotifSubtext(n: NotificationItem): string | null {
  const postPreview = clip(n.postId?.content || "", 60);
  if (!postPreview) return null;

  if (n.type === "share" || n.type === "react") {
    return `Bài viết: "${postPreview}"`;
  }
  return null;
}

export const NOTIF_TOAST_ICON: Record<NotificationType, string> = {
  react: "👍",
  comment: "💬",
  reply: "↩️",
  share: "🔁",
  react_comment: "💗",
};
