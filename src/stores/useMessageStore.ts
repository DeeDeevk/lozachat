import api from "@/lib/axios";
import type { MessageStatsState } from "@/services/adminService";
import { create } from "zustand";

export const useMessageStore = create<MessageStatsState>((set, get) => ({
  data: [],
  period: "7d",
  selectedDate: null,
  isLoading: false,
  error: null,
  setPeriod: (period) => {
    set({ period, selectedDate: null });
    get().fetchStats();
  },
  setSelectedDate: (date) => {
    set({ selectedDate: date, period: "day" });
    get().fetchStats();
  },
  fetchStats: async () => {
    const { period, selectedDate } = get();
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        params.set("date", selectedDate);
      } else {
        params.set("period", period);
      }
      const res = await api.get(`/admin/messages/stats?${params.toString()}`);
      set({ data: res.data.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || "Không thể tải dữ liệu",
        isLoading: false,
      });
    }
  },
}));
