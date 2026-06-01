// src/hook/useFriendsTutorial.ts
import { useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function useFriendsTutorial() {
  const startTutorial = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayOpacity: 0.2,
      stagePadding: 14,
      stageRadius: 20,
      popoverClass: "loza-tutorial-popover",
      nextBtnText: "Tiếp →",
      prevBtnText: "← Trước",
      doneBtnText: "Xong",
      onDestroyed: () => {
        localStorage.setItem("friendsTutorialCompleted", "true");
      },
    });

    const step = (selector: string, config: any) =>
      document.querySelector(selector) ? config : null;

    const steps = [
      step('[data-tour="sidenav"]', {
        element: '[data-tour="sidenav"]',
        popover: {
          title: "📍 Điều hướng",
          description:
            "Di chuyển giữa các khu vực trong app. Đây là trung tâm điều khiển.",
          side: "right",
          align: "start",
        },
      }),

      step('[data-tour="open-search-user"]', {
        element: '[data-tour="open-search-user"]',
        popover: {
          title: "🔍 Tìm người dùng",
          description:
            "Mở modal để tìm kiếm và gửi lời mời kết bạn tới người khác.",
          side: "left",
          align: "center",
        },
      }),

      step('[data-tour="friend-tabs"]', {
        element: '[data-tour="friend-tabs"]',
        popover: {
          title: "📂 Quản lý bạn bè",
          description:
            "3 tab chính: Bạn bè, Lời mời nhận, Lời mời gửi. Toàn bộ social graph nằm ở đây.",
          side: "right",
          align: "start",
        },
      }),

      step('[data-tour="tab-friends"]', {
        element: '[data-tour="tab-friends"]',
        popover: {
          title: "👥 Danh sách bạn bè",
          description:
            "Hiển thị toàn bộ bạn bè đã kết nối. Badge là số lượng hiện tại.",
          side: "right",
          align: "center",
        },
      }),

      step('[data-tour="tab-received"]', {
        element: '[data-tour="tab-received"]',
        popover: {
          title: "📩 Lời mời nhận",
          description:
            "Những người gửi lời mời cho bạn. Có thể chấp nhận hoặc từ chối ngay.",
          side: "right",
          align: "center",
        },
      }),

      step('[data-tour="tab-sent"]', {
        element: '[data-tour="tab-sent"]',
        popover: {
          title: "📤 Lời mời đã gửi",
          description:
            "Theo dõi trạng thái lời mời bạn đã gửi đi.",
          side: "right",
          align: "center",
        },
      }),

      step('[data-tour="friend-search-input"]', {
        element: '[data-tour="friend-search-input"]',
        popover: {
          title: "🔎 Tìm trong danh sách",
          description:
            "Lọc nhanh bạn bè theo tên. Dùng khi danh sách dài.",
          side: "bottom",
          align: "center",
        },
      }),

      step('[data-tour="friend-card"]', {
        element: '[data-tour="friend-card"]',
        popover: {
          title: "👤 Friend Card",
          description:
            "Hiển thị avatar, trạng thái online và thông tin cơ bản.",
          side: "top",
          align: "center",
        },
      }),
      step('[data-tour="accept-friend-request"]', {
  element: '[data-tour="accept-friend-request"]',
  popover: {
    title: "✅ Chấp nhận lời mời",
    description:
      "Đồng ý kết bạn với người dùng này để bắt đầu nhắn tin và tương tác với nhau.",
    side: "left",
    align: "center",
  },
}),

step('[data-tour="decline-friend-request"]', {
  element: '[data-tour="decline-friend-request"]',
  popover: {
    title: "❌ Từ chối lời mời",
    description:
      "Bỏ qua lời mời kết bạn hiện tại nếu bạn không muốn kết nối.",
    side: "left",
    align: "center",
  },
}),

step('[data-tour="cancel-sent-friend-request"]', {
  element: '[data-tour="cancel-sent-friend-request"]',
  popover: {
    title: "↩️ Huỷ lời mời đã gửi",
    description:
      "Thu hồi lời mời kết bạn trước khi người kia chấp nhận.",
    side: "left",
    align: "center",
  },
}),
    
    ].filter(Boolean);

    driverObj.setSteps(steps);
    driverObj.drive();

    // style giữ nguyên (không đụng CSS của m)
    const styleId = "loza-driver-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
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
          transition: all .35s cubic-bezier(.22,1,.36,1);
          animation: tutorialFocus 1.8s ease-in-out infinite;
        }

        .driver-active-element {
          position: relative;
          z-index: 100000 !important;
          transform: scale(1.015);
          transition: transform .28s ease, filter .28s ease;
          filter: brightness(1.08) saturate(1.08);
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
          animation: tutorialPop .35s cubic-bezier(.22,1,.36,1);
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
          background: linear-gradient(135deg, #2563eb, #3b82f6) !important;
          color: white !important;
          box-shadow: 0 6px 20px rgba(59,130,246,.35);
        }

        .loza-tutorial-popover .driver-popover-next-btn:hover,
        .loza-tutorial-popover .driver-popover-done-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 10px 30px rgba(59,130,246,.45);
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
          from { opacity: 0; transform: translateY(10px) scale(.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes overlayFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return { startTutorial };
}