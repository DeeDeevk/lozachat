// hook/useAppInit.ts
import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router-dom";

export function useAppInit() {
  const refresh = useAuthStore((s) => s.refresh);
  const accessToken = useAuthStore((s) => s.accessToken);
  const forceLogoutMessage = useAuthStore((s) => s.forceLogoutMessage);
  const navigate = useNavigate();

  useEffect(() => {
    // Chỉ check khi đang có session (user đã từng đăng nhập)
    if (accessToken) {
      refresh();
    }
  }, []); // Chỉ chạy 1 lần khi mount

  // ✅ Redirect khi bị force logout (cả online lẫn offline case)
  useEffect(() => {
    if (forceLogoutMessage) {
      navigate("/signin");
    }
  }, [forceLogoutMessage]);
}