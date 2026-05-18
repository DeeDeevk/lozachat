import { useState } from "react";
import {
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useOtpStore } from "@/stores/useOtpStore";

interface OtpModalProps {
  email: string;
  onVerified: () => Promise<void>; // ← gọi signUp sau khi verify thành công
  onClose: () => void;
}

export default function OtpModal({ email, onVerified, onClose }: OtpModalProps) {
  const { verifyOTP, sendOTP, loading: otpLoading } = useOtpStore();
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
    await verifyOTP(email, code);
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
    await sendOTP(email);
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
        onClick={onClose}
      >
        <div className="otp-modal" onClick={(e) => e.stopPropagation()}>
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