// components/InputAreaGuard.tsx
import { type ReactNode } from "react";

interface InputAreaGuardProps {
  activeConversation: {
    type?: string;
    group?: {
      settings?: {
        whoCanSendMessages?: string;
        requireApprovalToJoin?: boolean;
      };
    };
    participants?: {
      _id: string;
      role?: string;
    }[];
  } | null;
  user?: {
    userId?: string;
  } | null;
  children: ReactNode;
}

export default function InputAreaGuard({
  activeConversation,
  user,
  children,
}: InputAreaGuardProps) {
  const settings = activeConversation?.group?.settings;
  const isGroup = activeConversation?.type === "group";
  const currentParticipant = activeConversation?.participants?.find(
    (p) => p._id === user?.userId,
  );
  const canSend =
    !isGroup ||
    settings?.whoCanSendMessages === "all" ||
    currentParticipant?.role === "owner" ||
    currentParticipant?.role === "admin";

  if (!canSend) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "14px",
          color: "#64748b",
          fontSize: 13,
          border: "1px solid rgba(148,163,184,.15)",
          borderRadius: 12,
          background: "rgba(15,23,42,.5)",
        }}
      >
        🔒 Chỉ trưởng nhóm và phó nhóm mới được gửi tin nhắn
      </div>
    );
  }

  return <>{children}</>;
}
