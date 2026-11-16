import type { Bron } from "./bron.ts";
import type { TeamConfig } from "./config.ts";
import { besluitBericht } from "./besluiten.ts";
import { bouwHuis } from "./huis.ts";
import type { Postbode } from "./postbode.ts";
import { archiveer, haalTerug, type ArchiefOpslag } from "./archief.ts";
import type { Ophaler } from "./ophaler.ts";
import { bouwGesprekken } from "./parsers/gesprekken.ts";
import { isVeiligeNaam } from "./parsers/documenten.ts";
import type { RunBeheer } from "./regie/beheer.ts";
import { behandelRunGet, behandelRunPost } from "./regie/routes.ts";
import { valideerBesluit, valideerOpdracht } from "./verzoek.ts";
import { alleBerichten, batchInhoud, leesAgent, leesBatchDocument, leesBericht, leesWerkDocument, OngeldigVerzoek, teamWerk } from "./werk.ts";

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
      const huis = await bouwHuis(omg.bron, omg.hq, omg.teams, omg.vandaag, omg.mailbox);
      return { status: 200, body: { ...huis, runs: omg.regie?.lijst().slice(0, 20) ?? [], post: omg.ophaler?.stand() } };
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

/** Schrijfroutes. Alleen berichten van Mark via mailbox.py; de server stelt besluitberichten zelf op. */
export async function behandelPost(pad: string, body: unknown, omg: Omgeving): Promise<Antwoord> {
  try {
    if (pad === "/api/opdracht") {
      const verzending = valideerOpdracht(body);
      if (verzending.antwoordOp) {
        const bestaat = (await alleBerichten(omg.bron, omg.mailbox, omg.vandaag)).some((b) => b.bestand === verzending.antwoordOp);
        if (!bestaat) throw new OngeldigVerzoek("Het bericht waarop je antwoordt bestaat niet");
      }
      const { bestand } = await omg.postbode.stuur(verzending);
      return { status: 201, body: { bestand, aan: verzending.aan } };
    }
    if (pad === "/api/besluit") {
      const verzoek = valideerBesluit(body);
      const huis = await bouwHuis(omg.bron, omg.hq, omg.teams, omg.vandaag, omg.mailbox);
      const besluit = huis.besluiten.find((b) => b.id === verzoek.id);
      if (!besluit) return { status: 404, body: { fout: "Dit besluit staat niet (meer) op de agenda" } };
      const team = besluit.team && besluit.team !== "directie" ? besluit.team : verzoek.aan;
      if (!team) throw new OngeldigVerzoek("Kies naar welk team dit besluit gaat");
      const { onderwerp, tekst } = besluitBericht(besluit, verzoek.keuze, verzoek.toelichting);
      const { bestand } = await omg.postbode.stuur({ aan: team, onderwerp, tekst, prioriteit: "hoog", antwoordOp: null });
      return { status: 201, body: { bestand, aan: team } };
    }
    if (omg.regie && pad.startsWith("/api/runs")) {
      const antwoord = await behandelRunPost(pad, body, omg.regie, omg.bron, omg.teams);
      if (antwoord) return antwoord;
    }
    if (pad === "/api/archief") return await archiefActie(body, omg);
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
