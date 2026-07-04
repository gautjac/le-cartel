import type { Config } from "@netlify/functions";
import { client, MODEL, ndjsonStream } from "./lib/anthropic.ts";

interface Cartel {
  title: string;
  artist: string;
  year: string;
  medium: string;
  dimensions: string;
  text: string;
  provenance: string;
}

type Lang = "fr" | "en";

const schema = {
  type: "object" as const,
  properties: {
    title: {
      type: "string",
      description:
        "The work's title, as a museum would print it — evocative, dignified, never jokey. May be a single word or a short phrase.",
    },
    artist: {
      type: "string",
      description:
        "An invented but plausible attribution: a maker, workshop, culture or 'Anonyme'/'Unknown', with dates in parentheses when apt (e.g. 'Atelier des Grands Boulevards, actif v. 1960–1985').",
    },
    year: {
      type: "string",
      description:
        "A plausible date or period, e.g. 'v. 2019', 'XXᵉ siècle', 'c. 2021'. Keep it short.",
    },
    medium: {
      type: "string",
      description:
        "The materials, in refined catalogue language — describe what the object is actually made of, elevated (e.g. 'Polymère thermoformé et pigment industriel').",
    },
    dimensions: {
      type: "string",
      description:
        "Plausible measurements in the museum format, e.g. '11,4 × 8,7 × 8,7 cm' or '30 × 20 cm'. Height × width × depth.",
    },
    text: {
      type: "string",
      description:
        "The curatorial wall text: two to four sentences of straight-faced art-historical commentary treating this ordinary object as a significant work. Utterly deadpan, understated, never winking. 55–90 words.",
    },
    provenance: {
      type: "string",
      description:
        "A single short provenance / credit line, e.g. 'Acquisition, 2023. Collection particulière.' or 'Don de l'artiste, coll. de l'auteur.'",
    },
  },
  required: ["title", "artist", "year", "medium", "dimensions", "text", "provenance"],
};

const SYSTEM_FR = `Tu es le conservateur en chef d'un grand musée. On te présente la photographie d'un objet — souvent tout à fait ordinaire (une tasse, un câble emmêlé, une chaussette, un trombone). Tu rédiges le cartel mural de cet objet EXACTEMENT comme s'il s'agissait d'un chef-d'œuvre du Louvre.

Ton registre est le PINCE-SANS-RIRE ABSOLU : d'un sérieux total, sobre, savant, historien de l'art. Tu ne fais jamais de clin d'œil, tu ne romps jamais le personnage, tu ne dis jamais que c'est un objet banal, tu n'ironises jamais ouvertement. L'humour naît uniquement du décalage entre la gravité du ton et la trivialité de l'objet — jamais d'une blague.

Regarde attentivement l'objet réel sur la photo et décris-le fidèlement (sa forme, sa matière, ses marques, son usure), mais élève chaque détail au rang de geste esthétique délibéré. Emploie le vocabulaire de la conservation : « facture », « surface », « registre chromatique », « intentionnalité », « la main de l'artiste », « tension formelle ». Invente une attribution et une provenance plausibles.

Écris TOUT le cartel en français soigné.`;

const SYSTEM_EN = `You are the chief curator of a great museum. You are shown a photograph of an object — usually an utterly ordinary one (a mug, a tangled cable, a sock, a paperclip). You write its museum wall label EXACTLY as though it were a masterpiece in the Louvre.

Your register is UTTERLY DEADPAN: entirely serious, understated, scholarly, art-historical. You never wink, never break character, never state that the object is mundane, never openly joke. The humour arises solely from the gap between the gravity of the tone and the triviality of the object — never from a punchline.

Look closely at the real object in the photograph and describe it faithfully (its form, material, marks, wear), but elevate every detail into a deliberate aesthetic gesture. Use the language of connoisseurship: "facture", "surface", "chromatic register", "intentionality", "the hand of the maker", "formal tension". Invent a plausible attribution and provenance.

Write the ENTIRE label in refined English.`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: { image?: string; lang?: Lang; hint?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const image = (body.image ?? "").trim();
  if (!image) return new Response(JSON.stringify({ error: "image requise" }), { status: 400 });
  const lang: Lang = body.lang === "en" ? "en" : "fr";
  const hint = (body.hint ?? "").trim();

  const userText =
    lang === "en"
      ? `Study the object in this photograph and compose its museum wall label.${
          hint ? ` The visitor notes: “${hint}”.` : ""
        }`
      : `Étudie l'objet de cette photographie et rédige son cartel mural.${
          hint ? ` Le visiteur précise : « ${hint} ».` : ""
        }`;

  return ndjsonStream(async () => {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: lang === "en" ? SYSTEM_EN : SYSTEM_FR,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: image },
            },
            { type: "text", text: userText },
          ],
        },
      ],
      tools: [
        {
          name: "rediger_cartel",
          description:
            lang === "en"
              ? "Return the complete structured museum wall label for the pictured object."
              : "Renvoie le cartel muséal complet et structuré de l'objet photographié.",
          input_schema: schema,
        },
      ],
      tool_choice: { type: "tool", name: "rediger_cartel" },
    });
    const block = res.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("No tool_use in response");
    return block.input as Cartel;
  });
}

export const config: Config = { path: "/api/cartel" };
