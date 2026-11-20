import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TeamId } from "../shared/types.ts";

export const HQ = process.env.HUIS_HQ ? path.resolve(process.env.HUIS_HQ) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
/** Zonder git (zandbak en tests): mailbox.py krijgt --geen-git, er wordt niets gepusht. */
export const GEEN_GIT = process.env.HUIS_GEEN_GIT === "1";
export const WEB_PORT = 5310;
export const DREMPEL_DAGEN = 3; // gelijk aan scripts/directie_overzicht.py
export const RECENT_DAGEN = 2;
export const API_PORT = Number(process.env.HUIS_PORT ?? 4310);
export const HOST = "127.0.0.1";

export interface TeamConfig {
  readonly id: TeamId;
  readonly naam: string;
  readonly kamer: string;
  readonly repo: string;
  readonly heeftPipeline: boolean;
}

const thuis = (map: string) => path.join(os.homedir(), map);

export const TEAMS: readonly TeamConfig[] = [
  { id: "directie", naam: "Directie", kamer: "Kantoortje boven", repo: HQ, heeftPipeline: false },
  { id: "seo", naam: "SEO", kamer: "Etalage", repo: process.env.HUIS_SEO ?? thuis("tante-rie/tante-rie-seo"), heeftPipeline: false },
  { id: "design", naam: "Design", kamer: "Atelier", repo: process.env.HUIS_DESIGN ?? thuis("tante-rie/tante-rie-design"), heeftPipeline: false },
  { id: "pim", naam: "PIM", kamer: "Theekelder", repo: process.env.HUIS_PIM ?? thuis("tante-rie/tante-rie-pim"), heeftPipeline: true },
  { id: "inkoop", naam: "Inkoop", kamer: "Pakhuis", repo: process.env.HUIS_INKOOP ?? thuis("tante-rie/tante-rie-inkoop"), heeftPipeline: false },
];

export const PIPELINE_FASES: ReadonlyArray<readonly [string, string]> = [
  ["01-raw", "Binnengekomen"],
  ["02-normalized", "Genormaliseerd"],
  ["03-enriched", "Verrijkt"],
  ["04-review", "Ter controle"],
  ["05-published", "Gepubliceerd"],
];

/**
 * De mailbox op origin/main staat in de werkkopie .git/mailbox-main die scripts/mailbox.py bijhoudt.
 * Die is actueler dan de map in de werkboom (die op een featurebranch kan staan). Bestaat hij niet, dan de werkboom.
 */
export function mailboxMap(hq: string): string {
  const main = path.join(hq, ".git", "mailbox-main", "team", "mailbox");
  return existsSync(main) ? main : path.join(hq, "team", "mailbox");
}

/** Inkoop-app (po-confirmations): adres van /api/pakhuis en de gedeelde sleutel, uit huis/.env. Leeg = uit. */
export const PAKHUIS_URL = process.env.HUIS_PAKHUIS_URL ?? "";
export const PAKHUIS_TOKEN = process.env.HUIS_PAKHUIS_TOKEN ?? "";
