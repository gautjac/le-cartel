import type { Cartel, Lang } from "./types";

const ERR = {
  fr: {
    status: (s: number) => `Erreur ${s}`,
    empty: "Réponse vide du serveur",
    incomplete: "Réponse incomplète du serveur",
  },
  en: {
    status: (s: number) => `Error ${s}`,
    empty: "Empty response from the server",
    incomplete: "Incomplete response from the server",
  },
} as const;

// POST the downscaled photo to /api/cartel and read the ndjson keepalive
// stream, returning the final { result } | { error } JSON line.
export async function requestCartel(base64: string, lang: Lang, hint: string): Promise<Cartel> {
  const e = ERR[lang];
  const res = await fetch("/api/cartel", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image: base64, lang, hint }),
  });

  if (!res.body) {
    // Non-streamed error path (e.g. 400/405/500 with a JSON body).
    const data = await res.json().catch(() => ({}));
    if (data?.result) return data.result as Cartel;
    throw new Error(data?.error || e.status(res.status));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let last: unknown = null;

  const consume = (chunk: string) => {
    buffer += chunk;
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) last = JSON.parse(line);
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    consume(decoder.decode(value, { stream: true }));
  }
  const tail = buffer.trim();
  if (tail) last = JSON.parse(tail);

  if (!last || typeof last !== "object") throw new Error(e.empty);
  const obj = last as { result?: Cartel; error?: string };
  if (obj.error) throw new Error(obj.error);
  if (!obj.result) throw new Error(e.incomplete);
  return obj.result;
}
