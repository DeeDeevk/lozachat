import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import {toast} from "sonner"
import { useAuthStore } from "@/stores/useAuthStore";

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  
  const {loading} = useAuthStore()
  const [focused, setFocused] = useState<string>("");
  const [hoverEye, setHoverEye] = useState(false);
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  const validate = () => {
    const newErrors = {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Vui lòng nhập họ";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Vui lòng nhập tên";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Vui lòng nhập tên đăng nhập";
    } else if (formData.username.length < 3) {
      newErrors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải ít nhất 6 ký tự";
    }

    setErrors(newErrors);

    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async () => {
  if (!validate()) return;

  const loading = toast.loading("Đang tạo tài khoản...");

  try {
    const response = await fetch("http://localhost:8888/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success("Đăng ký thành công!", { id: loading });

      setTimeout(() => {
        navigate("/signin");
      }, 1200);

    } else {
      toast.error(data.message || "Đăng ký thất bại", { id: loading });
    }

  } catch (error) {
    console.error(error);
    toast.error("Không thể kết nối server", { id: loading });
  }
};

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

        .r-anim-bg      { animation: fadeIn            .6s  ease                      both; }
        .r-anim-form    { animation: fadeSlideLeft      .55s cubic-bezier(.22,1,.36,1) both; }
        .r-anim-illus   { animation: fadeSlideRight     .55s cubic-bezier(.22,1,.36,1) both; }
        .r-anim-logo    { animation: fadeSlideUp        .5s  cubic-bezier(.22,1,.36,1) both; }
        .r-anim-heading { animation: fadeSlideUp        .5s  cubic-bezier(.22,1,.36,1) .05s both; }
        .r-anim-fields  { animation: fadeSlideUp        .5s  cubic-bezier(.22,1,.36,1) .1s  both; }
        .r-illus        { animation: floatY 4s ease-in-out infinite; }
        .r-dot          { animation: glow  3s ease-in-out infinite; }

        /* ── Responsive: ẩn illustration panel khi màn hình nhỏ ── */
        .r-illus-panel  { display: flex; }
        .r-card         { flex-direction: row; }
        @media (max-width: 680px) {
          .r-illus-panel { display: none !important; }
          .r-card        { flex-direction: column; }
          .r-form-panel  { border-right: none !important; padding: 28px 24px !important; }
        }

        input::placeholder { color: rgba(148,163,184,0.55); }
      `}</style>

      {/* Blobs */}
      <div
        className="r-anim-bg"
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
          className="r-dot r-anim-bg"
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
        className="r-card"
        style={{
          display: "flex",
          width: "min(880px, 100%)",
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
          className="r-anim-form r-form-panel"
          style={{
            flex: 1,
            padding: "34px 38px",
            display: "flex",
            flexDirection: "column",
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
                "radial-gradient(ellipse at 0% 50%,rgba(37,99,235,.06) 0%,transparent 60%)",
            }}
          />

          {/* Logo */}
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
              Tạo tài khoản
            </h1>
            <p
              style={{
                color: "#94a3b8",
                fontSize: 13,
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              Chào mừng bạn! Hãy đăng ký để bắt đầu!
            </p>
          </div>

          {/* Fields */}
          <div
            className="r-anim-fields"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 13,
              position: "relative",
            }}
          >
            {/* Họ / Tên */}
            <div style={{ display: "flex", gap: 12 }}>
              {/* Họ */}
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 500,
                    marginBottom: 5,
                  }}
                >
                  Họ
                </label>

                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  onFocus={() => setFocused("firstName")}
                  onBlur={() => setFocused("")}
                  placeholder="Phùng"
                  style={inputBase("firstName")}
                />
                {errors.firstName && (
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
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Tên */}
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 500,
                    marginBottom: 5,
                  }}
                >
                  Tên
                </label>

                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  onFocus={() => setFocused("lastName")}
                  onBlur={() => setFocused("")}
                  placeholder="Thanh Độ"
                  style={inputBase("lastName")}
                />
                {errors.lastName && (
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
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

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
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onFocus={() => setFocused("username")}
                  onBlur={() => setFocused("")}
                  placeholder="mrxd"
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

            {/* Email */}
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
                Email
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
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused("")}
                  placeholder="siu@example.com"
                  style={{ ...inputBase("email"), paddingLeft: 34 }}
                />
              </div>
              {errors.email && (
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
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
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
                Mật khẩu
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
                marginTop: 2,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              onClick={handleSubmit}
              disabled={loading}
            >
              {
                loading ? "Đang xử lý..." : ( <> Tạo tài khoản
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg> </> )
              }
           
            </button>

            {/* Link sang Login */}
            <p
              style={{
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 12,
                margin: 0,
              }}
            >
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => navigate("/signin")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#60a5fa",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#93c5fd")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#60a5fa")}
              >
                Đăng nhập
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
          className="r-anim-illus r-illus-panel"
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
            className="r-illus"
            style={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              maxWidth: 230,
            }}
          >
            <svg
              viewBox="0 0 230 250"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%" }}
            >
              <ellipse
                cx="115"
                cy="135"
                rx="85"
                ry="65"
                fill="rgba(37,99,235,.06)"
              />
              <rect
                x="12"
                y="16"
                width="134"
                height="42"
                rx="13"
                fill="rgba(28,38,74,.97)"
                stroke="rgba(59,130,246,.3)"
                strokeWidth="1"
              />
              <polygon points="12,50 12,58 22,50" fill="rgba(28,38,74,.97)" />
              <circle cx="30" cy="37" r="9" fill="rgba(37,99,235,.8)" />
              <circle cx="30" cy="35" r="3.5" fill="rgba(255,255,255,.65)" />
              <rect
                x="46"
                y="24"
                width="62"
                height="5"
                rx="2.5"
                fill="rgba(99,179,237,.6)"
              />
              <rect
                x="46"
                y="35"
                width="86"
                height="4"
                rx="2"
                fill="rgba(71,85,105,.5)"
              />
              <rect
                x="46"
                y="44"
                width="55"
                height="3"
                rx="1.5"
                fill="rgba(71,85,105,.35)"
              />
              <rect
                x="66"
                y="72"
                width="152"
                height="42"
                rx="13"
                fill="rgba(37,99,235,.88)"
              />
              <polygon
                points="218,106 218,114 208,106"
                fill="rgba(37,99,235,.88)"
              />
              <rect
                x="78"
                y="80"
                width="88"
                height="5"
                rx="2.5"
                fill="rgba(255,255,255,.85)"
              />
              <rect
                x="78"
                y="91"
                width="118"
                height="4"
                rx="2"
                fill="rgba(255,255,255,.45)"
              />
              <rect
                x="78"
                y="101"
                width="72"
                height="3"
                rx="1.5"
                fill="rgba(255,255,255,.25)"
              />
              <rect
                x="12"
                y="128"
                width="144"
                height="50"
                rx="13"
                fill="rgba(28,38,74,.97)"
                stroke="rgba(59,130,246,.3)"
                strokeWidth="1"
              />
              <polygon
                points="12,168 12,176 22,168"
                fill="rgba(28,38,74,.97)"
              />
              <circle cx="30" cy="152" r="9" fill="rgba(99,102,241,.8)" />
              <rect
                x="25"
                y="149"
                width="10"
                height="7"
                rx="1.5"
                fill="rgba(255,255,255,.45)"
              />
              <rect
                x="46"
                y="135"
                width="52"
                height="5"
                rx="2.5"
                fill="rgba(99,179,237,.6)"
              />
              <rect
                x="46"
                y="146"
                width="92"
                height="4"
                rx="2"
                fill="rgba(71,85,105,.5)"
              />
              <rect
                x="46"
                y="156"
                width="68"
                height="4"
                rx="2"
                fill="rgba(71,85,105,.4)"
              />
              <rect
                x="46"
                y="166"
                width="42"
                height="3"
                rx="1.5"
                fill="rgba(71,85,105,.3)"
              />
              <rect
                x="12"
                y="192"
                width="64"
                height="30"
                rx="13"
                fill="rgba(28,38,74,.85)"
                stroke="rgba(59,130,246,.2)"
                strokeWidth="1"
              />
              <polygon
                points="12,212 12,220 20,212"
                fill="rgba(28,38,74,.85)"
              />
              <circle cx="28" cy="207" r="3.5" fill="rgba(99,179,237,.55)">
                <animate
                  attributeName="cy"
                  values="207;203;207"
                  dur=".75s"
                  repeatCount="indefinite"
                  begin="0s"
                />
              </circle>
              <circle cx="39" cy="207" r="3.5" fill="rgba(99,179,237,.55)">
                <animate
                  attributeName="cy"
                  values="207;203;207"
                  dur=".75s"
                  repeatCount="indefinite"
                  begin=".15s"
                />
              </circle>
              <circle cx="50" cy="207" r="3.5" fill="rgba(99,179,237,.55)">
                <animate
                  attributeName="cy"
                  values="207;203;207"
                  dur=".75s"
                  repeatCount="indefinite"
                  begin=".3s"
                />
              </circle>
              <circle
                cx="205"
                cy="26"
                r="16"
                fill="rgba(16,185,129,.13)"
                stroke="rgba(16,185,129,.4)"
                strokeWidth="1"
              />
              <circle cx="205" cy="26" r="5.5" fill="#10b981" />
              <circle cx="205" cy="26" r="9" fill="rgba(16,185,129,.25)">
                <animate
                  attributeName="r"
                  values="9;13;9"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.5;0;0.5"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
            <div
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                background: "linear-gradient(135deg,#f59e0b,#fbbf24)",
                borderRadius: "50%",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(245,158,11,.5)",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="white">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: 18,
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
              Kết nối mọi lúc
            </p>
            <p
              style={{
                color: "#64748b",
                fontSize: 11,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Nhắn tin, chia sẻ và kết nối
              <br />
              với bạn bè toàn thế giới
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
              { v: "10M+", l: "Người dùng" },
              { v: "99.9%", l: "Uptime" },
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
