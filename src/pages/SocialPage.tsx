import { useEffect, useRef } from "react";
import { CreatePost } from "../components/post/CreatePost";
import { PostCard } from "../components/post/PostCard";
import { useFeedPosts } from "../hook/usePost";
import { useAuthStore } from "@/stores/useAuthStore";
import SideNav from "../components/SideNav"; // Import SideNav
import { Bell, Search as SearchIcon } from "lucide-react";

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
    <div className="flex h-screen overflow-hidden" style={{ background: "#060d1f" }}>
      {/* ── SideNav cố định bên trái ── */}
      <SideNav />

      {/* ── Khu vực nội dung chính ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        
        {/* ── Header theo phong cách FriendsPage ── */}
        <header
          className="sticky top-0 z-40 px-3 h-16 flex items-center justify-between flex-shrink-0"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(8, 14, 28, 0.95)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-4">
            <p className="font-bold text-white tracking-tight text-xl">Bảng tin</p>
            <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full px-3 py-1 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Trực tuyến</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                <SearchIcon size={20} />
             </button>
             <button className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#080f1c]" />
             </button>
             <div className="h-8 w-px bg-white/10 mx-1" />
             {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} className="w-9 h-9 rounded-xl object-cover border border-white/20" alt="me" />
             ) : (
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                  {initials}
                </div>
             )}
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
                    onDelete={deletePost}
                    onReact={reactToPost}
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
                    <p className="text-slate-500 text-xs">@{currentUser._id.slice(-6)}</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Bài viết", val: posts.filter(p => p.author?._id === currentUser._id).length },
                    { label: "Bạn bè", val: "128" },
                    { label: "Likes", val: "1.2k" }
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/5 rounded-2xl p-2 text-center border border-white/5">
                      <p className="text-white font-bold text-sm">{stat.val}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">{stat.label}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Trending / Xu hướng */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                <span className="text-indigo-400">#</span> Xu hướng Loza
              </h3>
              <div className="space-y-4">
                {["#ReactJS", "#NodeJS", "#LozaSocial", "#WebDev"].map((tag) => (
                  <div key={tag} className="group cursor-pointer">
                    <p className="text-indigo-400 font-bold text-sm group-hover:text-indigo-300 transition-colors">{tag}</p>
                    <p className="text-slate-500 text-[11px]">1.2k bài viết</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
      
      {/* ── CSS Animations (Dùng chung với FriendsPage) ── */}
      <style>{`
        @keyframes fp-fadein { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};