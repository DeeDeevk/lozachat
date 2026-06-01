// components/AppInit.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AppInit() {
  const refresh = useAuthStore((s) => s.refresh);
  const accessToken = useAuthStore((s) => s.accessToken);
  const forceLogoutMessage = useAuthStore((s) => s.forceLogoutMessage);
  const navigate = useNavigate();

  // ✅ Khi load trang, nếu có session thì check còn hợp lệ không
  useEffect(() => {
    if (accessToken) {
      void refresh();
    }
  }, []);

  // ✅ Redirect về signin khi bị force logout (cả online lẫn offline)
  useEffect(() => {
    if (forceLogoutMessage) {
      navigate("/signin");
    }
  }, [forceLogoutMessage]);

  return null;
}