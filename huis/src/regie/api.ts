import type { RunSamenvatting, TeamId } from "../../shared/types.ts";
import { post } from "../schrijven/api.ts";

export const BUDGETTEN = [0.5, 1, 2, 5] as const;

export const startRun = (team: TeamId, agent: string, opdracht: string, budgetUsd: number) =>
  post<RunSamenvatting>("/api/runs", { team, agent, opdracht, budgetUsd });

export const stopRun = (id: string) => post<{ ok: true }>(`/api/runs/${id}/stop`, {});

export const beslisPoort = (id: string, verzoekId: string, toestaan: boolean, notitie: string) =>
  post<{ ok: true }>(`/api/runs/${id}/poort`, { verzoekId, toestaan, notitie });

export const EIND = new Set(["klaar", "gestopt", "fout", "onderbroken"]);

export const STATUS_TEKST: Record<RunSamenvatting["status"], string> = {
  bezig: "aan het werk",
  wacht: "wacht op jou",
  klaar: "klaar",
  gestopt: "gestopt",
  fout: "mislukt",
  onderbroken: "onderbroken",
};

export const euro = (usd: number | null) => (usd === null ? "onbekend" : `$${usd.toFixed(2)}`);
