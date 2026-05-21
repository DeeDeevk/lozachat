import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { usePostStore } from "../stores/usePostStore";
import { CreatePost } from "../components/post/CreatePost";
import { FriendSuggestions } from "../components/social/FriendSuggestions";
import { friendService } from "../services/friendService";
import { PostCard } from "../components/post/PostCard";
import { useFeedPosts } from "../hook/usePost";
import { useAuthStore } from "@/stores/useAuthStore";
import SideNav from "../components/SideNav"; // Import SideNav
import { Bell, Search as SearchIcon } from "lucide-react";
import { NotificationPanel } from "../components/post/NotificationPanel";

export const SocialPage = () => {
  const { posts, loading, hasMore, loadMore, deletePost, reactToPost } = useFeedPosts();
  const ensurePostInFeed = usePostStore((s) => s.ensurePostInFeed);
  const loaderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [friendCount, setFriendCount] = useState(0);
  const [focusPostId, setFocusPostId] = useState<string | null>(null);
  const [openCommentsFor, setOpenCommentsFor] = useState(false);
  const [resolvingPost, setResolvingPost] = useState(false);

  const targetPostId = searchParams.get("post");
  const wantComments = searchParams.get("comments") === "1";

  const userProfile = useAuthStore((s) => s.userProfile);
  const user = useAuthStore((s) => s.user);

  const currentUser = {
    _id: userProfile?._id ?? user?.userId ?? "",
    displayName: userProfile?.displayName ?? user?.username ?? "Người dùng",
    avatarUrl: userProfile?.avatarUrl,
  };

  useEffect(() => {
    friendService.getFriendList().then((friends) => setFriendCount(friends?.length ?? 0)).catch(() => {});
  }, []);

  const myPostCount = posts.filter((p) => p.author?._id === currentUser._id).length;
  const totalReactions = posts
    .filter((p) => p.author?._id === currentUser._id)
    .reduce((sum, p) => sum + (p.reactions?.length ?? 0), 0);

  const scrollToPost = useCallback((postId: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(`post-${postId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, []);

  // Deep link: /social?post=xxx&comments=1
  useEffect(() => {
    if (!targetPostId) {
      setOpenCommentsFor(false);
      return;
    }

    let cancelled = false;
    setResolvingPost(true);
    setFocusPostId(targetPostId);
    setOpenCommentsFor(wantComments);

    void (async () => {
      const found = posts.find((p) => p._id === targetPostId);
      if (!found) {
        await ensurePostInFeed(targetPostId);
      }
      if (cancelled) return;
      setResolvingPost(false);
      window.setTimeout(() => {
        if (!cancelled) scrollToPost(targetPostId);
      }, 150);
    })();

    const highlightTimer = window.setTimeout(() => {
      if (!cancelled) setFocusPostId(null);
    }, 4000);

    return () => {
      cancelled = true;
      window.clearTimeout(highlightTimer);
    };
  }, [targetPostId, wantComments, ensurePostInFeed, scrollToPost, posts]);

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
    <div className="flex h-screen overflow-hidden" style={{ background: "#060d1f" }}>
      {/* ── SideNav cố định bên trái ── */}
      <SideNav />

      {/* ── Khu vực nội dung chính ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        
        {/* ── Header: chỉ giữ thanh tìm kiếm + thông báo (sidenav chứa navigation) ── */}
        <header className="sticky top-0 z-40 px-3 h-16 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(8, 14, 28, 0.95)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-full max-w-2xl mx-auto">
              <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-2">
                <SearchIcon size={16} className="text-slate-200" />
                <form
                  className="flex items-center gap-2 w-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const q = (
                      e.currentTarget.elements.namedItem("social-search") as HTMLInputElement
                    )?.value.trim();
                    if (!q) return;
                    navigate(`/search?q=${encodeURIComponent(q)}`);
                  }}
                >
                  <input
                    name="social-search"
                    placeholder="Tìm bài viết hoặc người theo tên / email"
                    className="bg-transparent outline-none text-sm text-slate-200 w-full"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                      }
                    }}
                  />
                </form>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-8 w-px bg-white/10 mx-30" />
          </div>
        </header>

        {/* ── Layout 2 cột (Main Content & Aside) ── */}
        <div className="max-w-[1200px] w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          
          {/* Cột chính: Post Feed */}
          <main className="space-y-6 min-w-0">
            <CreatePost currentUser={currentUser} />

            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-200 whitespace-nowrap">Mới nhất</span>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            {resolvingPost && targetPostId ? (
              <p className="text-sm text-indigo-300 text-center py-2">Đang mở bài viết...</p>
            ) : null}

            <div className="flex flex-col gap-6">
              {posts.length === 0 && !loading ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl py-20 text-center">
                  <p className="text-5xl mb-4">✨</p>
                  <p className="text-slate-300 font-medium">Bảng tin đang trống</p>
                  <p className="text-sm text-slate-500 mt-1">Hãy theo dõi thêm bạn bè để thấy bài viết!</p>
                </div>
              ) : (
                posts.map((post, i) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUserId={currentUser._id}
                    onDelete={(id) => {
                      deletePost(id);
                      if (targetPostId === id) {
                        setSearchParams({}, { replace: true });
                      }
                    }}
                    onReact={reactToPost}
                    highlighted={focusPostId === post._id || targetPostId === post._id}
                    openComments={
                      openCommentsFor &&
                      (targetPostId === post._id || focusPostId === post._id)
                    }
                    style={{ animation: `fp-fadein 0.4s ease-out ${i * 0.05}s both` }}
                  />
                ))
              )}
            </div>

            {/* Infinite Loader */}
            <div ref={loaderRef} className="flex justify-center py-10">
              {loading && (
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <p className="text-sm text-slate-500 font-medium">Bạn đã bắt kịp mọi tin tức 🎉</p>
              )}
            </div>
          </main>

          {/* Cột phải: Widgets (Ẩn trên mobile) */}
          <aside className="hidden lg:flex flex-col gap-6">
            {/* Thẻ profile nhanh */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm">
               <button
                 type="button"
                 onClick={() => currentUser._id && navigate(`/profile/${currentUser._id}`)}
                 className="w-full text-left hover:opacity-90 transition-opacity"
               >
                 <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      {currentUser.avatarUrl ? (
                         <img src={currentUser.avatarUrl} className="w-14 h-14 rounded-2xl object-cover" alt="me" />
                      ) : (
                         <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-xl font-bold text-white uppercase">{initials}</div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-[#0d1425] rounded-full" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base">{currentUser.displayName}</h4>
                      <p className="text-slate-500 text-xs">Xem trang cá nhân →</p>
                    </div>
                 </div>
               </button>

               <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Bài viết", val: String(myPostCount) },
                    { label: "Bạn bè", val: String(friendCount) },
                    { label: "Cảm xúc", val: String(totalReactions) },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/5 rounded-2xl p-2 text-center border border-white/5">
                      <p className="text-white font-bold text-sm">{stat.val}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">{stat.label}</p>
                    </div>
                  ))}
               </div>
            </div>

            <FriendSuggestions />
          </aside>
        </div>
      </div>
      
      {/* ── CSS Animations (Dùng chung với FriendsPage) ── */}
      <style>{`
        @keyframes fp-fadein { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .post-focus-ring {
          outline: 2px solid rgba(99, 102, 241, 0.85);
          outline-offset: 3px;
          box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.2), 0 4px 24px rgba(0,0,0,0.4) !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};

// ─── NotificationBell (local component) ─────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread count on mount
  useEffect(() => {
    import("../services/notificationService").then(({ notificationService }) => {
      notificationService.getUnreadCount().then((res) => setUnreadCount(res.count)).catch(() => {});
    });
  }, []);

  // Listen for real-time notifications to increment badge
  useEffect(() => {
    const handler = () => setUnreadCount((c) => c + 1);
    window.addEventListener("loza:notification", handler);
    return () => window.removeEventListener("loza:notification", handler);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
            style={{ background: "#ef4444", border: "2px solid #080f1c" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      <NotificationPanel
        open={open}
        onClose={() => setOpen(false)}
        unreadCount={unreadCount}
        onUnreadChange={setUnreadCount}
      />
    </div>
  );
}