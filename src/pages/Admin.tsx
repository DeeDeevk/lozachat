import { useEffect, useMemo, useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  Clock,
  LayoutDashboard,
  Lock,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Shield,
  TrendingDown,
  TrendingUp,
  UserX,
  Users,
  X,
} from "lucide-react";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { userService } from "@/services/userService";
import type {
  AccountLockRequest,
  AccountLockRequestStatus,
} from "@/services/userService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";

type AdminTab = "dashboard" | "users" | "lock" | "settings" | "unlock";
type RequestFilter = AccountLockRequestStatus | "all";
type ReviewAction = "approved" | "rejected";

interface ToastState {
  msg: string;
  type: "info" | "success" | "error";
}

interface ConfirmReviewState {
  request: AccountLockRequest;
  action: ReviewAction;
}

interface AvatarProps {
  name: string;
  bg?: string;
  size?: number;
}

interface MetricCardProps {
  icon: ComponentType<{ size?: number; style?: CSSProperties }>;
  color: string;
  val: string | number;
  lbl: string;
  delta: string;
  up: boolean;
}

interface NavItemProps {
  active: boolean;
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
  badge?: number;
}

const STATUS_LABEL: Record<AccountLockRequestStatus, string> = {
  pending: "Đang chờ",
  approved: "Đã khóa",
  rejected: "Đã từ chối",
};

const STATUS_STYLE: Record<AccountLockRequestStatus, string> = {
  pending: "border-amber-400/25 bg-amber-500/10 text-amber-200",
  approved: "border-red-400/25 bg-red-500/10 text-red-200",
  rejected: "border-slate-400/20 bg-slate-500/10 text-slate-300",
};

const FILTERS: Array<{ value: RequestFilter; label: string }> = [
  { value: "pending", label: "Đang chờ" },
  { value: "approved", label: "Đã khóa" },
  { value: "rejected", label: "Từ chối" },
  { value: "all", label: "Tất cả" },
];

const getAvatarColor = (seed: string) => {
  const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4", "#ef4444"];
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[total % colors.length];
};

const getRequestUser = (request: AccountLockRequest) => {
  if (typeof request.userId === "string") {
    return {
      _id: request.userId,
      username: request.userId,
      email: "",
      displayName: request.userId,
      avatarUrl: "",
      isLocked: false,
    };
  }

  return request.userId;
};

const formatDateTime = (value?: string) => {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
};

const Avatar = ({ name, bg, size = 36 }: AvatarProps) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center font-bold text-white shadow-lg"
      style={{
        backgroundColor: bg || getAvatarColor(name),
        width: size,
        height: size,
        borderRadius: size * 0.28,
        fontSize: size * 0.35,
      }}
    >
      {initials || "U"}
    </div>
  );
};

const MetricCard = ({ icon: Icon, color, val, lbl, delta, up }: MetricCardProps) => (
  <div className="rounded-2xl border border-[#3b82f62e] bg-[#0d1526] p-[18px] shadow-xl">
    <div
      className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
      style={{ backgroundColor: `${color}25` }}
    >
      <Icon size={20} style={{ color }} />
    </div>
    <div className="text-2xl font-extrabold text-white">{val}</div>
    <div className="text-xs text-slate-400">{lbl}</div>
    <div className={`mt-1.5 flex items-center gap-1 text-[11px] ${up ? "text-emerald-400" : "text-red-400"}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {delta}
    </div>
  </div>
);

export default function LozaAdmin() {
  const navigate = useNavigate();
  const { userProfile } = useAuthStore();
  const socket = useSocketStore((state) => state.socket);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [filter, setFilter] = useState<RequestFilter>("pending");
  const [requests, setRequests] = useState<AccountLockRequest[]>([]);
  const [unlockRequests, setUnlockRequests] = useState<AccountLockRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccountLockRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmReview, setConfirmReview] = useState<ConfirmReviewState | null>(null);

  const isAdmin = userProfile?.role === "admin";

  const showToast = (msg: string, type: ToastState["type"] = "info") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const fetchRequests = async (nextFilter = filter) => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [res, pendingRes] = await Promise.all([
        userService.getAccountLockRequests(nextFilter),
        nextFilter === "pending" ? Promise.resolve(null) : userService.getAccountLockRequests("pending"),
      ]);

      setRequests(res.requests);
      setPendingRequests(
        pendingRes?.requests || res.requests.filter((request) => request.status === "pending"),
      );
    } catch (error) {
      showToast(getErrorMessage(error, "Không thể tải yêu cầu khóa tài khoản"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void fetchRequests(filter);
      void fetchUnlockRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, isAdmin]);

  useEffect(() => {
    if (!socket || !isAdmin) return;

    const refreshLockRequests = () => {
      void fetchRequests(filter);
    };
    const refreshUnlockRequests = () => {
      void fetchUnlockRequests();
    };
    const notifyLockCreated = () => {
      showToast("Có yêu cầu khóa tài khoản mới", "info");
      refreshLockRequests();
    };
    const notifyUnlockCreated = () => {
      showToast("Có yêu cầu mở khóa tài khoản mới", "info");
      refreshUnlockRequests();
    };

    socket.on("account-lock-request:created", notifyLockCreated);
    socket.on("account-lock-request:updated", refreshLockRequests);
    socket.on("account-unlock-request:created", notifyUnlockCreated);
    socket.on("account-unlock-request:updated", refreshUnlockRequests);

    return () => {
      socket.off("account-lock-request:created", notifyLockCreated);
      socket.off("account-lock-request:updated", refreshLockRequests);
      socket.off("account-unlock-request:created", notifyUnlockCreated);
      socket.off("account-unlock-request:updated", refreshUnlockRequests);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isAdmin, filter]);

  const pendingCount = useMemo(
    () => pendingRequests.length,
    [pendingRequests],
  );

  const stats = useMemo(() => {
    const approved = requests.filter((request) => request.status === "approved").length;
    const rejected = requests.filter((request) => request.status === "rejected").length;
    return {
      total: requests.length,
      pending: pendingCount,
      approved,
      rejected,
    };
  }, [pendingCount, requests]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return requests;

    return requests.filter((request) => {
      const user = getRequestUser(request);
      return [
        user.displayName,
        user.username,
        user.email,
        request.reason,
        request.adminNote,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [query, requests]);

  const recentUsers = useMemo(
    () =>
      requests
        .map(getRequestUser)
        .filter((user, index, list) => list.findIndex((item) => item._id === user._id) === index)
        .slice(0, 4),
    [requests],
  );

  const fetchUnlockRequests = async () => {
    try {
      const res = await userService.getAccountUnlockRequests();
      setUnlockRequests(res.requests);
    } catch (error) {
      showToast(
        getErrorMessage(error, "Không thể tải yêu cầu mở khóa"),
        "error"
      );
    }
  };

  const handleReview = async () => {
    if (!confirmReview) return;

    setReviewingId(confirmReview.request._id);
    try {
      const { message } = await userService.reviewAccountLockRequest(
        confirmReview.request._id,
        confirmReview.action,
        adminNote.trim(),
      );
      showToast(message, confirmReview.action === "approved" ? "error" : "success");
      setAdminNote("");
      setConfirmReview(null);
      await fetchRequests(filter);
    } catch (error) {
      showToast(getErrorMessage(error, "Không thể xử lý yêu cầu khóa tài khoản"), "error");
    } finally {
      setReviewingId(null);
    }
  };

  const handleReviewUnlock = async (
    requestId: string,
    action: "approved" | "rejected"
  ) => {
    try {
      const res = await userService.reviewAccountUnlockRequest(
        requestId,
        action
      );

      showToast(res.message, "success");

      await fetchUnlockRequests();
    } catch (error) {
      showToast(
        getErrorMessage(error, "Không thể xử lý yêu cầu mở khóa"),
        "error"
      );
    }
  };

  const openReviewConfirm = (request: AccountLockRequest, action: ReviewAction) => {
    setAdminNote("");
    setConfirmReview({ request, action });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#040c1a] font-sans text-slate-300">
      <aside className="flex w-56 flex-col border-r border-blue-500/20 bg-[#040c1a]">
        <div className="flex items-center gap-3 border-b border-white/5 p-5">
          <img
            src="/logo.png"
            alt="Loza"
            className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-[0_0_14px_rgba(59,130,246,.55),0_0_32px_rgba(59,130,246,.22),0_4px_16px_rgba(0,0,0,.5)] transition-shadow hover:shadow-[0_0_20px_rgba(59,130,246,.75),0_0_48px_rgba(59,130,246,.35),0_4px_20px_rgba(0,0,0,.6)]"
          />
          <span className="text-base font-bold tracking-tight text-white">
            Loza <span className="text-blue-300">Admin</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          <NavItem active={false} onClick={() => navigate("/chat")} icon={MessageSquare} label="Về chat" />

          <div className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Admin</div>
          <div className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Tổng quan</div>
          <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={LayoutDashboard} label="Dashboard" />

          <div className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Quản lý</div>
          <NavItem active={activeTab === "users"} onClick={() => setActiveTab("users")} icon={Users} label="Người dùng" />
          <NavItem active={activeTab === "lock"} onClick={() => setActiveTab("lock")} icon={Lock} label="Khóa tài khoản" badge={pendingCount} />
          <NavItem
            active={activeTab === "unlock"}
            onClick={() => setActiveTab("unlock")}
            icon={Shield}
            label="Mở khóa tài khoản"
          />
          <NavItem active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={Settings} label="Cài đặt" />
        </nav>

        <div className="flex items-center gap-3 border-t border-white/5 p-4">
          <Avatar name={userProfile?.displayName || "Admin Loza"} bg="#3b82f6" size={34} />
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-white">{userProfile?.displayName || "Admin Loza"}</div>
            <div className="text-[10px] text-slate-500">{isAdmin ? "Superadmin" : "Không có quyền admin"}</div>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-blue-500/15 bg-[#040c1a] px-6">
          <h2 className="flex-1 font-bold capitalize text-white">
            {activeTab === "lock" ? "Khóa tài khoản" : activeTab}
          </h2>
          <div className="flex w-64 items-center gap-2 rounded-xl border-2 border-white/5 bg-[#0d1526] px-3 py-1.5 transition-all focus-within:border-blue-400/40">
            <Search size={14} className="text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên, email, lý do..."
              className="w-full border-none bg-transparent text-xs text-white outline-none"
            />
          </div>
          <button className="relative rounded-xl bg-blue-500/10 p-2 text-blue-300 hover:bg-blue-500/20" type="button">
            <Bell size={18} />
            {pendingCount > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />}
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto p-6">
          {!isAdmin ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6 text-red-100">
              <div className="mb-2 flex items-center gap-2 font-bold">
                <Shield size={18} />
                Bạn không có quyền truy cập trang Admin
              </div>
              <p className="text-sm text-red-200/80">Tài khoản hiện tại không có role admin nên không thể duyệt yêu cầu khóa tài khoản.</p>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard icon={Lock} color="#f59e0b" val={pendingCount} lbl="Yêu cầu chờ duyệt" delta="Cần xử lý" up />
                    <MetricCard icon={UserX} color="#ef4444" val={stats.approved} lbl="Tài khoản đã khóa" delta="Đã duyệt" up={false} />
                    <MetricCard icon={X} color="#94a3b8" val={stats.rejected} lbl="Yêu cầu từ chối" delta="Đã xử lý" up />
                    <MetricCard icon={Shield} color="#a5b4fc" val={stats.total} lbl="Tổng yêu cầu" delta="Theo bộ lọc" up />
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <section className="rounded-2xl border border-[#3b82f62e] bg-[#0d1526] p-5 shadow-xl">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                        <Users size={16} className="text-slate-500" /> Người dùng có yêu cầu gần đây
                      </h3>
                      {recentUsers.length === 0 ? (
                        <EmptyState text="Chưa có dữ liệu người dùng từ yêu cầu khóa." />
                      ) : (
                        recentUsers.map((user) => (
                          <div key={user._id} className="flex items-center gap-3 border-b border-white/5 py-2.5 last:border-0">
                            <Avatar name={user.displayName || user.username} bg={getAvatarColor(user._id)} size={36} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-white">{user.displayName || user.username}</div>
                              <div className="truncate text-[11px] text-slate-500">@{user.username} {user.email ? `- ${user.email}` : ""}</div>
                            </div>
                            <div className={`h-2 w-2 rounded-full ${user.isLocked ? "bg-red-400" : "bg-cyan-400"}`} />
                          </div>
                        ))
                      )}
                    </section>

                    <section className="rounded-2xl border border-[#3b82f62e] bg-[#0d1526] p-5 shadow-xl">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                          <Lock size={16} className="text-slate-500" /> Yêu cầu khóa đang chờ
                        </h3>
                        <button
                          type="button"
                          onClick={() => void fetchRequests("pending")}
                          className="rounded-lg border border-blue-400/20 p-1.5 text-blue-200 hover:bg-blue-500/10"
                          title="Tải lại"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                      <RequestList
                        requests={pendingRequests.slice(0, 4)}
                        loading={loading}
                        reviewingId={reviewingId}
                        onReview={openReviewConfirm}
                      />
                    </section>
                  </div>
                </>
              )}

              {activeTab === "lock" && (
                <section className="rounded-2xl border border-[#3b82f62e] bg-[#0d1526] shadow-xl">
                  <div className="flex flex-wrap items-center gap-3 border-b border-white/5 p-5">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-white">Duyệt yêu cầu khóa tài khoản</h3>
                      <p className="mt-1 text-xs text-slate-400">Khi duyệt, tài khoản sẽ bị khóa và session hiện tại của user sẽ bị xóa ở backend.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void fetchRequests(filter)}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-400/20 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                      Tải lại
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 border-b border-white/5 p-4">
                    {FILTERS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setFilter(item.value)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                          filter === item.value
                            ? "border-blue-400/40 bg-blue-500/20 text-blue-100"
                            : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    <RequestList
                      requests={filteredRequests}
                      loading={loading}
                      reviewingId={reviewingId}
                      onReview={openReviewConfirm}
                      showReviewedInfo
                    />
                  </div>
                </section>
              )}

              {activeTab === "unlock" && (
                <section className="rounded-2xl border border-[#3b82f62e] bg-[#0d1526] shadow-xl">
                  <div className="border-b border-white/5 p-5">
                    <h3 className="text-base font-bold text-white">
                      Yêu cầu mở khóa tài khoản
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Admin có thể duyệt yêu cầu mở khóa tài khoản từ người dùng.
                    </p>
                  </div>

                  <div className="space-y-3 p-5">
                    {unlockRequests.length === 0 ? (
                      <EmptyState text="Không có yêu cầu mở khóa." />
                    ) : (
                      unlockRequests.map((request) => {
                        const user = getRequestUser(request);

                        return (
                          <article
                            key={request._id}
                            className="rounded-xl border border-white/5 bg-[#111827] p-4"
                          >
                            <div className="flex items-start gap-3">
                              <Avatar
                                name={user.displayName || user.username}
                                bg={getAvatarColor(user._id)}
                                size={42}
                              />

                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-white">
                                  {user.displayName || user.username}
                                </h4>

                                <div className="mt-1 text-xs text-slate-500">
                                  @{user.username}
                                </div>

                                <p className="mt-3 text-sm text-slate-300">
                                  {request.reason || "Không nhập lý do"}
                                </p>

                                <div className="mt-3 text-[11px] text-slate-500">
                                  Gửi lúc {formatDateTime(request.createdAt)}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                                  onClick={() =>
                                    handleReviewUnlock(request._id, "approved")
                                  }
                                >
                                  Mở khóa
                                </button>

                                <button
                                  type="button"
                                  className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.05]"
                                  onClick={() =>
                                    handleReviewUnlock(request._id, "rejected")
                                  }
                                >
                                  Từ chối
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>
              )}

              {activeTab === "users" && <Placeholder icon={Users} title="Quản lý người dùng" text="Phần này có thể nối tiếp danh sách user, tìm kiếm và mở khóa tài khoản nếu backend bổ sung API unlock." />}
              {activeTab === "settings" && <Placeholder icon={Settings} title="Cài đặt" text="Các cấu hình admin sẽ nằm ở đây." />}
            </>
          )}
        </div>
      </main>

      {confirmReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-blue-500/20 bg-[#0d1526] p-5 shadow-2xl">
            <div className="mb-3 flex items-start gap-3">
              <div className={`rounded-xl p-2 ${confirmReview.action === "approved" ? "bg-red-500/15 text-red-300" : "bg-slate-500/15 text-slate-300"}`}>
                {confirmReview.action === "approved" ? <AlertTriangle size={20} /> : <X size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-white">
                  {confirmReview.action === "approved" ? "Xác nhận khóa tài khoản" : "Xác nhận từ chối yêu cầu"}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {confirmReview.action === "approved"
                    ? "Sau khi duyệt, user sẽ không thể tiếp tục sử dụng tài khoản cho đến khi có cơ chế mở khóa."
                    : "Yêu cầu sẽ được đánh dấu là đã từ chối."}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div className="text-sm font-semibold text-white">{getRequestUser(confirmReview.request).displayName}</div>
              <div className="mt-1 text-xs text-slate-500">{confirmReview.request.reason || "Không nhập lý do"}</div>
            </div>

            <label className="mb-2 block text-xs font-semibold text-slate-300">Ghi chú admin</label>
            <textarea
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              maxLength={500}
              placeholder="Nhập ghi chú nếu cần..."
              className="mb-4 min-h-24 w-full resize-y rounded-xl border border-white/10 bg-[#111827] p-3 text-sm text-white outline-none focus:border-blue-400/40"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReview(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.05]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleReview()}
                disabled={reviewingId === confirmReview.request._id}
                className={`rounded-xl px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmReview.action === "approved" ? "bg-red-600 hover:bg-red-500" : "bg-slate-600 hover:bg-slate-500"
                }`}
              >
                {reviewingId === confirmReview.request._id
                  ? "Đang xử lý..."
                  : confirmReview.action === "approved"
                    ? "Khóa tài khoản"
                    : "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 rounded-xl px-4 py-3 text-xs font-bold shadow-2xl ${
            toast.type === "error"
              ? "border border-red-500/20 bg-red-950 text-red-300"
              : toast.type === "success"
                ? "border border-emerald-500/20 bg-emerald-950 text-emerald-300"
                : "border border-blue-500/20 bg-blue-950 text-blue-300"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function RequestList({
  requests,
  loading,
  reviewingId,
  onReview,
  showReviewedInfo = false,
}: {
  requests: AccountLockRequest[];
  loading: boolean;
  reviewingId: string | null;
  onReview: (request: AccountLockRequest, action: ReviewAction) => void;
  showReviewedInfo?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-4 text-sm text-slate-400">
        <RefreshCw size={16} className="animate-spin" />
        Đang tải yêu cầu khóa tài khoản...
      </div>
    );
  }

  if (requests.length === 0) {
    return <EmptyState text="Không có yêu cầu khóa tài khoản phù hợp." />;
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const user = getRequestUser(request);
        const isPending = request.status === "pending";

        return (
          <article key={request._id} className="rounded-xl border border-white/5 bg-[#111827] p-4">
            <div className="flex flex-wrap items-start gap-3">
              <Avatar name={user.displayName || user.username} bg={getAvatarColor(user._id)} size={42} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="truncate text-sm font-bold text-white">{user.displayName || user.username}</h4>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[request.status]}`}>
                    {STATUS_LABEL[request.status]}
                  </span>
                  {user.isLocked && (
                    <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-200">
                      User đã khóa
                    </span>
                  )}
                </div>
                <div className="mt-1 truncate text-xs text-slate-500">
                  @{user.username} {user.email ? `- ${user.email}` : ""}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{request.reason || "Không nhập lý do"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    Gửi lúc {formatDateTime(request.createdAt)}
                  </span>
                  {showReviewedInfo && request.reviewedAt && <span>Duyệt lúc {formatDateTime(request.reviewedAt)}</span>}
                  {showReviewedInfo && request.adminNote && <span>Ghi chú: {request.adminNote}</span>}
                </div>
              </div>

              {isPending && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onReview(request, "approved")}
                    disabled={reviewingId === request._id}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check size={14} />
                    Duyệt khóa
                  </button>
                  <button
                    type="button"
                    onClick={() => onReview(request, "rejected")}
                    disabled={reviewingId === request._id}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X size={14} />
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-sm text-slate-500">
      {text}
    </div>
  );
}

function Placeholder({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <section className="rounded-2xl border border-[#3b82f62e] bg-[#0d1526] p-6 shadow-xl">
      <div className="mb-2 flex items-center gap-2 font-bold text-white">
        <Icon size={18} className="text-blue-300" />
        {title}
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </section>
  );
}

function NavItem({ active, icon: Icon, label, onClick, badge = 0 }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm outline-none transition-all ${
        active
          ? "border-blue-500/30 bg-blue-500/15 font-semibold text-blue-300"
          : "border-transparent bg-transparent text-slate-400 hover:bg-blue-500/10 hover:text-blue-200"
      }`}
    >
      <Icon size={18} className={active ? "text-blue-300" : "text-slate-500"} />
      <span>{label}</span>
      {badge > 0 && (
        <span className="ml-auto min-w-[18px] rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-1.5 py-0.5 text-[10px] text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
