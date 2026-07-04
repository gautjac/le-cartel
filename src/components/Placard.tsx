import type { Cartel } from "../types";

// The refined on-screen gallery label. The PNG export is generated separately
// (placard.ts) so the two stay visually aligned but this one uses the real
// Cormorant serif for maximum polish on screen.
export default function Placard({ cartel, className = "" }: { cartel: Cartel; className?: string }) {
  const meta = [cartel.year, cartel.medium, cartel.dimensions].filter(Boolean).join("  ·  ");
  return (
    <figure
      className={`bg-gallery-paper border border-gallery-line shadow-plaque px-9 sm:px-12 py-10 ${className}`}
    >
      <div className="h-[2px] w-full bg-gallery-brass/85 mb-7" />
      <h2 className="font-serif italic font-medium text-gallery-ink text-3xl sm:text-[2.6rem] leading-[1.08]">
        {cartel.title}
      </h2>
      <p className="font-serif font-semibold text-gallery-ink text-lg sm:text-xl mt-4">
        {cartel.artist}
      </p>
      <p className="meta text-gallery-soft text-[13px] mt-2">{meta}</p>

      <div className="h-px w-full bg-gallery-line my-6" />

      <p className="font-serif text-gallery-ink text-[1.15rem] sm:text-[1.28rem] leading-relaxed">
        {cartel.text}
      </p>

      <p className="font-serif italic text-gallery-soft text-sm mt-6">{cartel.provenance}</p>

      <div className="meta text-gallery-brass text-[11px] tracking-museum mt-7">le cartel</div>
    </figure>
  );
}
