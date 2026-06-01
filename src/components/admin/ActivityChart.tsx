"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useActivityStatsStore } from "@/stores/useActivityStatsStore";
import type { StatPeriod } from "@/services/adminService";

// ─── helpers ─────────────────────────────────────────────────────────────────

const PERIODS: { label: string; value: StatPeriod }[] = [
  { label: "7 ngày", value: "7d" },
  { label: "30 ngày", value: "30d" },
  { label: "12 tháng", value: "12m" },
];

const formatXLabel = (id: string, period: StatPeriod | "day"): string => {
  if (period === "day") return `${id}:00`;
  if (period === "7d") {
    const [datePart, hour] = id.split(" ");
    const [, m, d] = datePart.split("-");
    return `${parseInt(d)}/${parseInt(m)} ${hour}h`;
  }
  if (period === "30d") {
    const [, m, d] = id.split("-");
    return `${parseInt(d)}/${parseInt(m)}`;
  }
  if (period === "12m") {
    const [y, m] = id.split("-");
    return `T${parseInt(m)}/${y.slice(2)}`;
  }
  return id;
};

const formatTooltipLabel = (id: string, period: StatPeriod | "day"): string => {
  if (period === "day") return `${id}:00 – ${id}:59`;
  if (period === "7d") {
    const [datePart, hour] = id.split(" ");
    const [y, m, d] = datePart.split("-");
    return `${d}/${m}/${y} lúc ${hour}h`;
  }
  if (period === "30d") {
    const [y, m, d] = id.split("-");
    return `${d}/${m}/${y}`;
  }
  if (period === "12m") {
    const [y, m] = id.split("-");
    return `Tháng ${parseInt(m)}/${y}`;
  }
  return id;
};

// ─── custom tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
  period,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  period: StatPeriod | "day";
}) => {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-slate-400 mb-1">
        {formatTooltipLabel(label, period)}
      </p>
      <p className="text-lg font-bold text-cyan-400">
        {payload[0].value.toLocaleString("vi-VN")}
        <span className="text-xs font-normal text-slate-400 ml-1">
          lượt đăng nhập
        </span>
      </p>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

export default function ActivityStatsChart() {
  const {
    data,
    period,
    selectedDate,
    isLoading,
    error,
    setPeriod,
    setSelectedDate,
    fetchStats,
  } = useActivityStatsStore();

  const [dateInput, setDateInput] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const chartData = (() => {
    if (selectedDate) {
      const map = new Map(data.map((d) => [d._id, d.count]));
      return Array.from({ length: 24 }, (_, i) => {
        const key = String(i).padStart(2, "0");
        return { _id: key, count: map.get(key) ?? 0 };
      });
    }
    return data;
  })();

  const activePeriod: StatPeriod | "day" = selectedDate ? "day" : period;
  const total = chartData.reduce((s, d) => s + d.count, 0);
  const peak = chartData.reduce((a, b) => (b.count > a.count ? b : a), {
    _id: "",
    count: 0,
  });

  const handleDateApply = () => {
    if (!dateInput) return;
    setSelectedDate(dateInput);
  };

  const handlePeriodClick = (p: StatPeriod) => {
    setDateInput("");
    setPeriod(p);
  };

  return (
    <div className="bg-[#0a0f1e] rounded-2xl p-6 border border-[#1e293b] w-full mt-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white text-xl font-semibold tracking-tight">
            Thống kê hoạt động
          </h2>
          {!isLoading && !error && (
            <p className="text-slate-400 text-sm mt-0.5">
              Tổng:{" "}
              <span className="text-cyan-400 font-medium">
                {total.toLocaleString("vi-VN")}
              </span>{" "}
              lượt đăng nhập
              {peak.count > 0 && (
                <>
                  {" · "}Đỉnh:{" "}
                  <span className="text-cyan-400 font-medium">
                    {peak.count.toLocaleString("vi-VN")}
                  </span>{" "}
                  lúc{" "}
                  <span className="text-slate-300">
                    {formatTooltipLabel(peak._id, activePeriod)}
                  </span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period tabs */}
          <div className="flex bg-[#0f172a] border border-[#1e293b] rounded-xl p-1 gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodClick(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activePeriod === p.value
                    ? "bg-cyan-500 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date picker */}
          <div className="flex items-center gap-1.5 bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-1.5">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="bg-transparent text-slate-300 text-xs outline-none w-32 [color-scheme:dark]"
            />
            <button
              onClick={handleDateApply}
              disabled={!dateInput}
              className="text-xs px-2 py-0.5 rounded-lg bg-cyan-600 text-white disabled:opacity-40 hover:bg-cyan-500 transition-colors"
            >
              Xem
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-400 text-sm">
            {error}
          </div>
        ) : total === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            Không có dữ liệu trong khoảng thời gian này
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />

              <XAxis
                dataKey="_id"
                tickFormatter={(v) => formatXLabel(v, activePeriod)}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v
                }
              />

              <Tooltip
                content={<CustomTooltip period={activePeriod} />}
                cursor={{ fill: "rgba(139,92,246,0.08)" }}
              />

              <Bar
                dataKey="count"
                fill="#00b8db"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Selected date label */}
      {selectedDate && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500">Đang xem ngày:</span>
          <span className="text-xs text-cyan-400 font-medium">
            {selectedDate}
          </span>
          <button
            onClick={() => {
              setDateInput("");
              setPeriod("7d");
            }}
            className="text-xs text-slate-500 hover:text-white transition-colors underline"
          >
            Xoá
          </button>
        </div>
      )}
    </div>
  );
}
