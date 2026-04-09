import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

const PublicRoute = () => {
  const { accessToken, loading, refresh } = useAuthStore();
  const [starting, setStarting] = useState(true);

  const init = async () => {
    // Nếu chưa có accessToken → thử refresh từ cookie
    if (!accessToken) {
      await refresh();
    }

    setStarting(false);
  };

  useEffect(() => {
    init();
  }, []);

  // loading màn hình
  if (starting || loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  // 🔥 Nếu đã login → đá qua /chat
  if (accessToken) {
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;