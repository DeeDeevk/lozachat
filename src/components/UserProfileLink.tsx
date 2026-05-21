import { useNavigate } from "react-router";

interface UserProfileLinkProps {
  userId?: string | null;
  displayName?: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { avatar: "w-7 h-7 text-xs", name: "text-xs" },
  md: { avatar: "w-10 h-10 text-sm", name: "text-sm" },
  lg: { avatar: "w-14 h-14 text-base", name: "text-base" },
};

export function UserProfileLink({
  userId,
  displayName = "Người dùng",
  avatarUrl,
  size = "md",
  showName = true,
  className = "",
}: UserProfileLinkProps) {
  const navigate = useNavigate();
  const s = sizeMap[size];

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  const goProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userId) navigate(`/profile/${userId}`);
  };

  return (
    <div
      className={`flex items-center gap-2 min-w-0 ${className}`}
      style={{ cursor: userId ? "pointer" : "default" }}
      onClick={userId ? goProfile : undefined}
      role={userId ? "button" : undefined}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className={`${s.avatar} mb-auto rounded-full object-cover flex-shrink-0 hover:opacity-90 transition-opacity`}
        />
      ) : (
        <div
          className={`${s.avatar} rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold bg-indigo-600 hover:opacity-90 transition-opacity`}
        >
          {initials}
        </div>
      )}
      {showName ? (
        <span
          className={`${s.name} font-semibold truncate hover:underline`}
          style={{ color: "var(--loza-text, #e2e8f0)" }}
        >
          {displayName}
        </span>
      ) : null}
    </div>
  );
}
