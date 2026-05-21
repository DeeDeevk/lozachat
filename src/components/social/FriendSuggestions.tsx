import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { friendService, type FriendSuggestion } from "@/services/friendService";
import FriendActionButton from "@/components/FriendActionButton";

export function FriendSuggestions() {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    friendService
      .getSuggestions(8)
      .then((res) =>
        setSuggestions(
          (res.suggestions || []).map((u) => ({
            ...u,
            _id: typeof u._id === "string" ? u._id : String(u._id),
          })),
        ),
      )
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSent = (userId: string) => {
    setSuggestions((prev) => prev.filter((u) => u._id !== userId));
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold text-sm mb-4">Gợi ý kết bạn</h3>
        <p className="text-slate-500 text-xs">Đang tải...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold text-sm mb-2">Gợi ý kết bạn</h3>
        <p className="text-slate-500 text-xs">Chưa có gợi ý. Hãy tìm bạn qua tên hoặc email!</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <h3 className="text-white font-bold text-sm mb-4">Gợi ý kết bạn</h3>
      <div className="space-y-4">
        {suggestions.map((user) => {
          const initials = (user.displayName || user.username || "?")
            .split(" ")
            .map((w) => w[0])
            .slice(-2)
            .join("")
            .toUpperCase();

          return (
            <div key={user._id} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/profile/${user._id}`)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-90 transition-opacity"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-slate-500 text-[11px] truncate">
                    @{user.username}
                  </p>
                </div>
              </button>
              <FriendActionButton
                userId={user._id}
                displayName={user.displayName}
                username={user.username}
                onRequestSent={() => handleSent(user._id)}
                className="flex-shrink-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
