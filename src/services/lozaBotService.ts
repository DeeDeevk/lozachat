import api from "@/lib/axios";

export interface LozaBotContextMessage {
  sender: "me" | "other";
  senderName: string;
  at: string;
  content: string;
}

export const lozaBotService = {
  async ask(payload: {
    conversationId: string;
    request: string;
    fromLastOwnMessage?: boolean;
    messages: LozaBotContextMessage[];
  }): Promise<string> {
    const res = await api.post("/agents/lozabot", payload);
    return res.data?.answer || "";
  },
};
