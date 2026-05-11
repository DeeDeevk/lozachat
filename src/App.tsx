+// import './App.css'
import { BrowserRouter, Route, Routes } from "react-router";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ChatAppPage from "./pages/ChatAppPage";
import { Toaster } from "sonner";
import LandingPage from "./pages/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import FriendsPage from "./pages/FriendPage";
import { SocialPage } from "./pages/SocialPage";
import { useAuthStore } from "./stores/useAuthStore";
import { useSocketStore } from "./stores/useSocketStore";
import { useEffect } from "react";
import PublicRoute from "./components/PublicRoute";
function App() {
  const { accessToken} = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    }
    return () => disconnectSocket();
  }, [accessToken]);

 

  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* public route */}
          <Route element={<PublicRoute />}>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
          </Route>
          {/* protected route */}
          <Route element={<ProtectedRoute />}>
            <Route path="/chat" element={<ChatAppPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/social" element={<SocialPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
