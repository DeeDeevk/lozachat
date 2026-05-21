import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { notificationService } from "../../services/notificationService";
import type { NotificationItem, NotificationType } from "../../types/post";
import { useNavigate } from "react-router";
import { UserProfileLink } from "../UserProfileLink";
import { normalizeNotification } from "../../utils/normalizeNotification";
import { getNotifMessage, getNotifSubtext, NOTIF_TOAST_ICON } from "../../utils/notificationMessage";

const NOTIF_ICON: Record<NotificationType, string> = NOTIF_TOAST_ICON;

interface Props {
  open: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadChange: Dispatch<SetStateAction<number>>;
}

export function NotificationPanel({ open, onClose, unreadCount, onUnreadChange }: Props) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async (p: number, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(p);
      const normalized = (res.notifications || []).map(normalizeNotification);
      setItems((prev) => (reset ? normalized : [...prev, ...normalized]));
      setHasMore(res.pagination.hasMore);
      onUnreadChange(res.unreadCount);
    } catch (e) {
      console.warn("fetch notifications failed", e);
    } finally {
      setLoading(false);
    }
  }, [loading, onUnreadChange]);

  useEffect(() => {
    if (open) {
      setPage(1);
      fetchNotifications(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Realtime từ socket (App.tsx → useSocketStore)
  useEffect(() => {
    const handler = (e: Event) => {
      const notif = normalizeNotification((e as CustomEvent).detail);
      setItems((prev) => {
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
      onUnreadChange((c) => c + 1);
    };
    window.addEventListener("loza:notification", handler);
    return () => window.removeEventListener("loza:notification", handler);
  }, [onUnreadChange]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      onUnreadChange(0);
    } catch (e) {
      console.warn("mark all read failed", e);
    }
  };

  const handleClickNotif = async (n: NotificationItem) => {
    if (!n.read) {
      try {
        await notificationService.markRead(n._id);
        setItems((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, read: true } : item)),
        );
        onUnreadChange((c) => Math.max(0, c - 1));
      } catch {
        /* ignore */
      }
    }
    if (n.postId?._id) {
      onClose();
      const params = new URLSearchParams();
      params.set("post", n.postId._id);
      if (
        n.type === "comment" ||
        n.type === "reply" ||
        n.type === "react_comment"
      ) {
        params.set("comments", "1");
      }
      navigate(`/social?${params.toString()}`);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[55]" onClick={onClose} />

      <div
        className="absolute right-0 mt-2 w-[380px] rounded-2xl overflow-hidden z-[56]"
        style={{
          background: "var(--loza-bg-elevated, #0d1425)",
          border: "1px solid var(--loza-border, rgba(255,255,255,0.08))",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h4 className="font-bold text-sm" style={{ color: "var(--loza-text, #e2e8f0)" }}>
            Thông báo
            {unreadCount > 0 && (
              <span
                className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: "var(--loza-accent, #6366f1)", color: "#fff" }}
              >
                {unreadCount}
              </span>
            )}
          </h4>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold transition-colors"
              style={{
                color: "var(--loza-accent, #6366f1)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto"
          style={{ maxHeight: "400px" }}
        >
          {items.length === 0 && !loading ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">🔔</p>
              <p className="text-sm" style={{ color: "var(--loza-muted, #64748b)" }}>
                Chưa có thông báo nào
              </p>
            </div>
          ) : (
            items.map((n) => {
              const subtext = getNotifSubtext(n);
              return (
                <div
                  key={n._id}
                  onClick={() => handleClickNotif(n)}
                  className="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer"
                  style={{
                    background: n.read ? "transparent" : "rgba(99, 102, 241, 0.06)",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                  }}
                >
                  <div
                    className="relative flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (n.actorId?._id) {
                        onClose();
                        navigate(`/profile/${n.actorId._id}`);
                      }
                    }}
                  >
                    <UserProfileLink
                      userId={n.actorId?._id}
                      displayName={n.actorId?.displayName || "Ai đó"}
                      avatarUrl={n.actorId?.avatarUrl}
                      showName={false}
                    />
                    <span
                      className="absolute -bottom-1 -right-1 text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      style={{
                        background: "var(--loza-bg-elevated, #0d1425)",
                        border: "2px solid var(--loza-bg-elevated, #0d1425)",
                      }}
                    >
                      {NOTIF_ICON[n.type] || "🔔"}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm leading-snug"
                      style={{
                        color: n.read ? "var(--loza-sub, #94a3b8)" : "var(--loza-text, #e2e8f0)",
                        fontWeight: n.read ? 400 : 500,
                      }}
                    >
                      {getNotifMessage(n)}
                    </p>
                    {subtext ? (
                      <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: "var(--loza-muted, #64748b)" }}
                      >
                        {subtext}
                      </p>
                    ) : null}
                    <p
                      className="text-[11px] mt-1"
                      style={{
                        color: n.read ? "var(--loza-muted, #64748b)" : "var(--loza-accent, #6366f1)",
                      }}
                    >
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </p>
                  </div>

                  {!n.read && (
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2"
                      style={{ background: "var(--loza-accent, #6366f1)" }}
                    />
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                      background: "var(--loza-accent, #6366f1)",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
