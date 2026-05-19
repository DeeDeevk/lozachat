// components/admin/UsersTab.tsx
import { useEffect, useState } from "react";
import { Shield, Lock, Unlock, ChevronLeft, ChevronRight } from "lucide-react";

import { useUserStore } from "@/stores/useUserStore";

export default function UsersTab() {
  const { users, getUsers, loading, totalPages, total } = useUserStore();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getUsers(currentPage);
  }, [currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            color: "#f8fafc",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          Danh sách người dùng
        </div>

        <div
          style={{
            color: "#94a3b8",
            fontSize: 13,
          }}
        >
          Tổng: {total} người dùng
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div
          style={{
            color: "#94a3b8",
            textAlign: "center",
            padding: 20,
          }}
        >
          Đang tải danh sách người dùng...
        </div>
      ) : users.length === 0 ? (
        <div
          style={{
            color: "#94a3b8",
            textAlign: "center",
            padding: 20,
          }}
        >
          Không có người dùng nào
        </div>
      ) : (
        <>
          {/* User List */}
          {users.map((user) => (
            <div
              key={user._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderRadius: 16,
                background: "rgba(15,23,42,.7)",
                border: "1px solid rgba(148,163,184,.12)",
              }}
            >
              {/* Avatar */}
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid rgba(96,165,250,.35)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 18,
                    border: "2px solid rgba(96,165,250,.35)",
                    flexShrink: 0,
                  }}
                >
                  {user.displayName?.[0]?.toUpperCase() || "U"}
                </div>
              )}

              {/* Info */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      color: "#f8fafc",
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    {user.displayName}
                  </span>

                  {user.role === "admin" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(59,130,246,.15)",
                        color: "#60a5fa",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <Shield size={12} />
                      ADMIN
                    </div>
                  )}

                  {user.isLocked && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(239,68,68,.15)",
                        color: "#f87171",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <Lock size={12} />
                      LOCKED
                    </div>
                  )}
                </div>

                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: 13,
                    marginBottom: 2,
                  }}
                >
                  @{user.username}
                </div>

                <div
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                  }}
                >
                  {user.email}
                </div>
              </div>

              {/* Action */}
              <button
                style={{
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 12px",
                  background: user.isLocked
                    ? "rgba(34,197,94,.15)"
                    : "rgba(239,68,68,.15)",
                  color: user.isLocked ? "#4ade80" : "#f87171",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {user.isLocked ? (
                  <>
                    <Unlock size={14} />
                    Mở khóa
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    Khóa
                  </>
                )}
              </button>
            </div>
          ))}

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              marginTop: 20,
            }}
          >
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{
                border: "none",
                padding: "8px 12px",
                borderRadius: 10,
                background: "#1e293b",
                color: "white",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <span
              style={{
                color: "#cbd5e1",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Trang {currentPage} / {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              style={{
                border: "none",
                padding: "8px 12px",
                borderRadius: 10,
                background: "#1e293b",
                color: "white",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
