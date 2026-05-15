import { useAuthStore } from "@/stores/useAuthStore";
import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute() {
  const user = useAuthStore((state) => state.user);
  const userProfile = useAuthStore((state) => state.userProfile);
  const role = userProfile?.role || user?.role;

  if (role !== "admin") {
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
}
