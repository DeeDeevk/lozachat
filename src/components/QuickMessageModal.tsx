import { useState, useEffect, useRef } from "react";
import api from "@/lib/axios";
import {
  X,
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  Zap,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { useQuickMessageStore } from "@/stores/useQuickMessageStore";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface QuickMessage {
  _id: string;
  shortcut: string;
  content: string;
}

interface QuickMessageModalProps {
  onClose: () => void;
}

// ─── API ──────────────────────────────────────────────────────────────────────


export const quickMessageService = {
  async getAll(): Promise<QuickMessage[]> {
    const res = await api.get("/messages/quick-messages");
    return res.data.quickMessages ?? [];
  },

  async create(payload: {
    shortcut: string;
    content: string;
  }): Promise<QuickMessage> {
    const res = await api.post("/messages/quick-messages", payload);
    return res.data.quickMessage;
  },

  async update(
    id: string,
    payload: {
      shortcut?: string;
      content?: string;
    }
  ): Promise<QuickMessage> {
    const res = await api.put(`/messages/quick-messages/${id}`, payload);
    return res.data.quickMessage;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/messages/quick-messages/${id}`);
  },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes qmIn {
    from { opacity:0; transform:scale(.96) translateY(8px); }
    to   { opacity:1; transform:scale(1)   translateY(0); }
  }
  @keyframes qmShimmer {
    0%   { background-position:-200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes qmPulse {
    from { box-shadow:0 0 0 0   rgba(239,68,68,0); }
    to   { box-shadow:0 0 0 5px rgba(239,68,68,.22); }
  }
  @keyframes qmSpin { to { transform:rotate(360deg); } }

  .qm-overlay {
    position:fixed; inset:0;
    background:rgba(0,0,0,.58);
    backdrop-filter:blur(5px);
    z-index:1000;
    display:flex; align-items:center; justify-content:center;
  }
  .qm-modal {
    width:540px;
    max-width:calc(100vw - 24px);
    max-height:86vh;
    background:#0a1220;
    border:1px solid rgba(255,255,255,.09);
    border-radius:18px;
    box-shadow:0 32px 80px rgba(0,0,0,.75), 0 2px 8px rgba(0,0,0,.4);
    display:flex; flex-direction:column; overflow:hidden;
    animation:qmIn .22s cubic-bezier(.22,1,.36,1);
    font-family:'Segoe UI',system-ui,sans-serif;
  }

  /* Header */
  .qm-hdr {
    display:flex; align-items:center; justify-content:space-between;
    padding:16px 18px 14px;
    border-bottom:1px solid rgba(255,255,255,.06);
    flex-shrink:0;
  }
  .qm-hdr-l { display:flex; align-items:center; gap:8px; }
  .qm-title { font-size:15px; font-weight:700; color:#e2e8f0; }
  .qm-ibtn {
    width:30px; height:30px; border-radius:8px; border:none;
    background:rgba(255,255,255,.05);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; color:#64748b; transition:all .15s; flex-shrink:0;
  }
  .qm-ibtn:hover { background:rgba(255,255,255,.1); color:#94a3b8; }
  .qm-ibtn.close:hover { background:rgba(239,68,68,.12); color:#f87171; }

  /* Topbar (list view) */
  .qm-topbar {
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 18px 10px;
    border-bottom:1px solid rgba(255,255,255,.05);
    flex-shrink:0;
  }
  .qm-count { font-size:12px; font-weight:600; color:#475569; }
  .qm-new {
    display:flex; align-items:center; gap:5px;
    padding:6px 13px; border-radius:8px; border:none;
    background:rgba(59,130,246,.14); color:#60a5fa;
    font-size:12px; font-weight:700; cursor:pointer;
    font-family:inherit; transition:background .15s;
  }
  .qm-new:hover { background:rgba(59,130,246,.28); }

  /* Desc */
  .qm-desc { font-size:12px; color:#475569; padding:10px 18px 8px; line-height:1.5; }

  /* Scrollable body */
  .qm-body { flex:1; overflow-y:auto; padding:10px 18px 18px; }
  .qm-body::-webkit-scrollbar { width:4px; }
  .qm-body::-webkit-scrollbar-track { background:transparent; }
  .qm-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,.08); border-radius:4px; }

  /* Row */
  .qm-row {
    position:relative;
    border-radius:10px;
    border:1px solid rgba(255,255,255,.07);
    padding:11px 13px;
    background:rgba(255,255,255,.025);
    transition:border-color .18s, background .18s;
    margin-bottom:8px;
  }
  .qm-row:hover {
    border-color:rgba(59,130,246,.35);
    background:rgba(59,130,246,.055);
  }
 .qm-row-acts {
  position:absolute;
  top:50%;
  right:10px;
  transform:translateY(-50%);
  display:flex;
  gap:4px;

  opacity:0;
  transition:opacity .15s ease;
}

.qm-row:hover .qm-row-acts {
  opacity:1;
}

  .qm-abtn {
    width:28px; height:28px; border-radius:7px;
    border:1px solid rgba(255,255,255,.1);
    background:rgba(6,12,26,.95);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all .15s;
  }
  .qm-abtn:hover { transform:scale(1.08); }
  .qm-abtn.e:hover { background:rgba(59,130,246,.2);  border-color:rgba(59,130,246,.45); }
  .qm-abtn.d:hover { background:rgba(239,68,68,.15);  border-color:rgba(239,68,68,.4); }
  .qm-abtn.dc {
    background:rgba(239,68,68,.18); border-color:rgba(239,68,68,.5);
    animation:qmPulse .65s ease infinite alternate;
  }

  .qm-badge {
    display:inline-flex; align-items:center;
    background:rgba(59,130,246,.12); border:1px solid rgba(59,130,246,.25);
    color:#60a5fa; font-size:11px; font-weight:700;
    padding:2px 8px; border-radius:6px;
    font-family:'Fira Code','Courier New',monospace; flex-shrink:0;
  }
  .qm-row-txt {
    margin:5px 0 0; font-size:13px; color:#94a3b8;
    line-height:1.5; padding-right:72px;
    overflow:hidden; display:-webkit-box;
    -webkit-line-clamp:2; -webkit-box-orient:vertical;
  }

  /* Skeleton */
  .qm-sk {
    height:64px; border-radius:10px; margin-bottom:8px;
    background:linear-gradient(90deg,
      rgba(255,255,255,.04) 0%,
      rgba(255,255,255,.08) 50%,
      rgba(255,255,255,.04) 100%);
    background-size:200% 100%;
    animation:qmShimmer 1.4s ease infinite;
  }

  /* Empty */
  .qm-empty {
    display:flex; flex-direction:column; align-items:center;
    justify-content:center; padding:52px 20px; gap:14px;
  }
  .qm-empty-ic {
    width:52px; height:52px; border-radius:16px;
    background:rgba(59,130,246,.1);
    display:flex; align-items:center; justify-content:center;
  }
  .qm-empty-tx { font-size:13px; color:#475569; text-align:center; line-height:1.7; }

  /* Form */
  .qm-form { padding:16px 18px 20px; }
  .qm-fld { margin-bottom:14px; }
  .qm-lbl {
    display:block; font-size:11px; font-weight:700;
    color:#475569; text-transform:uppercase;
    letter-spacing:.6px; margin-bottom:6px; font-family:inherit;
  }
  .qm-inp, .qm-ta {
    width:100%; box-sizing:border-box;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.1);
    border-radius:10px; color:#e2e8f0;
    font-size:13px; padding:10px 12px;
    outline:none; font-family:inherit;
    transition:border-color .18s, background .18s;
  }
  .qm-inp:focus, .qm-ta:focus {
    border-color:rgba(59,130,246,.55);
    background:rgba(59,130,246,.06);
  }
  .qm-inp::placeholder, .qm-ta::placeholder { color:#334155; }
  .qm-ta { resize:none; line-height:1.5; }
  .qm-hint { font-size:11px; color:#334155; margin-top:5px; line-height:1.4; }
  .qm-err {
    background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3);
    border-radius:8px; padding:8px 12px;
    color:#f87171; font-size:12px; margin-bottom:14px;
  }
  .qm-acts { display:flex; justify-content:flex-end; gap:8px; margin-top:4px; }
  .qm-cancel {
    padding:8px 16px; border-radius:8px;
    border:1px solid rgba(255,255,255,.1);
    background:transparent; color:#64748b;
    font-size:13px; font-weight:600; cursor:pointer;
    font-family:inherit; transition:background .15s;
  }
  .qm-cancel:hover { background:rgba(255,255,255,.05); }
  .qm-save {
    padding:8px 18px; border-radius:8px; border:none;
    background:rgba(59,130,246,.88); color:#fff;
    font-size:13px; font-weight:700; cursor:pointer;
    font-family:inherit; transition:background .15s;
    display:flex; align-items:center; gap:6px;
  }
  .qm-save:disabled { background:rgba(59,130,246,.3); cursor:not-allowed; }
  .qm-save:not(:disabled):hover { background:#3b82f6; }
  .qm-spin { animation:qmSpin 1s linear infinite; }
`;

// ─── Row component ────────────────────────────────────────────────────────────
function Row({
  msg,
  onEdit,
  onDelete,
}: {
  msg: QuickMessage;
  onEdit: (m: QuickMessage) => void;
  onDelete: (id: string) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDel = () => {
    if (confirm) {
      onDelete(msg._id);
    } else {
      setConfirm(true);
      timer.current = setTimeout(() => setConfirm(false), 2500);
    }
  };

  useEffect(
    () => () => { if (timer.current) clearTimeout(timer.current); },
    []
  );

  return (
    <div className="qm-row">
      <span className="qm-badge">{msg.shortcut}</span>
      <p className="qm-row-txt">{msg.content}</p>

      <div className="qm-row-acts">
        <button className="qm-abtn e" title="Chỉnh sửa" onClick={() => onEdit(msg)}>
          <Pencil size={12} color="#93c5fd" />
        </button>
        <button
          className={`qm-abtn d${confirm ? " dc" : ""}`}
          title={confirm ? "Nhấn lần nữa để xác nhận xoá" : "Xoá"}
          onClick={handleDel}
        >
          {confirm
            ? <AlertTriangle size={12} color="#f87171" />
            : <Trash2 size={12} color="#f87171" />}
        </button>
      </div>
    </div>
  );
}

// ─── Form component ───────────────────────────────────────────────────────────
function Form({
  initial,
  onSave,
  onCancel,
  error,
  loading,
}: {
  initial?: QuickMessage | null;
  onSave: (d: { shortcut: string; content: string }) => Promise<void>;
  onCancel: () => void;
  error: string;
  loading: boolean;
}) {
  const [shortcut, setShortcut] = useState(initial?.shortcut ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  const handleShortcut = (v: string) => {
    if (v.length === 1 && v !== "/") setShortcut("/" + v);
    else setShortcut(v);
  };

  const canSave = shortcut.trim().length > 1 && content.trim().length > 0 && !loading;

  return (
    <div className="qm-form">
      {error && <div className="qm-err">{error}</div>}

      <div className="qm-fld">
        <label className="qm-lbl">Phím tắt</label>
        <input
          className="qm-inp"
          placeholder="/xinchao"
          value={shortcut}
          autoFocus
          onChange={(e) => handleShortcut(e.target.value)}
        />
        <p className="qm-hint">
          Bắt đầu bằng "/" — gõ phím tắt trong hộp chat để chèn nội dung nhanh
        </p>
      </div>

      <div className="qm-fld">
        <label className="qm-lbl">Nội dung tin nhắn</label>
        <textarea
          className="qm-ta"
          placeholder="Xin chào! Mình có thể giúp gì cho bạn?"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="qm-acts">
        <button className="qm-cancel" onClick={onCancel}>Huỷ</button>
        <button
          className="qm-save"
          disabled={!canSave}
          onClick={() => onSave({ shortcut: shortcut.trim(), content: content.trim() })}
        >
          {loading ? (
            <><Loader2 size={13} className="qm-spin" /> Đang lưu...</>
          ) : (
            <><Check size={13} /> {initial ? "Lưu thay đổi" : "Tạo mới"}</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type View = "list" | "create" | "edit";

export default function QuickMessageModal({ onClose }: QuickMessageModalProps) {
  const [view, setView] = useState<View>("list");
  const [editTarget, setEditTarget] = useState<QuickMessage | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const messages = useQuickMessageStore((s) => s.messages);
const fetchLoading = useQuickMessageStore((s) => s.loading);

const fetchMessages = useQuickMessageStore((s) => s.fetchMessages);
const addMessage = useQuickMessageStore((s) => s.addMessage);
const updateMessageStore = useQuickMessageStore((s) => s.updateMessage);
const deleteMessageStore = useQuickMessageStore((s) => s.deleteMessage);

  useEffect(() => {
  fetchMessages();
}, []);

  const goCreate = () => { setFormError(""); setEditTarget(null); setView("create"); };
  const goEdit = (m: QuickMessage) => { setFormError(""); setEditTarget(m); setView("edit"); };
  const goList = () => { setView("list"); setEditTarget(null); setFormError(""); };

  const handleCreate = async (d: { shortcut: string; content: string }) => {
    setFormLoading(true); setFormError("");
    try {
      const item = await quickMessageService.create(d);
      addMessage(item);
      goList();
    } catch (e: any) { setFormError(e.message); }
    finally { setFormLoading(false); }
  };

  const handleUpdate = async (d: { shortcut: string; content: string }) => {
    if (!editTarget) return;
    setFormLoading(true); setFormError("");
    try {
      const item = await quickMessageService.update(editTarget._id, d);
      updateMessageStore(item);
      goList();
    } catch (e: any) { setFormError(e.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id: string) => {
  try {
    await quickMessageService.delete(id);

    deleteMessageStore(id);
  } catch (error) {
    console.error(error);
  }
};

  const TITLE: Record<View, string> = {
    list: "Tin nhắn nhanh",
    create: "Tạo tin nhắn nhanh",
    edit: "Chỉnh sửa tin nhắn nhanh",
  };

  return (
    <>
      <style>{CSS}</style>

      <div
        className="qm-overlay"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="qm-modal">

          {/* Header */}
          <div className="qm-hdr">
            <div className="qm-hdr-l">
              {view !== "list" && (
                <button className="qm-ibtn" onClick={goList} title="Quay lại">
                  <ChevronLeft size={15} />
                </button>
              )}
              <span className="qm-title">{TITLE[view]}</span>
            </div>
            <button className="qm-ibtn close" onClick={onClose} title="Đóng">
              <X size={14} />
            </button>
          </div>

          {/* LIST */}
          {view === "list" && (
            <>
              <div className="qm-topbar">
                <span className="qm-count">Tin nhắn nhanh ({messages.length})</span>
                <button className="qm-new" onClick={goCreate}>
                  <Plus size={13} /> Tạo mới
                </button>
              </div>
              <p className="qm-desc">
                Tạo, chỉnh sửa và quản lý phím tắt cho những tin nhắn thường sử dụng trong hội thoại
              </p>
              <div className="qm-body">
                {fetchLoading ? (
                  <>
                    <div className="qm-sk" />
                    <div className="qm-sk" style={{ opacity: .6 }} />
                    <div className="qm-sk" style={{ opacity: .35 }} />
                  </>
                ) : messages.length === 0 ? (
                  <div className="qm-empty">
                    <div className="qm-empty-ic">
                      <Zap size={22} color="#3b82f6" />
                    </div>
                    <p className="qm-empty-tx">
                      Chưa có tin nhắn nhanh nào<br />
                      <span style={{ color: "#334155" }}>
                        Nhấn "Tạo mới" để thêm phím tắt đầu tiên
                      </span>
                    </p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <Row key={m._id} msg={m} onEdit={goEdit} onDelete={handleDelete} />
                  ))
                )}
              </div>
            </>
          )}

          {/* CREATE / EDIT */}
          {(view === "create" || view === "edit") && (
            <Form
              initial={editTarget}
              onSave={view === "create" ? handleCreate : handleUpdate}
              onCancel={goList}
              error={formError}
              loading={formLoading}
            />
          )}

        </div>
      </div>
    </>
  );
}
