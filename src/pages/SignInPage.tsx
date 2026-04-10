import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, Eye, EyeOff, Lock, User,
  Mail, ArrowLeft, KeyRound, CheckCircle2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOtpStore } from "@/stores/useOtpStore";

interface LoginData {
  username: string;
  password: string;
}

type ForgotStep = "email" | "otp" | "newpassword" | "done";
type View = "login" | "forgot";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuthStore();
  const {
    sendOTP, verifyOTP, resetPassword,
    loading: otpLoading,
    isOtpVerified,
  } = useOtpStore();

  // ── Login state ──
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginData>({ username: "", password: "" });
  const [focused, setFocused] = useState("");
  const [hoverEye, setHoverEye] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });

  // ── View state ──
  const [view, setView] = useState<View>("login");

  // ── Forgot password state ──
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // ── New password state ──
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [newPassFocused, setNewPassFocused] = useState("");
  const [newPassError, setNewPassError] = useState({ newPassword: "", confirmPassword: "" });

  // ── Login handlers ──
  const validate = () => {
    const e = { username: "", password: "" };
    if (!formData.username.trim()) e.username = "Vui lòng nhập tên đăng nhập";
    else if (formData.username.length < 3) e.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
    if (!formData.password.trim()) e.password = "Vui lòng nhập mật khẩu";
    else if (formData.password.length < 6) e.password = "Mật khẩu phải có ít nhất 6 ký tự";
    setErrors(e);
    return !e.username && !e.password;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const success = await signIn(formData);
    if (success) navigate("/chat");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    handleSubmit();
  }
};

  // ── Forgot password handlers ──
  const validateEmail = () => {
    if (!email.trim()) { setEmailError("Vui lòng nhập địa chỉ email"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Email không hợp lệ"); return false; }
    setEmailError("");
    return true;
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!validateEmail()) return;
    await sendOTP(email);
    const { error } = useOtpStore.getState();
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Đã gửi mã OTP đến email của bạn!");
    setOtpSent(true);
    setForgotStep("otp");
    startResendTimer();
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    await sendOTP(email);
    const { error } = useOtpStore.getState();
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Đã gửi lại mã OTP!");
    startResendTimer();
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    setOtpError("");
    if (val && idx < 5) {
      const el = document.getElementById(`otp-${idx + 1}`);
      el?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  // Verify OTP — gọi API kiểm tra OTP có đúng không
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Vui lòng nhập đủ 6 chữ số"); return; }
    await verifyOTP(email, code);
    const { error, isOtpVerified } = useOtpStore.getState();
    if (error) {
      setOtpError(error); // hiện lỗi ngay dưới ô OTP
      toast.error(error);
      return;
    }
    if (isOtpVerified) {
      toast.success("Xác nhận OTP thành công!");
      setForgotStep("newpassword");
    }
  };

  const validateNewPassword = () => {
    const e = { newPassword: "", confirmPassword: "" };
    if (!newPassword.trim()) e.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (newPassword.length < 6) e.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    if (!confirmPassword.trim()) e.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (confirmPassword !== newPassword) e.confirmPassword = "Mật khẩu xác nhận không khớp";
    setNewPassError(e);
    return !e.newPassword && !e.confirmPassword;
  };

  // Reset password — chỉ truyền email + newPassword (store mới không cần otp nữa)
  const handleResetPassword = async () => {
    if (!validateNewPassword()) return;
    await resetPassword(email, newPassword);
    const { error } = useOtpStore.getState();
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Đổi mật khẩu thành công!");
    setForgotStep("done");
  };

  const switchToForgot = () => {
    setView("forgot");
    setForgotStep("email");
    setEmail("");
    setEmailError("");
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setOtpSent(false);
    setResendTimer(0);
    setNewPassword("");
    setConfirmPassword("");
    setNewPassError({ newPassword: "", confirmPassword: "" });
  };

  const switchToLogin = () => {
    setView("login");
    setErrors({ username: "", password: "" });
  };

  // ── Shared input style ──
  const inputBase = (fieldName: string): React.CSSProperties => ({
    background: "rgba(30,41,59,.8)",
    border: focused === fieldName ? "1px solid #3b82f6" : "1px solid rgba(71,85,105,.5)",
    boxShadow: focused === fieldName ? "0 0 0 3px rgba(59,130,246,.1)" : "none",
    color: "white", width: "100%", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, outline: "none",
    transition: "all .2s", boxSizing: "border-box" as const,
  });

  const emailInputStyle: React.CSSProperties = {
    background: "rgba(30,41,59,.8)",
    border: emailFocused ? "1px solid #3b82f6" : "1px solid rgba(71,85,105,.5)",
    boxShadow: emailFocused ? "0 0 0 3px rgba(59,130,246,.1)" : "none",
    color: "white", width: "100%", borderRadius: 10,
    padding: "10px 14px 10px 34px", fontSize: 13, outline: "none",
    transition: "all .2s", boxSizing: "border-box" as const,
  };

  return (
    <div
      style={{
        minHeight: "100vh", width: "100%", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        background: "linear-gradient(135deg,#060d1f 0%,#0a1628 40%,#071020 100%)",
        position: "relative", overflow: "hidden",
        padding: "20px 16px", boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes floatY        { 0%,100%{transform:translateY(0);}    50%{transform:translateY(-9px);} }
        @keyframes glow          { 0%,100%{opacity:.15;transform:scale(1);} 50%{opacity:.35;transform:scale(1.3);} }
        @keyframes fadeSlideUp   { from{opacity:0;transform:translateY(24px);}  to{opacity:1;transform:translateY(0);}  }
        @keyframes fadeSlideLeft { from{opacity:0;transform:translateX(-32px);} to{opacity:1;transform:translateX(0);} }
        @keyframes fadeSlideRight{ from{opacity:0;transform:translateX(32px);}  to{opacity:1;transform:translateX(0);} }
        @keyframes fadeIn        { from{opacity:0;} to{opacity:1;} }
        @keyframes panelSwitch   { from{opacity:0;transform:translateX(18px);} to{opacity:1;transform:translateX(0);} }

        .l-anim-bg      { animation: fadeIn            .6s  ease                      both; }
        .l-anim-form    { animation: fadeSlideLeft      .55s cubic-bezier(.22,1,.36,1) both; }
        .l-anim-illus   { animation: fadeSlideRight     .55s cubic-bezier(.22,1,.36,1) both; }
        .l-anim-logo    { animation: fadeSlideUp        .5s  cubic-bezier(.22,1,.36,1) both; }
        .l-anim-heading { animation: fadeSlideUp        .5s  cubic-bezier(.22,1,.36,1) .05s both; }
        .l-anim-fields  { animation: fadeSlideUp        .5s  cubic-bezier(.22,1,.36,1) .1s  both; }
        .l-panel-switch { animation: panelSwitch        .3s  cubic-bezier(.22,1,.36,1) both; }
        .l-illus        { animation: floatY 4s ease-in-out infinite; }
        .l-dot          { animation: glow  3s ease-in-out infinite; }

        .l-illus-panel { display: flex; }
        .l-card        { flex-direction: row; }
        @media (max-width: 680px) {
          .l-illus-panel { display: none !important; }
          .l-card        { flex-direction: column; }
          .l-form-panel  { border-right: none !important; padding: 32px 24px !important; }
        }

        input::placeholder { color: rgba(148,163,184,.55); }

        .otp-input {
          width: 44px; height: 52px; border-radius: 12px; border: 1.5px solid rgba(71,85,105,.5);
          background: rgba(30,41,59,.8); color: white; font-size: 20px; font-weight: 700;
          text-align: center; outline: none; transition: all .2s;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .otp-input:focus {
          border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15);
          background: rgba(30,41,80,.9);
        }
        .otp-input.filled { border-color: rgba(59,130,246,.4); color: #60a5fa; }

        .fp-primary-btn {
          width: 100%; padding: 11px 0; border-radius: 12px;
          background: linear-gradient(135deg,#2563eb 0%,#3b82f6 100%);
          box-shadow: 0 4px 18px rgba(37,99,235,.4); color: white;
          font-weight: 600; font-size: 14px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity .2s; font-family: inherit;
        }
        .fp-primary-btn:hover:not(:disabled) { opacity: .88; }
        .fp-primary-btn:disabled { opacity: .6; cursor: not-allowed; }

        .fp-back-btn {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; color: #64748b; cursor: pointer;
          font-size: 12px; font-weight: 500; padding: 0; font-family: inherit;
          transition: color .2s;
        }
        .fp-back-btn:hover { color: #94a3b8; }
        .fp-back-btn svg { display: block; stroke: currentColor; fill: none; flex-shrink: 0; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .fp-spin { animation: spin .7s linear infinite; }

        @keyframes successPop {
          0%   { transform: scale(.5); opacity: 0; }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .success-icon { animation: successPop .5s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      {/* Blobs */}
      <div className="l-anim-bg" style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:"radial-gradient(ellipse at 15% 50%,rgba(37,99,235,.16) 0%,transparent 55%),radial-gradient(ellipse at 85% 20%,rgba(99,102,241,.1) 0%,transparent 50%),radial-gradient(ellipse at 70% 80%,rgba(29,78,216,.12) 0%,transparent 50%)" }} />

      {/* Floating dots */}
      {[
        { s:5, c:"#3b82f6", t:"10%", l:"7%" }, { s:3, c:"#818cf8", t:"28%", l:"20%" },
        { s:6, c:"#2563eb", t:"62%", l:"4%" }, { s:4, c:"#60a5fa", t:"82%", l:"16%" },
        { s:5, c:"#6366f1", t:"14%", r:"9%" }, { s:3, c:"#3b82f6", t:"48%", r:"5%" },
        { s:6, c:"#1d4ed8", t:"77%", r:"13%" },
      ].map((p, i) => (
        <div key={i} className="l-dot l-anim-bg" style={{ position:"absolute", borderRadius:"50%",
          width:p.s, height:p.s, background:p.c, top:p.t, left:(p).l, right:(p).r, animationDelay:`${i*.35}s` }} />
      ))}

      {/* ── CARD ── */}
      <div className="l-card" style={{ display:"flex", width:"min(820px,100%)", borderRadius:22, overflow:"hidden",
        boxShadow:"0 28px 80px rgba(0,0,0,.7),0 0 0 1px rgba(59,130,246,.12)",
        background:"rgba(10,16,32,.93)", backdropFilter:"blur(24px)", position:"relative", zIndex:10 }}>

        {/* ── FORM PANEL ── */}
        <div className="l-anim-form l-form-panel" style={{ flex:1, padding:"48px 44px", display:"flex",
          flexDirection:"column", alignItems:"center", justifyContent:"center",
          borderRight:"1px solid rgba(59,130,246,.1)", position:"relative" }}>

          <div style={{ position:"absolute", inset:0, pointerEvents:"none",
            background:"radial-gradient(ellipse at 50% 0%,rgba(37,99,235,.07) 0%,transparent 60%)" }} />

          {/* Logo */}
          <div className="l-anim-logo" style={{ display:"flex", flexDirection:"column", alignItems:"center",
            gap:8, marginBottom:18, position:"relative" }}>
            <div style={{ width:52, height:52, borderRadius:16, flexShrink:0, display:"flex",
              alignItems:"center", justifyContent:"center", boxShadow:"0 4px 18px rgba(37,99,235,.45)", overflow:"hidden" }}>
              <img src="/logo.png" alt="Loza" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ color:"white", fontWeight:700, fontSize:18, lineHeight:1.2 }}>Loza</div>
              <div style={{ color:"#60a5fa", fontSize:11 }}>Connect with the future</div>
            </div>
          </div>

          {/* ════════════════════════════
              VIEW: LOGIN
          ════════════════════════════ */}
          {view === "login" && (
            <>
              <div className="l-anim-heading" style={{ textAlign:"center", marginBottom:26, width:"100%" }}>
                <h1 style={{ color:"white", fontWeight:800, fontSize:"1.75rem", margin:0, lineHeight:1.15 }}>
                  Chào mừng quay lại
                </h1>
                <p style={{ color:"#94a3b8", fontSize:13, marginTop:6, marginBottom:0 }}>
                  Đăng nhập vào tài khoản Loza của bạn
                </p>
              </div>

              <div className="l-anim-fields" style={{ display:"flex", flexDirection:"column", gap:14,
                position:"relative", width:"100%", maxWidth:360 }}>

                {/* Username */}
                <div>
                  <label style={{ display:"block", color:"#cbd5e1", fontSize:11, fontWeight:500, marginBottom:5 }}>
                    Tên đăng nhập hoặc email
                  </label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                      <User size={14} color="#64748b" />
                    </span>
                    <input name="username" value={formData.username} onChange={handleChange}
                      onFocus={() => setFocused("username")} onBlur={() => setFocused("")} onKeyDown={handleLoginKeyDown}  
                      placeholder="Nhập tên đăng nhập hoặc email" style={{ ...inputBase("username"), paddingLeft:34 }} />
                  </div>
                  {errors.username && (
                    <p style={{ display:"flex", alignItems:"center", gap:3, color:"#ef4444", fontSize:12, marginTop:4 }}>
                      <AlertCircle size={12} />{errors.username}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                    <label style={{ color:"#cbd5e1", fontSize:11, fontWeight:500 }}>Mật khẩu</label>
                    <button type="button" onClick={switchToForgot}
                      style={{ background:"none", border:"none", padding:0, color:"#60a5fa",
                        fontSize:11, cursor:"pointer", transition:"color .2s", fontFamily:"inherit" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#93c5fd")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#60a5fa")}>
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                      <Lock size={14} color="#64748b" />
                    </span>
                    <input name="password" type={showPassword ? "text" : "password"}
                      value={formData.password} onChange={handleChange}
                      onFocus={() => setFocused("password")} onBlur={() => setFocused("")} onKeyDown={handleLoginKeyDown}  
                      placeholder="••••••••" style={{ ...inputBase("password"), paddingLeft:34, paddingRight:38 }} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      onMouseEnter={() => setHoverEye(true)} onMouseLeave={() => setHoverEye(false)}
                      style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                        border:"none", background:"transparent", cursor:"pointer", padding:2,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        color: focused==="password" || hoverEye ? "#3b82f6" : "#94a3b8", transition:"color .2s" }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p style={{ display:"flex", alignItems:"center", gap:3, color:"#ef4444", fontSize:12, marginTop:4 }}>
                      <AlertCircle size={12} />{errors.password}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button type="button" className="fp-primary-btn" onClick={handleSubmit} disabled={loading}
                  style={{ marginTop:4 }}>
                  {loading ? "Đang xử lý..." : (
                    <>Đăng nhập
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ flex:1, height:1, background:"rgba(71,85,105,.3)" }} />
                  <span style={{ color:"#475569", fontSize:11 }}>hoặc</span>
                  <div style={{ flex:1, height:1, background:"rgba(71,85,105,.3)" }} />
                </div>

                <p style={{ textAlign:"center", color:"#94a3b8", fontSize:12, margin:0 }}>
                  Chưa có tài khoản?{" "}
                  <button type="button" onClick={() => navigate("/signup")}
                    style={{ background:"none", border:"none", padding:0, color:"#60a5fa",
                      fontWeight:600, fontSize:12, cursor:"pointer", transition:"color .2s", fontFamily:"inherit" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#93c5fd")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#60a5fa")}>
                    Đăng ký
                  </button>
                </p>
               
              </div>
            </>
          )}

          {/* ════════════════════════════
              VIEW: FORGOT PASSWORD
          ════════════════════════════ */}
          {view === "forgot" && (
            <div className="l-panel-switch" style={{ width:"100%", maxWidth:360, position:"relative" }}>

              {/* Back button */}
              <button className="fp-back-btn" onClick={switchToLogin} style={{ marginBottom:20 }}>
                <ArrowLeft size={14} />
                Quay lại đăng nhập
              </button>

              {/* ── STEP: EMAIL ── */}
              {forgotStep === "email" && (
                <>
                  <div style={{ marginBottom:24 }}>
                    <div style={{ width:48, height:48, borderRadius:14,
                      background:"linear-gradient(135deg,rgba(37,99,235,.2),rgba(99,102,246,.15))",
                      border:"1px solid rgba(59,130,246,.2)",
                      display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                      <KeyRound size={22} color="#60a5fa" />
                    </div>
                    <h2 style={{ color:"white", fontWeight:800, fontSize:"1.4rem", margin:"0 0 6px" }}>
                      Quên mật khẩu?
                    </h2>
                    <p style={{ color:"#64748b", fontSize:13, margin:0, lineHeight:1.6 }}>
                      Nhập email đăng ký của bạn. Chúng tôi sẽ gửi mã OTP để xác nhận danh tính.
                    </p>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <div>
                      <label style={{ display:"block", color:"#cbd5e1", fontSize:11, fontWeight:500, marginBottom:5 }}>
                        Địa chỉ Email
                      </label>
                      <div style={{ position:"relative" }}>
                        <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                          <Mail size={14} color="#64748b" />
                        </span>
                        <input
                          type="email" value={email}
                          onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                          onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                          placeholder="example@email.com"
                          style={emailInputStyle}
                        />
                      </div>
                      {emailError && (
                        <p style={{ display:"flex", alignItems:"center", gap:3, color:"#ef4444", fontSize:12, marginTop:4 }}>
                          <AlertCircle size={12} />{emailError}
                        </p>
                      )}
                    </div>

                    <button className="fp-primary-btn" onClick={handleSendOtp} disabled={otpLoading}>
                      {otpLoading ? (
                        <><RefreshCw size={15} className="fp-spin" />Đang gửi...</>
                      ) : (
                        <><Mail size={15} />Gửi mã OTP</>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP: OTP ── */}
              {forgotStep === "otp" && (
                <>
                  <div style={{ marginBottom:24 }}>
                    <div style={{ width:48, height:48, borderRadius:14,
                      background:"linear-gradient(135deg,rgba(16,185,129,.15),rgba(6,182,212,.1))",
                      border:"1px solid rgba(16,185,129,.2)",
                      display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                      <Mail size={22} color="#34d399" />
                    </div>
                    <h2 style={{ color:"white", fontWeight:800, fontSize:"1.4rem", margin:"0 0 6px" }}>
                      Nhập mã xác nhận
                    </h2>
               <p style={{ 
  color: "#64748b", 
  fontSize: 13, 
  margin: 0, 
  lineHeight: 1.65 
}}>
  Chúng tôi đã gửi mã OTP 6 chữ số đến{" "}
  <strong style={{ color: "#94a3b8" }}>{email}</strong>
  
  <br />
  
  <span style={{ 
    display: "block", 
    textAlign: "center", 
    color: "#60a5fa", 
    fontWeight: 600,
    fontSize: 13,
    marginTop: 10,           // ← Khoảng cách vừa phải
  }}>
    Mã có hiệu lực trong 1 phút
  </span>
</p>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                    <div>
                      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                        {otp.map((digit, idx) => (
                          <input key={idx} id={`otp-${idx}`}
                            className={`otp-input${digit ? " filled" : ""}`}
                            type="text" inputMode="numeric" maxLength={1} value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            onFocus={(e) => e.target.select()} />
                        ))}
                      </div>
                      {otpError && (
                        <p style={{ display:"flex", alignItems:"center", justifyContent:"center",
                          gap:3, color:"#ef4444", fontSize:12, marginTop:10 }}>
                          <AlertCircle size={12} />{otpError}
                        </p>
                      )}
                    </div>

                    <button className="fp-primary-btn" onClick={handleVerifyOtp} disabled={otpLoading}>
                      {otpLoading ? (
                        <><RefreshCw size={15} className="fp-spin" />Đang xác nhận...</>
                      ) : (
                        <><CheckCircle2 size={15} />Xác nhận mã OTP</>
                      )}
                    </button>

                    <div style={{ textAlign:"center" }}>
                      <p style={{ color:"#64748b", fontSize:12, margin:"0 0 6px" }}>Không nhận được mã?</p>
                      <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0 || otpLoading}
                        style={{ background:"none", border:"none", padding:0, fontFamily:"inherit",
                          color: resendTimer > 0 ? "#475569" : "#60a5fa",
                          fontSize:12, fontWeight:600, cursor: resendTimer > 0 ? "not-allowed" : "pointer",
                          transition:"color .2s", display:"inline-flex", alignItems:"center", gap:5 }}>
                        {otpLoading ? (
                          <><RefreshCw size={12} className="fp-spin" />Đang gửi lại...</>
                        ) : resendTimer > 0 ? (
                          `Gửi lại sau ${resendTimer}s`
                        ) : (
                          <><RefreshCw size={12} />Gửi lại mã</>
                        )}
                      </button>
                    </div>

                    <button type="button" onClick={() => setForgotStep("email")}
                      style={{ background:"none", border:"none", padding:0, color:"#475569",
                        fontSize:11, cursor:"pointer", fontFamily:"inherit", transition:"color .2s",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#64748b")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}>
                      <ArrowLeft size={11} />Đổi email khác
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP: NEW PASSWORD ── */}
              {forgotStep === "newpassword" && (
                <>
                  <div style={{ marginBottom:24 }}>
                    <div style={{ width:48, height:48, borderRadius:14,
                      background:"linear-gradient(135deg,rgba(37,99,235,.2),rgba(99,102,246,.15))",
                      border:"1px solid rgba(59,130,246,.2)",
                      display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                      <Lock size={22} color="#60a5fa" />
                    </div>
                    <h2 style={{ color:"white", fontWeight:800, fontSize:"1.4rem", margin:"0 0 6px" }}>
                      Đặt mật khẩu mới
                    </h2>
                    <p style={{ color:"#64748b", fontSize:13, margin:0, lineHeight:1.6 }}>
                      Tạo mật khẩu mới cho tài khoản của bạn.
                    </p>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {/* New password */}
                    <div>
                      <label style={{ display:"block", color:"#cbd5e1", fontSize:11, fontWeight:500, marginBottom:5 }}>
                        Mật khẩu mới
                      </label>
                      <div style={{ position:"relative" }}>
                        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                          <Lock size={14} color="#64748b" />
                        </span>
                        <input type={showNewPass ? "text" : "password"} value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setNewPassError(p => ({ ...p, newPassword:"" })); }}
                          onFocus={() => setNewPassFocused("new")} onBlur={() => setNewPassFocused("")}
                          placeholder="••••••••"
                          style={{ background:"rgba(30,41,59,.8)",
                            border: newPassFocused==="new" ? "1px solid #3b82f6" : "1px solid rgba(71,85,105,.5)",
                            boxShadow: newPassFocused==="new" ? "0 0 0 3px rgba(59,130,246,.1)" : "none",
                            color:"white", width:"100%", borderRadius:10, padding:"10px 38px 10px 34px",
                            fontSize:13, outline:"none", transition:"all .2s", boxSizing:"border-box" as const }} />
                        <button type="button" onClick={() => setShowNewPass(v => !v)}
                          style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                            border:"none", background:"transparent", cursor:"pointer", padding:2,
                            display:"flex", alignItems:"center", color:"#64748b" }}>
                          {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {newPassError.newPassword && (
                        <p style={{ display:"flex", alignItems:"center", gap:3, color:"#ef4444", fontSize:12, marginTop:4 }}>
                          <AlertCircle size={12} />{newPassError.newPassword}
                        </p>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label style={{ display:"block", color:"#cbd5e1", fontSize:11, fontWeight:500, marginBottom:5 }}>
                        Xác nhận mật khẩu
                      </label>
                      <div style={{ position:"relative" }}>
                        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                          <Lock size={14} color="#64748b" />
                        </span>
                        <input type={showConfirmPass ? "text" : "password"} value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setNewPassError(p => ({ ...p, confirmPassword:"" })); }}
                          onFocus={() => setNewPassFocused("confirm")} onBlur={() => setNewPassFocused("")}
                          placeholder="••••••••"
                          style={{ background:"rgba(30,41,59,.8)",
                            border: newPassFocused==="confirm" ? "1px solid #3b82f6" : "1px solid rgba(71,85,105,.5)",
                            boxShadow: newPassFocused==="confirm" ? "0 0 0 3px rgba(59,130,246,.1)" : "none",
                            color:"white", width:"100%", borderRadius:10, padding:"10px 38px 10px 34px",
                            fontSize:13, outline:"none", transition:"all .2s", boxSizing:"border-box" as const }} />
                        <button type="button" onClick={() => setShowConfirmPass(v => !v)}
                          style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                            border:"none", background:"transparent", cursor:"pointer", padding:2,
                            display:"flex", alignItems:"center", color:"#64748b" }}>
                          {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {newPassError.confirmPassword && (
                        <p style={{ display:"flex", alignItems:"center", gap:3, color:"#ef4444", fontSize:12, marginTop:4 }}>
                          <AlertCircle size={12} />{newPassError.confirmPassword}
                        </p>
                      )}
                    </div>

                    <button className="fp-primary-btn" onClick={handleResetPassword} disabled={otpLoading}
                      style={{ marginTop:4 }}>
                      {otpLoading ? (
                        <><RefreshCw size={15} className="fp-spin" />Đang cập nhật...</>
                      ) : (
                        <><CheckCircle2 size={15} />Đặt lại mật khẩu</>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP: DONE ── */}
              {forgotStep === "done" && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  textAlign:"center", gap:16, paddingTop:8 }}>
                  <div className="success-icon" style={{ width:64, height:64, borderRadius:20,
                    background:"linear-gradient(135deg,rgba(16,185,129,.2),rgba(16,185,129,.08))",
                    border:"1px solid rgba(16,185,129,.3)",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <CheckCircle2 size={32} color="#34d399" />
                  </div>
                  <div>
                    <h2 style={{ color:"white", fontWeight:800, fontSize:"1.3rem", margin:"0 0 8px" }}>
                      Đổi mật khẩu thành công!
                    </h2>
                    <p style={{ color:"#64748b", fontSize:13, margin:0, lineHeight:1.7 }}>
                      Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại.
                    </p>
                  </div>
                  <button className="fp-primary-btn" onClick={switchToLogin} style={{ width:"100%", marginTop:8 }}>
                    Đăng nhập ngay
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── ILLUSTRATION PANEL ── */}
        <div className="l-anim-illus l-illus-panel" style={{ width:300, flexDirection:"column",
          alignItems:"center", justifyContent:"center", padding:"34px 24px",
          position:"relative", overflow:"hidden",
          background:"linear-gradient(160deg,rgba(37,99,235,.13) 0%,rgba(10,16,32,.6) 100%)" }}>

          {[360, 250].map((s) => (
            <div key={s} style={{ position:"absolute", borderRadius:"50%", width:s, height:s,
              top:"50%", left:"50%", transform:"translate(-50%,-50%)",
              border:"1px solid rgba(59,130,246,.06)", pointerEvents:"none" }} />
          ))}

          <div className="l-illus" style={{ position:"relative", zIndex:2, width:"100%", maxWidth:220 }}>
            <svg viewBox="0 0 220 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%" }}>
              <ellipse cx="110" cy="130" rx="80" ry="60" fill="rgba(37,99,235,.06)" />
              <rect x="55" y="55" width="110" height="90" rx="16" fill="rgba(28,38,74,.97)" stroke="rgba(59,130,246,.35)" strokeWidth="1.2" />
              <circle cx="110" cy="85" r="20" fill="rgba(37,99,235,.25)" stroke="rgba(59,130,246,.5)" strokeWidth="1.5" />
              <circle cx="110" cy="80" r="9" fill="rgba(99,179,237,.7)" />
              <path d="M93 100 Q110 94 127 100" stroke="rgba(99,179,237,.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
              <rect x="75" y="110" width="70" height="6" rx="3" fill="rgba(99,179,237,.55)" />
              <rect x="85" y="122" width="50" height="4" rx="2" fill="rgba(71,85,105,.45)" />
              <circle cx="124" cy="68" r="5" fill="#10b981" />
              <circle cx="124" cy="68" r="8" fill="rgba(16,185,129,.2)">
                <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="28" cy="52" r="14" fill="rgba(28,38,74,.9)" stroke="rgba(99,102,241,.4)" strokeWidth="1" />
              <circle cx="28" cy="49" r="5" fill="rgba(99,102,241,.7)" />
              <path d="M24 55 Q28 52 32 55" stroke="rgba(99,102,241,.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <line x1="42" y1="58" x2="58" y2="68" stroke="rgba(59,130,246,.2)" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="22" cy="160" r="14" fill="rgba(28,38,74,.9)" stroke="rgba(37,99,235,.4)" strokeWidth="1" />
              <circle cx="22" cy="157" r="5" fill="rgba(59,130,246,.7)" />
              <path d="M18 163 Q22 160 26 163" stroke="rgba(59,130,246,.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <line x1="36" y1="155" x2="57" y2="140" stroke="rgba(59,130,246,.2)" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="192" cy="52" r="14" fill="rgba(28,38,74,.9)" stroke="rgba(16,185,129,.4)" strokeWidth="1" />
              <circle cx="192" cy="49" r="5" fill="rgba(16,185,129,.7)" />
              <path d="M188 55 Q192 52 196 55" stroke="rgba(16,185,129,.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <line x1="178" y1="58" x2="162" y2="68" stroke="rgba(16,185,129,.2)" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="196" cy="160" r="14" fill="rgba(28,38,74,.9)" stroke="rgba(245,158,11,.4)" strokeWidth="1" />
              <circle cx="196" cy="157" r="5" fill="rgba(245,158,11,.7)" />
              <path d="M192 163 Q196 160 200 163" stroke="rgba(245,158,11,.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <line x1="182" y1="155" x2="163" y2="140" stroke="rgba(245,158,11,.2)" strokeWidth="1" strokeDasharray="3,3" />
              <rect x="80" y="160" width="60" height="32" rx="10" fill="rgba(37,99,235,.85)" stroke="rgba(99,179,237,.3)" strokeWidth="1" />
              <rect x="97" y="168" width="26" height="17" rx="4" fill="rgba(255,255,255,.18)" />
              <path d="M103 168 v-4 a7 7 0 0 1 14 0 v4" stroke="rgba(255,255,255,.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
              <circle cx="110" cy="176" r="3" fill="rgba(255,255,255,.8)" />
              <circle cx="110" cy="100" r="52" fill="none" stroke="rgba(59,130,246,.06)">
                <animate attributeName="r" values="52;70;52" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0;0.2" dur="3s" repeatCount="indefinite" />
              </circle>
            </svg>
            <div style={{ position:"absolute", top:-6, right:-6,
              background:"linear-gradient(135deg,#10b981,#34d399)", borderRadius:"50%",
              width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 12px rgba(16,185,129,.45)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>

          <div style={{ textAlign:"center", marginTop:20, position:"relative", zIndex:2 }}>
            <p style={{ color:"white", fontWeight:700, fontSize:13, margin:"0 0 4px" }}>Bảo mật & Mượt mà</p>
            <p style={{ color:"#64748b", fontSize:11, margin:0, lineHeight:1.5 }}>
              Ưu tiên bảo mật và trải nghiệm<br />mượt mà, nhanh chóng
            </p>
          </div>
          <div style={{ display:"flex", gap:24, marginTop:16, position:"relative", zIndex:2 }}>
            {[{ v:"Mã hóa", l:"Dữ liệu" }, { v:"<50ms", l:"Độ trễ" }].map((s) => (
              <div key={s.l} style={{ textAlign:"center" }}>
                <div style={{ color:"#60a5fa", fontWeight:700, fontSize:13 }}>{s.v}</div>
                <div style={{ color:"#475569", fontSize:10, marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}