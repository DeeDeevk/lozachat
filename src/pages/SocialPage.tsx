import { useEffect, useRef } from "react";
import { CreatePost } from "../components/post/CreatePost";
import { PostCard } from "../components/post/PostCard";
import { useFeedPosts } from "../hook/usePost";
import { useAuthStore } from "@/stores/useAuthStore";

export const SocialPage = () => {
  const { posts, loading, hasMore, loadMore, deletePost, reactToPost } = useFeedPosts();
  const loaderRef = useRef<HTMLDivElement>(null);

  const userProfile = useAuthStore((s) => s.userProfile);
  const user = useAuthStore((s) => s.user);

  const currentUser = {
    _id: userProfile?._id ?? user?.userId ?? "",
    displayName: userProfile?.displayName ?? user?.username ?? "Người dùng",
    avatarUrl: userProfile?.avatarUrl,
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.5 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const initials = currentUser.displayName
    .split(" ").map((w: string) => w[0]).slice(-2).join("").toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: "var(--loza-bg-base)" }}>

      <header
        className="sticky top-0 z-40"
        style={{
          borderBottom: "1px solid var(--loza-border)",
          background: "color-mix(in srgb, var(--loza-bg-base) 85%, transparent)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "var(--loza-accent)",
                boxShadow: "0 0 12px var(--loza-accent-glow)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: "var(--loza-text)" }}>
              Loza
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {["Bảng tin", "Khám phá", "Bạn bè"].map((item, i) => (
              <button
                key={item}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  background: i === 0
                    ? "color-mix(in srgb, var(--loza-accent) 15%, transparent)"
                    : "transparent",
                  color: i === 0 ? "var(--loza-accent-light)" : "var(--loza-sub)",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (i !== 0) {
                    e.currentTarget.style.background = "var(--loza-bg-hover)";
                    e.currentTarget.style.color = "var(--loza-text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (i !== 0) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--loza-sub)";
                  }
                }}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "transparent", border: "none", color: "var(--loza-sub)", cursor: "pointer" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--loza-bg-hover)";
                e.currentTarget.style.color = "var(--loza-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--loza-sub)";
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
            </button>

            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                className="w-8 h-8 rounded-full object-cover cursor-pointer"
                style={{
                  outline: "2px solid color-mix(in srgb, var(--loza-accent) 40%, transparent)",
                  outlineOffset: "2px",
                }}
                alt={currentUser.displayName}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                style={{
                  background: "var(--loza-accent)",
                  outline: "2px solid color-mix(in srgb, var(--loza-accent) 35%, transparent)",
                  outlineOffset: "2px",
                }}
              >
                {initials}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[1fr_288px] gap-6">

        <main className="space-y-4 min-w-0">
          <CreatePost currentUser={currentUser} />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--loza-border)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--loza-muted)" }}>
              Bài viết mới nhất
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--loza-border)" }} />
          </div>

          {posts.length === 0 && !loading ? (
            <div className="loza-card py-16 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm" style={{ color: "var(--loza-sub)" }}>Chưa có bài viết nào.</p>
              <p className="text-xs mt-1" style={{ color: "var(--loza-muted)" }}>Hãy là người đầu tiên chia sẻ!</p>
            </div>
          ) : (
            posts.map((post, i) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={currentUser._id}
                onDelete={deletePost}
                onReact={reactToPost}
                style={{ animationDelay: `${i * 0.06}s` }}
              />
            ))
          )}

          <div ref={loaderRef} className="flex justify-center py-4">
            {loading && (
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="loza-bounce w-2 h-2 rounded-full"
                    style={{ background: "var(--loza-accent)", animationDelay: `${i * 0.16}s` }}
                  />
                ))}
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-xs" style={{ color: "var(--loza-muted)" }}>
                Bạn đã xem hết rồi 🎉
              </p>
            )}
          </div>
        </main>

        <aside className="hidden md:flex flex-col gap-4">
          {/* Profile card */}
          <div className="loza-card p-4">
            <div className="flex items-center gap-3 mb-4">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  className="w-12 h-12 rounded-full object-cover"
                  style={{
                    outline: "2px solid color-mix(in srgb, var(--loza-accent) 30%, transparent)",
                    outlineOffset: "2px",
                  }}
                  alt={currentUser.displayName}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    background: "var(--loza-accent)",
                    outline: "2px solid color-mix(in srgb, var(--loza-accent) 30%, transparent)",
                    outlineOffset: "2px",
                  }}
                >
                  {initials}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--loza-text)" }}>
                  {currentUser.displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="loza-online-dot" />
                  <span className="text-xs" style={{ color: "var(--loza-sub)" }}>Đang hoạt động</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Bài viết", value: posts.filter((p) => p.author._id === currentUser._id).length.toString() },
                { label: "Bạn bè", value: "0" },
                { label: "Theo dõi", value: "0" },
              ].map((s) => (
                <div key={s.label} className="loza-card-elevated py-2 rounded-xl">
                  <p className="font-bold text-base" style={{ color: "var(--loza-accent)" }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--loza-muted)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gợi ý kết bạn */}
          <div className="loza-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--loza-sub)" }}>
              Gợi ý kết bạn
            </p>
            <div className="space-y-3">
              {[
                { name: "Nguyễn Hoàng", mutual: 3 },
                { name: "Trần Phương", mutual: 2 },
                { name: "Lê Bảo Châu", mutual: 5 },
              ].map(({ name, mutual }) => {
                const abbr = name.split(" ").map((w) => w[0]).slice(-2).join("");
                return (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "var(--loza-bg-elevated)",
                          border: "1px solid var(--loza-border)",
                          color: "var(--loza-sub)",
                        }}
                      >{abbr}</div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: "var(--loza-text)" }}>{name}</p>
                        <p className="text-xs" style={{ color: "var(--loza-muted)" }}>{mutual} bạn chung</p>
                      </div>
                    </div>
                    <button
                      className="text-xs font-semibold transition-all rounded-md"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--loza-accent)",
                        padding: "4px 8px",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--loza-accent-light)";
                        e.currentTarget.style.background = "var(--loza-bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--loza-accent)";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >+ Kết bạn</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Xu hướng */}
          <div className="loza-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--loza-sub)" }}>
              Xu hướng
            </p>
            <div className="space-y-2.5">
              {["#LozaChat", "#ReactJS", "#NodeJS", "#MongoDB", "#FullStack"].map((tag, i) => (
                <div key={tag} className="flex items-center justify-between">
                  <span
                    className="text-sm font-medium cursor-pointer transition-colors"
                    style={{ color: "var(--loza-accent-light)" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--loza-text)")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--loza-accent-light)")}
                  >{tag}</span>
                  <span className="text-xs" style={{ color: "var(--loza-muted)" }}>{14 - i * 2}k bài</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};