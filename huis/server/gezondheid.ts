// De meterkast van het huis: vaste controles of het huis en de agents gezond zijn, zonder AI-kosten.
// Springt er iets op oranje of rood dat nog niet gemeld is, dan start de systeembeheerder (agent in de HQ-map).
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { GezondheidStand, MailboxTeam, MeterKleur, Meting, RunSamenvatting, TeamId } from "../shared/types.ts";
import { MAX_ACTIEF, RegieFout, type StartVerzoek } from "./regie/beheer.ts";

export const CONTROLE_MS = 10 * 60_000;
export const LOGIN_WAARSCHUW_DAGEN = 3;
export const SCHIJF_ORANJE_GB = 5;
export const SCHIJF_ROOD_GB = 1;
export const OPEN_UREN = 24;
export const BEHEERDER = "systeembeheerder";
export const BEHEER_BUDGET_USD = 1;
export const BEHEER_MAX_PER_DAG = 4;
export const BEHEER_RUST_MINUTEN = 60;
const UUR_MS = 3_600_000;
const DAG_MS = 24 * UUR_MS;
const MAX_DETAILS = 12;
const MAX_GEMELD = 500;

const TEAMNAAM: Readonly<Record<TeamId, string>> = { directie: "Directie", seo: "SEO", pim: "PIM", design: "Design", inkoop: "Inkoop", financien: "Financiën", klant: "Klant" };

export interface LoginStand {
  readonly ingelogd: boolean;
  readonly verlooptOp: string | null;
}
export interface RepoStand {
  readonly naam: string;
  /** Aantal lokale commits dat nog niet op GitHub staat. */
  readonly voor: number;
  /** Gewijzigde (bijgehouden) bestanden die al langer dan OPEN_UREN niet zijn vastgelegd. */
  readonly oudeWijzigingen: readonly string[];
}
export interface InboxBericht {
  readonly team: MailboxTeam;
  readonly bestand: string;
  readonly binnen: Date | null;
}
export interface AgentTools {
  readonly team: TeamId;
  readonly agent: string;
  readonly tools: readonly string[];
}

export interface GezondheidDeps {
  /** null: de login kon niet gelezen worden. */
  login(): Promise<LoginStand | null>;
  runs(): readonly RunSamenvatting[];
  /** Tools die de laatste run van deze agent bij de start had; null als onbekend. */
  gereedschap(team: TeamId, agent: string): readonly string[] | null;
  agentTools(): Promise<readonly AgentTools[]>;
  repos(): Promise<readonly RepoStand[]>;
  inbox(): Promise<readonly InboxBericht[]>;
  /** Ontbreekt: het Pakhuis is niet ingesteld. */
  pakhuis?(): Promise<boolean>;
  schijfVrijGb(): Promise<number | null>;
}

const meting = (id: string, naam: string, kleur: MeterKleur, tekst: string, details: readonly string[] = []): Meting => ({
  id,
  naam,
  kleur,
  tekst,
  details: details.length > MAX_DETAILS ? [...details.slice(0, MAX_DETAILS), `en nog ${details.length - MAX_DETAILS}`] : details,
});

export function meetLogin(stand: LoginStand | null, nu: Date): Meting {
  const naam = "Claude-login";
  if (!stand) return meting("login", naam, "oranje", "De login kon niet worden gecontroleerd.");
  if (!stand.ingelogd) return meting("login", naam, "rood", "Claude is uitgelogd: geen enkele agent kan starten. Log in met `claude auth login`.");
  if (stand.verlooptOp) {
    const dagen = (new Date(stand.verlooptOp).getTime() - nu.getTime()) / DAG_MS;
    const datum = new Date(stand.verlooptOp).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
    if (dagen < LOGIN_WAARSCHUW_DAGEN) return meting("login", naam, "oranje", `De login verloopt op ${datum}. Log op tijd opnieuw in met \`claude auth login\`.`);
    return meting("login", naam, "groen", `Ingelogd, geldig tot ${datum}.`);
  }
  return meting("login", naam, "groen", "Ingelogd.");
}

/** Per team en agent telt alleen de laatste run; fouten ouder dan een dag doen niet meer mee. */
export function meetRuns(runs: readonly RunSamenvatting[], nu: Date): Meting {
  const laatste = new Map<string, RunSamenvatting>();
  for (const r of [...runs].sort((a, b) => a.gestart.localeCompare(b.gestart))) laatste.set(`${r.team}|${r.agent}`, r);
  const recent = [...laatste.values()].filter((r) => r.status === "fout" && nu.getTime() - new Date(r.geeindigd ?? r.gestart).getTime() < DAG_MS);
  const budget = recent.filter((r) => r.budgetOp);
  const fout = recent.filter((r) => !r.budgetOp);
  const regel = (r: RunSamenvatting) => `${TEAMNAAM[r.team]}, ${r.agent}: ${r.budgetOp ? "budget op" : r.laatsteRegel.slice(0, 160)}`;
  const naam = "Agent-runs";
  if (fout.length) return meting("runs", naam, "rood", `${fout.length} ${fout.length === 1 ? "agent liep" : "agents liepen"} vast bij de laatste run.`, recent.map(regel));
  if (budget.length) return meting("runs", naam, "oranje", "Een run stopte omdat het budget op was; het werk is waarschijnlijk niet af.", budget.map(regel));
  return meting("runs", naam, "groen", "De laatste runs van alle agents zijn goed afgelopen.");
}

const KOPPELING = /^mcp__(.+)__([^_].*)$/;

/**
 * Noemt een agent een tool van een koppeling die in zijn eigen laatste run wel aanwezig was, maar zonder die tool?
 * Per agent: een run ziet alleen de tools van die agent, dus de run van een teamgenoot zegt hier niets over.
 * Tools van een koppeling die er helemaal niet was, tellen niet: agents noemen vaak twee namen van dezelfde koppeling.
 */
export function meetGereedschap(agents: readonly AgentTools[], gereedschap: (team: TeamId, agent: string) => readonly string[] | null): Meting {
  const missend: string[] = [];
  for (const a of agents) {
    const sessie = gereedschap(a.team, a.agent);
    if (!sessie) continue;
    const aanwezig = new Set(sessie);
    const koppelingen = new Set(sessie.map((t) => KOPPELING.exec(t)?.[1]).filter(Boolean));
    for (const t of a.tools) {
      const m = KOPPELING.exec(t);
      if (!m || aanwezig.has(t) || !koppelingen.has(m[1])) continue;
      missend.push(`${TEAMNAAM[a.team]}, ${a.agent}: ${m[2]} (${m[1]}) bestaat niet`);
    }
  }
  const naam = "Gereedschap van agents";
  if (missend.length) return meting("gereedschap", naam, "oranje", "Agents rekenen op tools die er niet (meer) zijn.", missend);
  return meting("gereedschap", naam, "groen", "Alle agents hebben de tools die ze noemen.");
}

export function meetRepos(repos: readonly RepoStand[]): Meting {
  const details = repos.flatMap((r) => [
    ...(r.voor > 0 ? [`${r.naam}: ${r.voor} ${r.voor === 1 ? "commit" : "commits"} niet gepusht`] : []),
    ...r.oudeWijzigingen.map((b) => `${r.naam}: wijziging staat al meer dan ${OPEN_UREN} uur open in ${b}`),
  ]);
  const naam = "Projectmappen (git)";
  if (details.length) return meting("repos", naam, "oranje", "Er staat werk dat nog niet is vastgelegd of niet op GitHub staat.", details);
  return meting("repos", naam, "groen", "Alle projectmappen zijn vastgelegd en gepusht.");
}

/** Een bericht dat er al lag toen het team een geslaagde run deed, en dat nog in de inbox ligt: vergeten op verwerkt te zetten. */
export function meetInbox(berichten: readonly InboxBericht[], runs: readonly RunSamenvatting[], nu: Date): Meting {
  const blijven = berichten.filter((b) => {
    if (!b.binnen || nu.getTime() - b.binnen.getTime() < OPEN_UREN * UUR_MS) return false;
    const binnen = b.binnen.getTime();
    return runs.some((r) => r.team === b.team && r.status === "klaar" && new Date(r.gestart).getTime() > binnen);
  });
  const naam = "Inboxen";
  if (blijven.length) {
    return meting("inbox", naam, "oranje", "Berichten liggen nog in de inbox terwijl het team daarna al heeft gewerkt.", blijven.map((b) => `${TEAMNAAM[b.team]}: ${b.bestand}`));
  }
  return meting("inbox", naam, "groen", "Geen vergeten berichten in de inboxen.");
}

export function meetPakhuis(bereikbaar: boolean | undefined): Meting {
  const naam = "Pakhuis (inkoop-app)";
  if (bereikbaar === undefined) return meting("pakhuis", naam, "groen", "Niet ingesteld.");
  if (!bereikbaar) return meting("pakhuis", naam, "rood", "De inkoop-app op de NAS geeft geen antwoord, of de sleutel klopt niet.");
  return meting("pakhuis", naam, "groen", "De inkoop-app antwoordt.");
}

export function meetSchijf(vrijGb: number | null): Meting {
  const naam = "Schijfruimte";
  if (vrijGb === null) return meting("schijf", naam, "oranje", "De vrije ruimte kon niet worden gelezen.");
  const tekst = `${vrijGb.toFixed(1)} GB vrij op deze Mac.`;
  if (vrijGb < SCHIJF_ROOD_GB) return meting("schijf", naam, "rood", `${tekst} Agents en git kunnen vastlopen.`);
  if (vrijGb < SCHIJF_ORANJE_GB) return meting("schijf", naam, "oranje", `${tekst} Ruim binnenkort op.`);
  return meting("schijf", naam, "groen", tekst);
}

/** Eén controle die zelf misgaat, mag de rest niet tegenhouden. */
async function veilig(id: string, naam: string, fn: () => Promise<Meting>): Promise<Meting> {
  try {
    return await fn();
  } catch (e) {
    return meting(id, naam, "oranje", `Deze controle mislukte: ${(e as Error).message}`);
  }
}

export async function meetAlles(deps: GezondheidDeps, nu: Date): Promise<Meting[]> {
  const runs = deps.runs();
  return Promise.all([
    veilig("login", "Claude-login", async () => meetLogin(await deps.login(), nu)),
    veilig("runs", "Agent-runs", async () => meetRuns(runs, nu)),
    veilig("gereedschap", "Gereedschap van agents", async () => meetGereedschap(await deps.agentTools(), deps.gereedschap)),
    veilig("repos", "Projectmappen (git)", async () => meetRepos(await deps.repos())),
    veilig("inbox", "Inboxen", async () => meetInbox(await deps.inbox(), runs, nu)),
    veilig("pakhuis", "Pakhuis (inkoop-app)", async () => meetPakhuis(deps.pakhuis ? await deps.pakhuis() : undefined)),
    veilig("schijf", "Schijfruimte", async () => meetSchijf(await deps.schijfVrijGb())),
  ]);
}

// ---------- de systeembeheerder starten ----------

export interface BeheerOpslag {
  /** Problemen waarvoor de beheerder al is gestart; zolang ze blijven staan, niet opnieuw. */
  readonly gemeld: readonly string[];
  readonly starts: readonly string[];
}
export interface BeheerOpslagBron {
  lees(): BeheerOpslag;
  schrijf(o: BeheerOpslag): void;
}
export interface BeheerDeps {
  readonly regie: { start(v: StartVerzoek): RunSamenvatting; actief(): RunSamenvatting[] };
  /** De HQ-map, waar de agent systeembeheerder woont. */
  readonly repo: string;
  readonly opslag: BeheerOpslagBron;
  readonly klok?: () => Date;
}

const LEEG: BeheerOpslag = { gemeld: [], starts: [] };
/** Login kan de beheerder niet oplossen en schijfruimte mag hij niet opruimen: die staan alleen in de meterkast. */
const NIET_VOOR_BEHEERDER = new Set(["login", "schijf"]);

const sleutels = (m: Meting) => (m.details.length ? m.details.map((d) => `${m.id}|${d}`) : [`${m.id}|${m.tekst}`]);

export function beheerOpdracht(problemen: readonly Meting[]): string {
  const lijst = problemen
    .map((m) => [`- ${m.naam} (${m.kleur}): ${m.tekst}`, ...m.details.map((d) => `  - ${d}`)].join("\n"))
    .join("\n");
  return [
    "De meterkast van het Huis meldt nieuwe problemen. Dit is een automatische start door het Huis, niet een opdracht van Mark.",
    `Problemen:\n${lijst}`,
    "Zoek per probleem de oorzaak. Los op wat volgens je instructies veilig is en leg de rest met de precieze oplossing voor aan Mark.",
    "Sluit af met een statusblok voor de directie: wat je hebt opgelost, wat Mark moet doen en waarom.",
  ].join("\n\n");
}

export class Systeembeheer {
  private laatste: GezondheidStand | null = null;
  private melding: string | null = null;
  private bezig: Promise<GezondheidStand> | null = null;
  private readonly klok: () => Date;

  constructor(
    private readonly deps: GezondheidDeps,
    private readonly beheer: BeheerDeps,
  ) {
    this.klok = beheer.klok ?? (() => new Date());
  }

  stand(): GezondheidStand | null {
    return this.laatste;
  }

  /** Eén ronde: alles meten en zo nodig de systeembeheerder starten. Tegelijk lopende aanroepen delen dezelfde ronde. */
  controleer(): Promise<GezondheidStand> {
    this.bezig ??= this.ronde().finally(() => (this.bezig = null));
    return this.bezig;
  }

  private async ronde(): Promise<GezondheidStand> {
    const nu = this.klok();
    const metingen = await meetAlles(this.deps, nu);
    this.besluit(metingen, nu);
    this.laatste = { bijgewerkt: nu.toISOString(), metingen, melding: this.melding };
    return this.laatste;
  }

  private besluit(metingen: readonly Meting[], nu: Date): void {
    const opgeslagen = this.beheer.opslag.lees();
    const problemen = metingen.filter((m) => m.kleur !== "groen" && !NIET_VOOR_BEHEERDER.has(m.id));
    const huidig = new Set(problemen.flatMap(sleutels));
    // Wat opgelost is, vergeten: komt het later terug, dan meldt de beheerder het opnieuw.
    const gemeld = opgeslagen.gemeld.filter((s) => huidig.has(s));
    const starts = opgeslagen.starts.filter((s) => nu.getTime() - new Date(s).getTime() < DAG_MS);
    const bewaar = (o: Partial<BeheerOpslag>) => this.schrijf({ gemeld, starts, ...o });

    const nieuw = problemen.filter((m) => sleutels(m).some((s) => !gemeld.includes(s)));
    if (nieuw.length === 0) {
      if (problemen.length === 0) this.melding = null;
      return bewaar({});
    }
    if (metingen.some((m) => m.id === "login" && m.kleur === "rood")) {
      this.melding = "Er zijn problemen, maar de systeembeheerder kan niet starten zolang de Claude-login verlopen is.";
      return bewaar({});
    }
    const actief = this.beheer.regie.actief();
    if (actief.some((r) => r.agent === BEHEERDER)) {
      this.melding = "De systeembeheerder is al aan het werk; nieuwe problemen wachten tot hij klaar is.";
      return bewaar({});
    }
    if (actief.length >= MAX_ACTIEF) {
      this.melding = `Er draaien al ${MAX_ACTIEF} agents; de systeembeheerder wacht.`;
      return bewaar({});
    }
    if (starts.length >= BEHEER_MAX_PER_DAG) {
      this.melding = `De systeembeheerder is vandaag al ${BEHEER_MAX_PER_DAG} keer gestart; nieuwe problemen staan alleen in de meterkast.`;
      return bewaar({});
    }
    const vorige = starts.at(-1);
    if (vorige && nu.getTime() - new Date(vorige).getTime() < BEHEER_RUST_MINUTEN * 60_000) {
      const vrij = new Date(new Date(vorige).getTime() + BEHEER_RUST_MINUTEN * 60_000);
      this.melding = `Nieuwe problemen; de systeembeheerder kan weer starten vanaf ${vrij.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}.`;
      return bewaar({});
    }
    try {
      this.beheer.regie.start({ team: "directie", repo: this.beheer.repo, agent: BEHEERDER, opdracht: beheerOpdracht(problemen), budgetUsd: BEHEER_BUDGET_USD, bron: "huis" });
    } catch (e) {
      if (!(e instanceof RegieFout)) throw e;
      this.melding = e.message;
      return bewaar({});
    }
    this.melding = `Systeembeheerder gestart om ${nu.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })} voor ${nieuw.length} ${nieuw.length === 1 ? "probleem" : "problemen"}.`;
    bewaar({ gemeld: [...huidig].slice(-MAX_GEMELD), starts: [...starts, nu.toISOString()] });
  }

  private schrijf(o: BeheerOpslag): void {
    try {
      this.beheer.opslag.schrijf(o);
    } catch (e) {
      console.error("[huis] systeembeheer bewaren mislukt:", e);
    }
  }
}

export function geheugenBeheer(begin: BeheerOpslag = LEEG): BeheerOpslagBron {
  let o = begin;
  return { lees: () => o, schrijf: (n) => void (o = n) };
}

export function schijfBeheer(bestand: string): BeheerOpslagBron {
  return {
    lees() {
      try {
        const x = JSON.parse(readFileSync(bestand, "utf8")) as Partial<BeheerOpslag>;
        const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : []);
        return { gemeld: strings(x.gemeld), starts: strings(x.starts) };
      } catch {
        return LEEG;
      }
    },
    schrijf(o) {
      mkdirSync(path.dirname(bestand), { recursive: true });
      const tijdelijk = `${bestand}.tmp`;
      writeFileSync(tijdelijk, JSON.stringify(o, null, 2));
      renameSync(tijdelijk, bestand);
    },
  };
}
