import { mkdirSync, readFileSync, readdirSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import type { RunDetail } from "../../shared/types.ts";
import type { Opslag } from "./beheer.ts";

const MAX_GELADEN = 60;

/** Bewaart elke run als JSON in huis/runs (staat in .gitignore). Atomisch via een tijdelijk bestand. */
export function schijfOpslag(map: string): Opslag {
  mkdirSync(map, { recursive: true });
  return {
    bewaar(run) {
      const doel = path.join(map, `${run.id}.json`);
      const tijdelijk = `${doel}.tmp`;
      writeFileSync(tijdelijk, JSON.stringify(run));
      renameSync(tijdelijk, doel);
    },
    laadAlle() {
      return readdirSync(map)
        .filter((n) => n.endsWith(".json"))
        .flatMap((n): RunDetail[] => {
          try {
            return [JSON.parse(readFileSync(path.join(map, n), "utf8")) as RunDetail];
          } catch (e) {
            console.error(`[huis] run ${n} niet te lezen:`, e);
            return [];
          }
        })
        .sort((a, b) => b.gestart.localeCompare(a.gestart))
        .slice(0, MAX_GELADEN);
    },
  };
}

export const geheugenOpslag = (): Opslag & { readonly alles: Map<string, RunDetail> } => {
  const alles = new Map<string, RunDetail>();
  return { alles, bewaar: (r) => void alles.set(r.id, r), laadAlle: () => [...alles.values()] };
};
