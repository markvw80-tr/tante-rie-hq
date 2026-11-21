import type { Bron } from "./bron.ts";
import type { TeamConfig } from "./config.ts";
import { besluitBericht } from "./besluiten.ts";
import { bouwHuis, stemmingVoor } from "./huis.ts";
import { DREMPEL_DAGEN } from "./config.ts";
import { pakhuisSignalen, type PakhuisBron } from "./pakhuis.ts";
import type { Systeembeheer } from "./gezondheid.ts";
import type { Dagverslag } from "./dagverslag.ts";
import { RegieFout } from "./regie/beheer.ts";
import type { GezondheidStand, HuisStand, Persoon } from "../shared/types.ts";
import type { Postbode } from "./postbode.ts";
import { archiveer, haalTerug, type ArchiefOpslag } from "./archief.ts";
import type { Ophaler } from "./ophaler.ts";
import { DAGLIMIETEN, type Automaat } from "./automaat.ts";
import { BUDGETTEN } from "./regie/routes.ts";
import { bouwGesprekken } from "./parsers/gesprekken.ts";
import { isVeiligeNaam } from "./parsers/documenten.ts";
import type { RunBeheer } from "./regie/beheer.ts";
import { behandelRunGet, behandelRunPost } from "./regie/routes.ts";
import { valideerBesluit, valideerOpdracht } from "./verzoek.ts";
import { alleBerichten, batchInhoud, leesAgent, leesBatchDocument, leesBericht, leesWerkDocument, OngeldigVerzoek, teamWerk } from "./werk.ts";
import { kostenOverzicht } from "./regie/kosten.ts";
import { leesKengetallen } from "./kengetallen.ts";

export interface Antwoord {
  readonly status: number;
  readonly body: unknown;
}

export interface Omgeving {
  readonly bron: Bron;
  readonly hq: string;
  readonly mailbox: string;
  readonly teams: readonly TeamConfig[];
  readonly vandaag: string;
  readonly postbode: Postbode;
  readonly regie?: RunBeheer;
  readonly archief?: ArchiefOpslag;
  readonly ophaler?: Ophaler;
  readonly automaat?: Automaat;
  readonly opAfstand?: string | null;
  readonly pakhuis?: PakhuisBron;
  readonly systeembeheer?: Systeembeheer;
  readonly dagverslag?: Dagverslag;
  /** Wie dit verzoek doet. Ontbreekt: Mark (de Mac zelf). Alleen Marks berichten gelden als zijn akkoord. */
  readonly persoon?: Persoon;
}

const NIET_GEVONDEN: Antwoord = { status: 404, body: { fout: "Niet gevonden" } };

function verplicht(params: URLSearchParams, ...namen: string[]): string[] {
  return namen.map((n) => {
    const waarde = params.get(n);
    if (!waarde) throw new OngeldigVerzoek(`Parameter ${n} ontbreekt`);
    return waarde;
  });
}

function zoekTeam(omg: Omgeving, id: string): TeamConfig {
  const team = omg.teams.find((t) => t.id === id);
  if (!team) throw new OngeldigVerzoek(`Onbekend team ${id}`);
  return team;
}

const ofNietGevonden = (body: unknown): Antwoord => (body === null ? NIET_GEVONDEN : { status: 200, body });

/** Alle GET-routes van het huis. Alleen lezen; elke naam van buiten wordt tegen een vaste lijst gecontroleerd. */
export async function behandel(pad: string, params: URLSearchParams, omg: Omgeving): Promise<Antwoord> {
  try {
    if (pad === "/api/huis") {
      const huis = metGezondheid(await metPakhuis(await bouwHuis(omg.bron, omg.hq, omg.teams, omg.vandaag, omg.mailbox), omg.pakhuis), omg.systeembeheer?.stand() ?? null);
      return { status: 200, body: { ...huis, dagverslag: omg.dagverslag?.stand() ?? null, runs: omg.regie?.lijst().slice(0, 20) ?? [], post: omg.ophaler?.stand(), automaat: omg.automaat?.stand(), kosten: omg.regie ? kostenOverzicht(omg.regie.lijst(), new Date()) : undefined, kengetallen: await leesKengetallen(omg.bron, omg.teams), autoGoedkeuring: omg.regie?.autoGoedkeuring(), opAfstand: omg.opAfstand ?? null, ik: omg.persoon ?? "mark" } };
    }
    if (omg.regie && pad.startsWith("/api/runs")) {
      const antwoord = behandelRunGet(pad, omg.regie);
      if (antwoord) return antwoord;
    }

    const teamMatch = /^\/api\/team\/([a-z]+)$/.exec(pad);
    if (teamMatch) return { status: 200, body: await teamWerk(omg.bron, omg.mailbox, zoekTeam(omg, teamMatch[1]), omg.vandaag, omg.archief?.lees()) };

    if (pad === "/api/document") {
      const [team, bron, bestand] = verplicht(params, "team", "bron", "bestand");
      return ofNietGevonden(await leesWerkDocument(omg.bron, zoekTeam(omg, team), bron, bestand));
    }
    if (pad === "/api/bericht") {
      const [bestand] = verplicht(params, "bestand");
      return ofNietGevonden(await leesBericht(omg.bron, omg.mailbox, bestand));
    }
    if (pad === "/api/agent") {
      const [team, naam] = verplicht(params, "team", "naam");
      return ofNietGevonden(await leesAgent(omg.bron, zoekTeam(omg, team), naam));
    }
    if (pad === "/api/batch") {
      const [fase, batch] = verplicht(params, "fase", "batch");
      const pim = zoekTeam(omg, "pim");
      const bestand = params.get("bestand");
      return ofNietGevonden(
        bestand ? await leesBatchDocument(omg.bron, pim.repo, fase, batch, bestand) : await batchInhoud(omg.bron, pim.repo, fase, batch),
      );
    }
    return { status: 404, body: { fout: "Onbekend adres" } };
  } catch (e) {
    if (e instanceof OngeldigVerzoek) return { status: 400, body: { fout: e.message } };
    throw e;
  }
}

/** Schrijfroutes. Berichten gaan via mailbox.py als van Mark of van Nikkie (wie het verzoek doet); de server stelt besluitberichten zelf op. */
export async function behandelPost(pad: string, body: unknown, omg: Omgeving): Promise<Antwoord> {
  try {
    if (pad === "/api/opdracht") {
      const verzending = valideerOpdracht(body);
      if (verzending.antwoordOp) {
        const bestaat = (await alleBerichten(omg.bron, omg.mailbox, omg.vandaag)).some((b) => b.bestand === verzending.antwoordOp);
        if (!bestaat) throw new OngeldigVerzoek("Het bericht waarop je antwoordt bestaat niet");
      }
      const { bestand } = await omg.postbode.stuur({ ...verzending, van: omg.persoon ?? "mark" });
      meldPost(omg);
      return { status: 201, body: { bestand, aan: verzending.aan } };
    }
    if (pad === "/api/besluit") {
      const verzoek = valideerBesluit(body);
      const huis = await bouwHuis(omg.bron, omg.hq, omg.teams, omg.vandaag, omg.mailbox);
      const besluit = huis.besluiten.find((b) => b.id === verzoek.id);
      if (!besluit) return { status: 404, body: { fout: "Dit besluit staat niet (meer) op de agenda" } };
      const team = besluit.team && besluit.team !== "directie" ? besluit.team : verzoek.aan;
      if (!team) throw new OngeldigVerzoek("Kies naar welk team dit besluit gaat");
      const door = omg.persoon ?? "mark";
      const { onderwerp, tekst } = besluitBericht(besluit, verzoek.keuze, verzoek.toelichting, door);
      const { bestand } = await omg.postbode.stuur({ van: door, aan: team, onderwerp, tekst, prioriteit: door === "mark" ? "hoog" : "normaal", antwoordOp: null, voor: besluit.team === team ? besluit.agent ?? null : null });
      meldPost(omg);
      return { status: 201, body: { bestand, aan: team } };
    }
    if (omg.regie && pad.startsWith("/api/runs")) {
      const antwoord = await behandelRunPost(pad, body, omg.regie, omg.bron, omg.teams, omg.persoon ?? "mark");
      if (antwoord) return antwoord;
    }
    if (pad === "/api/archief") return await archiefActie(body, omg);
    if (pad === "/api/automaat" && omg.automaat) return automaatActie(body, omg.automaat);
    if (pad === "/api/regie/goedkeuring" && omg.regie) return goedkeuringActie(body, omg.regie);
    if (pad === "/api/dagverslag" && omg.dagverslag) return await dagverslagActie(omg.dagverslag, omg.persoon ?? "mark");
    if (pad === "/api/post-ophalen") {
      await (omg.ophaler ? omg.ophaler.haalNu() : omg.postbode.ophalen());
      return { status: 200, body: { ok: true } };
    }
    return { status: 404, body: { fout: "Onbekend adres" } };
  } catch (e) {
    if (e instanceof OngeldigVerzoek) return { status: 400, body: { fout: e.message } };
    throw e;
  }
}

/** Automatisch oppakken aan of uit, met een budget per run uit de vaste lijst. Aanzetten kijkt meteen in de inboxen. */
function automaatActie(body: unknown, automaat: Automaat): Antwoord {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new OngeldigVerzoek("Verwacht een JSON-object");
  const { aan, budgetUsd, maxPerDag } = body as Record<string, unknown>;
  if (typeof aan !== "boolean") throw new OngeldigVerzoek("Verwacht aan: true of false");
  const budget = BUDGETTEN.find((b) => b === budgetUsd);
  if (budget === undefined) throw new OngeldigVerzoek(`Budget is een van ${BUDGETTEN.join(", ")} dollar`);
  const limiet = maxPerDag === undefined ? undefined : DAGLIMIETEN.find((d) => d === maxPerDag);
  if (maxPerDag !== undefined && limiet === undefined) throw new OngeldigVerzoek(`Daglimiet is een van ${DAGLIMIETEN.join(", ")}`);
  const stand = automaat.zet(aan, budget, limiet);
  if (aan) void automaat.controleer().catch((e) => console.error("[huis] automaat mislukt:", e));
  return { status: 200, body: stand };
}

/** Met de hand een tussendoorverslag van vandaag laten schrijven. Kost een run, dus alleen Mark. */
async function dagverslagActie(dagverslag: Dagverslag, persoon: Persoon): Promise<Antwoord> {
  if (persoon !== "mark") return { status: 403, body: { fout: "Alleen Mark kan een verslag laten maken." } };
  try {
    await dagverslag.maakNu();
  } catch (e) {
    if (e instanceof RegieFout) return { status: 409, body: { fout: e.message } };
    throw e;
  }
  return { status: 202, body: dagverslag.stand() };
}

/** Na een bericht van Mark kijkt de automaat meteen in de inboxen, in plaats van te wachten op de volgende ronde post ophalen. */
function meldPost(omg: Omgeving): void {
  void omg.automaat?.controleer().catch((e) => console.error("[huis] automaat na bericht van Mark mislukt:", e));
}

/** Toestemmingsvragen automatisch goedkeuren aan of uit. Live acties blijven altijd op Mark wachten. */
function goedkeuringActie(body: unknown, regie: NonNullable<Omgeving["regie"]>): Antwoord {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new OngeldigVerzoek("Verwacht een JSON-object");
  const { aan } = body as Record<string, unknown>;
  if (typeof aan !== "boolean") throw new OngeldigVerzoek("Verwacht aan: true of false");
  return { status: 200, body: { aan: regie.zetAutoGoedkeuring(aan) } };
}

const MAX_IDS = 500;

/** Archiveren of terughalen van gesprekken. Alleen bestaande, afgehandelde gesprekken gaan het archief in. */
async function archiefActie(body: unknown, omg: Omgeving): Promise<Antwoord> {
  if (!omg.archief) return { status: 404, body: { fout: "Archief is niet beschikbaar" } };
  const b = (typeof body === "object" && body !== null ? body : {}) as { actie?: unknown; ids?: unknown };
  if (b.actie !== "archiveer" && b.actie !== "terug") throw new OngeldigVerzoek("Actie is archiveer of terug");
  if (!Array.isArray(b.ids) || b.ids.length === 0 || b.ids.length > MAX_IDS) throw new OngeldigVerzoek(`Geef 1 tot ${MAX_IDS} gesprekken op`);
  const ids = b.ids.map(String);
  if (!ids.every((id) => isVeiligeNaam(id, ".md"))) throw new OngeldigVerzoek("Ongeldig gesprek");

  const huidig = omg.archief.lees();
  const uitkomst =
    b.actie === "terug"
      ? haalTerug(huidig, ids)
      : archiveer(huidig, bouwGesprekken(await alleBerichten(omg.bron, omg.mailbox, omg.vandaag)), ids, new Date().toISOString());
  omg.archief.schrijf(uitkomst.archief);
  return { status: 200, body: { aantal: uitkomst.aantal } };
}

/** Zet de meterkast in de stand; wat op rood staat, komt als signaal bij de directie (het kantoortje boven). */
export function metGezondheid(huis: HuisStand, gezondheid: GezondheidStand | null): HuisStand {
  if (!gezondheid) return { ...huis, gezondheid: null };
  const rood = gezondheid.metingen.filter((m) => m.kleur === "rood");
  if (rood.length === 0) return { ...huis, gezondheid };
  const teams = huis.teams.map((t) => {
    if (t.id !== "directie") return t;
    const signalen = [...t.signalen, ...rood.map((m) => `Meterkast: ${m.naam} staat op rood`)];
    return { ...t, signalen, stemming: stemmingVoor(signalen, t.statusLeeftijdDagen) };
  });
  return { ...huis, teams, gezondheid };
}

/** Voegt de stand uit de inkoop-app toe en zet de signalen ervan bij de kamer Inkoop (die kunnen de stemming kleuren). */
export async function metPakhuis(huis: HuisStand, bron: PakhuisBron | undefined): Promise<HuisStand> {
  if (!bron) return { ...huis, pakhuis: null };
  const { stand, bereikbaar } = await bron.stand();
  const extra = pakhuisSignalen(stand, DREMPEL_DAGEN, bereikbaar);
  const teams = huis.teams.map((t) => {
    if (t.id !== "inkoop" || extra.length === 0) return t;
    const signalen = [...t.signalen, ...extra];
    return { ...t, signalen, stemming: stemmingVoor(signalen, t.statusLeeftijdDagen) };
  });
  return { ...huis, teams, pakhuis: stand };
}
