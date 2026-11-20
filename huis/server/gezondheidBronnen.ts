// Echte bronnen voor de meterkast: git, de Claude-login, de schijf en de agentbestanden. Alleen lezen.
import { execFile } from "node:child_process";
import { stat, statfs } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { MailboxTeam, TeamId } from "../shared/types.ts";
import type { Bron } from "./bron.ts";
import type { TeamConfig } from "./config.ts";
import { OPEN_UREN, type AgentTools, type InboxBericht, type LoginStand, type RepoStand } from "./gezondheid.ts";
import { parseAgent } from "./parsers/agents.ts";

const voerUit = promisify(execFile);
const TIMEOUT_MS = 15_000;
/** launchd geeft het huis een kale PATH; claude staat meestal in ~/.local/bin. */
const CLAUDE = process.env.HUIS_CLAUDE_BIN ?? path.join(os.homedir(), ".local/bin/claude");

/** Leest `git status --porcelain=v1 -b`: hoeveel commits vooruit, en welke bijgehouden bestanden gewijzigd zijn. */
export function parseGitStatus(tekst: string): { voor: number; gewijzigd: string[] } {
  const regels = tekst.split("\n").filter(Boolean);
  const kop = regels.find((r) => r.startsWith("## ")) ?? "";
  const voor = Number(/\bahead (\d+)/.exec(kop)?.[1] ?? 0);
  const gewijzigd = regels
    .filter((r) => !r.startsWith("## ") && !r.startsWith("??") && r.length > 3)
    .map((r) => r.slice(3).split(" -> ").at(-1)!.replace(/^"|"$/g, ""));
  return { voor, gewijzigd };
}

/** "2026-11-20-204850-..." is lokale tijd 20-11-2026 20:48:50. */
export function tijdUitNaam(naam: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(\d{2})/.exec(naam);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function leesLogin(): Promise<LoginStand | null> {
  try {
    const { stdout } = await voerUit(CLAUDE, ["auth", "status"], { timeout: TIMEOUT_MS });
    const x = JSON.parse(stdout) as { loggedIn?: unknown; loginExpiresAt?: unknown };
    return { ingelogd: x.loggedIn === true, verlooptOp: typeof x.loginExpiresAt === "string" ? x.loginExpiresAt : null };
  } catch {
    return null;
  }
}

export async function leesRepos(teams: readonly TeamConfig[], nu: () => Date = () => new Date()): Promise<RepoStand[]> {
  const mappen = [...new Set(teams.map((t) => t.repo))];
  return Promise.all(
    mappen.map(async (repo) => {
      const { stdout } = await voerUit("git", ["-C", repo, "status", "--porcelain=v1", "-b"], { timeout: TIMEOUT_MS });
      const { voor, gewijzigd } = parseGitStatus(stdout);
      const grens = nu().getTime() - OPEN_UREN * 3_600_000;
      const oud = await Promise.all(
        gewijzigd.map(async (b) => {
          try {
            return (await stat(path.join(repo, b))).mtimeMs < grens ? b : null;
          } catch {
            return null; // verwijderd bestand: geen datum, niet melden
          }
        }),
      );
      return { naam: path.basename(repo), voor, oudeWijzigingen: oud.filter((b): b is string => b !== null) };
    }),
  );
}

export async function leesAgentTools(bron: Bron, teams: readonly TeamConfig[]): Promise<AgentTools[]> {
  const lijsten = await Promise.all(
    teams.map(async (t) => {
      const map = path.join(t.repo, ".claude/agents");
      const namen = await bron.bestanden(map, ".md");
      return Promise.all(
        namen.map(async (n) => {
          const agent = parseAgent((await bron.lees(path.join(map, n))) ?? "", n);
          return { team: t.id as TeamId, agent: agent.naam, tools: agent.tools };
        }),
      );
    }),
  );
  return lijsten.flat();
}

export async function leesInboxen(bron: Bron, mailbox: string, teams: readonly MailboxTeam[]): Promise<InboxBericht[]> {
  const lijsten = await Promise.all(
    teams.map(async (team) => (await bron.bestanden(path.join(mailbox, team, "inbox"), ".md")).map((bestand) => ({ team, bestand, binnen: tijdUitNaam(bestand) }))),
  );
  return lijsten.flat();
}

export async function leesSchijfVrijGb(map: string = os.homedir()): Promise<number | null> {
  try {
    const s = await statfs(map);
    return (s.bavail * s.bsize) / 1e9;
  } catch {
    return null;
  }
}
