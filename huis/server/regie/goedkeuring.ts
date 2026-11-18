import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Schakelaar "toestemmingsvragen automatisch goedkeuren". Geldt nooit voor live acties
 * (Shopify, thema, publiceren, push): die wachten altijd op Mark.
 */
export interface GoedkeuringOpslag {
  lees(): boolean;
  schrijf(aan: boolean): void;
}

export function geldigeGoedkeuring(x: unknown): boolean {
  return !!x && typeof x === "object" && !Array.isArray(x) && (x as Record<string, unknown>).aan === true;
}

export function geheugenGoedkeuring(aan = false): GoedkeuringOpslag {
  let stand = aan;
  return { lees: () => stand, schrijf: (nieuw) => void (stand = nieuw) };
}

/** Bewaart de schakelaar in een JSON-bestand (niet in git). Onleesbaar of ontbrekend betekent: uit. */
export function schijfGoedkeuring(bestand: string): GoedkeuringOpslag {
  return {
    lees() {
      try {
        return geldigeGoedkeuring(JSON.parse(readFileSync(bestand, "utf8")));
      } catch {
        return false;
      }
    },
    schrijf(aan) {
      mkdirSync(path.dirname(bestand), { recursive: true });
      const tijdelijk = `${bestand}.tmp`;
      writeFileSync(tijdelijk, JSON.stringify({ aan, gewijzigd: new Date().toISOString() }, null, 2));
      renameSync(tijdelijk, bestand);
    },
  };
}
