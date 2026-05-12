import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ProtectedRoute = () => {
  const {
    accessToken,
    user,
    loading,
    refresh,
    fetchCurrentUser,
    fetchMe,
    signOut: _signOut,
  } = useAuthStore();
  const [starting, setStarting] = useState(true);

  const init = async () => {
    // có thể xảy ra khi refresh trang
    if (!accessToken) {
      await refresh();
    }

    if (accessToken && !user) {
      await fetchCurrentUser();
      await fetchMe();
    }

    setStarting(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
  }, []);

  if (starting || loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/signin" replace></Navigate>;
  }

  return <Outlet></Outlet>;
};

export default ProtectedRoute;
