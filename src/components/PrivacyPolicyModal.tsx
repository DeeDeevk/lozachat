import { useEffect, useRef } from "react";

interface PrivacyPolicyModalProps {
  onClose: () => void;
  onAccept: () => void;
}

export default function PrivacyPolicyModal({ onClose, onAccept }: PrivacyPolicyModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sections = [
    {
      icon: "🔐",
      title: "1. Thu thập thông tin",
      content: `Loza thu thập các thông tin sau khi bạn đăng ký và sử dụng dịch vụ:
• Thông tin tài khoản: họ tên, tên đăng nhập, địa chỉ email, số điện thoại (tuỳ chọn), ảnh đại diện.
• Thông tin hoạt động: tin nhắn, bình luận, bài đăng, lượt thích, danh sách bạn bè.
• Thông tin thiết bị: địa chỉ IP, loại trình duyệt, hệ điều hành, múi giờ.
• Thông tin sử dụng: thời gian truy cập, trang xem, tính năng sử dụng.
Chúng tôi không thu thập thông tin tài chính như số thẻ tín dụng hay tài khoản ngân hàng.`,
    },
    {
      icon: "📋",
      title: "2. Mục đích sử dụng",
      content: `Thông tin thu thập được sử dụng để:
• Cung cấp và vận hành các tính năng nhắn tin, mạng xã hội của Loza.
• Xác thực danh tính và bảo mật tài khoản người dùng.
• Gợi ý kết bạn, nội dung phù hợp dựa trên sở thích.
• Gửi thông báo hệ thống, cập nhật tính năng mới.
• Phân tích và cải thiện chất lượng dịch vụ.
• Phát hiện và ngăn chặn các hành vi lạm dụng, gian lận.`,
    },
    {
      icon: "💬",
      title: "3. Bảo mật tin nhắn",
      content: `Loza áp dụng các biện pháp bảo mật tin nhắn nghiêm ngặt:
• Tin nhắn được mã hoá trong quá trình truyền tải (TLS/SSL).
• Chúng tôi không đọc nội dung tin nhắn riêng tư của người dùng.
• Lịch sử tin nhắn được lưu trữ an toàn trên máy chủ có kiểm soát truy cập.
• Người dùng có thể xoá tin nhắn của mình bất kỳ lúc nào.
• Trong trường hợp có yêu cầu pháp lý hợp lệ, chúng tôi có thể cung cấp dữ liệu cho cơ quan chức năng theo quy định pháp luật.`,
    },
    {
      icon: "🌐",
      title: "4. Mạng xã hội & chia sẻ dữ liệu",
      content: `Đối với tính năng mạng xã hội tích hợp trong Loza:
• Bài đăng công khai có thể được người dùng khác xem, chia sẻ.
• Danh sách bạn bè chỉ hiển thị cho chính bạn và bạn bè của bạn (theo cài đặt quyền riêng tư).
• Chúng tôi không bán hoặc cho thuê dữ liệu cá nhân của bạn cho bên thứ ba.
• Chúng tôi có thể chia sẻ dữ liệu tổng hợp (không định danh) với đối tác phân tích.
• Khi tích hợp đăng nhập Google, chúng tôi chỉ nhận thông tin cơ bản theo phạm vi bạn cho phép.`,
    },
    {
      icon: "🛡️",
      title: "5. Quyền của người dùng",
      content: `Bạn có các quyền sau đối với dữ liệu cá nhân của mình:
• Quyền truy cập: yêu cầu xem dữ liệu Loza đang lưu trữ về bạn.
• Quyền chỉnh sửa: cập nhật thông tin cá nhân bất kỳ lúc nào trong Cài đặt.
• Quyền xoá: yêu cầu xoá tài khoản và toàn bộ dữ liệu liên quan.
• Quyền xuất dữ liệu: tải xuống bản sao dữ liệu cá nhân của bạn.
• Quyền hạn chế xử lý: yêu cầu tạm dừng xử lý dữ liệu trong một số trường hợp.
Để thực hiện các quyền này, liên hệ: privacy@loza.chat`,
    },
    {
      icon: "🍪",
      title: "6. Cookie & Theo dõi",
      content: `Loza sử dụng cookie và công nghệ tương tự để:
• Duy trì phiên đăng nhập của bạn (cookie bắt buộc).
• Lưu trữ tuỳ chọn giao diện (chế độ tối/sáng, ngôn ngữ).
• Phân tích hành vi sử dụng để cải thiện trải nghiệm.
• Bạn có thể tắt cookie không bắt buộc trong cài đặt trình duyệt, tuy nhiên điều này có thể ảnh hưởng đến một số tính năng.`,
    },
    {
      icon: "👶",
      title: "7. Trẻ em & Độ tuổi",
      content: `Loza không dành cho trẻ em dưới 13 tuổi:
• Chúng tôi không cố ý thu thập thông tin từ trẻ em dưới 13 tuổi.
• Nếu phát hiện tài khoản của trẻ em dưới độ tuổi quy định, chúng tôi sẽ xoá tài khoản đó.
• Người dùng từ 13–17 tuổi nên có sự đồng ý của phụ huynh.
• Phụ huynh phát hiện con mình đăng ký trái phép có thể liên hệ để yêu cầu xoá tài khoản.`,
    },
    {
      icon: "🔄",
      title: "8. Cập nhật chính sách",
      content: `Chính sách bảo mật này có thể được cập nhật định kỳ:
• Chúng tôi sẽ thông báo qua email hoặc thông báo trong ứng dụng khi có thay đổi quan trọng.
• Phiên bản mới nhất luôn được đăng tại loza.chat/privacy.
• Việc tiếp tục sử dụng dịch vụ sau khi thay đổi chính sách đồng nghĩa với việc bạn chấp nhận chính sách mới.
• Ngày cập nhật gần nhất: 07/04/2025.`,
    },
    {
      icon: "📧",
      title: "9. Liên hệ",
      content: `Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật này, vui lòng liên hệ:
• Email: privacy@loza.chat
• Địa chỉ: Tầng 5, Toà nhà Tech Hub, TP. Hồ Chí Minh
• Hotline: 1800-LOZA (miễn phí, 8:00–22:00 mỗi ngày)
• Thời gian phản hồi: trong vòng 3–5 ngày làm việc.`,
    },
  ];

  return (
    <>
      <style>{`
        @keyframes ppModalIn {
          from { opacity:0; transform:scale(.96) translateY(-12px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes ppFadeIn { from{opacity:0;} to{opacity:1;} }

        .pp-backdrop {
          position: fixed; inset: 0; z-index: 2000;
          background: rgba(2,6,18,.82); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; animation: ppFadeIn .2s ease both;
        }
        .pp-modal {
          width: 100%; max-width: 680px; max-height: 88vh;
          background: linear-gradient(170deg,#0d1526 0%,#0a1020 100%);
          border: 1px solid rgba(255,255,255,.09); border-radius: 22px;
          box-shadow: 0 32px 80px rgba(0,0,0,.75), 0 0 0 1px rgba(99,102,246,.08);
          animation: ppModalIn .28s cubic-bezier(.22,1,.36,1) both;
          display: flex; flex-direction: column; overflow: hidden;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .pp-header {
          padding: 22px 24px 18px; border-bottom: 1px solid rgba(255,255,255,.06);
          flex-shrink: 0;
          background: linear-gradient(90deg,rgba(37,99,235,.08),rgba(99,102,246,.05));
        }
        .pp-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .pp-header-title { display: flex; align-items: center; gap: 10px; }
        .pp-header-icon {
          width: 36px; height: 36px; border-radius: 11px; flex-shrink: 0;
          background: linear-gradient(135deg,rgba(37,99,235,.25),rgba(99,102,246,.2));
          border: 1px solid rgba(99,102,246,.25);
          display: flex; align-items: center; justify-content: center;
        }
        .pp-title { font-size: 17px; font-weight: 800; color: white; }
        .pp-subtitle { font-size: 12px; color: #64748b; margin-top: 3px; }
        .pp-close {
          width: 30px; height: 30px; border-radius: 8px; border: none;
          background: rgba(255,255,255,.06); color: #64748b; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all .15s;
          font-size: 14px;
        }
        .pp-close:hover { background: rgba(255,255,255,.1); color: #e2e8f0; }

        .pp-content {
          flex: 1; overflow-y: auto; padding: 20px 24px;
          scrollbar-width: thin; scrollbar-color: rgba(99,102,246,.3) transparent;
        }
        .pp-content::-webkit-scrollbar { width: 4px; }
        .pp-content::-webkit-scrollbar-thumb { background: rgba(99,102,246,.3); border-radius: 4px; }

        .pp-intro {
          background: linear-gradient(135deg,rgba(37,99,235,.08),rgba(99,102,246,.05));
          border: 1px solid rgba(99,102,246,.15); border-radius: 12px;
          padding: 14px 16px; margin-bottom: 20px;
          font-size: 13px; color: #94a3b8; line-height: 1.7;
        }
        .pp-intro strong { color: #60a5fa; }

        .pp-section { margin-bottom: 20px; }
        .pp-section-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
        }
        .pp-section-emoji { font-size: 18px; line-height: 1; }
        .pp-section-title {
          font-size: 14px; font-weight: 700; color: #e2e8f0;
        }
        .pp-section-body {
          font-size: 12.5px; color: #94a3b8; line-height: 1.85;
          padding: 12px 14px; border-radius: 10px;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.05);
          white-space: pre-line;
        }
        .pp-section-body strong { color: #cbd5e1; }

        .pp-divider { height: 1px; background: rgba(255,255,255,.05); margin: 4px 0 20px; }

        .pp-footer {
          padding: 16px 24px; border-top: 1px solid rgba(255,255,255,.06);
          flex-shrink: 0; display: flex; gap: 10px; justify-content: flex-end;
          background: rgba(8,14,28,.6);
        }
        .pp-btn-close {
          padding: 10px 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.06); color: #94a3b8; font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all .18s; font-family: inherit;
        }
        .pp-btn-close:hover { background: rgba(255,255,255,.1); color: #e2e8f0; }
        .pp-btn-accept {
          padding: 10px 24px; border-radius: 10px; border: none;
          background: linear-gradient(135deg,#2563eb,#3b82f6); color: white;
          font-size: 13px; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 14px rgba(37,99,235,.4); transition: all .18s;
          font-family: inherit; display: flex; align-items: center; gap: 6px;
        }
        .pp-btn-accept:hover { box-shadow: 0 6px 20px rgba(37,99,235,.55); transform: translateY(-1px); }
      `}</style>

      <div className="pp-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="pp-modal">
          {/* Header */}
          <div className="pp-header">
            <div className="pp-header-top">
              <div className="pp-header-title">
                <div className="pp-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <div className="pp-title">Chính sách bảo mật Loza</div>
                  <div className="pp-subtitle">Cập nhật lần cuối: 07/04/2025 · Hiệu lực ngay khi đăng ký</div>
                </div>
              </div>
              <button className="pp-close" onClick={onClose}>✕</button>
            </div>
          </div>

          {/* Content */}
          <div className="pp-content" ref={contentRef}>
            <div className="pp-intro">
              Chào mừng bạn đến với <strong>Loza</strong> — ứng dụng nhắn tin thời gian thực tích hợp mạng xã hội.
              Chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn. Vui lòng đọc kỹ chính sách này
              trước khi sử dụng dịch vụ. Bằng cách đăng ký tài khoản, bạn đồng ý với các điều khoản được mô tả dưới đây.
            </div>

            {sections.map((section, i) => (
              <div key={i} className="pp-section">
                <div className="pp-section-header">
                  <span className="pp-section-emoji">{section.icon}</span>
                  <span className="pp-section-title">{section.title}</span>
                </div>
                <div className="pp-section-body">{section.content}</div>
                {i < sections.length - 1 && <div style={{ height: 8 }} />}
              </div>
            ))}

            <div className="pp-divider" />
            <p style={{ fontSize: 11, color: "#475569", textAlign: "center", lineHeight: 1.6 }}>
              © 2025 Loza Inc. · Mọi quyền được bảo lưu · loza.chat/privacy · privacy@loza.chat
            </p>
          </div>

          {/* Footer */}
          <div className="pp-footer">
            <button className="pp-btn-close" onClick={onClose}>Đóng</button>
            <button className="pp-btn-accept" onClick={() => { onAccept(); onClose(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Tôi đã đọc và đồng ý
            </button>
          </div>
        </div>
      </div>
    </>
  );
}