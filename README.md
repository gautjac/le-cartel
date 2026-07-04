# Le Cartel

**Un chef-d'œuvre instantané, au premier degré.**

Photographiez n'importe quel objet ordinaire — une tasse, un câble emmêlé, une
clé — et *Le Cartel* en rédige le **cartel muséal** : un titre, une attribution,
une notice de conservateur qui traite l'objet avec toute la gravité d'un
catalogue du Louvre. Le ton est **pince-sans-rire absolu** : jamais un
clin d'œil, jamais une blague — l'humour naît uniquement du décalage entre la
solennité du propos et la trivialité du sujet.

Live : **https://le-cartel.netlify.app**

## Ce que ça fait

- **Photographier** (`getUserMedia`, caméra arrière) ou **importer** une image.
  La photo est réduite côté client (~1024 px, JPEG 0.8) avant l'envoi.
- **Vision → cartel structuré** via `/api/cartel` : Claude (opus, vision) renvoie
  `{ title, artist, year, medium, dimensions, text, provenance }`.
- **Bascule de langue FR / EN** — le cartel est rédigé dans la langue choisie.
- **Rendu placard** : une étiquette de galerie raffinée (titre en italique,
  méta en petites capitales, paragraphe de conservateur, ligne de provenance),
  affichable **à côté de la photo**.
- **Export PNG partageable** : le placard est généré en SVG → `Blob` → `Image`
  → `canvas` → `toBlob` → téléchargement, sans aucune librairie externe.
- **Galerie locale** : chaque cartel est conservé dans IndexedDB (Dexie),
  consultable et réexportable, effaçable.

## Stack

Vite + React 19 + TypeScript + Tailwind CSS v3 + Dexie (IndexedDB, local-first).
Une seule fonction Netlify (`netlify/functions/cartel.mts`) appelle l'API Claude.

- La clé serveur est lue depuis `CLAUDE_API_KEY` (jamais `ANTHROPIC_API_KEY`),
  `baseURL` fixé à `https://api.anthropic.com`.
- L'appel opus + vision peut dépasser le délai d'inactivité de Netlify : il est
  encapsulé dans `ndjsonStream(...)`. Le client lit le flux ndjson et parse la
  dernière ligne JSON non vide (`{ result }` ou `{ error }`).

## Identité visuelle

Raffinement muséal : **blanc de galerie**, marges généreuses, serif fin
(**Cormorant Garamond**) pour le cartel, sans en petites capitales (**Inter**)
pour la méta, accents **laiton / charbon**. L'ensemble doit avoir l'air
d'appartenir à un mur, juste à côté d'une vraie œuvre.

## Développement

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
```

Pour les fonctions en local : `netlify dev` (nécessite `CLAUDE_API_KEY`).

## Précautions

- La photo est envoyée à l'API Claude (vision) pour générer le cartel ; rien
  n'est stocké côté serveur, mais l'image transite par l'API.
- L'export PNG utilise l'approche SVG → canvas et s'appuie sur des polices
  serif/sans système (Georgia/Helvetica) pour un rendu identique à la
  rastérisation, sans dépendance de police externe.
- Tout (galerie, préférences) reste **local** dans le navigateur (IndexedDB).

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
