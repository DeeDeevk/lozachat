import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting)
            setVisible((v) => ({ ...v, [e.target.id]: true }));
        });
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll("[data-animate]").forEach((el) => {
      observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const features = [
    {
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: "Nhắn tin tức thì",
      desc: "Gửi và nhận tin nhắn trong tích tắc. Không delay, không lag — kết nối mượt mà như đang gặp trực tiếp.",
      color: "#3b82f6",
      glow: "rgba(59,130,246,0.2)",
    },
    {
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      title: "Mã hóa đầu cuối",
      desc: "Mọi tin nhắn đều được mã hóa 256-bit. Chỉ bạn và người nhận mới có thể đọc — tuyệt đối riêng tư.",
      color: "#10b981",
      glow: "rgba(16,185,129,0.2)",
    },
    {
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: "Nhóm & Cộng đồng",
      desc: "Tạo nhóm chat không giới hạn thành viên. Chia sẻ file, hình ảnh, và cộng tác dễ dàng.",
      color: "#8b5cf6",
      glow: "rgba(139,92,246,0.2)",
    },
    {
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
      title: "Đa nền tảng",
      desc: "Dùng trên web, mobile, desktop — đồng bộ hoàn hảo. Cuộc trò chuyện của bạn ở khắp mọi nơi.",
      color: "#f59e0b",
      glow: "rgba(245,158,11,0.2)",
    },
    {
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      title: "Siêu nhanh",
      desc: "Kiến trúc real-time WebSocket đảm bảo mọi tin nhắn đến ngay lập tức, dù bạn ở đâu trên thế giới.",
      color: "#ef4444",
      glow: "rgba(239,68,68,0.2)",
    },
    {
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
          <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" />
          <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" />
          <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" />
          <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
          <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z" />
          <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z" />
        </svg>
      ),
      title: "Tích hợp linh hoạt",
      desc: "API mở, webhook, bot tùy chỉnh. Tích hợp Loza vào workflow của bạn trong vài phút.",
      color: "#06b6d4",
      glow: "rgba(6,182,212,0.2)",
    },
  ];

  const stats = [
    { value: "10M+", label: "Người dùng" },
    { value: "99.9%", label: "Uptime" },
    { value: "256-bit", label: "Mã hóa" },
    { value: "<50ms", label: "Độ trễ" },
  ];

  const testimonials = [
    {
      name: "Nguyễn Minh Tuấn",
      role: "Product Manager tại TechVN",
      text: "Loza thay đổi hoàn toàn cách team tôi làm việc. Nhanh, bảo mật và giao diện đẹp hơn bất kỳ app nào tôi từng dùng.",
      avatar: "MT",
      color: "#3b82f6",
    },
    {
      name: "Trần Thị Hương",
      role: "Freelancer Designer",
      text: "Tôi dùng Loza để trao đổi với khách hàng mỗi ngày. Tính năng nhóm cực kỳ tiện, file chia sẻ siêu nhanh!",
      avatar: "TH",
      color: "#10b981",
    },
    {
      name: "Lê Quốc Bảo",
      role: "Founder startup EdTech",
      text: "Bảo mật đầu cuối là điều team chúng tôi cần nhất. Loza đáp ứng hoàn toàn và còn nhiều hơn thế.",
      avatar: "LB",
      color: "#8b5cf6",
    },
  ];

  const isVisible = (id: string) => !!visible[id];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #060d1f 0%, #0a1628 30%, #060d1f 100%)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "white",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp    { from{opacity:0;transform:translateY(32px);} to{opacity:1;transform:translateY(0);} }
        @keyframes fadeLeft  { from{opacity:0;transform:translateX(-32px);} to{opacity:1;transform:translateX(0);} }
        @keyframes fadeRight { from{opacity:0;transform:translateX(32px);} to{opacity:1;transform:translateX(0);} }
        @keyframes floatY    { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-12px);} }
        @keyframes pulse     { 0%,100%{opacity:.15;transform:scale(1);} 50%{opacity:.3;transform:scale(1.15);} }
        @keyframes spin      { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes shimmer   { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:.4;} 30%{transform:translateY(-4px);opacity:1;} }
        @keyframes blink     { 0%,100%{opacity:1;} 50%{opacity:0;} }
        @keyframes glow      { 0%,100%{box-shadow:0 0 20px rgba(59,130,246,.3);} 50%{box-shadow:0 0 40px rgba(59,130,246,.6);} }

        .reveal       { opacity:0; }
        .reveal.show  { animation: fadeUp   .6s cubic-bezier(.22,1,.36,1) both; }
        .reveal-l.show{ animation: fadeLeft .6s cubic-bezier(.22,1,.36,1) both; }
        .reveal-r.show{ animation: fadeRight.6s cubic-bezier(.22,1,.36,1) both; }

        .float { animation: floatY 4s ease-in-out infinite; }
        .dot   { animation: pulse  3s ease-in-out infinite; }

        .shimmer-text {
          background: linear-gradient(90deg, #60a5fa, #ffffff, #a78bfa, #60a5fa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white; border: none; cursor: pointer;
          border-radius: 14px; font-weight: 700; font-size: 15px;
          padding: 14px 32px;
          display: inline-flex; align-items: center; gap: 8px;
          box-shadow: 0 4px 24px rgba(37,99,235,.45);
          transition: all 0.25s; position: relative; overflow: hidden;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(37,99,235,.6); }
        .btn-primary:active { transform: translateY(0); }

        .btn-ghost {
          background: rgba(255,255,255,.06);
          color: white; border: 1px solid rgba(255,255,255,.12); cursor: pointer;
          border-radius: 14px; font-weight: 600; font-size: 15px;
          padding: 14px 32px;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.25s; backdrop-filter: blur(8px);
        }
        .btn-ghost:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.25); transform: translateY(-2px); }

        .feature-card {
          background: rgba(15,23,42,.8);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 20px; padding: 28px;
          transition: all 0.3s; cursor: default;
          backdrop-filter: blur(12px);
        }
        .feature-card:hover { transform: translateY(-6px); border-color: rgba(59,130,246,.25); }

        .stat-card {
          text-align: center; padding: 24px 20px;
          background: rgba(15,23,42,.6);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 18px; backdrop-filter: blur(8px);
          transition: transform 0.3s;
        }
        .stat-card:hover { transform: scale(1.04); }

        .testi-card {
          background: rgba(15,23,42,.8);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 20px; padding: 28px;
          backdrop-filter: blur(12px);
          transition: all 0.3s;
        }
        .testi-card:hover { border-color: rgba(59,130,246,.2); transform: translateY(-4px); }

        .nav-link {
          color: rgba(255,255,255,.65); font-size: 14px; font-weight: 500;
          text-decoration: none; cursor: pointer; transition: color 0.2s;
          background: none; border: none;
        }
        .nav-link:hover { color: white; }

        .chat-bubble-in {
          background: rgba(28,38,74,.95);
          border: 1px solid rgba(59,130,246,.25);
          border-radius: 16px 16px 16px 4px;
          padding: 10px 14px; max-width: 220px;
          font-size: 13px; color: #e2e8f0; line-height: 1.5;
        }
        .chat-bubble-out {
          background: rgba(37,99,235,.85);
          border-radius: 16px 16px 4px 16px;
          padding: 10px 14px; max-width: 220px;
          font-size: 13px; color: white; line-height: 1.5;
          align-self: flex-end;
        }

        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 2.4rem !important; }
          .hide-mobile { display: none !important; }
          .nav-actions { gap: 8px !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 5%",
          height: 64,
          background: scrollY > 40 ? "rgba(6,13,31,.92)" : "transparent",
          backdropFilter: scrollY > 40 ? "blur(20px)" : "none",
          borderBottom:
            scrollY > 40 ? "1px solid rgba(255,255,255,.06)" : "none",
          transition: "all 0.3s",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 18px rgba(37,99,235,.45)",
              overflow: "hidden",
            }}
          >
            <img
              src="/logo.png"
              alt="Loza Logo"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <span
            style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.3px" }}
          >
            Loza
          </span>
        </div>

        {/* Nav links */}
        {/* <div
          className="hide-mobile"
          style={{ display: "flex", alignItems: "center", gap: 32 }}
        >
          {["Tính năng", "Bảo mật", "Cộng đồng"].map((l) => (
            <button key={l} className="nav-link">
              {l}
            </button>
          ))}
        </div> */}

        {/* CTA */}
        <div
          className="nav-actions"
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          <button className="nav-link" onClick={() => navigate("/signin")}>
            Đăng nhập
          </button>
          <button
            className="btn-primary"
            style={{ padding: "9px 20px", fontSize: 13, borderRadius: 10 }}
            onClick={() => navigate("/signup")}
          >
            Bắt đầu miễn phí
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          paddingTop: 140,
          paddingBottom: 100,
          padding: "140px 5% 100px",
          position: "relative",
        }}
      >
        {/* Background blobs */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at 20% 40%, rgba(37,99,235,.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,.12) 0%, transparent 50%)",
          }}
        />
        {/* Dots */}
        {[
          { s: 5, c: "#3b82f6", t: "15%", l: "3%" },
          { s: 3, c: "#818cf8", t: "30%", l: "12%" },
          { s: 6, c: "#2563eb", t: "70%", l: "2%" },
          { s: 4, c: "#60a5fa", t: "85%", l: "8%" },
          { s: 5, c: "#6366f1", t: "12%", r: "4%" },
          { s: 3, c: "#3b82f6", t: "55%", r: "2%" },
          { s: 6, c: "#1d4ed8", t: "80%", r: "6%" },
        ].map((p, i) => (
          <div
            key={i}
            className="dot"
            style={{
              position: "absolute",
              borderRadius: "50%",
              width: p.s,
              height: p.s,
              background: p.c,
              top: p.t,
              left: p.l,
              right: p.r,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}

        <div
          className="hero-grid"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 60,
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {/* Left: copy */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(37,99,235,.15)",
                border: "1px solid rgba(59,130,246,.3)",
                borderRadius: 100,
                padding: "6px 14px",
                marginBottom: 28,
                fontSize: 12,
                color: "#93c5fd",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981",
                  animation: "pulse 2s infinite",
                }}
              />
              10 triệu+ người dùng tin tưởng
            </div>

            <h1
              className="hero-title"
              style={{
                fontFamily: "'Syne', 'Segoe UI', sans-serif",
                fontSize: "3.6rem",
                fontWeight: 800,
                lineHeight: 1.08,
                marginBottom: 24,
                letterSpacing: "-1px",
              }}
            >
              Kết nối thế giới
              <br />
              <span className="shimmer-text">không giới hạn</span>
            </h1>

            <p
              style={{
                color: "#94a3b8",
                fontSize: 17,
                lineHeight: 1.7,
                marginBottom: 40,
                maxWidth: 480,
              }}
            >
              Loza là nền tảng nhắn tin thế hệ mới — nhanh, bảo mật, và đẹp đến
              từng pixel. Kết nối với bạn bè, đồng nghiệp và cộng đồng của bạn
              ngay hôm nay.
            </p>

            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                marginBottom: 48,
              }}
            >
              <button
                className="btn-primary"
                onClick={() => navigate("/signup")}
              >
                Dùng thử miễn phí
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button className="btn-ghost" onClick={() => navigate("/signin")}>
                Đăng nhập
              </button>
            </div>

            {/* Social proof */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex" }}>
                {["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"].map(
                  (c, i) => (
                    <div
                      key={i}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: c,
                        border: "2px solid #060d1f",
                        marginLeft: i === 0 ? 0 : -10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "white",
                      }}
                    >
                      {["MT", "TH", "LB", "PQ", "NA"][i]}
                    </div>
                  ),
                )}
              </div>
              <div>
                <div style={{ display: "flex", gap: 2 }}>
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="#f59e0b"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                  4.9/5 từ 50,000+ đánh giá
                </p>
              </div>
            </div>
          </div>

          {/* Right: Chat mockup */}
          <div
            className="hide-mobile float"
            style={{ flexShrink: 0, width: 380, position: "relative" }}
          >
            {/* Glow behind */}
            <div
              style={{
                position: "absolute",
                inset: -40,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(37,99,235,.25) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Chat window */}
            <div
              style={{
                background: "rgba(10,16,32,.95)",
                border: "1px solid rgba(59,130,246,.2)",
                borderRadius: 24,
                overflow: "hidden",
                boxShadow:
                  "0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(59,130,246,.08)",
                position: "relative",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 18px",
                  borderBottom: "1px solid rgba(255,255,255,.06)",
                  background: "rgba(15,23,42,.9)",
                }}
              >
                <div style={{ display: "flex", gap: 6 }}>
                  {["#ef4444", "#f59e0b", "#10b981"].map((c) => (
                    <div
                      key={c}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: c,
                      }}
                    />
                  ))}
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <span
                    style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}
                  >
                    Loza Chat
                  </span>
                </div>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 8px #10b981",
                  }}
                />
              </div>

              {/* Messages */}
              <div
                style={{
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  minHeight: 300,
                }}
              >
                {/* Incoming */}
                <div
                  style={{ display: "flex", alignItems: "flex-end", gap: 8 }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: "linear-gradient(135deg,#3b82f6,#2563eb)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    MT
                  </div>
                  <div>
                    <div className="chat-bubble-in">
                      Ơi, bạn đã thử Loza chưa? Nhắn tin nhanh vl 🔥
                    </div>
                    <div
                      style={{
                        color: "#475569",
                        fontSize: 10,
                        marginTop: 4,
                        marginLeft: 4,
                      }}
                    >
                      10:24 SA
                    </div>
                  </div>
                </div>

                {/* Outgoing */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                  }}
                >
                  <div className="chat-bubble-out">
                    Vừa đăng ký xong! Giao diện đẹp quá 😍
                  </div>
                  <div
                    style={{
                      color: "#475569",
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    10:25 SA
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                    >
                      <path d="M20 6L9 17l-5-5" />
                      <path d="M27 6L16 17" opacity=".5" />
                    </svg>
                  </div>
                </div>

                {/* Incoming 2 */}
                <div
                  style={{ display: "flex", alignItems: "flex-end", gap: 8 }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: "linear-gradient(135deg,#10b981,#059669)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    TH
                  </div>
                  <div>
                    <div className="chat-bubble-in">
                      Mã hóa đầu cuối nữa, an toàn hơn Zalo nhiều 🔒
                    </div>
                    <div
                      style={{
                        color: "#475569",
                        fontSize: 10,
                        marginTop: 4,
                        marginLeft: 4,
                      }}
                    >
                      10:26 SA
                    </div>
                  </div>
                </div>

                {/* Outgoing 2 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                  }}
                >
                  <div className="chat-bubble-out">
                    Đúng! Recommend cho cả team luôn 👍
                  </div>
                  <div
                    style={{
                      color: "#475569",
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    10:26 SA
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                </div>

                {/* Typing */}
                <div
                  style={{ display: "flex", alignItems: "flex-end", gap: 8 }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: "linear-gradient(135deg,#3b82f6,#2563eb)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    MT
                  </div>
                  <div
                    className="chat-bubble-in"
                    style={{
                      display: "flex",
                      gap: 4,
                      alignItems: "center",
                      padding: "12px 16px",
                    }}
                  >
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#60a5fa",
                          animation: `typingDot .8s ${d}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Input bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderTop: "1px solid rgba(255,255,255,.06)",
                  background: "rgba(15,23,42,.9)",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: "rgba(30,41,59,.8)",
                    border: "1px solid rgba(71,85,105,.4)",
                    borderRadius: 12,
                    padding: "8px 14px",
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  Nhập tin nhắn...
                </div>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "linear-gradient(135deg,#2563eb,#3b82f6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Floating notification badge */}
            <div
              style={{
                position: "absolute",
                top: -16,
                right: -16,
                background: "linear-gradient(135deg,#ef4444,#f87171)",
                borderRadius: 14,
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 8px 24px rgba(239,68,68,.4)",
                fontSize: 12,
                fontWeight: 700,
                color: "white",
                animation: "glow 2s ease-in-out infinite",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
              3 tin mới
            </div>

            {/* Shield badge */}
            <div
              style={{
                position: "absolute",
                bottom: -12,
                left: -12,
                background: "rgba(10,16,32,.95)",
                border: "1px solid rgba(16,185,129,.3)",
                borderRadius: 14,
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 8px 24px rgba(0,0,0,.4)",
                fontSize: 12,
                fontWeight: 600,
                color: "#6ee7b7",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Mã hóa 256-bit
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        id="stats"
        data-animate
        style={{ padding: "60px 5%", position: "relative" }}
        ref={(el) => {
          if (el) observerRef.current?.observe(el);
        }}
      >
        <div id="stats" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className={`reveal ${isVisible("stats") ? "show" : ""}`}>
            <div
              className="stats-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 16,
              }}
            >
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className="stat-card"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: 800,
                      color: "#60a5fa",
                      letterSpacing: "-1px",
                      marginBottom: 6,
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "80px 5% 100px", position: "relative" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div
              style={{
                display: "inline-block",
                background: "rgba(99,102,241,.15)",
                border: "1px solid rgba(99,102,241,.3)",
                borderRadius: 100,
                padding: "5px 16px",
                marginBottom: 16,
                fontSize: 12,
                color: "#a78bfa",
                fontWeight: 600,
              }}
            >
              Tính năng nổi bật
            </div>
            <h2
              style={{
                fontFamily: "'Syne','Segoe UI',sans-serif",
                fontSize: "2.2rem",
                fontWeight: 800,
                marginBottom: 14,
                letterSpacing: "-0.5px",
              }}
            >
              Mọi thứ bạn cần để kết nối
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: 15,
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              Được thiết kế để đơn giản, nhưng đủ mạnh mẽ cho mọi nhu cầu — cá
              nhân hay doanh nghiệp.
            </p>
          </div>

          <div
            id="features"
            data-animate
            ref={(el) => {
              if (el) observerRef.current?.observe(el);
            }}
          >
            <div
              className={`features-grid reveal ${isVisible("features") ? "show" : ""}`}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 20,
              }}
            >
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="feature-card"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      marginBottom: 18,
                      background: `rgba(${f.color === "#3b82f6" ? "59,130,246" : f.color === "#10b981" ? "16,185,129" : f.color === "#8b5cf6" ? "139,92,246" : f.color === "#f59e0b" ? "245,158,11" : f.color === "#ef4444" ? "239,68,68" : "6,182,212"},.15)`,
                      border: `1px solid ${f.color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: f.color,
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      marginBottom: 10,
                      color: "#e2e8f0",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}
                  >
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        style={{
          padding: "80px 5% 100px",
          background: "rgba(15,23,42,.5)",
          borderTop: "1px solid rgba(255,255,255,.04)",
          borderBottom: "1px solid rgba(255,255,255,.04)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div
              style={{
                display: "inline-block",
                background: "rgba(16,185,129,.12)",
                border: "1px solid rgba(16,185,129,.25)",
                borderRadius: 100,
                padding: "5px 16px",
                marginBottom: 16,
                fontSize: 12,
                color: "#6ee7b7",
                fontWeight: 600,
              }}
            >
              Cộng đồng Loza
            </div>
            <h2
              style={{
                fontFamily: "'Syne','Segoe UI',sans-serif",
                fontSize: "2.2rem",
                fontWeight: 800,
                marginBottom: 14,
                letterSpacing: "-0.5px",
              }}
            >
              Người dùng nói gì về Loza?
            </h2>
          </div>

          <div
            id="testi"
            data-animate
            ref={(el) => {
              if (el) observerRef.current?.observe(el);
            }}
          >
            <div
              className={`testi-grid reveal ${isVisible("testi") ? "show" : ""}`}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 20,
              }}
            >
              {testimonials.map((t, i) => (
                <div
                  key={t.name}
                  className="testi-card"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="#f59e0b"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p
                    style={{
                      color: "#cbd5e1",
                      fontSize: 14,
                      lineHeight: 1.65,
                      marginBottom: 20,
                    }}
                  >
                    "{t.text}"
                  </p>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: t.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {t.name}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        {t.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section
        style={{
          padding: "100px 5%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(37,99,235,.15) 0%, transparent 65%)",
          }}
        />
        <div
          id="cta"
          data-animate
          ref={(el) => {
            if (el) observerRef.current?.observe(el);
          }}
        >
          <div
            className={`reveal ${isVisible("cta") ? "show" : ""}`}
            style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}
          >
            <h2
              style={{
                fontFamily: "'Syne','Segoe UI',sans-serif",
                fontSize: "2.8rem",
                fontWeight: 800,
                marginBottom: 20,
                letterSpacing: "-1px",
                lineHeight: 1.1,
              }}
            >
              Sẵn sàng kết nối
              <br />
              <span className="shimmer-text">với thế giới?</span>
            </h2>
            <p
              style={{
                color: "#94a3b8",
                fontSize: 16,
                lineHeight: 1.7,
                marginBottom: 40,
              }}
            >
              Tham gia cùng hơn 10 triệu người đang dùng Loza mỗi ngày. Miễn phí
              hoàn toàn, không cần thẻ tín dụng.
            </p>
            <div
              style={{
                display: "flex",
                gap: 14,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn-primary"
                style={{ padding: "15px 36px", fontSize: 16, borderRadius: 16 }}
                onClick={() => navigate("/signup")}
              >
                Tạo tài khoản miễn phí
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                className="btn-ghost"
                style={{ padding: "15px 36px", fontSize: 16, borderRadius: 16 }}
                onClick={() => navigate("/signin")}
              >
                Đăng nhập ngay
              </button>
            </div>
            <p style={{ color: "#475569", fontSize: 12, marginTop: 20 }}>
              Không cần thẻ • Miễn phí mãi mãi • Hủy bất cứ lúc nào
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          padding: "40px 5%",
          borderTop: "1px solid rgba(255,255,255,.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <img
              src="/logo.png"
              alt="Loza Logo"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Loza</span>
          <span style={{ color: "#475569", fontSize: 13, marginLeft: 8 }}>
            © 2025 Loza. All rights reserved.
          </span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {["Điều khoản", "Bảo mật", "Liên hệ"].map((l) => (
            <button key={l} className="nav-link" style={{ fontSize: 13 }}>
              {l}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
