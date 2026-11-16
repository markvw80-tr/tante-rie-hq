import type { TeamId } from "../../shared/types.ts";

/** Wat het leesvenster moet openen. Elke soort heeft een eigen alleen-lezen endpoint. */
export type Verwijzing =
  | { readonly soort: "werk"; readonly team: TeamId; readonly bron: string; readonly bestand: string }
  | { readonly soort: "bericht"; readonly bestand: string }
  | { readonly soort: "agent"; readonly team: TeamId; readonly naam: string }
  | { readonly soort: "batch"; readonly fase: string; readonly batch: string; readonly bestand: string };

export function urlVoor(v: Verwijzing): string {
  const q = (o: Record<string, string>) => new URLSearchParams(o).toString();
  switch (v.soort) {
    case "werk":
      return `/api/document?${q({ team: v.team, bron: v.bron, bestand: v.bestand })}`;
    case "bericht":
      return `/api/bericht?${q({ bestand: v.bestand })}`;
    case "agent":
      return `/api/agent?${q({ team: v.team, naam: v.naam })}`;
    case "batch":
      return `/api/batch?${q({ fase: v.fase, batch: v.batch, bestand: v.bestand })}`;
  }
}

export async function haalJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("De huis-server is niet bereikbaar.");
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body as { fout?: string } | null)?.fout ?? `Server gaf ${res.status}`);
  return body as T;
}
