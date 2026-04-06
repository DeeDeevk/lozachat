import type { Conversation, Message } from "./chat";

export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hashMore: boolean; // infinite-scroll
      nextCursor?: string | null;
    }
  >;
  activeConversationId: string | null;
  loading: boolean;
  reset: () => void;
  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
}
