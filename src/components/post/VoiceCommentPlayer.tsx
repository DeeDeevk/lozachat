import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play } from "lucide-react";

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface Props {
  src: string;
  className?: string;
}

export function VoiceCommentPlayer({ src, className = "" }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      setProgress(audio.currentTime);
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  };

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <div
      className={`mt-2 flex items-center gap-3 p-3 rounded-2xl border max-w-sm ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(15,23,42,0.6) 100%)",
        borderColor: "rgba(99, 102, 241, 0.25)",
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <button
        type="button"
        onClick={toggle}
        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
        style={{
          background: playing
            ? "linear-gradient(135deg, #6366f1, #4f46e5)"
            : "rgba(99, 102, 241, 0.35)",
          boxShadow: playing ? "0 0 16px rgba(99,102,241,0.45)" : "none",
        }}
        aria-label={playing ? "Tạm dừng" : "Phát"}
      >
        {playing ? (
          <Pause size={18} className="text-white" fill="white" />
        ) : (
          <Play size={18} className="text-white ml-0.5" fill="white" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Mic size={12} className="text-indigo-300 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wide">
            Tin nhắn thoại
          </span>
        </div>

        <div className="flex items-end gap-0.5 h-6 mb-1.5">
          {Array.from({ length: 24 }).map((_, i) => {
            const h = 30 + ((i * 17) % 70);
            const active = playing && i / 24 < pct / 100;
            return (
              <div
                key={i}
                className="w-1 rounded-full transition-all duration-150"
                style={{
                  height: `${active ? h : h * 0.45}%`,
                  background: active
                    ? "linear-gradient(to top, #6366f1, #a5b4fc)"
                    : "rgba(148, 163, 184, 0.35)",
                }}
              />
            );
          })}
        </div>

        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #6366f1, #818cf8)",
            }}
          />
        </div>

        <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-medium tabular-nums">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
