import path from "node:path";
import type { BatchInhoud, Bericht, DocInfo, DocumentInhoud, MailboxTeam, TeamWerk, WerkBronInfo } from "../shared/types.ts";
import type { Bron } from "./bron.ts";
import { pasArchiefToe, type Archief } from "./archief.ts";
import { PIPELINE_FASES, type TeamConfig } from "./config.ts";
import { docInfo, filterBestanden, isVeiligeNaam, titelUitMarkdown } from "./parsers/documenten.ts";
import { bouwGesprekken } from "./parsers/gesprekken.ts";
import { parseBericht } from "./parsers/mailbox.ts";
import { MAX_DOCUMENTEN, MAX_TEKENS, WERKBRONNEN, type WerkBronConfig } from "./werkbronnen.ts";

const MAIL_TEAMS: readonly MailboxTeam[] = ["seo", "pim", "design"];
const MAPPEN: readonly Bericht["map"][] = ["inbox", "verwerkt"];
const AGENT_NAAM = /^[a-z0-9][a-z0-9-]*$/;

/** Ongeldige invoer van buiten (verkeerde naam, onbekende bron). Wordt een 400. */
export class OngeldigVerzoek extends Error {}

async function lijstBron(bron: Bron, repo: string, cfg: WerkBronConfig): Promise<DocInfo[]> {
  const namen = await bron.bestanden(path.join(repo, cfg.map), ".md");
  if (cfg.bestand) return namen.includes(cfg.bestand) ? [docInfo(cfg.bestand)] : [];
  return filterBestanden(namen, cfg.patroon);
}

export async function alleBerichten(bron: Bron, mailbox: string, vandaag: string): Promise<Bericht[]> {
  const per = await Promise.all(
    MAIL_TEAMS.flatMap((team) =>
      MAPPEN.map(async (map) => {
        const dir = path.join(mailbox, team, map);
        const namen = await bron.bestanden(dir, ".md");
        return Promise.all(namen.map(async (n) => parseBericht(n, (await bron.lees(path.join(dir, n))) ?? "", map, vandaag)));
      }),
    ),
  );
  return per.flat();
}

export async function teamWerk(bron: Bron, mailbox: string, team: TeamConfig, vandaag: string, archief: Archief = {}): Promise<TeamWerk> {
  const [bronnen, berichten] = await Promise.all([
    Promise.all(
      WERKBRONNEN[team.id].map(async (cfg): Promise<WerkBronInfo> => {
        const docs = await lijstBron(bron, team.repo, cfg);
        return { id: cfg.id, label: cfg.label, totaal: docs.length, documenten: docs.slice(0, MAX_DOCUMENTEN) };
      }),
    ),
    alleBerichten(bron, mailbox, vandaag),
  ]);
  const vanTeam = berichten.filter((b) => b.van === team.id || b.aan === team.id);
  return { team: team.id, bronnen, gesprekken: pasArchiefToe(bouwGesprekken(vanTeam), archief) };
}

async function leesBestand(bron: Bron, pad: string, bestand: string, herkomst: string): Promise<DocumentInhoud | null> {
  const tekst = await bron.lees(pad);
  if (tekst === null) return null;
  const ingekort = tekst.length > MAX_TEKENS;
  return {
    titel: titelUitMarkdown(tekst, docInfo(bestand).titel),
    bestand,
    herkomst,
    inhoud: ingekort ? tekst.slice(0, MAX_TEKENS) : tekst,
    ingekort,
  };
}

export async function leesWerkDocument(bron: Bron, team: TeamConfig, bronId: string, bestand: string): Promise<DocumentInhoud | null> {
  const cfg = WERKBRONNEN[team.id].find((b) => b.id === bronId);
  if (!cfg) throw new OngeldigVerzoek(`Onbekende bron ${bronId}`);
  if (!isVeiligeNaam(bestand, ".md")) throw new OngeldigVerzoek("Ongeldige bestandsnaam");
  const toegestaan = await lijstBron(bron, team.repo, cfg);
  if (!toegestaan.some((d) => d.bestand === bestand)) return null;
  return leesBestand(bron, path.join(team.repo, cfg.map, bestand), bestand, `${team.naam} · ${cfg.label}`);
}

export async function leesBericht(bron: Bron, mailbox: string, bestand: string): Promise<DocumentInhoud | null> {
  if (!isVeiligeNaam(bestand, ".md")) throw new OngeldigVerzoek("Ongeldige bestandsnaam");
  for (const team of MAIL_TEAMS) {
    for (const map of MAPPEN) {
      const dir = path.join(mailbox, team, map);
      if ((await bron.bestanden(dir, ".md")).includes(bestand)) {
        return leesBestand(bron, path.join(dir, bestand), bestand, `Mailbox ${team} · ${map}`);
      }
    }
  }
  return null;
}

export async function leesAgent(bron: Bron, team: TeamConfig, naam: string): Promise<DocumentInhoud | null> {
  if (!AGENT_NAAM.test(naam)) throw new OngeldigVerzoek("Ongeldige agentnaam");
  const dir = path.join(team.repo, ".claude/agents");
  const bestand = `${naam}.md`;
  if (!(await bron.bestanden(dir, ".md")).includes(bestand)) return null;
  return leesBestand(bron, path.join(dir, bestand), bestand, `${team.naam} · agent`);
}

async function controleerBatch(bron: Bron, repo: string, fase: string, batch: string): Promise<string | null> {
  if (!PIPELINE_FASES.some(([f]) => f === fase)) throw new OngeldigVerzoek(`Onbekende fase ${fase}`);
  if (!isVeiligeNaam(batch, "")) throw new OngeldigVerzoek("Ongeldige batchnaam");
  const dir = path.join(repo, "pipeline", fase);
  return (await bron.mappen(dir)).includes(batch) ? path.join(dir, batch) : null;
}

export async function batchInhoud(bron: Bron, repo: string, fase: string, batch: string): Promise<BatchInhoud | null> {
  const dir = await controleerBatch(bron, repo, fase, batch);
  if (!dir) return null;
  const [md, alles] = await Promise.all([bron.bestanden(dir, ".md"), bron.bestanden(dir, "")]);
  return {
    fase,
    batch,
    documenten: filterBestanden(md),
    overigeBestanden: alles.filter((n) => !n.endsWith(".md")),
  };
}

export async function leesBatchDocument(bron: Bron, repo: string, fase: string, batch: string, bestand: string): Promise<DocumentInhoud | null> {
  const dir = await controleerBatch(bron, repo, fase, batch);
  if (!isVeiligeNaam(bestand, ".md")) throw new OngeldigVerzoek("Ongeldige bestandsnaam");
  if (!dir || !(await bron.bestanden(dir, ".md")).includes(bestand)) return null;
  return leesBestand(bron, path.join(dir, bestand), bestand, `PIM · ${fase} · ${batch}`);
}
