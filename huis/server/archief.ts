import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Gesprek } from "../shared/types.ts";

/** Een gearchiveerd gesprek: het laatste bericht op het moment van archiveren. Komt er een nieuwer bij, dan is het weer zichtbaar. */
export interface ArchiefItem {
  readonly laatste: string;
  readonly sinds: string;
}

export type Archief = Readonly<Record<string, ArchiefItem>>;

/** Het archief is Marks eigen overzicht en staat alleen lokaal; de mailbox van de teams blijft ongemoeid. */
export interface ArchiefOpslag {
  lees(): Archief;
  schrijf(archief: Archief): void;
}

const laatsteBericht = (g: Gesprek) => g.berichten.at(-1)?.bestand ?? g.id;

export function pasArchiefToe(gesprekken: readonly Gesprek[], archief: Archief): Gesprek[] {
  return gesprekken.map((g) => {
    const item = archief[g.id];
    const gearchiveerd = Boolean(item) && !g.open && item.laatste === laatsteBericht(g);
    return gearchiveerd === g.gearchiveerd ? g : { ...g, gearchiveerd };
  });
}

/** Alleen afgehandelde gesprekken (niets meer in een inbox) kunnen het archief in. */
export function archiveer(archief: Archief, gesprekken: readonly Gesprek[], ids: readonly string[], nu: string): { archief: Archief; aantal: number } {
  const gewenst = new Set(ids);
  const toe = gesprekken.filter((g) => gewenst.has(g.id) && !g.open);
  const nieuw = Object.fromEntries(toe.map((g) => [g.id, { laatste: laatsteBericht(g), sinds: nu }]));
  return { archief: { ...archief, ...nieuw }, aantal: toe.length };
}

export function haalTerug(archief: Archief, ids: readonly string[]): { archief: Archief; aantal: number } {
  const weg = new Set(ids);
  const blijft = Object.entries(archief).filter(([id]) => !weg.has(id));
  return { archief: Object.fromEntries(blijft), aantal: Object.keys(archief).length - blijft.length };
}

export function schijfArchief(bestand: string): ArchiefOpslag {
  return {
    lees() {
      try {
        const data: unknown = JSON.parse(readFileSync(bestand, "utf8"));
        return data && typeof data === "object" && !Array.isArray(data) ? (data as Archief) : {};
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") console.error(`[huis] archief ${bestand} niet te lezen:`, e);
        return {};
      }
    },
    schrijf(archief) {
      mkdirSync(path.dirname(bestand), { recursive: true });
      const tijdelijk = `${bestand}.tmp`;
      writeFileSync(tijdelijk, JSON.stringify(archief, null, 2));
      renameSync(tijdelijk, bestand);
    },
  };
}

export function geheugenArchief(begin: Archief = {}): ArchiefOpslag {
  let huidig = begin;
  return { lees: () => huidig, schrijf: (a) => void (huidig = a) };
}
