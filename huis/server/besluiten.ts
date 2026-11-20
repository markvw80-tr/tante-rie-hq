import { createHash } from "node:crypto";
import path from "node:path";
import type { Besluit, BesluitAntwoord, BesluitKeuze, Persoon } from "../shared/types.ts";
import type { Bron } from "./bron.ts";
import type { AgendaBesluit } from "./parsers/markdown.ts";
import { alleBerichten } from "./werk.ts";

export const KEUZES: readonly BesluitKeuze[] = ["akkoord", "afgewezen", "vraag"];
const KEUZE_TEKST: Record<BesluitKeuze, string> = {
  akkoord: "Akkoord",
  afgewezen: "Niet akkoord",
  vraag: "Eerst een vraag",
};
const MAX_ONDERWERP = 110;

/** Vaste sleutel voor een besluit: dezelfde agendaregel geeft altijd hetzelfde id. */
export function besluitId(tekst: string): string {
  return createHash("sha1").update(tekst.trim()).digest("hex").slice(0, 10);
}

export function metAntwoorden(besluiten: readonly AgendaBesluit[], antwoorden: ReadonlyMap<string, BesluitAntwoord>): Besluit[] {
  return besluiten.map((b) => {
    const id = besluitId(b.tekst);
    return { ...b, id, antwoord: antwoorden.get(id) ?? null };
  });
}

/**
 * Stelt het bericht op dat Mark naar een team stuurt. De server bouwt de tekst zelf uit de agendaregel,
 * zodat de browser alleen een keuze en een toelichting meegeeft.
 */
export function besluitBericht(besluit: Besluit, keuze: BesluitKeuze, toelichting: string, door: Persoon = "mark"): { onderwerp: string; tekst: string } {
  const kort = besluit.tekst.length > 70 ? `${besluit.tekst.slice(0, 67).trimEnd()}...` : besluit.tekst;
  if (door === "nikkie") return reactieNikkie(besluit, keuze, toelichting, kort);
  const onderwerp = `Besluit Mark: ${KEUZE_TEKST[keuze].toLowerCase()}, ${kort}`.slice(0, MAX_ONDERWERP).replace(/^-+/, "");
  const regels = [
    `Besluit: ${keuze}`,
    `Besluit-id: ${besluit.id}`,
    "",
    `${KEUZE_TEKST[keuze]} van Mark op dit agendapunt van de directie:`,
    "",
    `> ${besluit.tekst}`,
  ];
  if (toelichting.trim()) regels.push("", "Toelichting van Mark:", "", toelichting.trim());
  regels.push("", "Verstuurd door Mark via het Huis van Tante Rie.");
  return { onderwerp, tekst: regels.join("\n") };
}

/**
 * Nikkie kan reageren op een agendapunt, maar beslist niet: haar bericht heeft geen Besluit- of Besluit-id-regel,
 * zodat het huis en de teams het nooit als akkoord van Mark lezen. Het punt blijft open tot Mark beslist.
 */
function reactieNikkie(besluit: Besluit, keuze: BesluitKeuze, toelichting: string, kort: string): { onderwerp: string; tekst: string } {
  const onderwerp = `Reactie Nikkie (geen besluit): ${KEUZE_TEKST[keuze].toLowerCase()}, ${kort}`.slice(0, MAX_ONDERWERP);
  const regels = [
    `Reactie van Nikkie op dit agendapunt van de directie: ${KEUZE_TEKST[keuze].toLowerCase()}.`,
    "",
    `> ${besluit.tekst}`,
    "",
    "Dit is geen besluit en geen akkoord van Mark. Het agendapunt blijft open tot Mark zelf beslist.",
  ];
  if (toelichting.trim()) regels.push("", "Toelichting van Nikkie:", "", toelichting.trim());
  regels.push("", "Verstuurd door Nikkie via het Huis van Tante Rie.");
  return { onderwerp, tekst: regels.join("\n") };
}

const ID_REGEL = /^Besluit-id: ([a-f0-9]{10})$/m;
const KEUZE_REGEL = /^Besluit: (akkoord|afgewezen|vraag)$/m;

/** Zoekt in de mailbox naar berichten van Mark met een besluit-id. Het nieuwste antwoord per besluit telt. */
export async function zoekBesluitAntwoorden(bron: Bron, mailbox: string, vandaag: string): Promise<Map<string, BesluitAntwoord>> {
  const vanMark = (await alleBerichten(bron, mailbox, vandaag)).filter((b) => b.van === "mark").sort((a, b) => a.bestand.localeCompare(b.bestand));
  const antwoorden = new Map<string, BesluitAntwoord>();
  for (const b of vanMark) {
    const tekst = (await bron.lees(path.join(mailbox, b.aan, b.map, b.bestand))) ?? "";
    const id = ID_REGEL.exec(tekst)?.[1];
    const keuze = KEUZE_REGEL.exec(tekst)?.[1] as BesluitKeuze | undefined;
    if (id && keuze) antwoorden.set(id, { keuze, aan: b.aan, datum: b.datum, bestand: b.bestand });
  }
  return antwoorden;
}
