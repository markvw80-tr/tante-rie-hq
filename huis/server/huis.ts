import path from "node:path";
import type {
  Agenda, Agent, Bericht, HuisStand, JsonMailbox, MailboxStand, MailboxTeam,
  MdDocument, PipelineFase, StatusBlok, Stemming, TeamStand,
} from "../shared/types.ts";
import type { Bron } from "./bron.ts";
import { DREMPEL_DAGEN, PIPELINE_FASES, RECENT_DAGEN, type TeamConfig } from "./config.ts";
import { parseAgent } from "./parsers/agents.ts";
import { dagenTussen, datumUitNaam } from "./parsers/datum.ts";
import { parseBericht, parseJsonMailbox } from "./parsers/mailbox.ts";
import { besluitenUitAgenda, parseMarkdown } from "./parsers/markdown.ts";
import { metAntwoorden, zoekBesluitAntwoorden } from "./besluiten.ts";
import { parseStatus } from "./parsers/status.ts";

const RECENT_VERWERKT = 6;
const STATUS_HISTORIE = 8;

interface Context {
  readonly bron: Bron;
  readonly hq: string;
  /** Root van de gedeelde stand: de werkkopie van origin/main als de post daar vandaan komt, anders hq. */
  readonly gedeeld: string;
  readonly mailbox: string;
  readonly vandaag: string;
}

export async function bouwHuis(
  bron: Bron,
  hq: string,
  teams: readonly TeamConfig[],
  vandaag: string,
  mailbox: string = path.join(hq, "team/mailbox"),
): Promise<HuisStand> {
  // Status, agenda en doelen uit dezelfde stand als de post: teams en de directie-routine zetten ze op main.
  const gedeeld = path.resolve(mailbox, "..", "..");
  const ctx: Context = { bron, hq, gedeeld, mailbox, vandaag };
  const [statusTekst, agenda, doelen, jsonMailbox, antwoorden] = await Promise.all([
    bron.lees(path.join(gedeeld, "team/status.md")),
    leesAgenda(ctx),
    leesDoc(ctx, "team/doelen.md"),
    Promise.all(["seo-naar-pim", "pim-naar-seo"].map((n) => leesJsonMailbox(ctx, n))),
    zoekBesluitAntwoorden(bron, mailbox, vandaag),
  ]);
  const status = statusTekst ? parseStatus(statusTekst) : [];
  const standen = await Promise.all(teams.map((t) => bouwTeam(ctx, t, status, agenda)));

  return {
    vandaag,
    drempelDagen: DREMPEL_DAGEN,
    teams: standen,
    agenda,
    doelen,
    besluiten: agenda ? metAntwoorden(besluitenUitAgenda(agenda), antwoorden) : [],
    jsonMailbox,
  };
}

async function bouwTeam(ctx: Context, team: TeamConfig, status: readonly StatusBlok[], agenda: Agenda | null): Promise<TeamStand> {
  const fouten: string[] = [];
  const poging = async <T>(wat: string, fn: () => Promise<T>, terugval: T): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      fouten.push(`${wat} niet te lezen: ${(e as Error).message}`);
      return terugval;
    }
  };

  const isTeam = team.id !== "directie";
  const [agents, mailbox, pipeline] = await Promise.all([
    poging("Agents", () => leesAgents(ctx, team.repo), [] as Agent[]),
    isTeam ? poging("Mailbox", () => leesMailbox(ctx, team.id as MailboxTeam), null) : Promise.resolve(null),
    team.heeftPipeline ? poging("Pipeline", () => leesPipeline(ctx, team.repo), null) : Promise.resolve(null),
  ]);

  const historie = status.filter((b) => b.team === team.id).slice(0, STATUS_HISTORIE);
  const laatsteDatum = team.id === "directie" ? agenda?.datum ?? null : historie[0]?.datum ?? null;
  const leeftijd = dagenTussen(laatsteDatum, ctx.vandaag);
  const signalen = signalenVoor(team, mailbox, leeftijd);

  return {
    id: team.id,
    naam: team.naam,
    kamer: team.kamer,
    agents,
    mailbox,
    statusHistorie: historie,
    statusLeeftijdDagen: leeftijd,
    pipeline,
    stemming: stemmingVoor(signalen, leeftijd),
    signalen,
    fouten,
  };
}

export function signalenVoor(team: TeamConfig, mailbox: MailboxStand | null, leeftijd: number | null): string[] {
  const signalen: string[] = [];
  const oud = mailbox?.inbox.filter((b) => (b.leeftijdDagen ?? 0) >= DREMPEL_DAGEN) ?? [];
  if (oud.length > 0) signalen.push(`${oud.length} ${oud.length === 1 ? "bericht ligt" : "berichten liggen"} ${DREMPEL_DAGEN} dagen of langer in de inbox`);

  const wat = team.id === "directie" ? "agenda" : "statusblok";
  if (leeftijd === null) signalen.push(`Nog geen ${wat} gevonden`);
  else if (leeftijd >= DREMPEL_DAGEN) signalen.push(`Laatste ${wat} is ${leeftijd} dagen oud`);
  return signalen;
}

export function stemmingVoor(signalen: readonly string[], leeftijd: number | null): Stemming {
  if (signalen.length > 0) return "achterstand";
  return leeftijd !== null && leeftijd <= RECENT_DAGEN ? "bezig" : "stil";
}

async function leesAgents(ctx: Context, repo: string): Promise<Agent[]> {
  const map = path.join(repo, ".claude/agents");
  const namen = await ctx.bron.bestanden(map, ".md");
  const teksten = await Promise.all(namen.map((n) => ctx.bron.lees(path.join(map, n))));
  return namen.map((n, i) => parseAgent(teksten[i] ?? "", n));
}

async function leesMailbox(ctx: Context, team: MailboxTeam): Promise<MailboxStand> {
  const basis = path.join(ctx.mailbox, team);
  const lees = async (map: Bericht["map"], namen: readonly string[]) =>
    Promise.all(namen.map(async (n) => parseBericht(n, (await ctx.bron.lees(path.join(basis, map, n))) ?? "", map, ctx.vandaag)));

  const [inboxNamen, verwerktNamen] = await Promise.all([
    ctx.bron.bestanden(path.join(basis, "inbox"), ".md"),
    ctx.bron.bestanden(path.join(basis, "verwerkt"), ".md"),
  ]);
  const [inbox, recentVerwerkt] = await Promise.all([
    lees("inbox", inboxNamen),
    lees("verwerkt", verwerktNamen.slice(-RECENT_VERWERKT).reverse()),
  ]);
  return { inbox, verwerktAantal: verwerktNamen.length, recentVerwerkt };
}

async function leesPipeline(ctx: Context, repo: string): Promise<PipelineFase[]> {
  return Promise.all(
    PIPELINE_FASES.map(async ([fase, label]) => ({
      fase,
      label,
      batches: await ctx.bron.mappen(path.join(repo, "pipeline", fase)),
    })),
  );
}

async function leesAgenda(ctx: Context): Promise<Agenda | null> {
  const map = path.join(ctx.gedeeld, "team/directie");
  const agendas = (await ctx.bron.bestanden(map, ".md")).filter((n) => n.startsWith("agenda-"));
  const laatste = agendas.at(-1);
  if (!laatste) return null;
  const tekst = await ctx.bron.lees(path.join(map, laatste));
  const datum = datumUitNaam(laatste.replace(/^agenda-/, ""));
  if (tekst === null || !datum) return null;
  return { ...parseMarkdown(tekst), datum, bestand: laatste };
}

async function leesDoc(ctx: Context, relatief: string): Promise<MdDocument | null> {
  const tekst = await ctx.bron.lees(path.join(ctx.gedeeld, relatief));
  return tekst === null ? null : parseMarkdown(tekst);
}

async function leesJsonMailbox(ctx: Context, naam: string): Promise<JsonMailbox> {
  const tekst = await ctx.bron.lees(path.join(ctx.mailbox, `${naam}.json`));
  return tekst === null ? { naam, leesbaar: false, open: [] } : parseJsonMailbox(naam, tekst, ctx.vandaag);
}
