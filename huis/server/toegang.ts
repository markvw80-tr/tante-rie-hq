import { readFileSync } from "node:fs";

/**
 * Wie er behalve Mark via Tailscale in het huis mag. Staat in huis/data/toegang.json (niet in git), bijvoorbeeld
 * { "nikkie": "nikkie@voorbeeld.nl" }: het e-mailadres van haar Tailscale-account. Ontbreekt het, dan alleen Mark.
 */
export interface Toegang {
  readonly nikkie: string | null;
}

export const GEEN_EXTRA: Toegang = { nikkie: null };
const LOGIN = /^[^\s@]+@[^\s@]+$|^[a-z0-9][a-z0-9._-]*@github$/i;

export function geldigeToegang(x: unknown): Toegang {
  if (!x || typeof x !== "object" || Array.isArray(x)) return GEEN_EXTRA;
  const nikkie = (x as Record<string, unknown>).nikkie;
  return { nikkie: typeof nikkie === "string" && LOGIN.test(nikkie.trim()) ? nikkie.trim().toLowerCase() : null };
}

/** Leest het bestand bij elke aanroep, zodat een wijziging zonder herstart geldt. Kapot of ontbrekend: alleen Mark. */
export function schijfToegang(bestand: string): () => Toegang {
  return () => {
    try {
      return geldigeToegang(JSON.parse(readFileSync(bestand, "utf8")));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") console.error(`[huis] toegang ${bestand} niet te lezen:`, e);
      return GEEN_EXTRA;
    }
  };
}
