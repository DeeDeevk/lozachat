import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

interface LoginData {
  username: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuthStore();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<LoginData>({
    username: "",
    password: "",
  });
  const [focused, setFocused] = useState<string>("");
  const [hoverEye, setHoverEye] = useState(false);
  const [errors, setErrors] = useState({
    username: "",
    password: "",
  });

  //validate
  const validate = () => {
    const newErrors = {
      username: "",
      password: "",
    };

    if (!formData.username.trim()) {
      newErrors.username = "Vui lòng nhập tên đăng nhập";
    } else if (formData.username.length < 3) {
      newErrors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);

    return !newErrors.username && !newErrors.password;
  };

  //nay khi lam voi useAuthStore
  const handleSubmit = async () => {
    if (!validate()) return;

    const success = await signIn(formData);
    if (success) {
      navigate("/chat");
    }
  };
  // const handleSubmit = async () => {
  //   if (!validate()) return;

  //   const loading = toast.loading("Đang đăng nhập...");

  //   try {
  //     const response = await fetch("http://localhost:8888/api/auth/signin", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(formData),
  //     });

  //     const data = await response.json();
  //     if (!response.ok) {
  //       throw new Error(data.message || "Đăng nhập thất bại");
  //     }

  //     // lưu token (nếu backend trả token)
  //     if (data.accessToken) {
  //       console.log(data.accessToken);
  //       localStorage.setItem("token", data.accessToken);
  //     }

  //     // lưu user
  //     if (data.user) {
  //       localStorage.setItem("user", JSON.stringify(data.user));
  //     }

  //     toast.success("Đăng nhập thành công!", { id: loading });

  //     setTimeout(() => {
  //       navigate("/chat"); // chuyển sang trang chat
  //     }, 1000);
  //   } catch (error: any) {
  //     console.error(error);
  //     toast.error(error.message, { id: loading });
  //   }
  // };

  //get date from input and add to formData
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputBase = (fieldName: string): React.CSSProperties => ({
    background: "rgba(30, 41, 59, 0.8)",
    border:
      focused === fieldName
        ? "1px solid #3b82f6"
        : "1px solid rgba(71,85,105,0.5)",
    boxShadow:
      focused === fieldName ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
    color: "white",
    width: "100%",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box" as const,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        background:
          "linear-gradient(135deg, #060d1f 0%, #0a1628 40%, #071020 100%)",
        position: "relative",
        overflow: "hidden",
        padding: "20px 16px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes floatY        { 0%,100%{transform:translateY(0);}    50%{transform:translateY(-9px);} }
        @keyframes glow          { 0%,100%{opacity:.15;transform:scale(1);} 50%{opacity:.35;transform:scale(1.3);} }
        @keyframes fadeSlideUp   { from{opacity:0;transform:translateY(24px);}  to{opacity:1;transform:translateY(0);}  }
        @keyframes fadeSlideLeft { from{opacity:0;transform:translateX(-32px);} to{opacity:1;transform:translateX(0);} }
        @keyframes fadeSlideRight{ from{opacity:0;transform:translateX(32px);}  to{opacity:1;transform:translateX(0);} }
        @keyframes fadeIn        { from{opacity:0;} to{opacity:1;} }

        .l-anim-bg      { animation: fadeIn            .6s  ease                      both; }
        .l-anim-form    { animation: fadeSlideLeft      .55s cubic-bezier(.22,1,.36,1) both; }
        .l-anim-illus   { animation: fadeSlideRight     .55s cubic-bezier(.22,1,.36,1) both; }
        .l-anim-logo    { animation: fadeSlideUp        .5s  cubic-bezier(.22,1,.36,1) both; }
        .l-anim-heading { animation: fadeSlideUp        .5s  cubic-bezier(.22,1,.36,1) .05s both; }
        .l-anim-fields  { animation: fadeSlideUp        .5s  cubic-bezier(.22,1,.36,1) .1s  both; }
        .l-illus        { animation: floatY 4s ease-in-out infinite; }
        .l-dot          { animation: glow  3s ease-in-out infinite; }

        /* ── Responsive ── */
        .l-illus-panel { display: flex; }
        .l-card        { flex-direction: row; }
        @media (max-width: 680px) {
          .l-illus-panel { display: none !important; }
          .l-card        { flex-direction: column; }
          .l-form-panel  { border-right: none !important; padding: 32px 24px !important; }
        }

        input::placeholder { color: rgba(148,163,184,0.55); }
      `}</style>

      {/* Blobs */}
      <div
        className="l-anim-bg"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 15% 50%,rgba(37,99,235,.16) 0%,transparent 55%),radial-gradient(ellipse at 85% 20%,rgba(99,102,241,.1) 0%,transparent 50%),radial-gradient(ellipse at 70% 80%,rgba(29,78,216,.12) 0%,transparent 50%)",
        }}
      />

      {/* Floating dots */}
      {[
        { s: 5, c: "#3b82f6", t: "10%", l: "7%" },
        { s: 3, c: "#818cf8", t: "28%", l: "20%" },
        { s: 6, c: "#2563eb", t: "62%", l: "4%" },
        { s: 4, c: "#60a5fa", t: "82%", l: "16%" },
        { s: 5, c: "#6366f1", t: "14%", r: "9%" },
        { s: 3, c: "#3b82f6", t: "48%", r: "5%" },
        { s: 6, c: "#1d4ed8", t: "77%", r: "13%" },
      ].map((p, i) => (
        <div
          key={i}
          className="l-dot l-anim-bg"
          style={{
            position: "absolute",
            borderRadius: "50%",
            width: p.s,
            height: p.s,
            background: p.c,
            top: p.t,
            left: p.l,
            right: p.r,
            animationDelay: `${i * 0.35}s`,
          }}
        />
      ))}

      {/* ── CARD ── */}
      <div
        className="l-card"
        style={{
          display: "flex",
          width: "min(820px, 100%)",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow:
            "0 28px 80px rgba(0,0,0,.7),0 0 0 1px rgba(59,130,246,.12)",
          background: "rgba(10,16,32,.93)",
          backdropFilter: "blur(24px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* ── FORM PANEL ── */}
        <div
          className="l-anim-form l-form-panel"
          style={{
            flex: 1,
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRight: "1px solid rgba(59,130,246,.1)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse at 50% 0%,rgba(37,99,235,.07) 0%,transparent 60%)",
            }}
          />

          {/* Logo — centered */}
          <div
            className="l-anim-logo"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
              position: "relative",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
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
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 18,
                  lineHeight: 1.2,
                }}
              >
                Loza
              </div>
              <div style={{ color: "#60a5fa", fontSize: 11 }}>
                Connect with the future
              </div>
            </div>
          </div>

          {/* Heading */}
          <div
            className="l-anim-heading"
            style={{
              textAlign: "center",
              marginBottom: 26,
              position: "relative",
              width: "100%",
            }}
          >
            <h1
              style={{
                color: "white",
                fontWeight: 800,
                fontSize: "1.75rem",
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              Chào mừng quay lại
            </h1>
            <p
              style={{
                color: "#94a3b8",
                fontSize: 13,
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              Đăng nhập vào tài khoản Loza của bạn
            </p>
          </div>

          {/* Fields */}
          <div
            className="l-anim-fields"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              position: "relative",
              width: "100%",
              maxWidth: 360,
            }}
          >
            {/* Username */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "#cbd5e1",
                  fontSize: 11,
                  fontWeight: 500,
                  marginBottom: 5,
                }}
              >
                Tên đăng nhập
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                >
                  <User size={14} color="#64748b" />
                </span>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onFocus={() => setFocused("username")}
                  onBlur={() => setFocused("")}
                  placeholder="abc"
                  style={{ ...inputBase("username"), paddingLeft: 34 }}
                />
              </div>
              {errors.username && (
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    color: "#ef4444",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  <AlertCircle size={12} />
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 5,
                }}
              >
                <label
                  style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 500 }}
                >
                  Mật khẩu
                </label>
                <a
                  href="#"
                  style={{
                    color: "#60a5fa",
                    fontSize: 11,
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#93c5fd")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#60a5fa")
                  }
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                >
                  <Lock size={14} color="#64748b" />
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  placeholder="••••••••"
                  style={{
                    ...inputBase("password"),
                    paddingLeft: 34,
                    paddingRight: 38,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  onMouseEnter={() => setHoverEye(true)}
                  onMouseLeave={() => setHoverEye(false)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color:
                      focused === "password" || hoverEye
                        ? "#3b82f6"
                        : "#94a3b8",
                    transition: "color 0.2s",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    color: "#ef4444",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  <AlertCircle size={12} />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="button"
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 12,
                background: "linear-gradient(135deg,#2563eb 0%,#3b82f6 100%)",
                boxShadow: "0 4px 18px rgba(37,99,235,.4)",
                color: "white",
                fontWeight: 600,
                fontSize: 14,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 4,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                "Đang xử lý..."
              ) : (
                <>
                  {" "}
                  Đăng nhập
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>{" "}
                </>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(71,85,105,0.3)",
                }}
              />
              <span style={{ color: "#475569", fontSize: 11 }}>hoặc</span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(71,85,105,0.3)",
                }}
              />
            </div>

            {/* Google */}
            <button
              type="button"
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 12,
                background: "rgba(30,41,59,0.8)",
                border: "1px solid rgba(71,85,105,0.5)",
                color: "#cbd5e1",
                fontWeight: 500,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(71,85,105,0.5)";
                e.currentTarget.style.color = "#cbd5e1";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Đăng nhập với Google
            </button>

            {/* Link sang Register */}
            <p
              style={{
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 12,
                margin: 0,
              }}
            >
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#60a5fa",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#93c5fd")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#60a5fa")}
              >
                Đăng ký
              </button>
            </p>

            <p
              style={{
                textAlign: "center",
                color: "#475569",
                fontSize: 11,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Bằng cách tiếp tục, bạn đồng ý với{" "}
              <a
                href="#"
                style={{ color: "#64748b", textDecoration: "underline" }}
              >
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a
                href="#"
                style={{ color: "#64748b", textDecoration: "underline" }}
              >
                Chính sách bảo mật
              </a>
              .
            </p>
          </div>
        </div>

        {/* ── ILLUSTRATION PANEL ── */}
        <div
          className="l-anim-illus l-illus-panel"
          style={{
            width: 300,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "34px 24px",
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(160deg,rgba(37,99,235,.13) 0%,rgba(10,16,32,.6) 100%)",
          }}
        >
          {[360, 250].map((s) => (
            <div
              key={s}
              style={{
                position: "absolute",
                borderRadius: "50%",
                width: s,
                height: s,
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                border: "1px solid rgba(59,130,246,.06)",
                pointerEvents: "none",
              }}
            />
          ))}

          <div
            className="l-illus"
            style={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              maxWidth: 220,
            }}
          >
            <svg
              viewBox="0 0 220 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%" }}
            >
              <ellipse
                cx="110"
                cy="130"
                rx="80"
                ry="60"
                fill="rgba(37,99,235,.06)"
              />
              {/* Central card */}
              <rect
                x="55"
                y="55"
                width="110"
                height="90"
                rx="16"
                fill="rgba(28,38,74,.97)"
                stroke="rgba(59,130,246,.35)"
                strokeWidth="1.2"
              />
              <circle
                cx="110"
                cy="85"
                r="20"
                fill="rgba(37,99,235,.25)"
                stroke="rgba(59,130,246,.5)"
                strokeWidth="1.5"
              />
              <circle cx="110" cy="80" r="9" fill="rgba(99,179,237,.7)" />
              <path
                d="M93 100 Q110 94 127 100"
                stroke="rgba(99,179,237,.5)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <rect
                x="75"
                y="110"
                width="70"
                height="6"
                rx="3"
                fill="rgba(99,179,237,.55)"
              />
              <rect
                x="85"
                y="122"
                width="50"
                height="4"
                rx="2"
                fill="rgba(71,85,105,.45)"
              />
              <circle cx="124" cy="68" r="5" fill="#10b981" />
              <circle cx="124" cy="68" r="8" fill="rgba(16,185,129,.2)">
                <animate
                  attributeName="r"
                  values="8;12;8"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.4;0;0.4"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Nodes */}
              <circle
                cx="28"
                cy="52"
                r="14"
                fill="rgba(28,38,74,.9)"
                stroke="rgba(99,102,241,.4)"
                strokeWidth="1"
              />
              <circle cx="28" cy="49" r="5" fill="rgba(99,102,241,.7)" />
              <path
                d="M24 55 Q28 52 32 55"
                stroke="rgba(99,102,241,.4)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <line
                x1="42"
                y1="58"
                x2="58"
                y2="68"
                stroke="rgba(59,130,246,.2)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <circle
                cx="22"
                cy="160"
                r="14"
                fill="rgba(28,38,74,.9)"
                stroke="rgba(37,99,235,.4)"
                strokeWidth="1"
              />
              <circle cx="22" cy="157" r="5" fill="rgba(59,130,246,.7)" />
              <path
                d="M18 163 Q22 160 26 163"
                stroke="rgba(59,130,246,.4)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <line
                x1="36"
                y1="155"
                x2="57"
                y2="140"
                stroke="rgba(59,130,246,.2)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <circle
                cx="192"
                cy="52"
                r="14"
                fill="rgba(28,38,74,.9)"
                stroke="rgba(16,185,129,.4)"
                strokeWidth="1"
              />
              <circle cx="192" cy="49" r="5" fill="rgba(16,185,129,.7)" />
              <path
                d="M188 55 Q192 52 196 55"
                stroke="rgba(16,185,129,.4)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <line
                x1="178"
                y1="58"
                x2="162"
                y2="68"
                stroke="rgba(16,185,129,.2)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <circle
                cx="196"
                cy="160"
                r="14"
                fill="rgba(28,38,74,.9)"
                stroke="rgba(245,158,11,.4)"
                strokeWidth="1"
              />
              <circle cx="196" cy="157" r="5" fill="rgba(245,158,11,.7)" />
              <path
                d="M192 163 Q196 160 200 163"
                stroke="rgba(245,158,11,.4)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <line
                x1="182"
                y1="155"
                x2="163"
                y2="140"
                stroke="rgba(245,158,11,.2)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              {/* Lock badge */}
              <rect
                x="80"
                y="160"
                width="60"
                height="32"
                rx="10"
                fill="rgba(37,99,235,.85)"
                stroke="rgba(99,179,237,.3)"
                strokeWidth="1"
              />
              <rect
                x="97"
                y="168"
                width="26"
                height="17"
                rx="4"
                fill="rgba(255,255,255,.18)"
              />
              <path
                d="M103 168 v-4 a7 7 0 0 1 14 0 v4"
                stroke="rgba(255,255,255,.6)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="110" cy="176" r="3" fill="rgba(255,255,255,.8)" />
              {/* Pulse */}
              <circle
                cx="110"
                cy="100"
                r="52"
                fill="none"
                stroke="rgba(59,130,246,.06)"
              >
                <animate
                  attributeName="r"
                  values="52;70;52"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.2;0;0.2"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>

            {/* Shield badge */}
            <div
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                background: "linear-gradient(135deg,#10b981,#34d399)",
                borderRadius: "50%",
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(16,185,129,.45)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: 20,
              position: "relative",
              zIndex: 2,
            }}
          >
            <p
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: 13,
                margin: "0 0 4px",
              }}
            >
              Bảo mật & Mượt mà
            </p>
            <p
              style={{
                color: "#64748b",
                fontSize: 11,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Ưu tiên bảo mật và trải nghiệm
              <br />
              mượt mà, nhanh chóng
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              marginTop: 16,
              position: "relative",
              zIndex: 2,
            }}
          >
            {[
              { v: "Mã hóa", l: "Dữ liệu" },
              { v: "<50ms", l: "Độ trễ" },
            ].map((s) => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div
                  style={{ color: "#60a5fa", fontWeight: 700, fontSize: 13 }}
                >
                  {s.v}
                </div>
                <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
