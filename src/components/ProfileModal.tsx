import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { userService } from "@/services/userService";
import type { AccountLockRequest } from "@/services/userService";
import { useChangePasswordStore } from "@/stores/useOtpStore";
import { useNavigate } from "react-router-dom";
import { useOtpStore } from "@/stores/useOtpStore";
import OtpModal from "@/components/OtpModal";
import { useSocketStore } from "@/stores/useSocketStore";

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  role: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileModalProps {
  onClose: () => void;
  userProfile: UserProfile | null;
  setUserProfile: (user: UserProfile) => void;
  myColor: string;
  myName: string;
}

interface UpdateProfilePayload {
  displayName?: string;
  phone?: string;
  bio?: string;
}

type Tab = "profile" | "password" | "lock";

export default function ProfileModal({
  onClose,
  userProfile,
  setUserProfile,
  myColor,
  myName: _myName,
}: ProfileModalProps) {
  const {
    changePassword,
    loading: cpLoading,
    clearState,
  } = useChangePasswordStore();
  const {
    sendOTP,
    // loading: otpLoading,
    isOtpVerified: _isOtpVerified,
  } = useOtpStore();

  const navigate = useNavigate();
  const socket = useSocketStore((state) => state.socket);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [showLockOtpModal, setShowLockOtpModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitError, setSubmitError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [lockSubmitting, setLockSubmitting] = useState(false);
  const [myLockRequests, setMyLockRequests] = useState<AccountLockRequest[]>(
    [],
  );
  const [adminLockRequests, setAdminLockRequests] = useState<
    AccountLockRequest[]
  >([]);
  const [lockRequestsLoading, setLockRequestsLoading] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(
    null,
  );

  // ── Profile form ──
  const [form, setForm] = useState({
    displayName: userProfile?.displayName ?? "",
    bio: userProfile?.bio ?? "",
    phone: userProfile?.phone ?? "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    userProfile?.avatarUrl ?? null,
  );

  // ── Change password form ──
  const [cpForm, setCpForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [cpErrors, setCpErrors] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cpFocused, setCpFocused] = useState("");
  const isAdmin = userProfile?.role === "admin";

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // ── Profile handlers ──
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    try {
      const { user } = await userService.uploadAvatar(file);
      setUserProfile({
        _id: userProfile._id,
        username: userProfile.username,
        email: userProfile.email,
        role: userProfile.role,
        isLocked: userProfile.isLocked,
        lockedAt: userProfile.lockedAt,
        lockedReason: userProfile.lockedReason,
        createdAt: userProfile.createdAt,
        updatedAt: user.updatedAt,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio ?? userProfile.bio,
        phone: user.phone ?? userProfile.phone,
      });
      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (error) {
      console.error("Lỗi upload avatar:", error);
      setAvatarPreview(userProfile.avatarUrl ?? null);
      toast.error("Không thể cập nhật ảnh. Vui lòng thử lại.");
    }
  };

  const [errors, setErrors] = useState<{ phone?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (form.phone && !/^(0[3|5|7|8|9])+([0-9]{8})$/.test(form.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!userProfile) return;
    if (!validate()) {
      setSubmitError("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }
    setSubmitError("");
    try {
      const payload: UpdateProfilePayload = {};
      if (form.displayName) payload.displayName = form.displayName;
      if (form.phone) payload.phone = form.phone;
      if (form.bio) payload.bio = form.bio;
      const { user } = await userService.updateMe(payload);
      setUserProfile({
        _id: userProfile._id,
        username: userProfile.username,
        email: userProfile.email,
        role: userProfile.role,
        isLocked: userProfile.isLocked,
        lockedAt: userProfile.lockedAt,
        lockedReason: userProfile.lockedReason,
        createdAt: userProfile.createdAt,
        updatedAt: user.updatedAt,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? userProfile.avatarUrl,
        bio: user.bio ?? userProfile.bio,
        phone: user.phone ?? userProfile.phone,
      });
      toast.success("Cập nhật thông tin thành công!");
      onClose();
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await userService.deleteMe();
      onClose();
      navigate("/signin");
      // logout hoặc redirect về trang đăng nhập
    } catch (error) {
      console.error("Lỗi xóa tài khoản:", error);
    }
  };

  const fetchLockRequests = async () => {
    if (!userProfile) return;
    setLockRequestsLoading(true);
    try {
      const myRequestsRes = await userService.getMyAccountLockRequests();
      setMyLockRequests(myRequestsRes.requests);

      if (isAdmin) {
        const adminRequestsRes =
          await userService.getAccountLockRequests("pending");
        setAdminLockRequests(adminRequestsRes.requests);
      }
    } catch (error) {
      console.error("Lỗi lấy yêu cầu khóa tài khoản:", error);
      toast.error("Không thể tải danh sách yêu cầu khóa tài khoản");
    } finally {
      setLockRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "lock") {
      void fetchLockRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userProfile?._id, userProfile?.role]);

  useEffect(() => {
    if (!socket) return;

    const refreshLockRequests = () => {
      if (activeTab === "lock") {
        void fetchLockRequests();
      }
    };
    const handleReviewed = () => {
      toast.info("Yêu cầu khóa tài khoản của bạn đã được admin xử lý");
      refreshLockRequests();
    };
    const handleAccountLocked = () => {
      toast.error("Tài khoản của bạn đã bị khóa");
      onClose();
      navigate("/signin");
    };

    socket.on("account-lock-request:created", refreshLockRequests);
    socket.on("account-lock-request:updated", refreshLockRequests);
    socket.on("account-lock-request:reviewed", handleReviewed);
    socket.on("account:locked", handleAccountLocked);

    return () => {
      socket.off("account-lock-request:created", refreshLockRequests);
      socket.off("account-lock-request:updated", refreshLockRequests);
      socket.off("account-lock-request:reviewed", handleReviewed);
      socket.off("account:locked", handleAccountLocked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, activeTab]);

  const handleRequestAccountLock = async () => {
    setLockSubmitting(true);
    try {
      const { message } = await userService.requestAccountLock(
        lockReason.trim(),
      );
      toast.success(message);
      setLockReason("");
      await fetchLockRequests();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Không thể gửi yêu cầu khóa tài khoản";
      toast.error(message);
    } finally {
      setLockSubmitting(false);
    }
  };

  const handleRequestAccountLockClick = async () => {
    try {
      setLockSubmitting(true);

      if (!userProfile?.email) {
        toast.error("Không có email");
        return;
      }

      setShowLockOtpModal(false); // reset trước
      await new Promise((r) => setTimeout(r, 0)); // force remount

      setShowLockOtpModal(true);

      await sendOTP(userProfile.email);
    } catch (err) {
      console.error(err);
      toast.error("Không gửi được OTP");
    } finally {
      setLockSubmitting(false);
    }
  };

  const handleReviewAccountLock = async (
    requestId: string,
    action: "approved" | "rejected",
  ) => {
    setReviewingRequestId(requestId);
    try {
      const { message } = await userService.reviewAccountLockRequest(
        requestId,
        action,
      );
      toast.success(message);
      await fetchLockRequests();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Không thể xử lý yêu cầu khóa tài khoản";
      toast.error(message);
    } finally {
      setReviewingRequestId(null);
    }
  };

  const getRequestUserName = (request: AccountLockRequest) => {
    if (typeof request.userId === "string") return request.userId;
    return request.userId.displayName || request.userId.username;
  };

  const getStatusText = (status: AccountLockRequest["status"]) => {
    if (status === "approved") return "Đã duyệt";
    if (status === "rejected") return "Đã từ chối";
    return "Đang chờ duyệt";
  };

  // ── Change password handlers ──
  const validateCp = () => {
    const e = { oldPassword: "", newPassword: "", confirmPassword: "" };
    if (!cpForm.oldPassword) e.oldPassword = "Vui lòng nhập mật khẩu cũ";
    if (!cpForm.newPassword) e.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (cpForm.newPassword.length < 6)
      e.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    else if (cpForm.newPassword === cpForm.oldPassword)
      e.newPassword = "Mật khẩu mới phải khác mật khẩu cũ";
    if (!cpForm.confirmPassword)
      e.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    else if (cpForm.confirmPassword !== cpForm.newPassword)
      e.confirmPassword = "Mật khẩu xác nhận không khớp";
    setCpErrors(e);
    return !e.oldPassword && !e.newPassword && !e.confirmPassword;
  };

  const handleChangePassword = async () => {
    if (!validateCp()) return;
    await changePassword(cpForm.oldPassword, cpForm.newPassword);
    const { error, message } = useChangePasswordStore.getState();
    if (error) {
      toast.error(error);
      // Nếu lỗi mật khẩu cũ sai, hiển thị ngay dưới ô
      if (
        error.toLowerCase().includes("mật khẩu cũ") ||
        error.toLowerCase().includes("incorrect") ||
        error.toLowerCase().includes("wrong")
      ) {
        setCpErrors((prev) => ({ ...prev, oldPassword: error }));
      }
      return;
    }
    toast.success(message || "Đổi mật khẩu thành công!");
    setCpForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setCpErrors({ oldPassword: "", newPassword: "", confirmPassword: "" });
    clearState();
  };

  const cpInputStyle = (field: string): React.CSSProperties => ({
    padding: "10px 40px 10px 12px",
    borderRadius: 8,
    border: cpFocused === field ? "1.5px solid #1d6cbe" : "1px solid #374151",
    boxShadow: cpFocused === field ? "0 0 0 3px rgba(29,108,190,.15)" : "none",
    background: "#111827",
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
    width: "100%",
    transition: "all .2s",
  });

  return (
    <>
      <style>{`
        .pm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.65);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .pm-modal {
          background: #1e2433; border-radius: 16px; width: 720px;
          overflow: hidden; position: relative; font-family: 'Segoe UI', system-ui, sans-serif;
          color: #f1f5f9; display: flex; min-height: 480px;
          border: 1px solid #2d3748;
          box-shadow: 0 24px 60px rgba(0,0,0,.6);
        }
        .pm-sidebar {
          width: 220px; background: #171e2e; border-right: 1px solid #2d3748;
          padding: 24px 12px; flex-shrink: 0;
        }
        .pm-sidebar-title {
          font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 0 0 12px 8px;
        }
        .pm-sidebar-item {
          display: flex; align-items: flex-start; gap: 10px; padding: 10px;
          border-radius: 8px; cursor: pointer; margin-bottom: 4px;
          border-left: 3px solid transparent; transition: all .18s; border: none;
          background: transparent; width: 100%; text-align: left;
          font-family: inherit;
        }
        .pm-sidebar-item:hover { background: rgba(29,108,190,.1); }
        .pm-sidebar-item.active { background: #1e3a5f; border-left: 3px solid #1d6cbe; }
        .pm-sidebar-item svg { margin-top: 2px; flex-shrink: 0; }
        .pm-sidebar-item-text strong { font-size: 13px; font-weight: 600; color: #f1f5f9; }
        .pm-sidebar-item-text span { font-size: 11px; color: #9ca3af; display: block; margin-top: 2px; }

        .pm-content { flex: 1; padding: 32px 36px; overflow-y: auto; }
        .pm-content-header { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
        .pm-content-header h2 { font-size: 20px; font-weight: 700; color: #f1f5f9; margin: 0; }
        .pm-content-subtitle { font-size: 13px; color: #9ca3af; margin: 0 0 24px; }

        .pm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .pm-form-group { display: flex; flex-direction: column; gap: 6px; }
        .pm-form-group.full { grid-column: 1 / -1; }
        .pm-label { font-size: 13px; color: #cbd5e1; font-weight: 500; }
        .pm-label .required { color: #ef4444; margin-left: 2px; }

        .pm-input {
          padding: 10px 12px; border-radius: 8px; border: 1px solid #374151;
          background: #111827; color: #f1f5f9; font-size: 14px; outline: none;
          box-sizing: border-box; width: 100%; transition: all .2s;
          font-family: inherit;
        }
        .pm-input:focus { border-color: #1d6cbe; box-shadow: 0 0 0 3px rgba(29,108,190,.15); }
        .pm-input:disabled { background: #1a2133; color: #6b7280; cursor: not-allowed; }

        .pm-error {
          font-size: 11px; color: #f87171; margin-top: 3px;
          display: flex; align-items: center; gap: 4px;
        }

        .pm-divider { border: none; border-top: 1px solid #2d3748; margin: 20px 0; }

        .pm-btn-primary {
          padding: 11px 28px; background: #1d6cbe; color: white; border: none;
          border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
          float: right; transition: all .2s; font-family: inherit;
        }
        .pm-btn-primary:hover:not(:disabled) { background: #1558a8; }
        .pm-btn-primary:disabled { opacity: .6; cursor: not-allowed; }

        .pm-close {
          position: absolute; top: 12px; right: 16px; background: transparent;
          border: none; color: #9ca3af; font-size: 18px; cursor: pointer; z-index: 10;
          width: 28px; height: 28px; border-radius: 6px; display: flex;
          align-items: center; justify-content: center; transition: all .15s;
        }
        .pm-close:hover { color: #f1f5f9; background: rgba(255,255,255,.08); }

        @keyframes pm-spin { to { transform: rotate(360deg); } }
        .pm-spin { animation: pm-spin .7s linear infinite; display: inline-block; }

        input::placeholder { color: rgba(148,163,184,.5); }
      `}</style>

      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
          {/* ── Sidebar ── */}
          <div className="pm-sidebar">
            <p className="pm-sidebar-title">Cài đặt tài khoản</p>

            {/* Tab: Thông tin cá nhân */}
            <button
              className={`pm-sidebar-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                  stroke="#1d6cbe"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="7" r="4" stroke="#1d6cbe" strokeWidth="2" />
              </svg>
              <div className="pm-sidebar-item-text">
                <strong>Thông tin cá nhân</strong>
                <span>Quản lý thông tin của bạn</span>
              </div>
            </button>

            {/* Tab: Đổi mật khẩu */}
            <button
              className={`pm-sidebar-item ${activeTab === "password" ? "active" : ""}`}
              onClick={() => setActiveTab("password")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="11"
                  rx="2"
                  stroke="#1d6cbe"
                  strokeWidth="2"
                />
                <path
                  d="M7 11V7a5 5 0 0 1 10 0v4"
                  stroke="#1d6cbe"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16" r="1.5" fill="#1d6cbe" />
              </svg>
              <div className="pm-sidebar-item-text">
                <strong>Đổi mật khẩu</strong>
                <span>Cập nhật mật khẩu tài khoản</span>
              </div>
            </button>

            {/* Tab: Khóa tài khoản */}
            <button
              className={`pm-sidebar-item ${activeTab === "lock" ? "active" : ""}`}
              onClick={() => setActiveTab("lock")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect
                  x="4"
                  y="10"
                  width="16"
                  height="10"
                  rx="2"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
                <path
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 14v2"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div className="pm-sidebar-item-text">
                <strong>Khóa tài khoản</strong>
                <span>Gửi và duyệt yêu cầu khóa</span>
              </div>
            </button>
          </div>

          {/* ══════════════════════════════
              CONTENT: THÔNG TIN CÁ NHÂN
          ══════════════════════════════ */}
          {activeTab === "profile" && (
            <div className="pm-content">
              <div className="pm-content-header">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    stroke="#1d6cbe"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="12"
                    cy="7"
                    r="4"
                    stroke="#1d6cbe"
                    strokeWidth="2"
                  />
                </svg>
                <h2>Thông tin cá nhân</h2>
              </div>
              <p className="pm-content-subtitle">
                Cập nhật thông tin cá nhân của bạn
              </p>

              {/* Avatar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{ position: "relative", cursor: "pointer" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: avatarPreview ? "transparent" : myColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      fontWeight: 600,
                      color: "white",
                      overflow: "hidden",
                      border: "3px solid #2d3748",
                      flexShrink: 0,
                    }}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="avatar"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span>
                        {getInitials(
                          form.displayName || userProfile?.username || "?",
                        )}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#1d6cbe",
                      border: "2px solid #1e2433",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                        stroke="#fff"
                        strokeWidth="2"
                      />
                      <circle
                        cx="12"
                        cy="13"
                        r="4"
                        stroke="#fff"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: 15,
                      color: "#f1f5f9",
                    }}
                  >
                    {form.displayName || userProfile?.username}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 8px",
                      fontSize: 12,
                      color: "#9ca3af",
                    }}
                  >
                    @{userProfile?.username}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "5px 12px",
                      background: "transparent",
                      border: "1px solid #374151",
                      borderRadius: 6,
                      color: "#cbd5e1",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Đổi ảnh đại diện
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Chọn ảnh đại diện"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="pm-form-grid">
                <div className="pm-form-group">
                  <label className="pm-label">Email</label>
                  <input
                    className="pm-input"
                    value={userProfile?.email || ""}
                    disabled
                    placeholder="email@gmail.com"
                  />
                </div>
                <div className="pm-form-group">
                  <label className="pm-label">
                    Họ và tên <span className="required">*</span>
                  </label>
                  <input
                    className="pm-input"
                    name="displayName"
                    value={form.displayName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div className="pm-form-group full">
                  <label className="pm-label">Tiểu sử</label>
                  <input
                    className="pm-input"
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Nhập tiểu sử"
                  />
                </div>
                <div className="pm-form-group full">
                  <label className="pm-label">Điện thoại</label>
                  <input
                    className="pm-input"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              <hr className="pm-divider" />
              {submitError && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: 12,
                    marginBottom: 8,
                    textAlign: "right",
                  }}
                >
                  {submitError}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  style={{
                    padding: "11px 20px",
                    background: "transparent",
                    border: "1px solid #ef4444",
                    borderRadius: 8,
                    color: "#ef4444",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Xóa tài khoản
                </button>

                <button className="pm-btn-primary" onClick={handleSave}>
                  Cập nhật thông tin
                </button>
              </div>

              {/* Modal xác nhận xóa */}
              {showDeleteConfirm && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2000,
                  }}
                >
                  <div
                    style={{
                      background: "#1e2433",
                      borderRadius: 12,
                      padding: 28,
                      width: 320,
                      border: "1px solid #2d3748",
                    }}
                  >
                    <h3
                      style={{
                        color: "#f1f5f9",
                        fontSize: 16,
                        fontWeight: 600,
                        margin: "0 0 8px",
                      }}
                    >
                      Xóa tài khoản
                    </h3>
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: 13,
                        margin: "0 0 24px",
                        lineHeight: 1.6,
                      }}
                    >
                      Bạn có chắc muốn xóa tài khoản? Tất cả dữ liệu sẽ bị mất
                      vĩnh viễn và không thể hoàn tác.
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        style={{
                          flex: 1,
                          padding: "9px 0",
                          background: "transparent",
                          border: "1px solid #374151",
                          borderRadius: 8,
                          color: "#e2e8f0",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Hủy
                      </button>
                      <button
                        style={{
                          flex: 1,
                          padding: "9px 0",
                          background: "#ef4444",
                          border: "none",
                          borderRadius: 8,
                          color: "white",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        onClick={handleDelete}
                      >
                        Xác nhận xóa
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════
              CONTENT: ĐỔI MẬT KHẨU
          ══════════════════════════════ */}
          {activeTab === "password" && (
            <div className="pm-content">
              <div className="pm-content-header">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    stroke="#1d6cbe"
                    strokeWidth="2"
                  />
                  <path
                    d="M7 11V7a5 5 0 0 1 10 0v4"
                    stroke="#1d6cbe"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="16" r="1.5" fill="#1d6cbe" />
                </svg>
                <h2>Đổi mật khẩu</h2>
              </div>
              <p className="pm-content-subtitle">
                Cập nhật mật khẩu để bảo vệ tài khoản của bạn
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  maxWidth: 400,
                }}
              >
                {/* Mật khẩu cũ */}
                <div className="pm-form-group">
                  <label className="pm-label">
                    Mật khẩu hiện tại <span className="required">*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showOld ? "text" : "password"}
                      value={cpForm.oldPassword}
                      onChange={(e) => {
                        setCpForm((p) => ({
                          ...p,
                          oldPassword: e.target.value,
                        }));
                        setCpErrors((p) => ({ ...p, oldPassword: "" }));
                      }}
                      onFocus={() => setCpFocused("old")}
                      onBlur={() => setCpFocused("")}
                      placeholder="Nhập mật khẩu hiện tại"
                      style={cpInputStyle("old")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOld((v) => !v)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#9ca3af",
                        display: "flex",
                        padding: 2,
                      }}
                    >
                      {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {cpErrors.oldPassword && (
                    <span className="pm-error">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f87171"
                        strokeWidth="2.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {cpErrors.oldPassword}
                    </span>
                  )}
                </div>

                {/* Mật khẩu mới */}
                <div className="pm-form-group">
                  <label className="pm-label">
                    Mật khẩu mới <span className="required">*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNew ? "text" : "password"}
                      value={cpForm.newPassword}
                      onChange={(e) => {
                        setCpForm((p) => ({
                          ...p,
                          newPassword: e.target.value,
                        }));
                        setCpErrors((p) => ({ ...p, newPassword: "" }));
                      }}
                      onFocus={() => setCpFocused("new")}
                      onBlur={() => setCpFocused("")}
                      placeholder="Tối thiểu 6 ký tự"
                      style={cpInputStyle("new")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#9ca3af",
                        display: "flex",
                        padding: 2,
                      }}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {cpErrors.newPassword && (
                    <span className="pm-error">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f87171"
                        strokeWidth="2.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {cpErrors.newPassword}
                    </span>
                  )}
                  {/* Password strength hint */}
                  {cpForm.newPassword.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                      {[1, 2, 3].map((level) => {
                        const len = cpForm.newPassword.length;
                        const color =
                          len < 6
                            ? "#ef4444"
                            : len < 10
                              ? "#f59e0b"
                              : "#10b981";
                        const active =
                          (level === 1 && len > 0) ||
                          (level === 2 && len >= 6) ||
                          (level === 3 && len >= 10);
                        return (
                          <div
                            key={level}
                            style={{
                              flex: 1,
                              height: 3,
                              borderRadius: 2,
                              background: active ? color : "#374151",
                              transition: "all .3s",
                            }}
                          />
                        );
                      })}
                      <span
                        style={{
                          fontSize: 10,
                          color:
                            cpForm.newPassword.length < 6
                              ? "#ef4444"
                              : cpForm.newPassword.length < 10
                                ? "#f59e0b"
                                : "#10b981",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cpForm.newPassword.length < 6
                          ? "Yếu"
                          : cpForm.newPassword.length < 10
                            ? "Trung bình"
                            : "Mạnh"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div className="pm-form-group">
                  <label className="pm-label">
                    Xác nhận mật khẩu mới <span className="required">*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={cpForm.confirmPassword}
                      onChange={(e) => {
                        setCpForm((p) => ({
                          ...p,
                          confirmPassword: e.target.value,
                        }));
                        setCpErrors((p) => ({ ...p, confirmPassword: "" }));
                      }}
                      onFocus={() => setCpFocused("confirm")}
                      onBlur={() => setCpFocused("")}
                      placeholder="Nhập lại mật khẩu mới"
                      style={cpInputStyle("confirm")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#9ca3af",
                        display: "flex",
                        padding: 2,
                      }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {cpErrors.confirmPassword && (
                    <span className="pm-error">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f87171"
                        strokeWidth="2.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {cpErrors.confirmPassword}
                    </span>
                  )}
                  {/* Match indicator */}
                  {cpForm.confirmPassword.length > 0 &&
                    cpForm.newPassword.length > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          color:
                            cpForm.confirmPassword === cpForm.newPassword
                              ? "#10b981"
                              : "#f87171",
                          marginTop: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {cpForm.confirmPassword === cpForm.newPassword ? (
                          <>
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2.5"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Mật khẩu khớp
                          </>
                        ) : (
                          <></>
                        )}
                      </span>
                    )}
                </div>
              </div>

              <hr className="pm-divider" />

              <button
                className="pm-btn-primary"
                onClick={handleChangePassword}
                disabled={cpLoading}
              >
                {cpLoading ? (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <svg
                      className="pm-spin"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  "Đổi mật khẩu"
                )}
              </button>
            </div>
          )}

          {/* ══════════════════════════════
              CONTENT: KHÓA TÀI KHOẢN
          ══════════════════════════════ */}
          {activeTab === "lock" && (
            <div className="pm-content">
              <div className="pm-content-header">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4"
                    y="10"
                    width="16"
                    height="10"
                    rx="2"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                  <path
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <h2>Khóa tài khoản</h2>
              </div>
              <p className="pm-content-subtitle">
                Gửi yêu cầu khóa tài khoản và chờ admin duyệt
              </p>

              {userProfile?.isLocked ? (
                <div
                  style={{
                    border: "1px solid rgba(239,68,68,.35)",
                    background: "rgba(239,68,68,.1)",
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 18,
                  }}
                >
                  <p
                    style={{
                      color: "#fecaca",
                      fontWeight: 700,
                      margin: "0 0 6px",
                    }}
                  >
                    Tài khoản này đã bị khóa
                  </p>
                  <p
                    style={{
                      color: "#fca5a5",
                      fontSize: 13,
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {userProfile.lockedReason ||
                      "Không có lý do khóa được ghi nhận."}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid #2d3748",
                    background: "#171e2e",
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 20,
                  }}
                >
                  <label className="pm-label">Lý do muốn khóa tài khoản</label>
                  <textarea
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    placeholder="Ví dụ: Tôi muốn tạm ngừng sử dụng tài khoản này..."
                    maxLength={500}
                    style={{
                      width: "100%",
                      minHeight: 96,
                      resize: "vertical",
                      marginTop: 8,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #374151",
                      background: "#111827",
                      color: "#f1f5f9",
                      fontFamily: "inherit",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 12,
                      gap: 12,
                    }}
                  >
                    <span style={{ color: "#64748b", fontSize: 12 }}>
                      Admin phải duyệt thì tài khoản mới bị khóa.
                    </span>
                    <button
                      className="pm-btn-primary"
                      onClick={handleRequestAccountLockClick}
                      disabled={lockSubmitting}
                      style={{
                        float: "none",
                        background: "#d97706",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {lockSubmitting ? "Đang gửi..." : "Gửi yêu cầu khóa"}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 22 }}>
                <h3
                  style={{ color: "#f1f5f9", fontSize: 15, margin: "0 0 12px" }}
                >
                  Yêu cầu của tôi
                </h3>
                {lockRequestsLoading ? (
                  <p style={{ color: "#94a3b8", fontSize: 13 }}>Đang tải...</p>
                ) : myLockRequests.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: 13 }}>
                    Bạn chưa gửi yêu cầu khóa tài khoản nào.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      maxHeight: 160,
                      overflowY: "auto",
                      paddingRight: 4,
                    }}
                  >
                    {myLockRequests.map((request) => (
                      <div
                        key={request._id}
                        style={{
                          border: "1px solid #2d3748",
                          background: "#111827",
                          borderRadius: 10,
                          padding: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 6,
                          }}
                        >
                          <strong style={{ color: "#e2e8f0", fontSize: 13 }}>
                            {getStatusText(request.status)}
                          </strong>
                          <span style={{ color: "#64748b", fontSize: 12 }}>
                            {new Date(request.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "#94a3b8",
                            fontSize: 13,
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {request.reason || "Không nhập lý do"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isAdmin && (
                <>
                  <hr className="pm-divider" />
                  <div>
                    <h3
                      style={{
                        color: "#f1f5f9",
                        fontSize: 15,
                        margin: "0 0 12px",
                      }}
                    >
                      Admin duyệt yêu cầu khóa
                    </h3>
                    {lockRequestsLoading ? (
                      <p style={{ color: "#94a3b8", fontSize: 13 }}>
                        Đang tải...
                      </p>
                    ) : adminLockRequests.length === 0 ? (
                      <p style={{ color: "#64748b", fontSize: 13 }}>
                        Không có yêu cầu khóa tài khoản đang chờ.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                          maxHeight: 160,
                          overflowY: "auto",
                          paddingRight: 4,
                        }}
                      >
                        {adminLockRequests.map((request) => (
                          <div
                            key={request._id}
                            style={{
                              border: "1px solid #2d3748",
                              background: "#111827",
                              borderRadius: 10,
                              padding: 14,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                marginBottom: 8,
                              }}
                            >
                              <div>
                                <strong
                                  style={{ color: "#f1f5f9", fontSize: 14 }}
                                >
                                  {getRequestUserName(request)}
                                </strong>
                                <p
                                  style={{
                                    color: "#64748b",
                                    fontSize: 12,
                                    margin: "3px 0 0",
                                  }}
                                >
                                  {new Date(request.createdAt).toLocaleString(
                                    "vi-VN",
                                  )}
                                </p>
                              </div>
                              <span
                                style={{
                                  color: "#fbbf24",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                Đang chờ
                              </span>
                            </div>
                            <p
                              style={{
                                color: "#94a3b8",
                                fontSize: 13,
                                margin: "0 0 12px",
                                lineHeight: 1.5,
                              }}
                            >
                              {request.reason || "Không nhập lý do"}
                            </p>
                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                justifyContent: "flex-end",
                              }}
                            >
                              <button
                                onClick={() =>
                                  handleReviewAccountLock(
                                    request._id,
                                    "rejected",
                                  )
                                }
                                disabled={reviewingRequestId === request._id}
                                style={{
                                  padding: "8px 14px",
                                  background: "transparent",
                                  border: "1px solid #64748b",
                                  borderRadius: 8,
                                  color: "#cbd5e1",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                }}
                              >
                                Từ chối
                              </button>
                              <button
                                onClick={() =>
                                  handleReviewAccountLock(
                                    request._id,
                                    "approved",
                                  )
                                }
                                disabled={reviewingRequestId === request._id}
                                style={{
                                  padding: "8px 14px",
                                  background: "#dc2626",
                                  border: "none",
                                  borderRadius: 8,
                                  color: "white",
                                  cursor: "pointer",
                                  fontWeight: 700,
                                }}
                              >
                                Duyệt khóa
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <button className="pm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {showLockOtpModal && (
          <OtpModal
            key={userProfile?.email} // 👈 QUAN TRỌNG
            email={userProfile?.email || ""}
            onClose={() => setShowLockOtpModal(false)}
            onVerified={async () => {
              try {
                await handleRequestAccountLock();
                setShowLockOtpModal(false);
              } catch (error) {
                console.error(error);
              }
            }}
          />
        )}
      </div>
    </>
  );
}
