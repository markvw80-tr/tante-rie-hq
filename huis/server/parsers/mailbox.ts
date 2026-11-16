import type { Bericht, JsonMailbox, JsonMailboxOpen } from "../../shared/types.ts";
import { dagenTussen, datumUitNaam } from "./datum.ts";
import { parseFrontmatter } from "./frontmatter.ts";

const PRIORITEITEN = ["hoog", "normaal", "laag"] as const;
const OPEN_REGEL = new Set(["nieuw", "in_behandeling"]);

export function parseBericht(bestand: string, tekst: string, map: Bericht["map"], vandaag: string): Bericht {
  const { velden } = parseFrontmatter(tekst);
  const prio = PRIORITEITEN.find((p) => p === velden.prioriteit) ?? "normaal";
  return {
    bestand,
    map,
    van: velden.van ?? "?",
    aan: velden.aan ?? "?",
    datum: velden.datum ?? datumUitNaam(bestand) ?? "",
    onderwerp: velden.onderwerp || bestand,
    prioriteit: prio,
    antwoordOp: velden["antwoord-op"] || null,
    leeftijdDagen: dagenTussen(datumUitNaam(bestand), vandaag),
  };
}

interface RuwBericht {
  readonly bericht_id?: string;
  readonly datum?: string;
  readonly status?: string;
  readonly regels?: ReadonlyArray<{ readonly status?: string }>;
}

/** Open productregels in team/mailbox/seo-naar-pim.json en pim-naar-seo.json. */
export function parseJsonMailbox(naam: string, tekst: string, vandaag: string): JsonMailbox {
  let berichten: readonly RuwBericht[];
  try {
    const data: unknown = JSON.parse(tekst);
    const lijst = (data as { berichten?: unknown }).berichten;
    berichten = Array.isArray(lijst) ? (lijst as RuwBericht[]) : [];
  } catch {
    return { naam, leesbaar: false, open: [] };
  }

  const open: JsonMailboxOpen[] = berichten
    .filter((b) => b.status !== "verwerkt")
    .map((b) => {
      const regels = b.regels ?? [];
      return {
        berichtId: b.bericht_id ?? "?",
        status: b.status ?? "?",
        regelsOpen: regels.filter((r) => OPEN_REGEL.has(r.status ?? "")).length,
        regelsTotaal: regels.length,
        leeftijdDagen: dagenTussen(b.datum ?? null, vandaag),
      };
    });
  return { naam, leesbaar: true, open };
}
