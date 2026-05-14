import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  User,
  RefreshCw,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOtpStore } from "@/stores/useOtpStore";
import PrivacyPolicyModal from "../components/PrivacyPolicyModal";

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function getPasswordStrength(password: string): {
  level: 0 | 1 | 2 | 3;
  label: string;
  color: string;
} {
  if (!password) return { level: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { level: 1, label: "Yếu", color: "#ef4444" };
  if (score <= 2) return { level: 2, label: "Trung bình", color: "#f59e0b" };
  return { level: 3, label: "Mạnh", color: "#10b981" };
}

// ── OTP Modal ─────────────────────────────────────────────────────────────────
interface OtpModalProps {
  email: string;
  onVerified: () => Promise<void>; // ← gọi signUp sau khi verify thành công
  onClose: () => void;
}

function OtpModal({ email, onVerified, onClose }: OtpModalProps) {
  const { verifyOTP2, sendOTP2, loading: otpLoading } = useOtpStore();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [verified, setVerified] = useState(false);
  const [signingUp, setSigningUp] = useState(false);

  // Start countdown on mount
  useState(() => {
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  });

  const startTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    setOtpError("");
    if (val && idx < 5) document.getElementById(`reg-otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      document.getElementById(`reg-otp-${idx - 1}`)?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setOtpError("Vui lòng nhập đủ 6 chữ số");
      return;
    }
    await verifyOTP2(email, code);
    const { error, isOtpVerified } = useOtpStore.getState();
    if (error) {
      setOtpError(error);
      toast.error(error);
      return;
    }
    if (isOtpVerified) {
      // OTP đúng → gọi signUp thật
      setSigningUp(true);
      await onVerified();
      setSigningUp(false);
      setVerified(true);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await sendOTP2(email);
    const { error } = useOtpStore.getState();
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Đã gửi lại mã OTP!");
    startTimer();
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
  };

  return (
    <>
      <style>{`
        @keyframes otpModalIn {
          from { opacity:0; transform:scale(.95) translateY(-10px); }
          to   { opacity:1; transform:scale(1)   translateY(0); }
        }
        @keyframes otpFadeIn { from{opacity:0;} to{opacity:1;} }
        @keyframes otpSpin   { to { transform:rotate(360deg); } }
        @keyframes otpSuccessPop {
          0%   { transform:scale(.5); opacity:0; }
          70%  { transform:scale(1.2); }
          100% { transform:scale(1);  opacity:1; }
        }

        .otp-backdrop {
          position:fixed; inset:0; z-index:3000;
          background:rgba(2,6,18,.82); backdrop-filter:blur(8px);
          display:flex; align-items:center; justify-content:center; padding:20px;
          animation: otpFadeIn .2s ease both;
        }
        .otp-modal {
          width:100%; max-width:420px;
          background:linear-gradient(170deg,#0d1526 0%,#0a1020 100%);
          border:1px solid rgba(255,255,255,.09); border-radius:22px;
          box-shadow:0 32px 80px rgba(0,0,0,.75), 0 0 0 1px rgba(59,130,246,.08);
          animation:otpModalIn .28s cubic-bezier(.22,1,.36,1) both;
          overflow:hidden; font-family:'Segoe UI',system-ui,sans-serif;
        }
        .otp-header {
          padding:22px 24px 18px; border-bottom:1px solid rgba(255,255,255,.06);
          background:linear-gradient(90deg,rgba(37,99,235,.08),rgba(99,102,246,.05));
        }
        .otp-body { padding:24px; display:flex; flex-direction:column; gap:20px; }

        .otp-cell {
          width:46px; height:54px; border-radius:12px;
          border:1.5px solid rgba(71,85,105,.5); background:rgba(30,41,59,.8);
          color:white; font-size:22px; font-weight:700; text-align:center;
          outline:none; transition:all .2s;
          font-family:'Segoe UI',system-ui,sans-serif;
        }
        .otp-cell:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); background:rgba(30,41,80,.9); }
        .otp-cell.filled { border-color:rgba(59,130,246,.45); color:#60a5fa; }

        .otp-primary-btn {
          width:100%; padding:11px 0; border-radius:12px; border:none;
          background:linear-gradient(135deg,#2563eb,#3b82f6); color:white;
          font-weight:600; font-size:14px; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:7px;
          transition:opacity .2s; font-family:inherit;
          box-shadow:0 4px 16px rgba(37,99,235,.4);
        }
        .otp-primary-btn:hover:not(:disabled) { opacity:.88; }
        .otp-primary-btn:disabled { opacity:.6; cursor:not-allowed; }
        .otp-primary-btn svg { display:block; stroke:currentColor; fill:none; flex-shrink:0; }

        .otp-spin { animation:otpSpin .7s linear infinite; }
        .otp-success-icon { animation:otpSuccessPop .45s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div
        className="otp-backdrop"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="otp-modal">
          {/* Header */}
          <div className="otp-header">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg,rgba(37,99,235,.25),rgba(99,102,246,.2))",
                    border: "1px solid rgba(99,102,246,.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Mail size={16} color="#818cf8" />
                </div>
                <div>
                  <div
                    style={{ fontSize: 16, fontWeight: 800, color: "white" }}
                  >
                    Xác thực email
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    Bước cuối để hoàn tất đăng ký
                  </div>
                </div>
              </div>
              {!verified && (
                <button
                  onClick={onClose}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: "none",
                    background: "rgba(255,255,255,.06)",
                    color: "#64748b",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="otp-body">
            {verified ? (
              /* ── Success state ── */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 0",
                }}
              >
                <div
                  className="otp-success-icon"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 18,
                    background:
                      "linear-gradient(135deg,rgba(16,185,129,.2),rgba(16,185,129,.08))",
                    border: "1px solid rgba(16,185,129,.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={30} color="#34d399" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      color: "white",
                      fontWeight: 800,
                      fontSize: 16,
                      marginBottom: 6,
                    }}
                  >
                    Xác thực thành công!
                  </div>
                  <div
                    style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}
                  >
                    Tài khoản đã được tạo thành công.
                    <br />
                    Đang chuyển đến đăng nhập...
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Description */}
               {/* Ô thông báo email */}
<div
  style={{
    background: "rgba(59,130,246,.06)",
    border: "1px solid rgba(59,130,246,.12)",
    borderRadius: 10,
    padding: "14px 16px",
  }}
>
  <p
    style={{
      color: "#94a3b8",
      fontSize: 12,
      margin: 0,
      lineHeight: 1.7,
    }}
  >
    Chúng tôi đã gửi mã OTP 6 chữ số đến{" "}
    <strong style={{ color: "#60a5fa" }}>{email}</strong>
  </p>
</div>

{/* Dòng "Mã có hiệu lực trong 1 phút" nằm ngoài ô, căn giữa */}
<p
  style={{
    color: "#60a5fa",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "center",
    margin: 0,
  }}
>
  Mã có hiệu lực trong 1 phút
</p>

                {/* OTP inputs */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                    }}
                  >
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`reg-otp-${idx}`}
                        className={`otp-cell${digit ? " filled" : ""}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onFocus={(e) => e.target.select()}
                      />
                    ))}
                  </div>
                  {otpError && (
                    <p
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        color: "#f87171",
                        fontSize: 12,
                        marginTop: 10,
                      }}
                    >
                      <AlertCircle size={12} />
                      {otpError}
                    </p>
                  )}
                </div>

                {/* Verify button */}
                <button
                  className="otp-primary-btn"
                  onClick={handleVerify}
                  disabled={otpLoading || signingUp}
                >
                  {otpLoading || signingUp ? (
                    <>
                      <RefreshCw size={15} className="otp-spin" />
                      {signingUp ? "Đang tạo tài khoản..." : "Đang xác nhận..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      Xác nhận OTP
                    </>
                  )}
                </button>

                {/* Resend */}
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: 12,
                      margin: "0 0 6px",
                    }}
                  >
                    Không nhận được mã?
                  </p>
                  <button
                    onClick={handleResend}
                    disabled={resendTimer > 0 || otpLoading}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontFamily: "inherit",
                      color: resendTimer > 0 ? "#475569" : "#60a5fa",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: resendTimer > 0 ? "not-allowed" : "pointer",
                      transition: "color .2s",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {otpLoading ? (
                      <>
                        <RefreshCw size={12} className="otp-spin" />
                        Đang gửi...
                      </>
                    ) : resendTimer > 0 ? (
                      `Gửi lại sau ${resendTimer}s`
                    ) : (
                      <>
                        <RefreshCw size={12} />
                        Gửi lại mã
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main RegisterPage ─────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, loading: _loading } = useAuthStore();
  const { sendOTP2, loading: otpLoading } = useOtpStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [focused, setFocused] = useState("");
  const [hoverEye, setHoverEye] = useState("");
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const strength = getPasswordStrength(formData.password);

  const validate = () => {
    const e = {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    if (!formData.firstName.trim()) e.firstName = "Vui lòng nhập họ";
    if (!formData.lastName.trim()) e.lastName = "Vui lòng nhập tên";
    if (!formData.username.trim()) e.username = "Vui lòng nhập tên đăng nhập";
    else if (formData.username.length < 3)
      e.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
    else if (/\s/.test(formData.username))
      e.username = "Tên đăng nhập không được chứa dấu cách";
    if (!formData.email.trim()) e.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      e.email = "Email không hợp lệ";
    if (!formData.password.trim()) e.password = "Vui lòng nhập mật khẩu";
    else if (formData.password.length < 6)
      e.password = "Mật khẩu phải ít nhất 6 ký tự";
    if (!formData.confirmPassword.trim())
      e.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (formData.confirmPassword !== formData.password)
      e.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(e);
    return Object.values(e).every((v) => v === "");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!agreedToPolicy) {
      setPolicyError("Bạn phải đồng ý với Chính sách bảo mật để tiếp tục");
      return;
    }
    setPolicyError("");

    // 1. Gửi OTP trước — chưa tạo tài khoản
    await sendOTP2(formData.email);
    const { error } = useOtpStore.getState();
    if (error) {
      toast.error(error);
      return;
    }

    // 2. Hiện modal nhập OTP
    setRegisteredEmail(formData.email);
    setShowOtpModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "confirmPassword" || name === "password")
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
  };

  const inputBase = (fieldName: string): React.CSSProperties => ({
    background: "rgba(30,41,59,.8)",
    border:
      focused === fieldName
        ? "1px solid #3b82f6"
        : "1px solid rgba(71,85,105,.5)",
    boxShadow: focused === fieldName ? "0 0 0 3px rgba(59,130,246,.1)" : "none",
    color: "white",
    width: "100%",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    outline: "none",
    transition: "all .2s",
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
        fontFamily: "'Segoe UI',system-ui,sans-serif",
        background:
          "linear-gradient(135deg,#060d1f 0%,#0a1628 40%,#071020 100%)",
        position: "relative",
        overflow: "hidden",
        padding: "20px 16px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes floatY        { 0%,100%{transform:translateY(0);}    50%{transform:translateY(-9px);} }
        @keyframes glow          { 0%,100%{opacity:.15;transform:scale(1);} 50%{opacity:.35;transform:scale(1.3);} }
        @keyframes fadeSlideUp   { from{opacity:0;transform:translateY(24px);}  to{opacity:1;transform:translateY(0);} }
        @keyframes fadeSlideLeft { from{opacity:0;transform:translateX(-32px);} to{opacity:1;transform:translateX(0);} }
        @keyframes fadeSlideRight{ from{opacity:0;transform:translateX(32px);}  to{opacity:1;transform:translateX(0);} }
        @keyframes fadeIn        { from{opacity:0;} to{opacity:1;} }

        .r-anim-bg      { animation: fadeIn            .6s  ease both; }
        .r-anim-form    { animation: fadeSlideLeft      .55s cubic-bezier(.22,1,.36,1) both; }
        .r-anim-illus   { animation: fadeSlideRight     .55s cubic-bezier(.22,1,.36,1) both; }
        .r-anim-logo    { animation: fadeSlideUp        .5s  cubic-bezier(.22,1,.36,1) both; }
        .r-anim-heading { animation: fadeSlideUp        .5s  cubic-bezier(.22,1,.36,1) .05s both; }
        .r-anim-fields  { animation: fadeSlideUp        .5s  cubic-bezier(.22,1,.36,1) .1s  both; }
        .r-illus        { animation: floatY 4s ease-in-out infinite; }
        .r-dot          { animation: glow  3s ease-in-out infinite; }

        .r-illus-panel  { display: flex; }
        .r-card         { flex-direction: row; }
        @media (max-width: 700px) {
          .r-illus-panel { display: none !important; }
          .r-card        { flex-direction: column; }
          .r-form-panel  { border-right: none !important; padding: 28px 20px !important; }
        }

        input::placeholder { color: rgba(148,163,184,.55); }

        .r-strength-bar { height: 3px; border-radius: 3px; transition: all .35s; flex: 1; }

        .r-policy-row {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          background: rgba(15,23,42,.7); border: 1px solid rgba(255,255,255,.07);
          transition: border-color .2s;
        }
        .r-policy-row.error { border-color: rgba(239,68,68,.4); background: rgba(239,68,68,.05); }
        .r-policy-checkbox {
          width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
          border: 1.5px solid rgba(71,85,105,.7); background: rgba(15,23,42,.9);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all .18s; margin-top: 1px;
        }
        .r-policy-checkbox.checked {
          background: linear-gradient(135deg,#2563eb,#3b82f6);
          border-color: #3b82f6; box-shadow: 0 0 8px rgba(59,130,246,.35);
        }
        .r-policy-link {
          color: #60a5fa; font-weight: 600; cursor: pointer;
          background: none; border: none; padding: 0;
          font-size: inherit; font-family: inherit; transition: color .2s;
        }
        .r-policy-link:hover { color: #93c5fd; }
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
            left: (p as any).l,
            right: (p as any).r,
            animationDelay: `${i * 0.35}s`,
          }}
        />
      ))}

      {/* ── CARD ── */}
      <div
        className="r-card"
        style={{
          display: "flex",
          width: "min(900px,100%)",
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
            padding: "28px 36px",
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
          <div
            className="r-anim-logo"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              position: "relative",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
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
                alt="Loza"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 17,
                  lineHeight: 1.2,
                }}
              >
                Loza
              </div>
              <div style={{ color: "#60a5fa", fontSize: 10 }}>
                Connect with the future
              </div>
            </div>
          </div>

          {/* Heading */}
          <div
            className="r-anim-heading"
            style={{ textAlign: "center", marginBottom: 20 }}
          >
            <h1
              style={{
                color: "white",
                fontWeight: 800,
                fontSize: "1.6rem",
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              Tạo tài khoản
            </h1>
            <p
              style={{
                color: "#94a3b8",
                fontSize: 12,
                marginTop: 5,
                marginBottom: 0,
              }}
            >
              Chào mừng bạn! Hãy đăng ký để bắt đầu!
            </p>
          </div>

          {/* Fields */}
          <div
            className="r-anim-fields"
            style={{ display: "flex", flexDirection: "column", gap: 11 }}
          >
            {/* Họ / Tên */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 500,
                    marginBottom: 4,
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
                  placeholder="Nguyễn"
                  style={inputBase("firstName")}
                  onKeyDown={handleKeyDown}
                />
                {errors.firstName && (
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 3,
                    }}
                  >
                    <AlertCircle size={11} />
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 500,
                    marginBottom: 4,
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
                  placeholder="Văn A"
                  style={inputBase("lastName")}
                  onKeyDown={handleKeyDown}
                />
                {errors.lastName && (
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 3,
                    }}
                  >
                    <AlertCircle size={11} />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Username + Email */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 0.4 }}>
                <label
                  style={{
                    display: "block",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Tên đăng nhập
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 11,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <User size={13} color="#64748b" />
                  </span>
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => setFocused("username")}
                    onBlur={() => setFocused("")}
                    placeholder="abc123"
                    style={{
                      ...inputBase("username"),
                      paddingLeft: 32,
                      width: "100%",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === " ") e.preventDefault();
                      else handleKeyDown(e);
                    }}
                  />
                </div>
                {errors.username && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <AlertCircle size={11} />
                    {errors.username}
                  </p>
                )}
              </div>
              <div style={{ flex: 0.6 }}>
                <label
                  style={{
                    display: "block",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Email
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 11,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
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
                    placeholder="email@example.com"
                    style={{
                      ...inputBase("email"),
                      paddingLeft: 32,
                      width: "100%",
                    }}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                {errors.email && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      marginTop: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <AlertCircle size={11} />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Password + strength */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "#cbd5e1",
                  fontSize: 11,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                Mật khẩu
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                >
                  <Lock size={13} color="#64748b" />
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
                    paddingLeft: 32,
                    paddingRight: 36,
                  }}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  onMouseEnter={() => setHoverEye("password")}
                  onMouseLeave={() => setHoverEye("")}
                  style={{
                    position: "absolute",
                    right: 9,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 2,
                    color:
                      focused === "password" || hoverEye === "password"
                        ? "#3b82f6"
                        : "#94a3b8",
                    transition: "color .2s",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formData.password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div
                    style={{ display: "flex", gap: 4, alignItems: "center" }}
                  >
                    {[1, 2, 3].map((lvl) => (
                      <div
                        key={lvl}
                        className="r-strength-bar"
                        style={{
                          background:
                            strength.level >= lvl
                              ? strength.color
                              : "rgba(71,85,105,.4)",
                        }}
                      />
                    ))}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: strength.color,
                        whiteSpace: "nowrap",
                        marginLeft: 4,
                      }}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>
                    {strength.level === 1 &&
                      "Thêm chữ hoa, số hoặc ký tự đặc biệt để tăng độ mạnh"}
                    {strength.level === 2 &&
                      "Khá tốt! Thêm ký tự đặc biệt để đạt mức Mạnh"}
                    {strength.level === 3 && "Mật khẩu của bạn rất an toàn 🎉"}
                  </p>
                </div>
              )}
              {errors.password && (
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    color: "#ef4444",
                    fontSize: 11,
                    marginTop: 3,
                  }}
                >
                  <AlertCircle size={11} />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "#cbd5e1",
                  fontSize: 11,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                Xác nhận mật khẩu
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                >
                  <Lock size={13} color="#64748b" />
                </span>
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocused("confirmPassword")}
                  onBlur={() => setFocused("")}
                  placeholder="Nhập lại mật khẩu"
                  style={{
                    ...inputBase("confirmPassword"),
                    paddingLeft: 32,
                    paddingRight: 36,
                  }}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  onMouseEnter={() => setHoverEye("confirm")}
                  onMouseLeave={() => setHoverEye("")}
                  style={{
                    position: "absolute",
                    right: 9,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 2,
                    color:
                      focused === "confirmPassword" || hoverEye === "confirm"
                        ? "#3b82f6"
                        : "#94a3b8",
                    transition: "color .2s",
                  }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {formData.confirmPassword.length > 0 && (
                <p
                  style={{
                    fontSize: 10,
                    marginTop: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color:
                      formData.confirmPassword === formData.password
                        ? "#10b981"
                        : "#f87171",
                  }}
                >
                  {formData.confirmPassword === formData.password ? (
                    <>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Mật khẩu khớp
                    </>
                  ) : (
                    <>
                      
                    </>
                  )}
                </p>
              )}
              {errors.confirmPassword && (
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    color: "#ef4444",
                    fontSize: 11,
                    marginTop: 3,
                  }}
                >
                  <AlertCircle size={11} />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Policy checkbox */}
            <div>
              <div className={`r-policy-row ${policyError ? "error" : ""}`}>
                <div
                  className={`r-policy-checkbox ${agreedToPolicy ? "checked" : ""}`}
                  onClick={() => {
                    setAgreedToPolicy((v) => !v);
                    setPolicyError("");
                  }}
                  role="checkbox"
                  aria-checked={agreedToPolicy}
                >
                  {agreedToPolicy && (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    lineHeight: 1.55,
                    userSelect: "none",
                  }}
                >
                  Tôi đã đọc và đồng ý với{" "}
                  <button
                    className="r-policy-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPolicyModal(true);
                    }}
                  >
                    Chính sách bảo mật
                  </button>{" "}
                  và{" "}
                  <button
                    className="r-policy-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPolicyModal(true);
                    }}
                  >
                    Điều khoản dịch vụ
                  </button>{" "}
                  của Loza.
                </span>
              </div>
              {policyError && (
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    color: "#ef4444",
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  <AlertCircle size={11} />
                  {policyError}
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
                transition: "opacity .2s",
                opacity: otpLoading ? 0.7 : 1,
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!otpLoading) e.currentTarget.style.opacity = ".88";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = otpLoading ? ".7" : "1";
              }}
              onClick={handleSubmit}
              disabled={otpLoading}
            >
              {otpLoading ? (
                "Đang xử lý..."
              ) : (
                <>
                  Tạo tài khoản
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

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
                  transition: "color .2s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#93c5fd")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#60a5fa")}
              >
                Đăng nhập
              </button>
            </p>
          </div>
        </div>

        {/* ── ILLUSTRATION PANEL ── */}
        <div
          className="r-anim-illus r-illus-panel"
          style={{
            width: 280,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "34px 20px",
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
              maxWidth: 220,
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
              {[
                { cx: 28, delay: "0s" },
                { cx: 39, delay: ".15s" },
                { cx: 50, delay: ".3s" },
              ].map((c, i) => (
                <circle
                  key={i}
                  cx={c.cx}
                  cy="207"
                  r="3.5"
                  fill="rgba(99,179,237,.55)"
                >
                  <animate
                    attributeName="cy"
                    values="207;203;207"
                    dur=".75s"
                    repeatCount="indefinite"
                    begin={c.delay}
                  />
                </circle>
              ))}
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
              với bạn bè mọi lúc, mọi nơi
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

      {/* ── OTP Verification Modal ── */}
      {showOtpModal && (
        <OtpModal
          email={registeredEmail}
          onVerified={async () => {
            // OTP đã xác thực → tạo tài khoản thật
            const { confirmPassword: _, ...payload } = formData;
            const success = await signUp(payload);
            if (success) {
              setTimeout(() => {
                setShowOtpModal(false);
                navigate("/signin");
              }, 1200);
            }
          }}
          onClose={() => setShowOtpModal(false)}
        />
      )}

      {/* ── Privacy Policy Modal ── */}
      {showPolicyModal && (
        <PrivacyPolicyModal
          onClose={() => setShowPolicyModal(false)}
          onAccept={() => {
            setAgreedToPolicy(true);
            setPolicyError("");
          }}
        />
      )}
    </div>
  );
}
