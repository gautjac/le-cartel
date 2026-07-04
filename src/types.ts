export type Lang = "fr" | "en";

// The structured wall label returned by /api/cartel.
export interface Cartel {
  title: string;
  artist: string;
  year: string;
  medium: string;
  dimensions: string;
  text: string;
  provenance: string;
}

// A saved entry in the gallery (Dexie).
export interface Entry {
  id?: number;
  cartel: Cartel;
  lang: Lang;
  photo: string; // data URL (downscaled JPEG) of the photographed object
  createdAt: number;
}
