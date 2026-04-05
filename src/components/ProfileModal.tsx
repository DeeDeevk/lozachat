import { useState } from "react";

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const [isEdit, setIsEdit] = useState(false);

  const [form, setForm] = useState({
    gender: "Nam",
    dob: "04 tháng 02, 2004",
    phone: "+84 768 558 858",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    console.log("Dữ liệu mới:", form);

    // TODO: gọi API ở đây nếu cần

    setIsEdit(false);
  };

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          background: #1f2937;
          color: white;
          padding: 20px;
          border-radius: 10px;
          width: 350px;
          position: relative;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          color: #cbd5e1;
        }

        .note {
          font-size: 13px;
          color: #9ca3af;
          margin-top: 10px;
        }

        .update-btn {
          margin-top: 15px;
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid #374151;
          color: white;
          border-radius: 6px;
          cursor: pointer;
        }

        .input {
          width: 100%;
          padding: 8px;
          margin-top: 5px;
          margin-bottom: 10px;
          border-radius: 6px;
          border: 1px solid #374151;
          background: #111827;
          color: white;
        }

        .close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
        }
      `}</style>

      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <h2>Thông tin cá nhân</h2>

          {!isEdit ? (
            <>
              <div className="info-row">
                <span>Giới tính</span>
                <span>{form.gender}</span>
              </div>

              <div className="info-row">
                <span>Ngày sinh</span>
                <span>{form.dob}</span>
              </div>

              <div className="info-row">
                <span>Điện thoại</span>
                <span>{form.phone}</span>
              </div>

              <p className="note">
                Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số này
              </p>

              <button
                className="update-btn"
                onClick={() => setIsEdit(true)}
              >
                ✏️ Cập nhật
              </button>
            </>
          ) : (
            <>
              <label htmlFor="gender">Giới tính</label>
              <input
                id="gender"
                className="input"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                />

              <label htmlFor="dob">Ngày sinh</label>
              <input
                id="dob"
                className="input"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                />

              <label htmlFor="phone">Điện thoại</label>
              <input
                id="phone"
                className="input"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                />
                
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button className="update-btn" onClick={handleSave}>
                    💾 Lưu
                </button>

                <button
                    className="update-btn"
                    onClick={() => setIsEdit(false)}
                    style={{ borderColor: "#6b7280", color: "#9ca3af" }}
                >
                    ↩ Hủy
                </button>
            </div>
            </>
          )}

          <button className="close-btn" onClick={onClose}>
            ✖
          </button>
        </div>
      </div>
    </>
  );
}