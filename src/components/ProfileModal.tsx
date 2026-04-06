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

  const [form, setForm] = useState({
    displayName: userProfile?.displayName ?? "",
    bio: userProfile?.bio ?? "",
    phone: userProfile?.phone ?? "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile?.avatarUrl ?? null);

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

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

    } catch (error) {
      console.error("Lỗi upload avatar:", error);
      setAvatarPreview(null);
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

      setIsEdit(false);
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
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
          background: #1a2233;
          border-radius: 14px;
          width: 340px;
          overflow: hidden;
          position: relative;
          font-family: sans-serif;
          color: white;
        }

        .pm-banner {
          height: 90px;
          background: linear-gradient(135deg, #1a3a5c, #0d2137);
        }

        .pm-avatar-wrap {
          position: absolute;
          top: 50px;
          left: 50%;
          transform: translateX(-50%);
          cursor: pointer;
        }

        .pm-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #20b486;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 600;
          color: white;
          border: 3px solid #1a2233;
          overflow: hidden;
        }

        .pm-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pm-camera-badge {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #374151;
          border: 2px solid #1a2233;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pm-body {
          padding: 48px 20px 20px;
        }

        .pm-name {
          font-size: 17px;
          font-weight: 600;
          text-align: center;
          margin-bottom: 16px;
          color: #f1f5f9;
        }

        .pm-divider {
          border: none;
          border-top: 0.5px solid #2d3748;
          margin: 12px 0;
        }

        .pm-section-title {
          font-size: 13px;
          font-weight: 600;
          color: #f1f5f9;
          margin: 0 0 10px;
        }

        .pm-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .pm-info-label {
          font-size: 13px;
          color: #9ca3af;
        }

        .pm-info-value {
          font-size: 13px;
          color: #e2e8f0;
        }

        .pm-input {
          width: 100%;
          padding: 8px 10px;
          margin-bottom: 10px;
          border-radius: 7px;
          border: 1px solid #374151;
          background: #111827;
          color: white;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
        }

        .pm-input:focus {
          border-color: #1d6cbe;
        }

        .pm-label {
          font-size: 12px;
          color: #9ca3af;
          margin-bottom: 4px;
          display: block;
        }

        .pm-btn-row {
          display: flex;
          gap: 8px;
          margin-top: 14px;
        }

        .pm-btn {
          flex: 1;
          padding: 9px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          font-weight: 500;
        }

        .pm-btn-primary {
          background: #1d6cbe;
          color: white;
        }

        .pm-btn-secondary {
          background: #374151;
          color: #e2e8f0;
        }

        .pm-edit-btn {
          width: 100%;
          padding: 9px;
          margin-top: 6px;
          background: transparent;
          border: 1px solid #374151;
          color: #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
        }

        .pm-close {
          position: absolute;
          top: 10px;
          right: 12px;
          background: transparent;
          border: none;
          color: #9ca3af;
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
          z-index: 10;
        }
      `}</style>

      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal" onClick={(e) => e.stopPropagation()}>

          <div className="pm-banner" />

          <div className="pm-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
            <div
              className="sidenav-avatar-btn"
              style={{ background: avatarPreview ? "transparent" : myColor, width: 65, height: 65, fontSize: 25 }}
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "20%" }} />
                : <span>{getInitials(form.displayName || userProfile?.username || "?")}</span>
              }
              <div className="sidenav-online-dot" style={{ width: 12, height: 12 }}/>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" aria-label="Chọn ảnh đại diện" style={{ display: "none" }} onChange={handleAvatarChange} />

          <button className="pm-close" onClick={onClose}>✕</button>

          <div className="pm-body">
            <div className="pm-name">{form.displayName || userProfile?.username}</div>

            <hr className="pm-divider" />
            <p className="pm-section-title">Thông tin cá nhân</p>

            {!isEdit ? (
              <>
                <div className="pm-info-row">
                  <span className="pm-info-label">Tên hiển thị</span>
                  <span className="pm-info-value">{form.displayName || "—"}</span>
                </div>
                <div className="pm-info-row">
                  <span className="pm-info-label">Tiểu sử</span>
                  <span className="pm-info-value">{form.bio || "—"}</span>
                </div>
                <div className="pm-info-row">
                  <span className="pm-info-label">Điện thoại</span>
                  <span className="pm-info-value">{form.phone || "—"}</span>
                </div>

                <button className="pm-edit-btn" onClick={() => setIsEdit(true)}>
                   Cập nhật
                </button>
              </>
            ) : (
              <>
                <label className="pm-label" htmlFor="displayName">Tên hiển thị</label>
                <input id="displayName" className="pm-input" name="displayName" value={form.displayName} onChange={handleChange} />

                <label className="pm-label" htmlFor="bio">Tiểu sử</label>
                <input id="bio" className="pm-input" name="bio" value={form.bio} onChange={handleChange} />

                <label className="pm-label" htmlFor="phone">Điện thoại</label>
                <input id="phone" className="pm-input" name="phone" value={form.phone} onChange={handleChange} />

                <div className="pm-btn-row">
                  <button className="pm-btn pm-btn-primary" onClick={handleSave}>Lưu</button>
                  <button className="pm-btn pm-btn-secondary" onClick={() => setIsEdit(false)}> Hủy</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}