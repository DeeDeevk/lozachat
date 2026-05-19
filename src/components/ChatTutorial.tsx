'use client';

import { useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default function useChatTutorial() {
  const startTutorial = useCallback(() => {
   const driverObj = driver({
  showProgress: true,
  animate: true,

  smoothScroll: true,
  allowClose: true,

  overlayOpacity: 0.18,
  stagePadding: 14,
  stageRadius: 22,

  popoverClass: 'loza-tutorial-popover',

  nextBtnText: 'Tiếp →',
  prevBtnText: '← Trước',
  doneBtnText: 'Xong',

  onDestroyed: () => {
    localStorage.setItem('chatTutorialCompleted', 'true');
  },
});

// helper check element tồn tại
const stepExists = (selector: string) => {
  return document.querySelector(selector);
};

// tạo step an toàn
const createStep = (
  selector: string,
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  }
) => {
  if (!stepExists(selector)) return null;

  return {
    element: selector,
    popover,
  };
};

// build steps động
const steps = [
  createStep('[data-tour="sidenav"]', {
    title: '📍 Thanh điều hướng',
    description:
      'Đây là khu vực chính để chuyển trang. Bạn có thể vào chat, bạn bè, mạng xã hội và mở nhanh các công cụ.',
    side: 'right',
    align: 'center',
  }),

  createStep('[data-tour="conversation-list"]', {
    title: '💬 Danh sách cuộc trò chuyện',
    description:
      'Toàn bộ cuộc trò chuyện cá nhân và nhóm sẽ nằm ở đây. Click để chuyển chat cực nhanh.',
    side: 'right',
    align: 'start',
  }),

  createStep('[data-tour="chat-header"]', {
    title: '🧠 Header cuộc trò chuyện',
    description:
      'Hiển thị thông tin người nhận, trạng thái online và các chức năng như tìm kiếm, gọi điện hoặc đổi giao diện.',
    side: 'bottom',
    align: 'center',
  }),

  createStep('[data-tour="theme-area"]', {
    title: '🎨 Tuỳ chỉnh giao diện (Theme)',
    description:
      'Đổi màu chủ đề, dark/light mode hoặc cá nhân hoá giao diện chat theo style bạn thích.',
    side: 'bottom',
    align: 'center',
  }),

  createStep('[data-tour="add-member-area"]', {
    title: '👥 Thêm thành viên',
    description:
      'Mời người mới vào nhóm hoặc cuộc trò chuyện. Có thể tìm kiếm user và thêm nhanh chỉ với 1 click.',
    side: 'left',
    align: 'center',
  }),

  createStep('[data-tour="call-buttons"]', {
    title: '📞 Gọi thoại & video',
    description:
      'Bắt đầu voice call hoặc video call trực tiếp với người dùng hoặc nhóm.',
    side: 'bottom',
    align: 'center',
  }),

  createStep('[data-tour="search-button"]', {
    title: '🔎 Tìm kiếm tin nhắn',
    description:
      'Tìm nhanh hình ảnh, file hoặc nội dung tin nhắn trong cuộc trò chuyện.',
    side: 'bottom',
    align: 'center',
  }),

  createStep('[data-tour="messages-area"]', {
    title: '📨 Khu vực tin nhắn',
    description:
      'Tin nhắn sẽ hiển thị realtime tại đây. Bạn có thể reply, react emoji, ghim hoặc xem media.',
    side: 'top',
    align: 'center',
  }),

  createStep('[data-tour="my-message"]', {
    title: '🟦 Tin nhắn của bạn',
    description:
      'Bạn có thể edit, react, ghim hoặc thu hồi tin nhắn của chính mình.',
    side: 'left',
    align: 'center',
  }),

  createStep('[data-tour="other-message"]', {
    title: '🧩 Tin nhắn người khác',
    description:
      'Reply, reaction emoji hoặc mở menu tương tác nâng cao tại đây.',
    side: 'right',
    align: 'center',
  }),

  createStep('[data-tour="input-area"]', {
    title: '⌨️ Ô nhập tin nhắn',
    description:
      'Gửi văn bản, ảnh, sticker, voice, poll hoặc dùng quick message shortcut ngay tại đây.',
    side: 'top',
    align: 'center',
  }),

  createStep('[data-tour="emoji-button"]', {
    title: '😀 Emoji',
    description:
      'Mở kho emoji để phản hồi nhanh khi chat.',
    side: 'top',
    align: 'center',
  }),

  createStep('[data-tour="attachment-button"]', {
    title: '📎 Đính kèm',
    description:
      'Gửi ảnh, video, file hoặc nhiều media cùng lúc.',
    side: 'top',
    align: 'center',
  }),

  createStep('[data-tour="sticker-button"]', {
    title: '🧸 Sticker',
    description:
      'Gửi sticker và animation để cuộc trò chuyện vui hơn.',
    side: 'top',
    align: 'center',
  }),

  createStep('[data-tour="voice-record-button"]', {
    title: '🎤 Ghi âm',
    description:
      'Giữ để ghi âm voice message realtime.',
    side: 'top',
    align: 'center',
  }),

  createStep('[data-tour="poll-button"]', {
    title: '📊 Poll',
    description:
      'Tạo bình chọn nhanh trong nhóm chat.',
    side: 'top',
    align: 'center',
  }),

  createStep('[data-tour="send-button"]', {
    title: '🚀 Gửi tin nhắn',
    description:
      'Gửi nội dung ngay lập tức đến cuộc trò chuyện hiện tại.',
    side: 'top',
    align: 'center',
  }),

  createStep('[data-tour="info-panel"]', {
    title: '⚙️ Bảng thông tin',
    description:
      'Thông tin thành viên, media đã gửi, cài đặt nhóm và các tùy chọn nâng cao.',
    side: 'left',
    align: 'center',
  }),

  createStep('[data-tour="toggle-info-panel"]', {
    title: '🪟 Thu gọn Info Panel',
    description:
      'Ẩn hoặc hiện bảng thông tin bên phải để tăng không gian chat.',
    side: 'left',
    align: 'center',
  }),
]
.filter(
  (step): step is NonNullable<typeof step> => step !== null
);

driverObj.setSteps(steps);

if (steps.length > 0) {
  driverObj.drive();
}

    const styleId = 'loza-driver-style';

    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');

      style.id = styleId;

      style.innerHTML = `
      
      .driver-overlay {
        background:
          radial-gradient(
            circle at center,
            rgba(15,23,42,.15),
            rgba(2,6,23,.45)
          ) !important;

        backdrop-filter: blur(1px);

        animation: overlayFade .35s ease;
      }

      .driver-stage {
        position: relative;

        background: transparent !important;

        box-shadow:
          0 0 0 1px rgba(96,165,250,.55),
          0 0 25px rgba(59,130,246,.45),
          0 0 80px rgba(59,130,246,.28),
          0 0 120px rgba(96,165,250,.18);

        transition:
          all .35s cubic-bezier(.22,1,.36,1);

        animation:
          tutorialFocus 1.8s ease-in-out infinite;
      }

      .driver-active-element {
        position: relative;
        z-index: 100000 !important;

        transform: scale(1.015);

        transition:
          transform .28s ease,
          filter .28s ease;

        filter:
          brightness(1.08)
          saturate(1.08);
      }

      .loza-tutorial-popover {
        background: linear-gradient(
          180deg,
          rgba(15,23,42,.98),
          rgba(2,6,23,.98)
        ) !important;

        color: #e2e8f0 !important;

        border: 1px solid rgba(255,255,255,.08);

        border-radius: 20px !important;

        box-shadow:
          0 10px 40px rgba(0,0,0,.55),
          0 0 20px rgba(59,130,246,.18);

        overflow: hidden;

        animation:
          tutorialPop .35s cubic-bezier(.22,1,.36,1);
      }

      .loza-tutorial-popover .driver-popover-title {
        font-size: 18px;
        font-weight: 700;
        color: #60a5fa;
        margin-bottom: 8px;
      }

      .loza-tutorial-popover .driver-popover-description {
        font-size: 14px;
        line-height: 1.7;
        color: #cbd5e1;
      }

      .loza-tutorial-popover .driver-popover-progress-text {
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
      }

      .loza-tutorial-popover .driver-popover-footer {
        margin-top: 18px;
        border-top: 1px solid rgba(255,255,255,.05);
        padding-top: 14px;
      }

      .loza-tutorial-popover button {
        border-radius: 12px !important;
        border: none !important;
        transition: all .22s ease;
        font-weight: 600 !important;
        padding: 10px 16px !important;
      }

      .loza-tutorial-popover .driver-popover-prev-btn {
        background: rgba(255,255,255,.05) !important;
        color: #cbd5e1 !important;
      }

      .loza-tutorial-popover .driver-popover-prev-btn:hover {
        background: rgba(255,255,255,.1) !important;
        transform: translateY(-1px);
      }

      .loza-tutorial-popover .driver-popover-next-btn,
      .loza-tutorial-popover .driver-popover-done-btn {
        background: linear-gradient(
          135deg,
          #2563eb,
          #3b82f6
        ) !important;

        color: white !important;

        box-shadow:
          0 6px 20px rgba(59,130,246,.35);
      }

      .loza-tutorial-popover .driver-popover-next-btn:hover,
      .loza-tutorial-popover .driver-popover-done-btn:hover {
        transform: translateY(-2px) scale(1.02);

        box-shadow:
          0 10px 30px rgba(59,130,246,.45);
      }

      .loza-tutorial-popover .driver-popover-close-btn {
        color: #94a3b8 !important;
        transition: all .2s ease;
      }

      .loza-tutorial-popover .driver-popover-close-btn:hover {
        color: white !important;
        transform: rotate(90deg) scale(1.1);
      }

      @keyframes tutorialFocus {
        0% {
          box-shadow:
            0 0 0 1px rgba(96,165,250,.45),
            0 0 25px rgba(59,130,246,.35),
            0 0 80px rgba(59,130,246,.18);
        }

        50% {
          box-shadow:
            0 0 0 1px rgba(147,197,253,.9),
            0 0 35px rgba(59,130,246,.6),
            0 0 100px rgba(59,130,246,.35);
        }

        100% {
          box-shadow:
            0 0 0 1px rgba(96,165,250,.45),
            0 0 25px rgba(59,130,246,.35),
            0 0 80px rgba(59,130,246,.18);
        }
      }

      @keyframes tutorialPop {
        from {
          opacity: 0;
          transform:
            translateY(10px)
            scale(.94);
        }

        to {
          opacity: 1;
          transform:
            translateY(0)
            scale(1);
        }
      }

      @keyframes overlayFade {
        from {
          opacity: 0;
        }

        to {
          opacity: 1;
        }
      }

      `;

      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const hasSeen = localStorage.getItem('chatTutorialCompleted');

    if (!hasSeen) {
      const timer = setTimeout(() => {
        startTutorial();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [startTutorial]);

  return {
    startTutorial,
  };
}