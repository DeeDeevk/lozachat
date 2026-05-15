import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { getBroadcastChannel } from "@/lib/broadcastChannel";

export const useSyncAuthBetweenTabs = () => {
  // Chỉ lấy initFromBroadcast và clearState, không lấy fetchConversations nữa
  const initFromBroadcast = useAuthStore((s) => s.initFromBroadcast);
  const clearState = useAuthStore((s) => s.clearState);

  useEffect(() => {
    const channel = getBroadcastChannel();

    const handleMessage = async (event: MessageEvent) => {
      const { type, payload } = event.data;

      if (type === "AUTH_LOGIN") {
        // Gọi 1 hàm duy nhất, xử lý đúng thứ tự bên trong
        await initFromBroadcast(payload.accessToken);
      } else if (type === "AUTH_LOGOUT") {
        clearState();
      }
    };

    channel.addEventListener("message", handleMessage);
    return () => channel.removeEventListener("message", handleMessage);
  }, [initFromBroadcast, clearState]);
};

export const broadcastLogin = (accessToken: string) => {
  const channel = getBroadcastChannel();
  channel.postMessage({ type: "AUTH_LOGIN", payload: { accessToken } });
};

export const broadcastLogout = () => {
  const channel = getBroadcastChannel();
  channel.postMessage({ type: "AUTH_LOGOUT" });
};
