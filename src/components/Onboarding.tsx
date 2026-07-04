export default function Onboarding({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gallery-ink/45 backdrop-blur-sm p-6 fadeup">
      <div className="max-w-md w-full bg-gallery-paper border border-gallery-line rounded-sm p-8 shadow-plaque">
        <div className="meta text-gallery-brass text-xs tracking-museum mb-4">le cartel</div>
        <h1 className="font-serif text-4xl leading-[1.05] mb-4 text-gallery-ink">
          Tout objet devient
          <br />
          <span className="italic">un chef-d'œuvre.</span>
        </h1>
        <p className="font-serif text-lg text-gallery-soft mb-6 leading-snug">
          Photographiez n'importe quoi — une tasse, un câble emmêlé, une clé.
          Le conservateur en rédige le cartel muséal, au premier degré absolu.
        </p>
        <ol className="space-y-3 text-sm text-gallery-ink/80 my-6">
          <li className="flex gap-3">
            <span className="text-gallery-brass font-serif text-lg leading-none">i.</span>
            <span>Prenez une photo ou importez-en une.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-gallery-brass font-serif text-lg leading-none">ii.</span>
            <span>Le musée rédige un titre, une attribution et un texte de conservateur.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-gallery-brass font-serif text-lg leading-none">iii.</span>
            <span>Exportez le cartel en PNG, ou gardez-le dans votre galerie.</span>
          </li>
        </ol>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-sm bg-gallery-ink text-gallery-paper font-sans text-sm tracking-wide hover:bg-gallery-brassDeep transition-colors"
        >
          Entrer dans la galerie
        </button>
      </div>
    </div>
  );
}
