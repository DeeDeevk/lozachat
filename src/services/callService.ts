import api from "@/lib/axios";

export type CallKind = "voice" | "video";

interface LiveKitTokenResponse {
  token: string;
  wsUrl: string;
  roomName: string;
  kind: CallKind;
}

export const callService = {
  async createLiveKitToken(
    conversationId: string,
    kind: CallKind,
    roomName?: string,
  ): Promise<LiveKitTokenResponse> {
    const response = await api.post<LiveKitTokenResponse>(
      "/calls/livekit-token",
      {
        conversationId,
        kind,
        roomName,
      },
      { withCredentials: true },
    );

    return response.data;
  },
};
