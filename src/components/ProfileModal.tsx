import { useState, useRef } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { userService } from "@/services/userService";
import { useChangePasswordStore } from "@/stores/useOtpStore";

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  role: string;
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

type Tab = "profile" | "password";

export default function ProfileModal({
  onClose,
  userProfile,
  setUserProfile,
  myColor,
  myName,
}: ProfileModalProps) {
  const {
    changePassword,
    loading: cpLoading,
    clearState,
  } = useChangePasswordStore();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = async () => {
    if (!userProfile) return;
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
              <button className="pm-btn-primary" onClick={handleSave}>
                Cập nhật thông tin
              </button>
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
                          <>
                           
                          </>
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

          <button className="pm-close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
    </>
  );
}
