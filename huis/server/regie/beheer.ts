import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import type { PoortVerzoek, RunDetail, RunRegel, RunStatus, RunSamenvatting, TeamId } from "../../shared/types.ts";
import { beoordeel, samenvatting } from "./poort.ts";
import { vertaal } from "./vertaal.ts";

export const MAX_ACTIEF = 3;
export const MAX_REGELS = 2000;
export const POORT_WACHTTIJD_MS = 30 * 60_000;
const EINDSTATUS: ReadonlySet<RunStatus> = new Set(["klaar", "gestopt", "fout", "onderbroken"]);

export type Toestemming = (tool: string, invoer: Record<string, unknown>, opties: { signal: AbortSignal; hookReden?: string }) => Promise<{ toestaan: boolean; bericht: string }>;

/** Start één agent. De echte versie gebruikt de Claude Agent SDK; tests geven een nep-starter. */
export interface Starter {
  start(args: { readonly repo: string; readonly agent: string; readonly opdracht: string; readonly budgetUsd: number; readonly toestemming: Toestemming; readonly signal: AbortSignal }): AsyncIterable<unknown>;
}

export interface Opslag {
  bewaar(run: RunDetail): void;
  laadAlle(): RunDetail[];
}

export interface StartVerzoek {
  readonly team: TeamId;
  readonly repo: string;
  readonly agent: string;
  readonly opdracht: string;
  readonly budgetUsd: number;
}

interface Lopend {
  run: RunDetail;
  readonly stop: AbortController;
  wachtend: { readonly verzoek: PoortVerzoek; readonly klaar: (toestaan: boolean, notitie: string) => void } | null;
}

export class RegieFout extends Error {}

/** Houdt bij welke agents draaien, verzamelt hun log en laat poortvragen bij Mark uitkomen. */
export class RunBeheer extends EventEmitter {
  private readonly runs = new Map<string, Lopend>();

  constructor(private readonly starter: Starter, private readonly opslag: Opslag, private readonly klok: () => Date = () => new Date()) {
    super();
    for (const oud of opslag.laadAlle()) {
      const run = EINDSTATUS.has(oud.status) ? oud : { ...oud, status: "onderbroken" as const, poort: null };
      this.runs.set(run.id, { run, stop: new AbortController(), wachtend: null });
    }
  }

  lijst(): RunSamenvatting[] {
    return [...this.runs.values()].map((l) => samenvat(l.run)).sort((a, b) => b.gestart.localeCompare(a.gestart));
  }

  actief(): RunSamenvatting[] {
    return this.lijst().filter((r) => !EINDSTATUS.has(r.status));
  }

  detail(id: string): RunDetail | null {
    return this.runs.get(id)?.run ?? null;
  }

  start(v: StartVerzoek): RunSamenvatting {
    const actief = this.actief();
    if (actief.length >= MAX_ACTIEF) throw new RegieFout(`Er draaien al ${MAX_ACTIEF} agents. Wacht tot er één klaar is.`);
    if (actief.some((r) => r.team === v.team && r.agent === v.agent)) throw new RegieFout(`${v.agent} is al aan het werk.`);

    const nu = this.klok().toISOString();
    const run: RunDetail = {
      id: randomUUID(),
      team: v.team,
      agent: v.agent,
      opdracht: v.opdracht,
      status: "bezig",
      gestart: nu,
      geeindigd: null,
      kostenUsd: null,
      budgetUsd: v.budgetUsd,
      poort: null,
      laatsteRegel: "Wordt gestart...",
      regels: [],
      resultaat: null,
    };
    const lopend: Lopend = { run, stop: new AbortController(), wachtend: null };
    this.runs.set(run.id, lopend);
    this.voegToe(lopend, [{ t: nu, soort: "systeem", tekst: `Opdracht van Mark aan ${v.agent}: ${v.opdracht}` }]);
    void this.draai(lopend, v);
    return samenvat(run);
  }

  stop(id: string): void {
    const l = this.runs.get(id);
    if (!l || EINDSTATUS.has(l.run.status)) throw new RegieFout("Deze run draait niet.");
    l.wachtend?.klaar(false, "Run gestopt door Mark.");
    l.stop.abort();
    this.zet(l, { status: "gestopt", geeindigd: this.klok().toISOString(), poort: null });
    this.voegToe(l, [this.regel("systeem", "Gestopt door Mark.")]);
  }

  beslis(id: string, verzoekId: string, toestaan: boolean, notitie: string): void {
    const l = this.runs.get(id);
    if (!l?.wachtend || l.wachtend.verzoek.id !== verzoekId) throw new RegieFout("Er wacht hier geen vraag (meer).");
    l.wachtend.klaar(toestaan, notitie);
  }

  private async draai(l: Lopend, v: StartVerzoek): Promise<void> {
    try {
      const berichten = this.starter.start({ repo: v.repo, agent: v.agent, opdracht: v.opdracht, budgetUsd: v.budgetUsd, toestemming: this.toestemmingVoor(l, v.repo), signal: l.stop.signal });
      for await (const bericht of berichten) {
        const { regels, afloop } = vertaal(bericht, this.klok().toISOString());
        this.voegToe(l, regels);
        if (afloop) {
          this.zet(l, { status: afloop.gelukt ? "klaar" : "fout", kostenUsd: afloop.kostenUsd, resultaat: afloop.resultaat, geeindigd: this.klok().toISOString() });
        }
      }
      if (!EINDSTATUS.has(l.run.status)) this.zet(l, { status: "klaar", geeindigd: this.klok().toISOString() });
    } catch (e) {
      if (l.run.status === "gestopt") return;
      console.error(`[huis] run ${l.run.id} mislukt:`, e);
      this.voegToe(l, [this.regel("fout", `Fout: ${(e as Error).message}`)]);
      this.zet(l, { status: "fout", geeindigd: this.klok().toISOString(), poort: null });
    }
  }

  /** De poort: veilige acties gaan door, al het andere wacht op Mark (live acties altijd). */
  private toestemmingVoor(l: Lopend, repo: string): Toestemming {
    return async (tool, invoer, { signal, hookReden }) => {
      const oordeel = beoordeel(tool, invoer, repo, hookReden);
      if (oordeel.soort === "veilig") return { toestaan: true, bericht: "" };

      const verzoek: PoortVerzoek = {
        id: randomUUID(),
        soort: oordeel.soort,
        tool,
        samenvatting: samenvatting(tool, invoer),
        invoer: JSON.stringify(invoer, null, 2).slice(0, 4000),
        reden: oordeel.reden,
        sinds: this.klok().toISOString(),
      };
      this.voegToe(l, [this.regel("poort", `${oordeel.soort === "live" ? "LIVE, wacht op Mark" : "Wacht op toestemming"}: ${verzoek.samenvatting}`)]);
      this.zet(l, { status: "wacht", poort: verzoek });

      const besluit = await new Promise<{ toestaan: boolean; notitie: string }>((resolve) => {
        const klaar = (toestaan: boolean, notitie: string) => {
          clearTimeout(timer);
          signal.removeEventListener("abort", afgebroken);
          l.wachtend = null;
          resolve({ toestaan, notitie });
        };
        const afgebroken = () => klaar(false, "Run afgebroken.");
        const timer = setTimeout(() => klaar(false, "Geen antwoord van Mark binnen 30 minuten."), POORT_WACHTTIJD_MS);
        signal.addEventListener("abort", afgebroken, { once: true });
        l.wachtend = { verzoek, klaar };
      });

      if (!EINDSTATUS.has(l.run.status)) this.zet(l, { status: "bezig", poort: null });
      this.voegToe(l, [this.regel("besluit", `${besluit.toestaan ? "Toegestaan" : "Geweigerd"} door Mark${besluit.notitie ? `: ${besluit.notitie}` : ""}`)]);
      return {
        toestaan: besluit.toestaan,
        bericht: besluit.toestaan ? "" : `Mark heeft dit geweigerd via het Huis.${besluit.notitie ? ` Toelichting: ${besluit.notitie}` : ""} Ga niet om deze weigering heen; meld het in je afsluiting.`,
      };
    };
  }

  private regel(soort: RunRegel["soort"], tekst: string): RunRegel {
    return { t: this.klok().toISOString(), soort, tekst };
  }

  private voegToe(l: Lopend, regels: readonly RunRegel[]): void {
    if (regels.length === 0) return;
    const alle = [...l.run.regels, ...regels].slice(-MAX_REGELS);
    l.run = { ...l.run, regels: alle, laatsteRegel: regels.at(-1)!.tekst.slice(0, 200) };
    for (const r of regels) this.emit(`regel:${l.run.id}`, r);
    this.bewaar(l);
  }

  private zet(l: Lopend, wijziging: Partial<RunDetail>): void {
    l.run = { ...l.run, ...wijziging };
    this.emit(`status:${l.run.id}`, samenvat(l.run));
    this.emit("wijziging", samenvat(l.run));
    this.bewaar(l);
  }

  private bewaar(l: Lopend): void {
    try {
      this.opslag.bewaar(l.run);
    } catch (e) {
      console.error(`[huis] run ${l.run.id} bewaren mislukt:`, e);
    }
  }
}

function samenvat(r: RunDetail): RunSamenvatting {
  const { regels: _r, resultaat: _res, ...rest } = r;
  return rest;
}
