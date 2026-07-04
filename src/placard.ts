import type { Cartel } from "./types";

// ---- SVG placard generation (used for the shareable PNG export) ----
// Rendered with system serif/sans so it rasterizes identically inside the
// SVG -> Image -> canvas pipeline, without any external font dependency.

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Arial, sans-serif";
const INK = "#26241f";
const SOFT = "#6b665c";
const BRASS = "#8a6d3b";
const PAPER = "#fbfaf6";
const LINE = "#e2ddd1";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Greedy word-wrap into <= maxChars-ish lines (approximate, monospace-agnostic).
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export interface PlacardSVG {
  svg: string;
  width: number;
  height: number;
}

// Build the placard as a standalone SVG string at 2x for crisp export.
export function placardSVG(c: Cartel): PlacardSVG {
  const S = 2; // supersample
  const W = 720 * S;
  const padX = 64 * S;
  const contentW = W - padX * 2;

  // Approx chars-per-line at each type size (empirical for the widths below).
  const metaLines = wrap(`${c.year} · ${c.medium} · ${c.dimensions}`, 58);
  const bodyLines = wrap(c.text, 62);
  const provLines = wrap(c.provenance, 66);

  let y = 66 * S;
  const parts: string[] = [];

  // Brass rule at top.
  parts.push(
    `<rect x="${padX}" y="${44 * S}" width="${contentW}" height="${2 * S}" fill="${BRASS}" opacity="0.85"/>`
  );

  // Title (italic serif).
  const titleLines = wrap(c.title, 34);
  for (const line of titleLines) {
    parts.push(
      `<text x="${padX}" y="${y}" font-family="${SERIF}" font-style="italic" font-weight="500" font-size="${
        38 * S
      }" fill="${INK}">${esc(line)}</text>`
    );
    y += 46 * S;
  }
  y += 6 * S;

  // Artist.
  parts.push(
    `<text x="${padX}" y="${y}" font-family="${SERIF}" font-weight="600" font-size="${
      21 * S
    }" fill="${INK}">${esc(c.artist)}</text>`
  );
  y += 34 * S;

  // Meta line (year · medium · dimensions), small-caps-ish sans.
  for (const line of metaLines) {
    parts.push(
      `<text x="${padX}" y="${y}" font-family="${SANS}" font-size="${13 * S}" letter-spacing="${
        1.2 * S
      }" fill="${SOFT}">${esc(line.toUpperCase())}</text>`
    );
    y += 20 * S;
  }
  y += 14 * S;

  // Divider.
  parts.push(
    `<rect x="${padX}" y="${y}" width="${contentW}" height="${1 * S}" fill="${LINE}"/>`
  );
  y += 30 * S;

  // Curatorial body (serif).
  for (const line of bodyLines) {
    parts.push(
      `<text x="${padX}" y="${y}" font-family="${SERIF}" font-size="${19 * S}" fill="${INK}">${esc(
        line
      )}</text>`
    );
    y += 28 * S;
  }
  y += 16 * S;

  // Provenance (italic serif, muted).
  for (const line of provLines) {
    parts.push(
      `<text x="${padX}" y="${y}" font-family="${SERIF}" font-style="italic" font-size="${
        14 * S
      }" fill="${SOFT}">${esc(line)}</text>`
    );
    y += 20 * S;
  }
  y += 30 * S;

  // Signature footer.
  parts.push(
    `<text x="${padX}" y="${y}" font-family="${SANS}" font-size="${11 * S}" letter-spacing="${
      2 * S
    }" fill="${BRASS}">LE CARTEL</text>`
  );
  y += 34 * S;

  const H = y;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>` +
    `<rect x="${6 * S}" y="${6 * S}" width="${W - 12 * S}" height="${
      H - 12 * S
    }" fill="none" stroke="${LINE}" stroke-width="${1 * S}"/>` +
    parts.join("") +
    `</svg>`;

  return { svg, width: W, height: H };
}

// Rasterize the placard SVG to a PNG Blob via SVG -> Image -> canvas -> toBlob.
export async function placardPng(c: Cartel): Promise<Blob> {
  const { svg, width, height } = placardSVG(c);
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Rendu SVG impossible"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponible");
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export PNG impossible"))), "image/png");
  });
}

// Trigger a download of a Blob under filename.
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// A filesystem-safe slug from a title.
export function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "cartel"
  );
}
