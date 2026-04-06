import { useState, useRef, useEffect } from "react";
import { usePostStore } from "../../stores/usePostStore";
import type { Post } from "../../types/post";

interface Props {
  post: Post;
  onClose: () => void;
}

const compressImage = (file: File, maxPx = 1200, quality = 0.82): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/gif") { resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxPx && height <= maxPx) { resolve(file); return; }
      const ratio = Math.min(maxPx / width, maxPx / height);
      width = Math.round(width * ratio); height = Math.round(height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg", quality
      );
    };
    img.src = url;
  });
};

export const EditPostModal = ({ post, onClose }: Props) => {
  const [content,       setContent]       = useState(post.content);
  const [keepImages,    setKeepImages]     = useState<string[]>(post.images);   
  const [removedImages, setRemovedImages]  = useState<string[]>([]);            
  const [newFiles,      setNewFiles]       = useState<File[]>([]);              
  const [newPreviews,   setNewPreviews]    = useState<string[]>([]);
  const [submitting,    setSubmitting]     = useState(false);
  const fileRef    = useRef<HTMLInputElement>(null);
  const updatePost = usePostStore((s) => s.updatePost);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleNewFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const total = keepImages.length + newFiles.length;
    const raw   = Array.from(fileList).slice(0, 10 - total);
    const compressed = await Promise.all(raw.map((f) => compressImage(f)));
    setNewFiles((prev)    => [...prev, ...compressed]);
    setNewPreviews((prev) => [...prev, ...compressed.map((f) => URL.createObjectURL(f))]);
  };

  const removeOldImage = (url: string) => {
    setKeepImages((prev)   => prev.filter((u) => u !== url));
    setRemovedImages((prev) => [...prev, url]);
  };

  const removeNewFile = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewFiles((prev)    => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await updatePost(post._id, content.trim(), newFiles, removedImages);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const totalImages = keepImages.length + newFiles.length;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="loza-pop"
        style={{
          background: "var(--loza-bg-card)",
          border: "1px solid var(--loza-border-bright)",
          borderRadius: "20px",
          width: "100%", maxWidth: "520px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          margin: "0 16px",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--loza-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--loza-text)" }}>
            Chỉnh sửa bài viết
          </h3>
          <button
            onClick={onClose}
            style={{ background: "var(--loza-bg-hover)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", color: "var(--loza-sub)", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nội dung bài viết..."
            maxLength={5000}
            style={{
              width: "100%", minHeight: "100px",
              background: "var(--loza-bg-elevated)",
              border: "1px solid var(--loza-border)",
              borderRadius: "12px", padding: "12px 14px",
              color: "var(--loza-text)", fontSize: "14px",
              lineHeight: 1.6, resize: "vertical",
              outline: "none", boxSizing: "border-box",
              fontFamily: "inherit",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--loza-border-bright)")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--loza-border)")}
          />
          <div style={{ textAlign: "right", fontSize: "11px", color: "var(--loza-muted)", marginTop: "4px" }}>
            {content.length}/5000
          </div>

          {keepImages.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <p style={{ fontSize: "11px", color: "var(--loza-muted)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Ảnh hiện tại
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "6px" }}>
                {keepImages.map((url) => (
                  <div key={url} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "1", background: "var(--loza-bg-base)" }}
                    className="group">
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button
                      onClick={() => removeOldImage(url)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ position: "absolute", top: "4px", right: "4px", width: "22px", height: "22px", background: "rgba(220,38,38,0.85)", border: "none", borderRadius: "50%", color: "#fff", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newPreviews.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <p style={{ fontSize: "11px", color: "var(--loza-muted)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Ảnh mới thêm
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "6px" }}>
                {newPreviews.map((src, i) => (
                  <div key={i} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "1", background: "var(--loza-bg-base)" }}
                    className="group">
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button
                      onClick={() => removeNewFile(i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ position: "absolute", top: "4px", right: "4px", width: "22px", height: "22px", background: "rgba(220,38,38,0.85)", border: "none", borderRadius: "50%", color: "#fff", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalImages < 10 && (
            <button
              onClick={() => fileRef.current?.click()}
              style={{ marginTop: "12px", width: "100%", padding: "10px", background: "var(--loza-bg-elevated)", border: "1px dashed var(--loza-border-bright)", borderRadius: "12px", color: "var(--loza-sub)", fontSize: "13px", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--loza-accent)"; e.currentTarget.style.color = "var(--loza-accent-light)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--loza-border-bright)"; e.currentTarget.style.color = "var(--loza-sub)"; }}
            >
              🖼️ Thêm ảnh ({totalImages}/10)
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/mp4" multiple className="hidden"
            onChange={(e) => handleNewFiles(e.target.files)} />
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--loza-border)", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ background: "var(--loza-bg-elevated)", border: "1px solid var(--loza-border)", borderRadius: "999px", padding: "8px 20px", color: "var(--loza-sub)", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--loza-border-bright)"; e.currentTarget.style.color = "var(--loza-text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--loza-border)"; e.currentTarget.style.color = "var(--loza-sub)"; }}
          >Huỷ</button>

          <button
            onClick={handleSave}
            disabled={submitting}
            style={{
              background: submitting ? "color-mix(in srgb, var(--loza-accent) 40%, var(--loza-bg-elevated))" : "var(--loza-accent)",
              border: "none", borderRadius: "999px",
              padding: "8px 24px", color: "#fff", fontSize: "13px", fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer", transition: "all 0.2s",
              boxShadow: submitting ? "none" : "0 0 16px color-mix(in srgb, var(--loza-accent) 40%, transparent)",
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "var(--loza-accent-light)"; }}
            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = "var(--loza-accent)"; }}
          >
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
};