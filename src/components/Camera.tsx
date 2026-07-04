import { useEffect, useRef, useState } from "react";
import type { Lang } from "../types";

const COPY = {
  fr: {
    unavailable: "Caméra indisponible. Importez plutôt une photo.",
    preview: "Aperçu de la caméra",
    cancel: "Annuler",
    shoot: "Prendre la photo",
    frame: "cadrez l'objet",
  },
  en: {
    unavailable: "Camera unavailable. Upload a photo instead.",
    preview: "Camera preview",
    cancel: "Cancel",
    shoot: "Take the photo",
    frame: "frame the object",
  },
} as const;

// Live camera capture via getUserMedia. Calls onCapture with a JPEG Blob.
export default function Camera({
  onCapture,
  onCancel,
  lang,
}: {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
  lang: Lang;
}) {
  const c = COPY[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setReady(true);
        }
      } catch {
        setError(c.unavailable);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const shoot = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    canvas.toBlob((b) => b && onCapture(b), "image/jpeg", 0.9);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gallery-ink/95 flex flex-col items-center justify-center p-4 fadeup">
      <div className="relative w-full max-w-lg aspect-[3/4] sm:aspect-video bg-black rounded-sm overflow-hidden border border-gallery-brass/40">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-8">
            <p className="font-serif text-gallery-paper/90 text-lg">{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
            aria-label={c.preview}
          />
        )}
        {ready && !error && (
          <div className="absolute inset-0 pointer-events-none border-[10px] border-gallery-paper/10" />
        )}
      </div>

      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={onCancel}
          className="font-sans text-sm text-gallery-paper/70 hover:text-gallery-paper px-4 py-2 transition-colors"
        >
          {c.cancel}
        </button>
        <button
          onClick={shoot}
          disabled={!ready || !!error}
          className="w-16 h-16 rounded-full bg-gallery-paper border-4 border-gallery-brass disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform"
          aria-label={c.shoot}
        />
        <div className="w-[72px]" />
      </div>
      <p className="meta text-gallery-paper/50 text-xs mt-4 tracking-museum">{c.frame}</p>
    </div>
  );
}
