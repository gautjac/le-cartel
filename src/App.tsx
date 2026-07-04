import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "./db";
import { requestCartel } from "./api";
import { downscaleToJpeg } from "./image";
import { placardPng, downloadBlob, slug } from "./placard";
import type { Cartel, Entry, Lang } from "./types";
import Placard from "./components/Placard";
import Camera from "./components/Camera";
import Onboarding from "./components/Onboarding";

type View = { photo: string; cartel: Cartel; lang: Lang; id?: number };

const LABELS = {
  fr: {
    tagline: "un chef-d'œuvre instantané, au premier degré",
    photograph: "Photographier",
    upload: "Importer",
    hint: "précision (facultatif) — « c'est une théière »…",
    curate: "Rédiger le cartel",
    curating: "Le conservateur rédige…",
    beside: "Voir à côté de l'œuvre",
    onlyLabel: "Cartel seul",
    export: "Exporter en PNG",
    again: "Nouvel objet",
    gallery: "La galerie",
    empty: "Aucune œuvre encore acquise.",
    help: "aide",
    delete: "Retirer de la collection",
    errorNet: "Le musée est injoignable. Réessayez.",
    errorImg: "Image illisible.",
    errorExport: "Export impossible.",
    subject: "Sujet de l'exposition",
  },
  en: {
    tagline: "an instant masterpiece, with a perfectly straight face",
    photograph: "Photograph",
    upload: "Upload",
    hint: "note (optional) — “it's a teapot”…",
    curate: "Write the label",
    curating: "The curator is writing…",
    beside: "Set beside the work",
    onlyLabel: "Label only",
    export: "Export PNG",
    again: "New object",
    gallery: "The gallery",
    empty: "No works acquired yet.",
    help: "help",
    delete: "Deaccession",
    errorNet: "The museum is unreachable. Try again.",
    errorImg: "Unreadable image.",
    errorExport: "Export failed.",
    subject: "Subject of the exhibition",
  },
} as const;

const LANG_KEY = "cartel.lang";
function initialLang(): Lang {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === "fr" || saved === "en") return saved;
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "fr";
}

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);
  const [onboard, setOnboard] = useState(() => !localStorage.getItem("cartel.seen"));
  const [camera, setCamera] = useState(false);

  const [photo, setPhoto] = useState<{ dataUrl: string; base64: string } | null>(null);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [beside, setBeside] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [exporting, setExporting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const t = LABELS[lang];

  const refresh = useCallback(async () => {
    setEntries(await db.entries.orderBy("createdAt").reverse().toArray());
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const acceptImage = useCallback(async (blob: Blob) => {
    setError(null);
    setView(null);
    try {
      const shrunk = await downscaleToJpeg(blob, 1024, 0.8);
      setPhoto(shrunk);
    } catch {
      setError(LABELS[lang].errorImg);
    }
  }, [lang]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void acceptImage(f);
    e.target.value = "";
  };

  const curate = useCallback(async () => {
    if (!photo || loading) return;
    setLoading(true);
    setError(null);
    try {
      const cartel = await requestCartel(photo.base64, lang, hint.trim());
      const entry: Entry = { cartel, lang, photo: photo.dataUrl, createdAt: Date.now() };
      const id = await db.entries.add(entry);
      setView({ photo: photo.dataUrl, cartel, lang, id });
      setBeside(true);
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.errorNet;
      setError(msg || t.errorNet);
    } finally {
      setLoading(false);
    }
  }, [photo, loading, lang, hint, refresh, t.errorNet]);

  const reset = () => {
    setPhoto(null);
    setHint("");
    setView(null);
    setError(null);
  };

  const exportPng = useCallback(async () => {
    if (!view) return;
    setExporting(true);
    try {
      const blob = await placardPng(view.cartel);
      downloadBlob(blob, `${slug(view.cartel.title)}.png`);
    } catch {
      setError(t.errorExport);
    } finally {
      setExporting(false);
    }
  }, [view, t.errorExport]);

  const remove = useCallback(
    async (id?: number) => {
      if (id == null) return;
      await db.entries.delete(id);
      if (view?.id === id) setView(null);
      await refresh();
    },
    [refresh, view]
  );

  const openEntry = (e: Entry) => {
    setPhoto(null);
    setView({ photo: e.photo, cartel: e.cartel, lang: e.lang, id: e.id });
    setBeside(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const dismissOnboard = () => {
    localStorage.setItem("cartel.seen", "1");
    setOnboard(false);
  };

  return (
    <div className="min-h-screen wall flex flex-col">
      {onboard && <Onboarding onClose={dismissOnboard} lang={lang} />}
      {camera && (
        <Camera
          lang={lang}
          onCapture={(b) => {
            setCamera(false);
            void acceptImage(b);
          }}
          onCancel={() => setCamera(false)}
        />
      )}

      {/* Header */}
      <header className="border-b border-gallery-line/80 bg-gallery-wall/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-5 py-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-serif italic text-2xl text-gallery-ink">Le Cartel</span>
            <span className="hidden sm:inline meta text-gallery-soft text-xs truncate">
              {t.tagline}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex rounded-sm border border-gallery-line overflow-hidden text-xs font-sans">
              {(["fr", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 uppercase tracking-wide transition-colors ${
                    lang === l
                      ? "bg-gallery-ink text-gallery-paper"
                      : "text-gallery-soft hover:text-gallery-ink"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={() => setOnboard(true)}
              className="meta text-gallery-soft text-xs hover:text-gallery-brass transition-colors"
            >
              {t.help}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-5 py-8 flex flex-col gap-10">
        {/* Studio: capture + curate */}
        <section className="flex flex-col items-center text-center gap-6">
          {!photo && !view && (
            <div className="fadeup flex flex-col items-center gap-6 py-6">
              <h1 className="font-serif text-4xl sm:text-5xl leading-[1.05] text-gallery-ink max-w-xl">
                {lang === "fr" ? (
                  <>
                    Présentez un objet.
                    <br />
                    <span className="italic">Le musée s'occupe du reste.</span>
                  </>
                ) : (
                  <>
                    Present an object.
                    <br />
                    <span className="italic">The museum does the rest.</span>
                  </>
                )}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setCamera(true)}
                  className="px-6 py-3 rounded-sm bg-gallery-ink text-gallery-paper font-sans text-sm tracking-wide hover:bg-gallery-brassDeep transition-colors"
                >
                  {t.photograph}
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-6 py-3 rounded-sm border border-gallery-line text-gallery-ink font-sans text-sm tracking-wide hover:border-gallery-brass transition-colors"
                >
                  {t.upload}
                </button>
              </div>
            </div>
          )}

          {photo && !view && (
            <div className="fadeup w-full max-w-md flex flex-col items-center gap-4">
              <div className="meta text-gallery-soft text-xs tracking-museum">{t.subject}</div>
              <div className="w-full rounded-sm overflow-hidden border border-gallery-line shadow-card bg-white">
                <img src={photo.dataUrl} alt="Objet à présenter" className="w-full object-contain max-h-[46vh]" />
              </div>
              <input
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder={t.hint}
                className="w-full bg-gallery-paper border border-gallery-line rounded-sm px-4 py-2.5 text-sm font-sans outline-none focus:border-gallery-brass transition-colors placeholder:text-gallery-soft/60"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => void curate()}
                  disabled={loading}
                  className="px-6 py-3 rounded-sm bg-gallery-ink text-gallery-paper font-sans text-sm tracking-wide disabled:opacity-50 hover:bg-gallery-brassDeep transition-colors"
                >
                  {loading ? t.curating : t.curate}
                </button>
                <button
                  onClick={reset}
                  disabled={loading}
                  className="font-sans text-sm text-gallery-soft hover:text-gallery-ink px-3 py-2 disabled:opacity-40 transition-colors"
                >
                  {t.again}
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="w-full max-w-2xl fadeup">
              <div className="bg-gallery-paper border border-gallery-line shadow-card px-10 py-9 text-left">
                <div className="h-[2px] w-full bg-gallery-brass/40 mb-6" />
                <div className="shimmer h-9 w-2/3 rounded-sm mb-4" />
                <div className="shimmer h-5 w-1/3 rounded-sm mb-6" />
                <div className="shimmer h-3 w-full rounded-sm mb-2.5" />
                <div className="shimmer h-3 w-full rounded-sm mb-2.5" />
                <div className="shimmer h-3 w-4/5 rounded-sm" />
              </div>
            </div>
          )}

          {error && <p className="font-serif italic text-gallery-brassDeep text-base">{error}</p>}
        </section>

        {/* Result: the label, optionally beside the work */}
        {view && !loading && (
          <section className="fadeup flex flex-col gap-5">
            <div
              className={`grid gap-6 items-start ${
                beside ? "md:grid-cols-[1fr_1.15fr]" : "grid-cols-1 max-w-2xl mx-auto w-full"
              }`}
            >
              {beside && (
                <div className="rounded-sm overflow-hidden border border-gallery-line shadow-card bg-white self-start">
                  <img src={view.photo} alt="L'œuvre" className="w-full object-contain max-h-[70vh]" />
                </div>
              )}
              <Placard cartel={view.cartel} />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                onClick={() => setBeside((b) => !b)}
                className="font-sans text-sm text-gallery-soft hover:text-gallery-ink border border-gallery-line rounded-sm px-4 py-2 transition-colors"
              >
                {beside ? t.onlyLabel : t.beside}
              </button>
              <button
                onClick={() => void exportPng()}
                disabled={exporting}
                className="font-sans text-sm bg-gallery-brass text-white rounded-sm px-5 py-2 hover:bg-gallery-brassDeep disabled:opacity-50 transition-colors"
              >
                {exporting ? "…" : t.export}
              </button>
              <button
                onClick={reset}
                className="font-sans text-sm text-gallery-soft hover:text-gallery-ink px-4 py-2 transition-colors"
              >
                {t.again}
              </button>
            </div>
          </section>
        )}

        {/* The gallery of past cartels */}
        {entries.length > 0 && (
          <section className="border-t border-gallery-line/80 pt-8">
            <h2 className="meta text-gallery-soft text-sm tracking-museum mb-5">{t.gallery}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="group relative flex gap-4 bg-gallery-paper border border-gallery-line rounded-sm p-3 hover:border-gallery-brass/60 shadow-card transition-colors"
                >
                  <button
                    onClick={() => openEntry(e)}
                    className="flex gap-4 text-left min-w-0 flex-1"
                    aria-label={e.cartel.title}
                  >
                    <img
                      src={e.photo}
                      alt=""
                      className="w-20 h-20 object-cover rounded-sm border border-gallery-line shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-serif italic text-gallery-ink text-lg leading-tight truncate">
                        {e.cartel.title}
                      </div>
                      <div className="font-serif text-gallery-soft text-sm truncate">
                        {e.cartel.artist}
                      </div>
                      <div className="meta text-gallery-soft/80 text-[11px] mt-1 truncate">
                        {e.cartel.year} · {e.cartel.medium}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => void remove(e.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gallery-soft/50 hover:text-gallery-brassDeep text-lg leading-none px-1 transition-opacity"
                    aria-label={t.delete}
                    title={t.delete}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {entries.length === 0 && !view && !photo && (
          <p className="text-center meta text-gallery-soft/70 text-xs">{t.empty}</p>
        )}
      </main>

      <footer className="border-t border-gallery-line/70 py-5 text-center">
        <span className="meta text-gallery-soft/60 text-xs tracking-museum">
          le cartel · {new Date().getFullYear()}
        </span>
      </footer>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
