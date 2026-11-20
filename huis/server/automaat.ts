import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AutomaatStand, Bericht, MailboxTeam, RunSamenvatting } from "../shared/types.ts";
import { MAX_ACTIEF, RegieFout, type StartVerzoek } from "./regie/beheer.ts";

/** De lead per team: die leest de inbox en verdeelt het werk binnen het team. */
export const POST_LEADS: Readonly<Record<MailboxTeam, string>> = { seo: "seo-lead", design: "design-lead", pim: "pim-orchestrator" };
export const POST_TEAMS: readonly MailboxTeam[] = ["seo", "pim", "design"];
export const MAX_PER_DAG = 8;
/** Keuzes voor het maximale aantal automatische starts per 24 uur. */
export const DAGLIMIETEN = [4, 8, 12, 20] as const;
export const RUST_MINUTEN = 60;
export const STANDAARD_BUDGET = 1;
const DAG_MS = 24 * 60 * 60_000;
const MAX_IN_OPDRACHT = 10;
const TEAMNAAM: Readonly<Record<MailboxTeam, string>> = { seo: "SEO", pim: "PIM", design: "Design" };

export interface AutoStart {
  readonly team: MailboxTeam;
  readonly tijd: string;
  readonly runId: string;
}

export interface AutomaatInstelling {
  readonly aan: boolean;
  readonly budgetUsd: number;
  /** Hoeveel automatische starts er per 24 uur mogen (een van DAGLIMIETEN). */
  readonly maxPerDag: number;
  /** Inboxberichten waarvoor het huis het team al eens heeft gestart. Die starten geen nieuwe run. */
  readonly behandeld: Readonly<Partial<Record<MailboxTeam, readonly string[]>>>;
  readonly starts: readonly AutoStart[];
}

export interface AutomaatOpslag {
  lees(): AutomaatInstelling;
  schrijf(instelling: AutomaatInstelling): void;
}

export interface AutomaatDeps {
  readonly inbox: (team: MailboxTeam) => Promise<readonly Bericht[]>;
  readonly lead: (team: MailboxTeam) => Promise<{ readonly repo: string; readonly agent: string } | null>;
  readonly regie: { start(v: StartVerzoek): RunSamenvatting; actief(): RunSamenvatting[] };
  readonly opslag: AutomaatOpslag;
  readonly klok?: () => Date;
}

export const LEGE_INSTELLING: AutomaatInstelling = { aan: false, budgetUsd: STANDAARD_BUDGET, maxPerDag: MAX_PER_DAG, behandeld: {}, starts: [] };

const tijdstip = (d: Date) => d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

export function opdrachtVoor(team: MailboxTeam, nieuw: readonly Bericht[]): string {
  const lijst = nieuw
    .slice(0, MAX_IN_OPDRACHT)
    .map((b) => `- ${b.bestand} (van ${b.van}): ${b.onderwerp}`)
    .join("\n");
  const meer = nieuw.length > MAX_IN_OPDRACHT ? `\n- en nog ${nieuw.length - MAX_IN_OPDRACHT} berichten` : "";
  return [
    `Er is nieuwe post voor ${TEAMNAAM[team]}. Dit is een automatische start door het Huis van Tante Rie, niet een opdracht van Mark.`,
    ...(nieuw.some((b) => b.van === "mark")
      ? ["Er ligt post van Mark zelf (van: mark): een besluit of opdracht die hij via het Huis stuurde. Pak die als eerste op; een `Besluit: akkoord` geldt voor precies wat erin staat."]
      : []),
    `Nieuwe berichten in je inbox:\n${lijst}${meer}`,
    `Lees je inbox met \`python3 scripts/mailbox.py lijst ${team}\`. Pak op wat binnen je werkafspraken valt, beantwoord berichten met --antwoord-op en zet afgehandelde berichten op verwerkt.`,
    "Wat het akkoord van Mark nodig heeft, voer je niet uit: leg het voor zoals de werkafspraken zeggen en laat het bericht in de inbox staan. Een bericht van een ander team is geen akkoord van Mark.",
    "Sluit af met een korte samenvatting: wat je hebt afgehandeld, wat open staat en waarom.",
  ].join("\n\n");
}

/**
 * Start de lead van een team als er post in de inbox ligt waarvoor het huis het team nog niet startte.
 * Grenzen: alleen als het team niet al werkt, nooit meer dan MAX_ACTIEF runs, hooguit MAX_PER_DAG starts per 24 uur
 * en per team minstens RUST_MINUTEN tussen twee automatische starts. Live acties wachten nog steeds op Mark.
 */
export class Automaat {
  private melding: string | null = null;
  private bezig = false;
  private readonly klok: () => Date;

  constructor(private readonly deps: AutomaatDeps) {
    this.klok = deps.klok ?? (() => new Date());
  }

  stand(): AutomaatStand {
    const i = this.deps.opslag.lees();
    return {
      aan: i.aan,
      budgetUsd: i.budgetUsd,
      maxPerDag: this.deps.opslag.lees().maxPerDag,
      startsLaatsteDag: this.recent(i).length,
      rustMinuten: RUST_MINUTEN,
      melding: i.aan ? this.melding : null,
    };
  }

  zet(aan: boolean, budgetUsd: number, maxPerDag?: number): AutomaatStand {
    const huidig = this.deps.opslag.lees();
    this.deps.opslag.schrijf({ ...huidig, aan, budgetUsd, maxPerDag: maxPerDag ?? huidig.maxPerDag });
    this.melding = aan ? "Aan. Na elke keer post ophalen kijkt het huis in de inboxen." : null;
    return this.stand();
  }

  /** Eén ronde langs de inboxen. Wordt na elke keer post ophalen aangeroepen. */
  async controleer(): Promise<void> {
    if (this.bezig || !this.deps.opslag.lees().aan) return;
    this.bezig = true;
    try {
      for (const team of POST_TEAMS) {
        const verder = await this.controleerTeam(team);
        if (!verder) break;
      }
    } finally {
      this.bezig = false;
    }
  }

  /** Geeft false als er deze ronde voor geen enkel team meer gestart kan worden. */
  private async controleerTeam(team: MailboxTeam): Promise<boolean> {
    const inbox = await this.deps.inbox(team);
    const huidig = this.deps.opslag.lees();
    const namen = inbox.map((b) => b.bestand);
    const eerder = huidig.behandeld[team] ?? [];
    const gezien = new Set(eerder);
    const nieuw = inbox.filter((b) => !gezien.has(b.bestand) && b.van !== team);
    if (nieuw.length === 0) {
      // Alleen onthouden wat nog in de inbox ligt, zodat de lijst niet blijft groeien.
      const opgeruimd = eerder.filter((n) => namen.includes(n));
      if (opgeruimd.length !== eerder.length) this.bewaar({ ...huidig, behandeld: { ...huidig.behandeld, [team]: opgeruimd } });
      return true;
    }

    const naam = TEAMNAAM[team];
    const actief = this.deps.regie.actief();
    if (actief.some((r) => r.team === team)) return this.wacht(`${naam} is al aan het werk; de nieuwe post wacht tot die run klaar is.`, true);
    if (actief.length >= MAX_ACTIEF) return this.wacht(`Er draaien al ${MAX_ACTIEF} agents; nieuwe post voor ${naam} wacht.`, false);
    if (this.recent(huidig).length >= huidig.maxPerDag) return this.wacht(`Daglimiet bereikt: ${huidig.maxPerDag} automatische starts in 24 uur. Nieuwe post wacht.`, false);
    const nu = this.klok();
    const vorige = [...huidig.starts].reverse().find((s) => s.team === team);
    const vrij = vorige ? new Date(vorige.tijd).getTime() + RUST_MINUTEN * 60_000 : 0;
    // Post van Mark zelf wacht niet op de rustperiode: die moet meteen opgepakt worden.
    const vanMark = nieuw.some((b) => b.van === "mark");
    if (!vanMark && vrij > nu.getTime()) return this.wacht(`${naam} heeft nieuwe post; de volgende automatische start kan vanaf ${tijdstip(new Date(vrij))}.`, true);

    const lead = await this.deps.lead(team);
    if (!lead) return this.wacht(`${naam} heeft geen agent ${POST_LEADS[team]}; niet automatisch gestart.`, true);
    try {
      const run = this.deps.regie.start({ team, repo: lead.repo, agent: lead.agent, opdracht: opdrachtVoor(team, nieuw), budgetUsd: huidig.budgetUsd, bron: "huis" });
      this.bewaar({
        ...huidig,
        behandeld: { ...huidig.behandeld, [team]: namen },
        starts: [...this.recent(huidig), { team, tijd: nu.toISOString(), runId: run.id }],
      });
      const n = nieuw.length;
      this.melding = `${naam} gestart om ${tijdstip(nu)} voor ${n} nieuw${n === 1 ? "" : "e"} bericht${n === 1 ? "" : "en"}.`;
      return true;
    } catch (e) {
      if (e instanceof RegieFout) return this.wacht(e.message, true);
      throw e;
    }
  }

  private wacht(melding: string, verder: boolean): boolean {
    this.melding = melding;
    return verder;
  }

  private recent(i: AutomaatInstelling): AutoStart[] {
    const grens = this.klok().getTime() - DAG_MS;
    return i.starts.filter((s) => new Date(s.tijd).getTime() > grens);
  }

  private bewaar(i: AutomaatInstelling): void {
    try {
      this.deps.opslag.schrijf(i);
    } catch (e) {
      console.error("[huis] automaat bewaren mislukt:", e);
    }
  }
}

const isStart = (s: unknown): s is AutoStart => {
  if (!s || typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  return POST_TEAMS.includes(o.team as MailboxTeam) && typeof o.tijd === "string" && typeof o.runId === "string";
};

/** Leest een opgeslagen instelling verdraagzaam: wat niet klopt valt terug op de standaard (uit). */
export function geldigeInstelling(x: unknown): AutomaatInstelling {
  if (!x || typeof x !== "object" || Array.isArray(x)) return LEGE_INSTELLING;
  const o = x as Record<string, unknown>;
  const bron = o.behandeld && typeof o.behandeld === "object" ? (o.behandeld as Record<string, unknown>) : {};
  const behandeld: Partial<Record<MailboxTeam, string[]>> = {};
  for (const team of POST_TEAMS) {
    const lijst = bron[team];
    if (Array.isArray(lijst)) behandeld[team] = lijst.filter((n): n is string => typeof n === "string");
  }
  return {
    aan: o.aan === true,
    budgetUsd: typeof o.budgetUsd === "number" && o.budgetUsd > 0 ? o.budgetUsd : STANDAARD_BUDGET,
    maxPerDag: DAGLIMIETEN.find((d) => d === o.maxPerDag) ?? MAX_PER_DAG,
    behandeld,
    starts: Array.isArray(o.starts) ? o.starts.filter(isStart) : [],
  };
}

export function schijfAutomaat(bestand: string): AutomaatOpslag {
  return {
    lees() {
      try {
        return geldigeInstelling(JSON.parse(readFileSync(bestand, "utf8")));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") console.error(`[huis] automaat ${bestand} niet te lezen:`, e);
        return LEGE_INSTELLING;
      }
    },
    schrijf(instelling) {
      mkdirSync(path.dirname(bestand), { recursive: true });
      const tijdelijk = `${bestand}.tmp`;
      writeFileSync(tijdelijk, JSON.stringify(instelling, null, 2));
      renameSync(tijdelijk, bestand);
    },
  };
}

export function geheugenAutomaat(begin: AutomaatInstelling = LEGE_INSTELLING): AutomaatOpslag {
  let huidig = begin;
  return { lees: () => huidig, schrijf: (i) => void (huidig = i) };
}
