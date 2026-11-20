// Meldt artikelen die op een inkooporder of levering staan maar niet in Shopify aan PIM.
// Bron is de stand van het Pakhuis (inkoop-app). Elk artikel (leverancier + SKU) wordt één keer gemeld;
// het bericht gaat van Inkoop naar PIM, zodat de automaat de PIM-lead start.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { PakhuisNieuwArtikel } from "../shared/types.ts";
import type { PakhuisBron } from "./pakhuis.ts";
import type { Postbode } from "./postbode.ts";

export const MELD_INTERVAL_MS = 10 * 60_000;
const MAX_ONTHOUDEN = 2_000;

export interface MelderOpslag {
  lees(): readonly string[];
  schrijf(sleutels: readonly string[]): void;
}

export const meldSleutel = (a: Pick<PakhuisNieuwArtikel, "leverancier" | "sku">) => `${a.leverancier.toLowerCase()}|${a.sku.toLowerCase()}`;

/** Artikelen die nog niet eerder aan PIM zijn gemeld. */
export function teMelden(artikelen: readonly PakhuisNieuwArtikel[], gemeld: ReadonlySet<string>): PakhuisNieuwArtikel[] {
  return artikelen.filter((a) => !gemeld.has(meldSleutel(a)));
}

const cel = (t: string) => t.replace(/\|/g, "/");
const euro = (n: number) => `€ ${n.toFixed(2).replace(".", ",")}`;

/** Het bericht aan PIM. Eén bericht per controle, met alle nieuwe artikelen in een tabel. */
export function pimBericht(artikelen: readonly PakhuisNieuwArtikel[], appUrl: string): { onderwerp: string; tekst: string } {
  const n = artikelen.length;
  const leveranciers = [...new Set(artikelen.map((a) => a.leverancier))].join(", ");
  const onderwerp = `${n} ${n === 1 ? "nieuw artikel" : "nieuwe artikelen"} aanmaken (${leveranciers})`.slice(0, 110);
  const regels = artikelen.map(
    (a) =>
      `| ${cel(a.sku)} | ${cel(a.omschrijving)} | ${cel(a.leverancier)} | ${cel(a.document)} | ${a.aantal} | ${euro(a.inkoopprijs)} | ${appUrl}/confirmations/${a.confirmationId} |`,
  );
  const tekst = [
    "**Van:** Inkoop",
    "**Naar:** PIM",
    `**Doel:** ${n === 1 ? "Dit artikel staat" : "Deze artikelen staan"} op een inkooporder of levering, maar niet in Shopify. Graag aanmaken en verrijken.`,
    "",
    "| SKU | Omschrijving leverancier | Leverancier | Document | Aantal | Inkoopprijs | In de inkoop-app |",
    "|---|---|---|---|---|---|---|",
    ...regels,
    "",
    "Afspraken:",
    "- Gebruik precies deze SKU. Daaraan herkent de inkoop-app het artikel; daarna kan de levering worden afgevinkt en bijgeboekt.",
    "- Volg jullie gewone route: eerst een diff naar Mark, pas na zijn akkoord aanmaken in Shopify (als concept, niet direct live).",
    "- De kostprijs hoeft PIM niet in te vullen: die zet de inkoop-app bij het afvinken van de levering.",
    "- Laat Inkoop weten wanneer de artikelen in Shopify staan, of als een SKU eigenlijk een bestaand artikel is.",
    "",
    "Dit bericht is automatisch verstuurd door het Pakhuis in het Huis van Tante Rie. Het is geen opdracht of akkoord van Mark.",
    "",
    "**Benodigde input:** productfoto's en teksten volgens de PIM-werkwijze.",
    "**Deadline:** voordat de levering binnen is; zolang het artikel ontbreekt kan die niet worden bijgeboekt.",
  ].join("\n");
  return { onderwerp, tekst };
}

export interface MelderDeps {
  readonly pakhuis: PakhuisBron;
  readonly postbode: Pick<Postbode, "stuur">;
  readonly opslag: MelderOpslag;
}

/** Controleert de stand en stuurt PIM één bericht met de artikelen die nog niet gemeld waren. */
export class PimMelder {
  private bezig: Promise<number> | null = null;
  constructor(private readonly deps: MelderDeps) {}

  controleer(): Promise<number> {
    this.bezig ??= this.voerUit().finally(() => (this.bezig = null));
    return this.bezig;
  }

  private async voerUit(): Promise<number> {
    const { stand, bereikbaar } = await this.deps.pakhuis.stand();
    if (!bereikbaar || !stand) return 0;
    const gemeld = this.deps.opslag.lees();
    const nieuw = teMelden(stand.nieuweArtikelen, new Set(gemeld));
    if (!nieuw.length) return 0;
    const { onderwerp, tekst } = pimBericht(nieuw, stand.appUrl);
    await this.deps.postbode.stuur({ van: "inkoop", aan: "pim", onderwerp, tekst, prioriteit: "normaal", antwoordOp: null });
    this.deps.opslag.schrijf([...gemeld, ...nieuw.map(meldSleutel)].slice(-MAX_ONTHOUDEN));
    return nieuw.length;
  }
}

/** Gemelde sleutels in een JSON-bestand; een kapot of ontbrekend bestand telt als leeg. */
export function schijfMelderOpslag(bestand: string): MelderOpslag {
  return {
    lees() {
      try {
        const data = JSON.parse(readFileSync(bestand, "utf8")) as unknown;
        return Array.isArray(data) ? data.filter((s): s is string => typeof s === "string") : [];
      } catch {
        return [];
      }
    },
    schrijf(sleutels) {
      mkdirSync(path.dirname(bestand), { recursive: true });
      const tijdelijk = `${bestand}.tmp`;
      writeFileSync(tijdelijk, JSON.stringify(sleutels, null, 2));
      renameSync(tijdelijk, bestand);
    },
  };
}
