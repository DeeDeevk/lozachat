// components/admin/UsersTab.tsx
import { useEffect, useRef, useState } from "react";
import {
  Shield, Lock, Unlock, ChevronLeft, ChevronRight,
  X, AlertTriangle, KeyRound, Loader2, CheckCircle2, RotateCcw,
} from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Eye, EyeOff } from "lucide-react";

type LockStep = "reason" | "password" | "success";
interface LockTarget { _id: string; displayName: string; username: string; avatarUrl?: string; }

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const handleChange = (i: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = digit || " ";
    const next = arr.join("").trimEnd();
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };
  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i]?.trim() && i > 0) refs.current[i - 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          aria-label={`OTP digit ${i + 1}`}
          title={`OTP digit ${i + 1}`}
          value={value[i]?.trim() || ""}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: 44,
            height: 52,
            textAlign: "center",
            fontSize: 22,
            fontWeight: 700,
            borderRadius: 12,
            border: value[i]?.trim()
              ? "2px solid rgba(239,68,68,.65)"
              : "2px solid rgba(148,163,184,.18)",
            background: "rgba(15,23,42,.85)",
            color: "#f8fafc",
            outline: "none",
            transition: "border-color .15s,box-shadow .15s",
            caretColor: "#f87171",
            opacity: disabled ? 0.5 : 1,
            fontFamily: "inherit"
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(239,68,68,.9)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(239,68,68,.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = value[i]?.trim()
              ? "rgba(239,68,68,.65)"
              : "rgba(148,163,184,.18)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      ))}
    </div>
  );
}

// ─── Lock Modal ───────────────────────────────────────────────────────────────
function LockModal({ target, onClose, onLocked, lockUser }: { target: LockTarget; onClose: () => void; onLocked: () => void; lockUser: (targetUserId: string, reason: string) => Promise<void>; }) {
  const { verifyPassword } = useAuthStore();
  const [step, setStep] = useState<LockStep>("reason");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleConfirm = async () => {
    if (!password.trim()) { setError("Vui lòng nhập mật khẩu."); return; }
    setError(""); setLoading(true);
    try {
      await verifyPassword(password); // ← xác thực
      await lockUser(target._id, reason);
      setStep("success");
      setTimeout(() => { onLocked(); onClose(); }, 1800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Mật khẩu không đúng.");
      setPassword("");
    } finally { setLoading(false); }
  };

  const overlay: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
  const card: React.CSSProperties = { background: "linear-gradient(160deg,#0d1528 0%,#0a1020 100%)", border: "1px solid rgba(239,68,68,.22)", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,.75),0 0 0 1px rgba(239,68,68,.1)" };
  const btnPrimary = (disabled: boolean): React.CSSProperties => ({ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: disabled ? "rgba(239,68,68,.25)" : "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: disabled ? "none" : "0 4px 14px rgba(239,68,68,.4)", transition: "all .15s" });
  const btnSecondary: React.CSSProperties = { flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid rgba(148,163,184,.15)", background: "transparent", color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };

  return (
    <div style={overlay} onClick={() => { if (!loading) onClose(); }}>
      <div style={card} onClick={(e) => e.stopPropagation()}>

        {step === "reason" && (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(239,68,68,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><Lock size={16} color="#f87171" /></div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>Khóa tài khoản</span>
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", paddingLeft: 41 }}>{target.displayName} <span style={{ color: "#64748b" }}>@{target.username}</span></div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                title="Close"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: 4
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.18)", borderRadius: 12, padding: "10px 14px", marginBottom: 20 }}>
              <AlertTriangle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.6 }}>
                Người dùng sẽ <strong>bị đăng xuất ngay lập tức</strong> và nhận thông báo kèm lý do khóa tài khoản.
              </span>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>Lý do khóa <span style={{ color: "#f87171" }}>*</span></label>
            <textarea
              value={reason} rows={3}
              onChange={(e) => { setReason(e.target.value); setError(""); }}
              placeholder="Mô tả chi tiết lý do khóa tài khoản này..."
              style={{ width: "100%", resize: "none", background: "rgba(15,23,42,.8)", border: `1px solid ${error ? "rgba(239,68,68,.5)" : "rgba(148,163,184,.15)"}`, borderRadius: 12, padding: "10px 14px", color: "#f8fafc", fontSize: 13, fontFamily: "inherit", outline: "none", lineHeight: 1.6, marginBottom: 6, transition: "border-color .15s" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(239,68,68,.5)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = error ? "rgba(239,68,68,.5)" : "rgba(148,163,184,.15)"; }}
            />
            {error && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 10 }}>{error}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={onClose} style={btnSecondary}>Hủy</button>
              <button onClick={() => { if (!reason.trim()) { setError("..."); return; } setError(""); setStep("password"); }} disabled={loading || !reason.trim()} style={btnPrimary(loading || !reason.trim())}>
                {loading ? <><Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> Đang gửi...</> : <><KeyRound size={14} /> Xác thực mật khẩu</>}
              </button>
            </div>
          </>
        )}

        {step === "password" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(239,68,68,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Lock size={16} color="#f87171" />
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>Xác thực mật khẩu</span>
              </div>
              <button aria-label="Close" onClick={onClose} disabled={loading} style={{ background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer", color: "#64748b", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: "rgba(99,102,246,.08)", border: "1px solid rgba(99,102,246,.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 22, fontSize: 12, color: "#a5b4fc", lineHeight: 1.7 }}>
              Nhập mật khẩu của bạn để xác nhận khóa tài khoản.<br />
              Lý do: <span style={{ color: "#fca5a5", fontStyle: "italic" }}>"{reason}"</span>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>
              Mật khẩu admin <span style={{ color: "#f87171" }}>*</span>
            </label>
            <div style={{ position: "relative", marginBottom: 6 }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                autoFocus
                disabled={loading}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
                placeholder="Nhập mật khẩu của bạn..."
                style={{ width: "100%", background: "rgba(15,23,42,.8)", border: `1px solid ${error ? "rgba(239,68,68,.5)" : "rgba(148,163,184,.15)"}`, borderRadius: 12, padding: "10px 42px 10px 14px", color: "#f8fafc", fontSize: 13, fontFamily: "inherit", outline: "none", transition: "border-color .15s", boxSizing: "border-box", opacity: loading ? 0.6 : 1 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(239,68,68,.5)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = error ? "rgba(239,68,68,.5)" : "rgba(148,163,184,.15)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0, display: "flex" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 10 }}>{error}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => { setStep("reason"); setPassword(""); setError(""); }} disabled={loading} style={{ ...btnSecondary, cursor: loading ? "not-allowed" : "pointer" }}>
                Quay lại
              </button>
              <button onClick={handleConfirm} disabled={loading || !password.trim()} style={btnPrimary(loading || !password.trim())}>
                {loading
                  ? <><Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> Đang khóa...</>
                  : <><Lock size={14} /> Xác nhận khóa</>
                }
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(34,197,94,.1)", border: "2px solid rgba(34,197,94,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", animation: "popIn .3s cubic-bezier(.22,1,.36,1)" }}>
              <CheckCircle2 size={34} color="#4ade80" />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#f8fafc", marginBottom: 8 }}>Đã khóa thành công!</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
              Tài khoản <strong style={{ color: "#fca5a5" }}>{target.displayName}</strong> đã bị khóa.<br />
              <span style={{ fontSize: 12, color: "#64748b" }}>Người dùng đã nhận thông báo và bị đăng xuất.</span>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes popIn{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UsersTab() {
  const { users, getUsers, loading, totalPages, total, lockUser, unlockUser } = useUserStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [lockTarget, setLockTarget] = useState<LockTarget | null>(null);
  const [confirmUnlock, setConfirmUnlock] = useState<LockTarget | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  useEffect(() => { getUsers(currentPage); }, [currentPage]);

  const handleUnlock = async (user: LockTarget) => {
    setUnlockingId(user._id);
    try {
      await unlockUser(user._id);
      await getUsers(currentPage);
    } catch { }
    finally { setUnlockingId(null); setConfirmUnlock(null); }
  };

  const toTarget = (u: typeof users[0]): LockTarget => ({ _id: u._id, displayName: u.displayName, username: u.username, avatarUrl: u.avatarUrl });

  return (
    <>
      {lockTarget && (
        <LockModal
          target={lockTarget}
          onClose={() => setLockTarget(null)}
          onLocked={() => getUsers(currentPage)}
          lockUser={lockUser}
        />
      )}

      {/* Confirm unlock modal */}
      {confirmUnlock && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.65)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => { if (!unlockingId) setConfirmUnlock(null); }}>
          <div style={{ background: "linear-gradient(160deg,#0d1528,#0a1020)", border: "1px solid rgba(34,197,94,.2)", borderRadius: 20, padding: "26px 24px", maxWidth: 380, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,.7)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(34,197,94,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><Unlock size={16} color="#4ade80" /></div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>Mở khóa tài khoản</span>
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 22, lineHeight: 1.6 }}>
              Xác nhận mở khóa <strong style={{ color: "#f8fafc" }}>{confirmUnlock.displayName}</strong>? Người dùng sẽ có thể đăng nhập lại ngay.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmUnlock(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid rgba(148,163,184,.15)", background: "transparent", color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Hủy</button>
              <button onClick={() => handleUnlock(confirmUnlock)} disabled={!!unlockingId} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: unlockingId ? "rgba(34,197,94,.2)" : "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: unlockingId ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: unlockingId ? "none" : "0 4px 14px rgba(34,197,94,.3)" }}>
                {unlockingId ? <><Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> Đang mở...</> : <><Unlock size={14} /> Xác nhận mở khóa</>}
              </button>
            </div>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 18 }}>Danh sách người dùng</div>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Tổng: {total} người dùng</div>
        </div>

        {loading ? (
          <div style={{ color: "#94a3b8", textAlign: "center", padding: 20 }}>Đang tải...</div>
        ) : users.length === 0 ? (
          <div style={{ color: "#94a3b8", textAlign: "center", padding: 20 }}>Không có người dùng nào</div>
        ) : (
          <>
            {users.map((user) => (
              <div key={user._id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16, background: user.isLocked ? "rgba(239,68,68,.04)" : "rgba(15,23,42,.7)", border: user.isLocked ? "1px solid rgba(239,68,68,.18)" : "1px solid rgba(148,163,184,.12)", transition: "all .2s" }}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt={user.displayName} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(96,165,250,.35)", flexShrink: 0 }} />
                  : <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 18, border: "2px solid rgba(96,165,250,.35)", flexShrink: 0 }}>{user.displayName?.[0]?.toUpperCase() || "U"}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: 15 }}>{user.displayName}</span>
                    {user.role === "admin" && <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: "rgba(59,130,246,.15)", color: "#60a5fa", fontSize: 11, fontWeight: 700 }}><Shield size={12} /> ADMIN</div>}
                    {user.isLocked && <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: "rgba(239,68,68,.15)", color: "#f87171", fontSize: 11, fontWeight: 700 }}><Lock size={12} /> LOCKED</div>}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 2 }}>@{user.username}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{user.email}</div>
                </div>

                {user.isLocked ? (
                  <button onClick={() => setConfirmUnlock(toTarget(user))} style={{ border: "none", borderRadius: 10, padding: "8px 14px", background: "rgba(34,197,94,.15)", color: "#4ade80", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(34,197,94,.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(34,197,94,.15)"; }}>
                    <Unlock size={14} /> Mở khóa
                  </button>
                ) : (
                  <button onClick={() => setLockTarget(toTarget(user))} disabled={user.role === "admin"} title={user.role === "admin" ? "Không thể khóa tài khoản admin" : ""} style={{ border: "none", borderRadius: 10, padding: "8px 14px", background: user.role === "admin" ? "rgba(100,116,139,.08)" : "rgba(239,68,68,.15)", color: user.role === "admin" ? "#475569" : "#f87171", fontWeight: 600, fontSize: 12, cursor: user.role === "admin" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }} onMouseEnter={(e) => { if (user.role !== "admin") e.currentTarget.style.background = "rgba(239,68,68,.28)"; }} onMouseLeave={(e) => { if (user.role !== "admin") e.currentTarget.style.background = "rgba(239,68,68,.15)"; }}>
                    <Lock size={14} /> Khóa
                  </button>
                )}
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20 }}>
              <button aria-label="Close" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1} style={{ border: "none", padding: "8px 12px", borderRadius: 10, background: "#1e293b", color: "white", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1, display: "flex", alignItems: "center" }}><ChevronLeft size={16} /></button>
              <span style={{ color: "#cbd5e1", fontWeight: 600, fontSize: 14 }}>Trang {currentPage} / {totalPages}</span>
              <button aria-label="Close" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages} style={{ border: "none", padding: "8px 12px", borderRadius: 10, background: "#1e293b", color: "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1, display: "flex", alignItems: "center" }}><ChevronRight size={16} /></button>
            </div>
          </>
        )}
      </div>
    </>
  );
}