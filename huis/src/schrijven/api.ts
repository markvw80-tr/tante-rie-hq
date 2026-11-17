import type { AutomaatStand, BesluitKeuze, MailboxTeam } from "../../shared/types.ts";

export interface Concept {
  readonly aan: MailboxTeam | null;
  readonly onderwerp: string;
  readonly tekst: string;
  readonly prioriteit: "hoog" | "normaal" | "laag";
  readonly antwoordOp: string | null;
}

export interface Verstuurd {
  readonly bestand: string;
  readonly aan: MailboxTeam;
}

/** Alle schrijfacties gaan met de huis-header en JSON; de server weigert al het andere. */
export async function post<T>(pad: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(pad, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Huis": "mark" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("De huis-server is niet bereikbaar.");
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as { fout?: string } | null)?.fout ?? `Server gaf ${res.status}`);
  return data as T;
}

export const stuurOpdracht = (c: Concept) => post<Verstuurd>("/api/opdracht", c);

export const stuurBesluit = (id: string, keuze: BesluitKeuze, toelichting: string, aan: MailboxTeam | null) =>
  post<Verstuurd>("/api/besluit", { id, keuze, toelichting, aan });

export const haalPostOp = () => post<{ ok: true }>("/api/post-ophalen", {});

export const TEAMS: ReadonlyArray<readonly [MailboxTeam, string]> = [
  ["seo", "SEO (etalage)"],
  ["pim", "PIM (theekelder)"],
  ["design", "Design (atelier)"],
];

export const archiefActie = (actie: "archiveer" | "terug", ids: readonly string[]) => post<{ aantal: number }>("/api/archief", { actie, ids });

export const zetAutomaat = (aan: boolean, budgetUsd: number) => post<AutomaatStand>("/api/automaat", { aan, budgetUsd });
