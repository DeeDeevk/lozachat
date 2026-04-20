import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatThemeMode = "solid" | "gradient" | "image";

export interface ChatThemeOption {
  id: string;
  name: string;
  mode: ChatThemeMode;
  appBackground: string;
  appBackgroundImage?: string;
  messageAreaOverlay?: string;
  mineBubble: string;
}

export const CHAT_THEME_OPTIONS: ChatThemeOption[] = [
  {
    id: "aurora",
    name: "Aurora",
    mode: "gradient",
    appBackground: "radial-gradient(circle at 12% 22%, rgba(56,189,248,.22), transparent 42%), radial-gradient(circle at 88% 16%, rgba(59,130,246,.26), transparent 36%), linear-gradient(160deg, #041226 0%, #0b1f3c 100%)",
    messageAreaOverlay: "rgba(6, 15, 35, 0.3)",
    mineBubble: "linear-gradient(145deg, #2563eb 0%, #1d4ed8 100%)",
  },
  {
    id: "sunset",
    name: "Sunset",
    mode: "gradient",
    appBackground: "radial-gradient(circle at 15% 10%, rgba(251,146,60,.25), transparent 35%), radial-gradient(circle at 85% 90%, rgba(244,114,182,.22), transparent 35%), linear-gradient(160deg, #1f1424 0%, #41264f 60%, #1c1f35 100%)",
    messageAreaOverlay: "rgba(34, 16, 40, 0.28)",
    mineBubble: "linear-gradient(145deg, #f97316 0%, #ec4899 100%)",
  },
  {
    id: "mint",
    name: "Mint",
    mode: "solid",
    appBackground: "#0f2b2a",
    messageAreaOverlay: "rgba(6, 22, 20, 0.2)",
    mineBubble: "linear-gradient(145deg, #10b981 0%, #0ea5a4 100%)",
  },
  {
    id: "graphite",
    name: "Graphite",
    mode: "solid",
    appBackground: "#111827",
    messageAreaOverlay: "rgba(2, 6, 23, 0.25)",
    mineBubble: "linear-gradient(145deg, #475569 0%, #334155 100%)",
  },
  {
    id: "skyline",
    name: "Skyline",
    mode: "image",
    appBackground: "#0b1220",
    appBackgroundImage:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1600&q=80",
    messageAreaOverlay: "rgba(6, 14, 28, 0.45)",
    mineBubble: "linear-gradient(145deg, #3b82f6 0%, #1d4ed8 100%)",
  },
  {
    id: "sand",
    name: "Sand",
    mode: "image",
    appBackground: "#1f1a16",
    appBackgroundImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    messageAreaOverlay: "rgba(25, 18, 12, 0.42)",
    mineBubble: "linear-gradient(145deg, #d97706 0%, #b45309 100%)",
  },
];

const DEFAULT_CHAT_THEME = CHAT_THEME_OPTIONS[0];

interface ChatThemeState {
  selectedByConversation: Record<string, string>;
  setThemeForConversation: (conversationId: string, themeId: string) => void;
  clearThemes: () => void;
}

export function getChatThemeById(themeId?: string | null): ChatThemeOption {
  return (
    CHAT_THEME_OPTIONS.find((theme) => theme.id === themeId) ||
    DEFAULT_CHAT_THEME
  );
}

export const useChatThemeStore = create<ChatThemeState>()(
  persist(
    (set) => ({
      selectedByConversation: {},
      setThemeForConversation: (conversationId, themeId) =>
        set((state) => ({
          selectedByConversation: {
            ...state.selectedByConversation,
            [conversationId]: themeId,
          },
        })),
      clearThemes: () => set({ selectedByConversation: {} }),
    }),
    {
      name: "chat-theme-storage",
      partialize: (state) => ({
        selectedByConversation: state.selectedByConversation,
      }),
    },
  ),
);
