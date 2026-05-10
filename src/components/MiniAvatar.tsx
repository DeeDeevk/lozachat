// ✅ Bỏ import React vì không dùng trực tiếp (JSX transform tự xử lý)

export interface ParticipantAvatar {
  displayName?: string;
  avatarUrl?: string;
  username?: string;
}

interface MiniAvatarProps {
  p: ParticipantAvatar;
  fontSize?: number;
}

const getAvatarColor = (name: string) => {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#ec4899",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default function MiniAvatar({ p, fontSize = 14 }: MiniAvatarProps) {
  const name = p.displayName || p.username || "?";

  if (p.avatarUrl) {
    return (
      <img
        src={p.avatarUrl}
        alt={name}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: getAvatarColor(name),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize,
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
