import { useState, useRef } from "react";
import { usePostStore } from "../../stores/usePostStore";

interface CurrentUser {
  _id: string;
  displayName: string;
  avatarUrl?: string;
}

interface Props {
  currentUser: CurrentUser;
}

const compressImage = (file: File, maxPx = 1200, quality = 0.82): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxPx && height <= maxPx) { resolve(file); return; }
      const ratio = Math.min(maxPx / width, maxPx / height);
      width  = Math.round(width  * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg",
        quality
      );
    };
    img.src = url;
  });
};

export const CreatePost = ({ currentUser }: Props) => {
  const [content,    setContent]    = useState("");
  const [files,      setFiles]      = useState<File[]>([]);
  const [previews,   setPreviews]   = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [focused,    setFocused]    = useState(false);
  const fileRef    = useRef<HTMLInputElement>(null);
  const textareaRef= useRef<HTMLTextAreaElement>(null);
  const createPost = usePostStore((s) => s.createPost);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const raw    = Array.from(fileList).slice(0, 10 - files.length);
    const compressed = await Promise.all(raw.map((f) => compressImage(f)));
    setFiles((prev)    => [...prev, ...compressed]);
    setPreviews((prev) => [...prev, ...compressed.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setFiles((prev)    => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) return;
    setSubmitting(true);
    try {
      await createPost(content.trim(), files);
      setContent(""); setFiles([]); setPreviews([]); setFocused(false);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit   = content.trim().length > 0 || files.length > 0;
  const initials    = currentUser.displayName
    .split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();

  const gridStyle = (n: number): React.CSSProperties => {
    if (n === 1) return { display: "grid", gridTemplateColumns: "1fr" };
    if (n === 2) return { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", height: "220px" };
    if (n === 3) return { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", height: "220px" };
    return          { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", height: "220px" };
  };

  return (
    <div className="loza-card loza-slide-up p-4" style={{ animationDelay: "0.05s" }}>
      <div className="flex items-center gap-3">
        {currentUser.avatarUrl ? (
          <img src={currentUser.avatarUrl}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            style={{ outline: "2px solid color-mix(in srgb, var(--loza-accent) 40%, transparent)", outlineOffset: "2px" }}
            alt={currentUser.displayName} />
        ) : (
          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold"
            style={{ background: "var(--loza-accent)", outline: "2px solid color-mix(in srgb, var(--loza-accent) 40%, transparent)", outlineOffset: "2px" }}>
            {initials}
          </div>
        )}

        {!focused ? (
          <button
            onClick={() => { setFocused(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
            className="flex-1 text-left px-4 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: "var(--loza-bg-elevated)", border: "1px solid var(--loza-border)", color: "var(--loza-muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--loza-border-bright)"; e.currentTarget.style.color = "var(--loza-sub)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--loza-border)"; e.currentTarget.style.color = "var(--loza-muted)"; }}
          >
            Bạn đang nghĩ gì, {currentUser.displayName.split(" ").pop()}?
          </button>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Bạn đang nghĩ gì, ${currentUser.displayName.split(" ").pop()}?`}
            className="flex-1 resize-none outline-none text-sm min-h-[80px] bg-transparent leading-relaxed"
            style={{ color: "var(--loza-text)" }}
            maxLength={5000}
          />
        )}
      </div>

      {previews.length > 0 && (
        <div className="mt-3 rounded-xl overflow-hidden" style={gridStyle(previews.length)}>
          {previews.map((src, i) => {
            const isFirst3 = previews.length === 3 && i === 0;
            return (
              <div
                key={i}
                className="relative group"
                style={{
                  overflow: "hidden",
                  gridRow: isFirst3 ? "span 2" : undefined,
                  ...(previews.length === 1 ? { maxHeight: "400px" } : {}),
                }}
              >
                <img
                  src={src}
                  alt=""
                  style={{
                    width: "100%",
                    height: previews.length === 1 ? "auto" : "100%",
                    maxHeight: previews.length === 1 ? "400px" : undefined,
                    objectFit: "contain",
                    objectPosition: "center",
                    display: "block",
                    background: "var(--loza-bg-base)",
                  }}
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full text-white text-xs
                             flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.75)", border: "none", padding: 0, cursor: "pointer" }}
                >✕</button>
              </div>
            );
          })}
        </div>
      )}

      {focused && (
        <div className="flex items-center justify-between mt-3 pt-3"
          style={{ borderTop: "1px solid var(--loza-border)" }}>
          <div className="flex gap-1">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={files.length >= 10}
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-30"
              style={{ background: "transparent", border: "none", color: "var(--loza-sub)", padding: "6px 10px", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--loza-bg-hover)"; e.currentTarget.style.color = "var(--loza-text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--loza-sub)"; }}
            >
              <span style={{ fontSize: "16px" }}>🖼️</span>
              <span>Ảnh/Video {files.length > 0 && `(${files.length}/10)`}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/mp4" multiple className="hidden"
              onChange={(e) => handleFiles(e.target.files)} />
          </div>

          <div className="flex items-center gap-2">
            {content.length > 100 && (
              <span style={{ fontSize: "11px", color: "var(--loza-muted)" }}>{content.length}/5000</span>
            )}
            <button
              onClick={() => { setFocused(false); setContent(""); setFiles([]); setPreviews([]); }}
              className="text-xs rounded-lg transition-all"
              style={{ background: "transparent", border: "none", color: "var(--loza-muted)", padding: "6px 12px", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--loza-bg-hover)"; e.currentTarget.style.color = "var(--loza-sub)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--loza-muted)"; }}
            >Huỷ</button>

            <button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              style={{
                background: canSubmit && !submitting ? "var(--loza-accent)" : "color-mix(in srgb, var(--loza-accent) 30%, var(--loza-bg-elevated))",
                color:      canSubmit && !submitting ? "#ffffff" : "var(--loza-muted)",
                border: "none", borderRadius: "999px",
                padding: "7px 20px", fontSize: "12px", fontWeight: 600,
                cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                boxShadow: canSubmit && !submitting ? "0 0 16px color-mix(in srgb, var(--loza-accent) 40%, transparent)" : "none",
              }}
              onMouseEnter={(e) => { if (canSubmit && !submitting) { e.currentTarget.style.background = "var(--loza-accent-light)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={(e) => { if (canSubmit && !submitting) { e.currentTarget.style.background = "var(--loza-accent)"; e.currentTarget.style.transform = "translateY(0)"; } }}
            >
              {submitting ? "Đang đăng..." : "Đăng bài"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};