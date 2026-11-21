import path from "node:path";
import type { Kengetal, MailboxTeam, TeamKengetallen } from "../shared/types.ts";
import type { Bron } from "./bron.ts";
import type { TeamConfig } from "./config.ts";

/** Teams die data/kengetallen.json bijhouden, in de volgorde van de kaart op de toonbank. */
export const KENGETAL_TEAMS: readonly MailboxTeam[] = ["financien", "klant", "seo"];
const BESTAND = path.join("data", "kengetallen.json");
const MAX_CIJFERS = 12;
const MAX_TEKST = 120;

const tekst = (x: unknown): string | null => (typeof x === "string" && x.trim() ? x.trim().slice(0, MAX_TEKST) : null);
const getal = (x: unknown): number | null | undefined => (x === null ? null : typeof x === "number" && Number.isFinite(x) ? x : undefined);

function kengetal(x: unknown): Kengetal | null {
  if (!x || typeof x !== "object") return null;
  const r = x as Record<string, unknown>;
  const id = tekst(r.id);
  const label = tekst(r.label);
  const waarde = getal(r.waarde);
  const vorige = getal(r.vorige ?? null);
  if (!id || !label || waarde === undefined || vorige === undefined) return null;
  return {
    id,
    label,
    waarde,
    vorige,
    periode: tekst(r.periode) ?? "",
    bron: tekst(r.bron) ?? "",
    beter: r.beter === "lager" ? "lager" : "hoger",
    eenheid: (tekst(r.eenheid) ?? "").slice(0, 4),
  };
}

/** Leest data/kengetallen.json van één team. Kapot of onvolledig: null, zodat het huis gewoon doorgaat. */
export function parseKengetallen(inhoud: string, team: MailboxTeam): TeamKengetallen | null {
  let d: unknown;
  try {
    d = JSON.parse(inhoud);
  } catch {
    return null;
  }
  if (!d || typeof d !== "object") return null;
  const r = d as Record<string, unknown>;
  if (!Array.isArray(r.cijfers) || typeof r.bijgewerkt !== "string") return null;
  return {
    team,
    bijgewerkt: r.bijgewerkt.slice(0, 25),
    cijfers: r.cijfers.map(kengetal).filter((k): k is Kengetal => k !== null).slice(0, MAX_CIJFERS),
    fouten: Array.isArray(r.fouten) ? r.fouten.map(tekst).filter((t): t is string => t !== null).slice(0, 5) : [],
  };
}

/** De kengetallen van alle teams die ze bijhouden; teams zonder (geldig) bestand vallen weg. */
export async function leesKengetallen(bron: Bron, teams: readonly TeamConfig[]): Promise<TeamKengetallen[]> {
  const uit: TeamKengetallen[] = [];
  for (const id of KENGETAL_TEAMS) {
    const team = teams.find((t) => t.id === id);
    if (!team) continue;
    const inhoud = await bron.lees(path.join(team.repo, BESTAND));
    const k = inhoud ? parseKengetallen(inhoud, id) : null;
    if (k) uit.push(k);
  }
  return uit;
}
