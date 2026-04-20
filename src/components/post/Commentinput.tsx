import { useState, useRef, useCallback, useEffect } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { Smile, ImagePlus, Mic, X, Send } from "lucide-react";

// ─── Sticker list (có thể mở rộng) ────────────────────────────
const STICKERS = [
  "https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1414779/LINEStorePC/main.png;compress=true",
  "https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1414816/LINEStorePC/main.png;compress=true",
  "https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1414814/IOS/main_animation.png",
  "https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1414808/LINEStorePC/main.png;compress=true",
  "https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1414804/LINEStorePC/main.png;compress=true",
  "https://sdl-stickershop.line.naver.jp/stickershop/v1/product/1414799/IOS/main_animation.png",
];

type PopupType = "emoji" | "sticker" | "image" | null;

interface CommentInputProps {
  /** Avatar URL hoặc chữ cái đầu của user hiện tại */
  avatarUrl?: string;
  displayName?: string;
  placeholder?: string;
  /** Gọi khi submit — trả về content, imageFiles, audioFile */
  onSubmit: (
    content: string,
    imageFiles: File[],
    audioFile: File | null,
  ) => Promise<void>;
  loading?: boolean;
  autoFocus?: boolean;
  /** Kích thước nhỏ hơn dùng cho reply input */
  compact?: boolean;
  onCancel?: () => void;
}

export const CommentInput = ({
  avatarUrl,
  displayName,
  placeholder = "Viết bình luận...",
  onSubmit,
  loading = false,
  autoFocus = false,
  compact = false,
  onCancel,
}: CommentInputProps) => {
  const [content, setContent] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [activePopup, setActivePopup] = useState<PopupType>(null);

  // ─── Voice recording state ─────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = !content.trim() && imageFiles.length === 0 && !audioBlob;

  // ─── Close popup on outside click ────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setActivePopup(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Cleanup on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      imagePreviews.forEach(URL.revokeObjectURL);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Image handlers ───────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (imageFiles.length + newFiles.length > 4) {
      alert("Tối đa 4 ảnh mỗi bình luận");
      return;
    }
    const newPreviews = newFiles.map(URL.createObjectURL);
    setImageFiles((p) => [...p, ...newFiles]);
    setImagePreviews((p) => [...p, ...newPreviews]);
    e.target.value = "";
    setActivePopup(null);
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImagePreviews((p) => p.filter((_, i) => i !== idx));
    setImageFiles((p) => p.filter((_, i) => i !== idx));
  };

  // ─── Sticker handler (sticker URL → gửi như content) ─────────
  const handleStickerSend = async (url: string) => {
    setActivePopup(null);
    // Sticker gửi dưới dạng content đặc biệt, backend lưu content = url
    // Frontend render bằng cách detect isUrl + endsWith img ext
    await onSubmit(`[sticker]:${url}`, [], null);
  };

  // ─── Voice recording ──────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find(
        (m) => MediaRecorder.isTypeSupported(m),
      ) ?? "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        if (blob.size > 0) {
          setAudioBlob(blob);
          setAudioPreviewUrl(URL.createObjectURL(blob));
        }
        chunksRef.current = [];
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsRecording(false);
        setRecordSeconds(0);
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(
        () => setRecordSeconds((s) => s + 1),
        1000,
      );
    } catch {
      alert("Không thể truy cập micro");
    }
  }, [isRecording]);

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  const discardAudio = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioBlob(null);
    setAudioPreviewUrl(null);
  };

  // ─── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isEmpty || loading) return;

    let audioFile: File | null = null;
    if (audioBlob) {
      const ext = audioBlob.type.includes("mp4") ? "m4a" : "webm";
      audioFile = new File([audioBlob], `voice-${Date.now()}.${ext}`, {
        type: audioBlob.type,
      });
    }

    await onSubmit(content.trim(), imageFiles, audioFile);

    // Reset
    setContent("");
    imagePreviews.forEach(URL.revokeObjectURL);
    setImagePreviews([]);
    setImageFiles([]);
    discardAudio();
    setActivePopup(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
    if (e.key === "Escape" && onCancel) onCancel();
  };

  const avatarSize = compact ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";

  return (
    <div className="flex gap-3 items-start w-full">
      {/* Avatar */}
      <div
        className={`${avatarSize} rounded-full flex-shrink-0 bg-gradient-to-br from-[#3b6ef5] to-[#6a3bf5] flex items-center justify-center text-white font-semibold overflow-hidden`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          displayName?.[0]?.toUpperCase() ?? "U"
        )}
      </div>

      {/* Input area */}
      <div className="flex-1 min-w-0" ref={popupRef}>
        {/* Textarea */}
        <div className="relative bg-[#0a1422] border border-white/[0.08] focus-within:border-[#3b6ef5]/60 rounded-xl transition-colors">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={compact ? 1 : 2}
            className="w-full bg-transparent text-[#e8eaf0] placeholder:text-[#3a4a60]
              text-sm resize-none outline-none leading-relaxed
              px-4 pt-3 pb-2"
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            {/* Left: action buttons */}
            <div className="flex items-center gap-1 relative">
              {/* Emoji */}
              <div className="relative">
                <button
                  type="button"
                  title="Emoji"
                  onClick={() => setActivePopup((p) => (p === "emoji" ? null : "emoji"))}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
                    ${activePopup === "emoji"
                      ? "bg-[#3b6ef5]/20 text-[#7aa3ff]"
                      : "text-[#4a5a70] hover:text-[#7a8aa8] hover:bg-white/5"}`}
                >
                  <Smile size={16} />
                </button>
                {activePopup === "emoji" && (
                  <div className="absolute bottom-full left-0 mb-2 z-50">
                    <Picker
                      data={data}
                      theme="dark"
                      previewPosition="none"
                      skinTonePosition="none"
                      onEmojiSelect={(emoji: { native?: string }) => {
                        if (!emoji.native) return;
                        setContent((p) => p + emoji.native);
                        textareaRef.current?.focus();
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Image */}
              <button
                type="button"
                title="Đính kèm ảnh"
                onClick={() => imageInputRef.current?.click()}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all
                  text-[#4a5a70] hover:text-[#7a8aa8] hover:bg-white/5"
              >
                <ImagePlus size={16} />
              </button>

              {/* Sticker */}
              <button
                type="button"
                title="Nhãn dán"
                onClick={() => setActivePopup((p) => (p === "sticker" ? null : "sticker"))}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-base
                  ${activePopup === "sticker"
                    ? "bg-[#3b6ef5]/20 text-[#7aa3ff]"
                    : "text-[#4a5a70] hover:text-[#7a8aa8] hover:bg-white/5"}`}
              >
                🎭
              </button>

              {/* Voice */}
              <button
                type="button"
                title={isRecording ? "Dừng ghi âm" : "Ghi âm"}
                onClick={isRecording ? stopRecording : () => void startRecording()}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
                  ${isRecording
                    ? "bg-red-500/20 text-red-400 animate-pulse"
                    : "text-[#4a5a70] hover:text-[#7a8aa8] hover:bg-white/5"}`}
              >
                <Mic size={16} />
              </button>

              {/* Recording timer */}
              {isRecording && (
                <span className="text-[11px] text-red-400 font-mono">
                  {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:
                  {String(recordSeconds % 60).padStart(2, "0")}
                </span>
              )}

              {/* Sticker popup */}
              {activePopup === "sticker" && (
                <div
                  className="absolute bottom-full left-0 mb-2 z-50 p-3 rounded-2xl"
                  style={{
                    background: "#0d1b2e",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                    width: 260,
                  }}
                >
                  <p className="text-[11px] text-[#4a5a70] mb-2 font-medium">Nhãn dán</p>
                  <div className="grid grid-cols-3 gap-2">
                    {STICKERS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => void handleStickerSend(url)}
                        className="rounded-xl p-1.5 border border-white/5 hover:border-[#3b6ef5]/30 hover:bg-[#3b6ef5]/10 transition-all"
                      >
                        <img
                          src={url}
                          alt="sticker"
                          className="w-full h-16 object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Cancel + Send */}
            <div className="flex items-center gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1 rounded-lg text-[12px] font-semibold
                    text-[#4a5a70] hover:text-[#7a8aa8] hover:bg-white/5 transition-all"
                >
                  Huỷ
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isEmpty || loading}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all
                  bg-[#3b6ef5] text-white
                  hover:bg-[#4a7aff]
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={13} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Image previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {imagePreviews.map((src, i) => (
              <div
                key={i}
                className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0a1422]"
                style={{ width: compact ? 56 : 72, height: compact ? 56 : 72 }}
              >
                <img src={src} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full
                    bg-red-500 hover:bg-red-600 text-white text-[10px]
                    flex items-center justify-center transition-colors"
                >
                  <X size={8} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Audio preview */}
        {audioPreviewUrl && !isRecording && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/[0.07]">
            <audio controls src={audioPreviewUrl} className="flex-1 h-8" style={{ minWidth: 0 }} />
            <button
              type="button"
              onClick={discardAudio}
              className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};
