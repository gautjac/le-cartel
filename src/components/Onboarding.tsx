import type { Lang } from "../types";

const COPY = {
  fr: {
    kicker: "le cartel",
    titleA: "Tout objet devient",
    titleB: "un chef-d'œuvre.",
    lede:
      "Photographiez n'importe quoi — une tasse, un câble emmêlé, une clé. Le conservateur en rédige le cartel muséal, au premier degré absolu.",
    steps: [
      "Prenez une photo ou importez-en une.",
      "Le musée rédige un titre, une attribution et un texte de conservateur.",
      "Exportez le cartel en PNG, ou gardez-le dans votre galerie.",
    ],
    enter: "Entrer dans la galerie",
  },
  en: {
    kicker: "le cartel",
    titleA: "Any object becomes",
    titleB: "a masterpiece.",
    lede:
      "Photograph anything — a mug, a tangled cable, a key. The curator writes its museum wall label, with a perfectly straight face.",
    steps: [
      "Take a photo or upload one.",
      "The museum writes a title, an attribution, and a curator's text.",
      "Export the label as a PNG, or keep it in your gallery.",
    ],
    enter: "Enter the gallery",
  },
} as const;

const NUM = ["i.", "ii.", "iii."];

export default function Onboarding({ onClose, lang }: { onClose: () => void; lang: Lang }) {
  const c = COPY[lang];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gallery-ink/45 backdrop-blur-sm p-6 fadeup">
      <div className="max-w-md w-full bg-gallery-paper border border-gallery-line rounded-sm p-8 shadow-plaque">
        <div className="meta text-gallery-brass text-xs tracking-museum mb-4">{c.kicker}</div>
        <h1 className="font-serif text-4xl leading-[1.05] mb-4 text-gallery-ink">
          {c.titleA}
          <br />
          <span className="italic">{c.titleB}</span>
        </h1>
        <p className="font-serif text-lg text-gallery-soft mb-6 leading-snug">{c.lede}</p>
        <ol className="space-y-3 text-sm text-gallery-ink/80 my-6">
          {c.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-gallery-brass font-serif text-lg leading-none">{NUM[i]}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-sm bg-gallery-ink text-gallery-paper font-sans text-sm tracking-wide hover:bg-gallery-brassDeep transition-colors"
        >
          {c.enter}
        </button>
      </div>
    </div>
  );
}
