import path from "node:path";
import type { Persoon, TeamId } from "../../shared/types.ts";
import type { Bron } from "../bron.ts";
import type { TeamConfig } from "../config.ts";
import { parseAgent } from "../parsers/agents.ts";
import { OngeldigVerzoek } from "../werk.ts";
import { AlleenMark, RegieFout, type RunBeheer } from "./beheer.ts";

export const BUDGETTEN = [0.5, 1, 2, 5] as const;
const AGENT_BESTAND = /^[a-z0-9][a-z0-9-]*$/;
const RUN_ID = /^[0-9a-f-]{36}$/;
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

interface Antwoord {
  readonly status: number;
  readonly body: unknown;
}

export function runId(pad: string, achtervoegsel = ""): string | null {
  const m = new RegExp(`^/api/runs/([^/]+)${achtervoegsel}$`).exec(pad);
  if (!m) return null;
  if (!RUN_ID.test(m[1])) throw new OngeldigVerzoek("Ongeldig run-id");
  return m[1];
}

export function behandelRunGet(pad: string, regie: RunBeheer): Antwoord | null {
  if (pad === "/api/runs") return { status: 200, body: regie.lijst() };
  const id = runId(pad);
  if (!id) return null;
  const run = regie.detail(id);
  return run ? { status: 200, body: run } : { status: 404, body: { fout: "Run niet gevonden" } };
}

/** Start, stop en poortbesluiten. Agents worden opgezocht in de agentmap van het team, nooit vrij opgegeven paden. */
export async function behandelRunPost(pad: string, body: unknown, regie: RunBeheer, bron: Bron, teams: readonly TeamConfig[], door: Persoon = "mark"): Promise<Antwoord | null> {
  try {
    if (pad === "/api/runs") {
      if (!isObj(body)) throw new OngeldigVerzoek("Verwacht een JSON-object");
      const team = teams.find((t) => t.id === body.team);
      if (!team) throw new OngeldigVerzoek("Onbekend team");
      const bestand = String(body.agent ?? "");
      if (!AGENT_BESTAND.test(bestand)) throw new OngeldigVerzoek("Ongeldige agentnaam");
      const map = path.join(team.repo, ".claude/agents");
      if (!(await bron.bestanden(map, ".md")).includes(`${bestand}.md`)) return { status: 404, body: { fout: "Deze agent bestaat niet bij dit team" } };
      const agent = parseAgent((await bron.lees(path.join(map, `${bestand}.md`))) ?? "", `${bestand}.md`);
      const opdracht = typeof body.opdracht === "string" ? body.opdracht.trim() : "";
      if (opdracht.length < 5 || opdracht.length > 4000) throw new OngeldigVerzoek("Schrijf een opdracht van 5 tot 4000 tekens");
      const budgetUsd = BUDGETTEN.find((b) => b === body.budgetUsd);
      if (budgetUsd === undefined) throw new OngeldigVerzoek(`Budget is een van ${BUDGETTEN.join(", ")} dollar`);
      return { status: 201, body: regie.start({ team: team.id as TeamId, repo: team.repo, agent: agent.naam, opdracht, budgetUsd, bron: door }) };
    }
    const stopId = runId(pad, "/stop");
    if (stopId) {
      regie.stop(stopId, door);
      return { status: 200, body: { ok: true } };
    }
    const poortId = runId(pad, "/poort");
    if (poortId) {
      if (!isObj(body) || typeof body.verzoekId !== "string" || typeof body.toestaan !== "boolean") throw new OngeldigVerzoek("Verwacht verzoekId en toestaan");
      const notitie = typeof body.notitie === "string" ? body.notitie.trim().slice(0, 1000) : "";
      regie.beslis(poortId, body.verzoekId, body.toestaan, notitie, door);
      return { status: 200, body: { ok: true } };
    }
    return null;
  } catch (e) {
    if (e instanceof AlleenMark) return { status: 403, body: { fout: e.message } };
    if (e instanceof RegieFout) return { status: 409, body: { fout: e.message } };
    if (e instanceof OngeldigVerzoek) return { status: 400, body: { fout: e.message } };
    throw e;
  }
}
