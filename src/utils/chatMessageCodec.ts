import type { ChatStructuredPayload } from "@/types/chat";

const PREFIX = "__LZ_CHAT_JSON__::";

export const encodeChatPayload = (payload: ChatStructuredPayload): string => {
  return `${PREFIX}${JSON.stringify(payload)}`;
};

export const decodeChatPayload = (content?: string | null): ChatStructuredPayload | null => {
  if (!content || typeof content !== "string") return null;
  if (!content.startsWith(PREFIX)) return null;

  try {
    const raw = content.slice(PREFIX.length);
    const parsed = JSON.parse(raw) as ChatStructuredPayload;
    if (parsed?.version !== 1 || !parsed?.kind) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const getSafeMessagePreview = (content?: string | null, fallback = "Tin nhắn"): string => {
  const payload = decodeChatPayload(content);
  if (!payload) {
    return (content || "").trim() || fallback;
  }

  switch (payload.kind) {
    case "text":
      return payload.text?.trim() || fallback;
    case "emoji":
      return payload.emoji || fallback;
    case "reply":
      return payload.text?.trim() || "Đã trả lời tin nhắn";
    case "image":
      return "Da gui anh";
    case "file":
      return `Da gui tep: ${payload.attachment?.name || "tep"}`;
    case "audio":
      return "Da gui am thanh";
    case "sticker":
      return "Da gui nhan dan";
    case "call": {
      if (payload.call?.status === "started") {
        const label = payload.call?.callType === "video" ? "video" : "voice";
        return `Cuoc goi ${label} dang dien ra`;
      }
      const duration = payload.call?.durationSeconds ?? 0;
      const minutes = Math.floor(duration / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (duration % 60).toString().padStart(2, "0");
      const label = payload.call?.callType === "video" ? "video" : "voice";
      return `Cuoc goi ${label} ${minutes}:${seconds}`;
    }
    case "poll":
      return `Da tao binh chon: ${payload.poll?.question || "Binh chon"}`;
    case "poll_vote":
      return "Da bo phieu";
    default:
      return fallback;
  }
};
