import { useState, useRef } from "react";
import { userService } from "@/services/userService";

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
  myColor: string;   // ← thêm
  myName: string;    // ← thêm
}

interface UpdateProfilePayload {
  displayName?: string;
  phone?: string;
  bio?: string;
}

export default function ProfileModal({ onClose, userProfile, setUserProfile, myColor, myName}: ProfileModalProps) {
  const [isEdit, setIsEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({
    displayName: userProfile?.displayName ?? "",
    bio: userProfile?.bio ?? "",
    phone: userProfile?.phone ?? "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile?.avatarUrl ?? null);
  const [errors, setErrors] = useState<{ phone?: string }>({});


  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
      if (!file || !userProfile) return;

      // Preview tạm thời
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

      } catch (error) {
        console.error("Lỗi upload avatar:", error);
        setAvatarPreview(null);
      }
  };

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
        createdAt: userProfile.createdAt,
        updatedAt: user.updatedAt,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? userProfile.avatarUrl,
        bio: user.bio ?? userProfile.bio,
        phone: user.phone ?? userProfile.phone,
      });

      setIsEdit(false);
      onClose();
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Lỗi: " + error);
    }
  };

  return (
    <>
      <style>{`
    .pm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .pm-modal {
      background: #1e2433;
      border-radius: 14px;
      width: 700px;
      overflow: hidden;
      position: relative;
      font-family: sans-serif;
      color: #f1f5f9;
      display: flex;
      min-height: 460px;
      border: 1px solid #2d3748;
    }

    .pm-sidebar {
      width: 220px;
      background: #171e2e;
      border-right: 1px solid #2d3748;
      padding: 24px 12px;
      flex-shrink: 0;
    }

    .pm-sidebar-title {
      font-size: 15px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 12px 8px;
    }

    .pm-sidebar-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 4px;
      border-left: 3px solid transparent;
    }

    .pm-sidebar-item.active {
      background: #1e3a5f;
      border-left: 3px solid #1d6cbe;
    }

    .pm-sidebar-item-text strong {
      font-size: 13px;
      font-weight: 600;
      color: #f1f5f9;
    }

    .pm-sidebar-item-text span {
      font-size: 11px;
      color: #9ca3af;
      display: block;
    }

    .pm-content {
      flex: 1;
      padding: 32px 36px;
      overflow-y: auto;
    }

    .pm-content-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }

    .pm-content-header h2 {
      font-size: 20px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
    }

    .pm-content-subtitle {
      font-size: 13px;
      color: #9ca3af;
      margin: 0 0 24px;
    }

    .pm-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .pm-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .pm-form-group.full {
      grid-column: 1 / -1;
    }

    .pm-label {
      font-size: 13px;
      color: #cbd5e1;
      font-weight: 500;
    }

    .pm-label .required {
      color: #ef4444;
      margin-left: 2px;
    }

    .pm-input {
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #374151;
      background: #111827;
      color: #f1f5f9;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
      width: 100%;
    }

    .pm-input:focus {
      border-color: #1d6cbe;
      box-shadow: 0 0 0 3px #1d4ed822;
    }

    .pm-input:disabled {
      background: #1a2133;
      color: #6b7280;
      cursor: not-allowed;
    }

    .pm-divider {
      border: none;
      border-top: 1px solid #2d3748;
      margin: 20px 0;
    }

    .pm-btn-primary {
      padding: 11px 28px;
      background: #1d6cbe;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      float: right;
    }

    .pm-btn-primary:hover {
      background: #1558a8;
    }

    .pm-close {
      position: absolute;
      top: 12px;
      right: 16px;
      background: transparent;
      border: none;
      color: #9ca3af;
      font-size: 18px;
      cursor: pointer;
      z-index: 10;
    }

    .pm-close:hover {
      color: #f1f5f9;
    }
  `}</style>

    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>

        <div className="pm-sidebar">
          <p className="pm-sidebar-title">Cài đặt tài khoản</p>
          <div className="pm-sidebar-item active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#1d6cbe" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="7" r="4" stroke="#1d6cbe" strokeWidth="2"/>
            </svg>
            <div className="pm-sidebar-item-text">
              <strong>Thông tin cá nhân</strong>
              <span>Quản lý thông tin cá nhân của bạn</span>
            </div>
          </div>
        </div>

        <div className="pm-content">
          <div className="pm-content-header">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#1d6cbe" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="7" r="4" stroke="#1d6cbe" strokeWidth="2"/>
            </svg>
            <h2>Thông tin cá nhân</h2>
          </div>
          <p className="pm-content-subtitle">Cập nhật thông tin cá nhân của bạn</p>

          {/* Thêm vào đầu .pm-content, trước pm-content-header */}
<div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
  <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
    <div style={{
      width: 72, height: 72, borderRadius: "50%",
      background: avatarPreview ? "transparent" : myColor,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 24, fontWeight: 600, color: "white",
      overflow: "hidden", border: "3px solid #2d3748", flexShrink: 0,
    }}>
      {avatarPreview
        ? <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span>{getInitials(form.displayName || userProfile?.username || "?")}</span>
      }
    </div>
    <div style={{
      position: "absolute", bottom: 2, right: 2,
      width: 22, height: 22, borderRadius: "50%",
      background: "#1d6cbe", border: "2px solid #1e2433",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#fff" strokeWidth="2"/>
        <circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="2"/>
      </svg>
    </div>
  </div>
  <div>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#f1f5f9" }}>{form.displayName || userProfile?.username}</p>
      <p style={{ margin: "4px 0 8px", fontSize: 12, color: "#9ca3af" }}>@{userProfile?.username}</p>
      <button
        onClick={() => fileInputRef.current?.click()}
        style={{ padding: "5px 12px", background: "transparent", border: "1px solid #374151", borderRadius: 6, color: "#cbd5e1", fontSize: 12, cursor: "pointer" }}
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
            <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 8, textAlign: "right" }}>
              {submitError}
            </p>
          )}

          <button className="pm-btn-primary" onClick={handleSave}>
            Cập nhật thông tin
          </button>
        </div>

        <button className="pm-close" onClick={onClose}>✕</button>
      </div>
    </div>
  </>
  );
}