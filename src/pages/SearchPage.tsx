import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Search as SearchIcon, Users, FileText } from "lucide-react";
import SideNav from "../components/SideNav";
import { PostCard } from "../components/post/PostCard";
import { searchService, type SearchUser } from "../services/searchService";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostStore } from "../stores/usePostStore";
import { normalizePost, normalizePosts } from "../utils/normalizePost";
import type { Post, ReactionType } from "../types/post";
import FriendActionButton from "../components/FriendActionButton";
import { UserProfileLink } from "../components/UserProfileLink";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = (searchParams.get("q") || "").trim();

  const [input, setInput] = useState(query);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [searched, setSearched] = useState(false);

  const userProfile = useAuthStore((s) => s.userProfile);
  const user = useAuthStore((s) => s.user);
  const deletePost = usePostStore((s) => s.deletePost);

  const currentUserId = userProfile?._id ?? user?.userId ?? "";

  const runSearch = useCallback(async (keyword: string) => {
    const q = keyword.trim();
    if (!q) {
      setPosts([]);
      setUsers([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchService.search(q);
      setPosts(normalizePosts(res.posts || []));
      setUsers(
        (res.users || []).map((u) => ({
          ...u,
          _id: typeof u._id === "string" ? u._id : String(u._id),
        })),
      );
    } catch {
      setPosts([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setInput(query);
    if (query) void runSearch(query);
    else {
      setPosts([]);
      setUsers([]);
      setSearched(false);
    }
  }, [query, runSearch]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q) return;
    setSearchParams({ q }, { replace: true });
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch {
      /* toast in store */
    }
  };

  const handleReact = async (postId: string, type: ReactionType) => {
    try {
      const { postService } = await import("../services/postService");
      const updated = normalizePost(await postService.reactToPost(postId, type));
      setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
    } catch {
      /* toast in service */
    }
  };

  const hasUsers = users.length > 0;
  const hasPosts = posts.length > 0;
  const isEmpty = searched && !loading && !hasUsers && !hasPosts;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#060d1f" }}>
      <SideNav />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        <header
          className="sticky top-0 z-40 px-3 h-16 flex items-center gap-3 flex-shrink-0"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            background: "rgba(8, 14, 28, 0.95)",
            backdropFilter: "blur(12px)",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/social")}
            className="p-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all flex-shrink-0"
            title="Quay lại Bảng tin"
          >
            <ArrowLeft size={20} />
          </button>

          <form onSubmit={handleSubmit} className="flex-1 max-w-2xl">
            <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-2 border border-white/5 focus-within:border-indigo-500/40 transition-colors">
              <SearchIcon size={16} className="text-slate-400 flex-shrink-0" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tìm bài viết hoặc người theo tên / email"
                className="bg-transparent outline-none text-sm text-slate-200 w-full"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Tìm
              </button>
            </div>
          </form>
        </header>

        <div className="max-w-[900px] w-full mx-auto px-4 py-6 space-y-8">
          {query ? (
            <p className="text-slate-400 text-sm">
              Kết quả cho{" "}
              <span className="text-slate-200 font-semibold">&quot;{query}&quot;</span>
            </p>
          ) : (
            <div className="text-center py-16">
              <SearchIcon size={40} className="mx-auto text-slate-600 mb-3" />
              <p className="text-slate-300 font-medium">Nhập từ khóa để tìm kiếm</p>
              <p className="text-slate-500 text-sm mt-1">
                Bài viết theo nội dung · Người dùng theo tên hoặc email
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12 gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          ) : null}

          {isEmpty ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 py-16 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-slate-300 font-medium">Không tìm thấy kết quả</p>
              <p className="text-slate-500 text-sm mt-1">Thử từ khóa khác</p>
            </div>
          ) : null}

          {hasUsers && !loading ? (
            <section>
              <h2 className="flex items-center gap-2 text-white font-bold text-sm mb-4">
                <Users size={18} className="text-indigo-400" />
                Người dùng ({users.length})
              </h2>
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <UserProfileLink
                        userId={u._id}
                        displayName={u.displayName || u.username}
                        avatarUrl={u.avatarUrl}
                        showName={false}
                        size="md"
                      />
                      <div
                        className="min-w-0 cursor-pointer"
                        onClick={() => navigate(`/profile/${u._id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") navigate(`/profile/${u._id}`);
                        }}
                        role="link"
                        tabIndex={0}
                      >
                        <p className="text-white font-semibold text-sm truncate hover:underline">
                          {u.displayName || u.username}
                        </p>
                        <p className="text-slate-500 text-xs truncate">
                          @{u.username}
                          {u.email ? ` · ${u.email}` : ""}
                        </p>
                        {u.bio ? (
                          <p className="text-slate-400 text-xs mt-1 line-clamp-1">{u.bio}</p>
                        ) : null}
                      </div>
                    </div>
                    <FriendActionButton
                      userId={u._id}
                      displayName={u.displayName}
                      username={u.username}
                      className="flex-shrink-0"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {hasPosts && !loading ? (
            <section>
              <h2 className="flex items-center gap-2 text-white font-bold text-sm mb-4">
                <FileText size={18} className="text-indigo-400" />
                Bài viết ({posts.length})
              </h2>
              <div className="flex flex-col gap-6">
                {posts.map((post, i) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUserId={currentUserId}
                    onDelete={handleDelete}
                    onReact={handleReact}
                    style={{ animation: `fp-fadein 0.35s ease-out ${i * 0.04}s both` }}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes fp-fadein {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
