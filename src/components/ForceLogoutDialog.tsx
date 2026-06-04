import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useSocketStore } from "@/stores/useSocketStore"; // thêm import

export default function ForceLogoutDialog() {
  const forceLogoutMessage = useAuthStore((s) => s.forceLogoutMessage);
  const clearForceLogout = useAuthStore((s) => s.clearForceLogout);
  const signOut = useAuthStore((s) => s.signOut);
  const disconnectSocket = useSocketStore((s) => s.disconnectSocket); // thêm
  const navigate = useNavigate();

  if (!forceLogoutMessage) return null;

  const handleConfirm = async () => {
    disconnectSocket(); // ✅ ngắt socket TRƯỚC để không nhận thêm event
    clearForceLogout();
    await signOut();
    navigate("/signin");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "32px 28px",
          maxWidth: 420,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3
          style={{
            color: "white",
            marginBottom: 10,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          Phiên đăng nhập bị thay thế
        </h3>
        <p
          style={{
            color: "#94a3b8",
            marginBottom: 28,
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {forceLogoutMessage}
          <br />
          Nhấn xác nhận để đăng xuất.
        </p>
        <button
          onClick={handleConfirm}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "11px 36px",
            fontSize: 14,
            cursor: "pointer",
            fontWeight: 600,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Xác nhận
        </button>
      </div>
    </div>
  );
}
