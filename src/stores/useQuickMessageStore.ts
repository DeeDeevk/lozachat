import { create } from "zustand";
import api from "@/lib/axios";

export interface QuickMessage {
  _id: string;
  shortcut: string;
  content: string;
}

interface QuickMessageState {
  messages: QuickMessage[];
  loading: boolean;

  fetchMessages: () => Promise<void>;

  addMessage: (msg: QuickMessage) => void;
  updateMessage: (msg: QuickMessage) => void;
  deleteMessage: (id: string) => void;
}

export const useQuickMessageStore = create<QuickMessageState>((set) => ({
  messages: [],
  loading: false,

  fetchMessages: async () => {
    set({ loading: true });

    try {
      const res = await api.get("/messages/quick-messages");

      set({
        messages: res.data.quickMessages || [],
      });
    } finally {
      set({ loading: false });
    }
  },

 addMessage: (msg) =>
  set((state) => {
    const exists = state.messages.some(
      (m) => m._id === msg._id
    );

    if (exists) return state;

    return {
      messages: [msg, ...state.messages],
    };
  }),

 updateMessage: (msg) =>
  set((state) => {
    const exists = state.messages.some(
      (m) => m._id === msg._id
    );

    if (!exists) {
      return {
        messages: [msg, ...state.messages],
      };
    }

    return {
      messages: state.messages.map((m) =>
        m._id === msg._id ? msg : m
      ),
    };
  }),

  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== id),
    })),
}));