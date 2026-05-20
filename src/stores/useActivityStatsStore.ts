import { create } from "zustand";
import { userService } from "@/services/userService";
import type { StatPeriod } from "@/services/adminService";

export interface ActivityStatPoint {
  _id: string;
  count: number;
}

interface ActivityStatsState {
  data: ActivityStatPoint[];
  period: StatPeriod;
  selectedDate: string | null;
  isLoading: boolean;
  error: string | null;

  setPeriod: (period: StatPeriod) => void;
  setSelectedDate: (date: string | null) => void;
  fetchStats: () => Promise<void>;
}

export const useActivityStatsStore = create<ActivityStatsState>((set, get) => ({
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
      const res = await userService.getActivityStats(
        selectedDate ? "7d" : (period as "7d" | "30d" | "12m"),
        selectedDate ?? undefined,
      );
      set({ data: res.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || "Không thể tải dữ liệu",
        isLoading: false,
      });
    }
  },
}));
