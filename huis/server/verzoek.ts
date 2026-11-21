import { AGENT_NAAM, MAIL_TEAMS } from "../shared/types.ts";
import type { BesluitKeuze, MailboxTeam } from "../shared/types.ts";
import { KEUZES } from "./besluiten.ts";
import { isVeiligeNaam } from "./parsers/documenten.ts";
import type { Verzending } from "./postbode.ts";
import { OngeldigVerzoek } from "./werk.ts";

const PRIORITEITEN = ["hoog", "normaal", "laag"] as const;
export const GRENZEN = { onderwerp: [3, 110], tekst: [1, 8000], toelichting: [0, 4000] } as const;

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

function tekstVeld(body: Record<string, unknown>, veld: string, [min, max]: readonly [number, number]): string {
  const waarde = body[veld] ?? "";
  if (typeof waarde !== "string") throw new OngeldigVerzoek(`${veld} moet tekst zijn`);
  const schoon = waarde.replace(/\r\n/g, "\n").trim();
  if (schoon.length < min) throw new OngeldigVerzoek(`${veld} is te kort (minimaal ${min} tekens)`);
  if (schoon.length > max) throw new OngeldigVerzoek(`${veld} is te lang (maximaal ${max} tekens)`);
  return schoon;
}

export function valideerTeam(waarde: unknown): MailboxTeam {
  const team = MAIL_TEAMS.find((t) => t === waarde);
  if (!team) throw new OngeldigVerzoek("Kies SEO, PIM of Design als ontvanger");
  return team;
}

export function valideerOpdracht(body: unknown): Verzending {
  if (!isObject(body)) throw new OngeldigVerzoek("Verwacht een JSON-object");
  const onderwerp = tekstVeld(body, "onderwerp", GRENZEN.onderwerp);
  if (/[\n\t]/.test(onderwerp)) throw new OngeldigVerzoek("Het onderwerp moet op één regel");
  if (onderwerp.startsWith("-")) throw new OngeldigVerzoek("Het onderwerp mag niet met een streepje beginnen");
  const prioriteit = PRIORITEITEN.find((p) => p === (body.prioriteit ?? "normaal"));
  if (!prioriteit) throw new OngeldigVerzoek("Prioriteit is hoog, normaal of laag");
  const antwoordOp = body.antwoordOp ?? null;
  if (antwoordOp !== null && (typeof antwoordOp !== "string" || !isVeiligeNaam(antwoordOp, ".md"))) {
    throw new OngeldigVerzoek("Ongeldig bericht om op te antwoorden");
  }
  const voor = body.voor ?? null;
  if (voor !== null && (typeof voor !== "string" || !AGENT_NAAM.test(voor))) {
    throw new OngeldigVerzoek("Ongeldige agent; kies een agent uit de lijst of het hele team");
  }
  return {
    aan: valideerTeam(body.aan),
    onderwerp,
    tekst: tekstVeld(body, "tekst", GRENZEN.tekst),
    prioriteit,
    antwoordOp: antwoordOp as string | null,
    voor: voor as string | null,
  };
}

export interface BesluitVerzoek {
  readonly id: string;
  readonly keuze: BesluitKeuze;
  readonly toelichting: string;
  readonly aan: MailboxTeam | null;
}

export function valideerBesluit(body: unknown): BesluitVerzoek {
  if (!isObject(body)) throw new OngeldigVerzoek("Verwacht een JSON-object");
  if (typeof body.id !== "string" || !/^[a-f0-9]{10}$/.test(body.id)) throw new OngeldigVerzoek("Ongeldig besluit-id");
  const keuze = KEUZES.find((k) => k === body.keuze);
  if (!keuze) throw new OngeldigVerzoek("Kies akkoord, afgewezen of vraag");
  const toelichting = tekstVeld(body, "toelichting", GRENZEN.toelichting);
  if (keuze !== "akkoord" && toelichting.length === 0) throw new OngeldigVerzoek("Geef bij niet akkoord of een vraag een korte toelichting");
  return { id: body.id, keuze, toelichting, aan: body.aan == null ? null : valideerTeam(body.aan) };
}
