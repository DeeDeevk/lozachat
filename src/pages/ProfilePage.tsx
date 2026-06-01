import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { postService } from "../services/postService";
import { PostCard } from "../components/post/PostCard";
import SideNav from "../components/SideNav";
import { userService, type UserProfile } from "../services/userService";
import { useAuthStore } from "../stores/useAuthStore";
import type { Post, ReactionType } from "../types/post";
import { normalizePost, normalizePosts } from "../utils/normalizePost";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { userId } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userProfile = useAuthStore((s) => s.userProfile);
  const setUserProfile = useAuthStore((s) => s.setUserProfile);
  const user = useAuthStore((s) => s.user);
  const currentUserId = userProfile?._id ?? user?.userId ?? "";
  const [bioDraft, setBioDraft] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [editingBio, setEditingBio] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError("");

    void Promise.allSettled([
      postService.getUserPosts(userId, 1),
      userService.getPublicProfileById(userId),
    ])
      .then(([postResult, profileResult]) => {
        const fetchedPosts =
          postResult.status === "fulfilled"
            ? normalizePosts(postResult.value.posts || [])
            : [];
        setPosts(fetchedPosts);

        if (profileResult.status === "fulfilled" && profileResult.value.user) {
          setProfileUser(profileResult.value.user);
          return;
        }

        const fallbackAuthor = fetchedPosts[0]?.author;
        if (fallbackAuthor?._id) {
          setProfileUser({
            _id: fallbackAuthor._id,
            username: fallbackAuthor.displayName || "unknown",
            displayName: fallbackAuthor.displayName || "Người dùng",
            avatarUrl: fallbackAuthor.avatarUrl,
            email: "",
            bio: "",
            phone: "",
            role: "user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          setProfileUser(null);
        }

        if (postResult.status === "rejected" && profileResult.status === "rejected") {
          setError("Không tải được trang cá nhân. Vui lòng thử lại.");
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const isOwner = Boolean(profileUser && currentUserId && profileUser._id === currentUserId);

  useEffect(() => {
    if (profileUser?.bio !== undefined) setBioDraft(profileUser.bio || "");
  }, [profileUser?.bio, profileUser?._id]);

  const handleSaveBio = async () => {
    if (!isOwner) return;
    setSavingBio(true);
    try {
      const res = await userService.updateMe({ bio: bioDraft.trim() });
      setProfileUser(res.user);
      setUserProfile(res.user);
      setEditingBio(false);
      toast.success("Đã cập nhật tiểu sử");
    } catch {
      toast.error("Không thể cập nhật tiểu sử");
    } finally {
      setSavingBio(false);
    }
  };

  const visibilityStats = useMemo(() => {
    return {
      public: posts.filter((p) => p.visibility === "public").length,
      friends: posts.filter((p) => p.visibility === "friends").length,
      private: posts.filter((p) => p.visibility === "private").length,
    };
  }, [posts]);

  const initials = (profileUser?.displayName || "Người dùng")
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  const handleDelete = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch {
      // Toast handled at service/store level
    }
  };

  const handleReact = async (postId: string, type: ReactionType) => {
    try {
      const updated = normalizePost(await postService.reactToPost(postId, type));
      setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
    } catch {
      // Toast handled at service/store level
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#060d1f" }}>
      <SideNav />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1100px] mx-auto px-4 py-6 space-y-6">
          <section
            className="rounded-3xl overflow-hidden border"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
          >
            <div
              className="h-44"
              style={{
                background:
                  "linear-gradient(120deg, rgba(30,58,138,0.8) 0%, rgba(15,23,42,0.9) 46%, rgba(2,132,199,0.7) 100%)",
              }}
            />

            <div className="px-6 pb-6 -mt-10">
              <div className="flex flex-wrap items-end gap-4 justify-between">
                <div className="flex items-end gap-4">
                  {profileUser?.avatarUrl ? (
                    <img
                      src={profileUser.avatarUrl}
                      alt={profileUser.displayName}
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-[#060d1f]"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-cyan-600 text-white font-bold text-3xl border-4 border-[#060d1f] flex items-center justify-center">
                      {initials}
                    </div>
                  )}

                  <div className="pb-1">
                    <h1 className="text-white text-2xl font-bold">
                      {profileUser?.displayName || "Trang cá nhân"}
                    </h1>
                    <p className="text-slate-400 text-sm">
                      @{profileUser?.username || "unknown"}
                    </p>
                    {profileUser?.bio ? (
                      <p className="text-slate-300 text-sm mt-2 max-w-xl">{profileUser.bio}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-1">
                  <StatItem label="Bài viết" value={String(posts.length)} />
                  <StatItem label="Công khai" value={String(visibilityStats.public)} />
                  <StatItem label="Bạn bè" value={String(visibilityStats.friends)} />
                  <StatItem label="Riêng tư" value={String(visibilityStats.private)} />
                </div>

                <div className="flex items-center gap-2 pb-1 mt-2">
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/profile/${userId}`;
                      navigator.clipboard.writeText(url).then(
                        () => toast.success("Đã sao chép liên kết trang cá nhân!"),
                        () => toast.error("Không thể sao chép liên kết"),
                      );
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#e2e8f0",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                  >
                    <span>🔗</span> Chia sẻ trang cá nhân
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <aside className="space-y-4">
              <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-sm font-semibold">Giới thiệu</h3>
                  {isOwner && !editingBio ? (
                    <button
                      type="button"
                      onClick={() => setEditingBio(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Chỉnh sửa
                    </button>
                  ) : null}
                </div>
                {isOwner && editingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      maxLength={500}
                      rows={4}
                      placeholder="Viết vài dòng về bạn..."
                      className="w-full rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 px-3 py-2 outline-none focus:border-indigo-500/50 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={savingBio}
                        onClick={handleSaveBio}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {savingBio ? "Đang lưu..." : "Lưu"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBioDraft(profileUser?.bio || "");
                          setEditingBio(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs font-semibold hover:bg-white/10"
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300">{profileUser?.bio || "Chưa cập nhật tiểu sử."}</p>
                )}
                {profileUser?.createdAt ? (
                  <p className="text-xs text-slate-500 mt-3">
                    Tham gia từ {new Date(profileUser.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                ) : null}
              </div>
            </aside>

            <main className="space-y-4">
              <h2 className="text-white text-lg font-semibold">
                {isOwner ? "Bài viết của bạn" : "Bài viết trên trang cá nhân"}
              </h2>

              {loading ? <p className="text-slate-400">Đang tải...</p> : null}
              {error ? <p className="text-red-400 text-sm">{error}</p> : null}

              {!loading && !error && posts.length === 0 ? (
                <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-4xl mb-2">📝</p>
                  <p className="text-slate-300">Chưa có bài viết hiển thị</p>
                </div>
              ) : null}

              {posts.map((p) => (
                <PostCard
                  key={p._id}
                  post={p}
                  currentUserId={currentUserId}
                  onDelete={handleDelete}
                  onReact={handleReact}
                />
              ))}
            </main>
          </section>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border px-3 py-2 text-center"
      style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
    >
      <p className="text-white text-sm font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}
