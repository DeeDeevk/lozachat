import api from "@/lib/axios";

export type StatPeriod = "7d" | "30d" | "12m" | "day";
export interface MessageStatPoint {
  _id: string;
  count: number;
}

export interface MessageStatsState {
  data: MessageStatPoint[];
  period: StatPeriod;
  selectedDate: string | null;
  isLoading: boolean;
  error: string | null;

  setPeriod: (period: StatPeriod) => void;
  setSelectedDate: (date: string | null) => void;
  fetchStats: () => Promise<void>;
}

export const adminService = {
  async getMessageStats(
    period: StatPeriod,
    selectedDate?: string | null,
  ): Promise<{
    data: MessageStatPoint[];
    period: string;
  }> {
    const params = new URLSearchParams();
    if (selectedDate) {
      params.set("date", selectedDate);
    } else {
      params.set("period", period);
    }

    const res = await api.get(`/admin/messages/stats?${params.toString()}`);
    return res.data;
  },
};
