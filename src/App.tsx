// App.tsx
import { BrowserRouter, Route, Routes } from "react-router";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ChatAppPage from "./pages/ChatAppPage";
import { Toaster } from "sonner";
import LandingPage from "./pages/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import FriendsPage from "./pages/FriendPage";
import { SocialPage } from "./pages/SocialPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuthStore } from "./stores/useAuthStore";
import { useSocketStore } from "./stores/useSocketStore";
import { useChatStore } from "./stores/useChatStore";
import { useEffect } from "react";
import PublicRoute from "./components/PublicRoute";
import { useSyncAuthBetweenTabs } from "./hook/useSyncAuthBetweenTabs";
import ForceLogoutDialog from "./components/ForceLogoutDialog"; // ← thêm import

function App() {
  const { accessToken } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();
  const { fetchConversations } = useChatStore();

  useSyncAuthBetweenTabs();

  useEffect(() => {
    if (accessToken) {
      connectSocket();
      void fetchConversations();
    }
    return () => disconnectSocket();
  }, [accessToken]);
  
  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <ForceLogoutDialog /> {/* ← thay ForceLogoutHandler bằng cái này */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<PublicRoute />}>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/chat" element={<ChatAppPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/social" element={<SocialPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;