import { execFileSync } from "node:child_process";
import path from "node:path";
import type { HookCallback, HookJSONOutput } from "@anthropic-ai/claude-agent-sdk";
import type { Toestemming } from "./beheer.ts";
import { beoordeel, type Beoordeling } from "./poort.ts";

/** Paden (relatief aan de teamrepo) van uitvoerbare bestanden die niet gecommit en ongewijzigd zijn. Gooit als git het niet kan zeggen. */
export type GitVuil = () => readonly string[];

type Gevangen = Exclude<Beoordeling, { soort: "veilig" }>;

/** Wachttijd van de hook in seconden: ruim boven de 30 minuten die Mark heeft om te beslissen. */
export const POORT_HOOK_TIMEOUT_S = 31 * 60;

const SCRIPT_EXT = /\.(py|sh|bash|zsh|js|mjs|cjs|ts|mts|cts|rb|pl|php|ps1)$/i;
const SCRIPT_MAP = /^(scripts|adapters|bin)\//;
const BOUWBESTAND = new Set(["Makefile", "package.json", "pyproject.toml", "setup.py", "setup.cfg"]);
const WOORD = /"([^"]*)"|'([^']*)'|([^\s;&|()<>]+)/g;

/** Kan dit bestand code zijn die een agent laat draaien? Bewust ruim: liever een vraag te veel. */
function uitvoerbaar(rel: string): boolean {
  const naam = path.basename(rel);
  return SCRIPT_EXT.test(rel) || SCRIPT_MAP.test(rel) || BOUWBESTAND.has(naam) || !naam.includes(".");
}

/** Woorden uit een shellcommando, met aanhalingstekens als één woord. */
function woorden(command: string): string[] {
  return [...command.matchAll(WOORD)].map((m) => m[1] ?? m[2] ?? m[3]);
}

function buitenRepo(repo: string, woord: string): boolean {
  const rel = path.relative(repo, path.resolve(repo, woord));
  return rel.startsWith("..") || path.isAbsolute(rel);
}

function opsomming(paden: readonly string[]): string {
  const eerst = paden.slice(0, 3).join(", ");
  return paden.length > 3 ? `${eerst} en ${paden.length - 3} meer` : eerst;
}

/**
 * Beslist of een aanroep langs Mark moet, ook als het team hem in zijn instellingen al toestaat.
 * Live acties altijd. Een shellcommando vraagt toestemming zolang er in de teamrepo uitvoerbare bestanden
 * staan die niet gecommit en ongewijzigd zijn, of als het een script buiten de repo noemt: zo kan een agent
 * niet zelf code schrijven en die via een ruime regel als `python3 scripts/*` (of een import) laten draaien.
 * `null` betekent: de gewone afhandeling (teaminstellingen en canUseTool) beslist.
 */
export function moetLangsPoort(tool: string, invoer: Record<string, unknown>, repo: string, vuil: GitVuil): Gevangen | null {
  const oordeel = beoordeel(tool, invoer, repo);
  if (oordeel.soort === "live") return oordeel;
  if (tool !== "Bash") return null;
  const extern = woorden(String(invoer.command ?? "")).find((w) => SCRIPT_EXT.test(w) && buitenRepo(repo, w));
  if (extern) return { soort: "toestemming", reden: `Script ${extern} staat buiten de teamrepo; Mark kijkt eerst mee.` };
  const paden = vuil();
  if (paden.length === 0) return null;
  return { soort: "toestemming", reden: `Nieuwe of gewijzigde scripts in de teamrepo (${opsomming(paden)}); commit ze eerst of laat Mark meekijken.` };
}

/** NUL-gescheiden git-uitvoer. */
function gitZ(repo: string, ...args: string[]): string[] {
  return execFileSync("git", ["-C", repo, ...args, "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
}

/** Echte controle via git: nieuw, gewijzigd, of voor git verstopt (assume-unchanged, skip-worktree). */
export function gitVuilIn(repo: string): GitVuil {
  return () => {
    const paden = new Set<string>();
    const status = gitZ(repo, "status", "--porcelain=v1", "--untracked-files=all");
    for (let i = 0; i < status.length; i++) {
      const regel = status[i];
      paden.add(regel.slice(3));
      if (regel[0] === "R" || regel[0] === "C") i++; // het oude pad van een hernoeming overslaan
    }
    for (const regel of gitZ(repo, "ls-files", "-v")) {
      const vlag = regel[0];
      if (vlag === "S" || (vlag >= "a" && vlag <= "z")) paden.add(regel.slice(2));
    }
    return [...paden].filter(uitvoerbaar);
  };
}

function besluit(toestaan: boolean, reden: string): HookJSONOutput {
  return { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: toestaan ? "allow" : "deny", permissionDecisionReason: reden } };
}

/**
 * SDK-hook die vóór elke tool-aanroep draait, dus ook vóór aanroepen die de teaminstellingen al toestaan
 * (die komen nooit bij canUseTool). Gevangen aanroepen gaan via dezelfde toonbank als canUseTool.
 * Gaat er iets mis, dan weigert de hook: de poort valt dicht, niet open.
 */
export function poortHook(repo: string, toestemming: Toestemming, vuil: GitVuil): HookCallback {
  return async (input, _toolUseId, { signal }) => {
    if (input.hook_event_name !== "PreToolUse") return {};
    try {
      const invoer = (input.tool_input ?? {}) as Record<string, unknown>;
      const gevangen = moetLangsPoort(input.tool_name, invoer, repo, vuil);
      if (!gevangen) return {};
      const antwoord = await toestemming(input.tool_name, invoer, { signal, hookReden: gevangen.reden });
      return besluit(antwoord.toestaan, antwoord.toestaan ? "Toegestaan door Mark via het Huis." : antwoord.bericht);
    } catch (e) {
      console.error(`[huis] poortcontrole mislukt voor ${input.tool_name}:`, e);
      return besluit(false, "De poortcontrole van het Huis is mislukt, dus deze actie is geweigerd. Meld dit in je afsluiting.");
    }
  };
}
