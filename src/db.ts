import Dexie, { type Table } from "dexie";
import type { Entry } from "./types";

// Local-first gallery of past cartels. No destructive migrations.
class CartelDB extends Dexie {
  entries!: Table<Entry, number>;

  constructor() {
    super("le-cartel");
    this.version(1).stores({
      entries: "++id, createdAt",
    });
  }
}

export const db = new CartelDB();
