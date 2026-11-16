import path from "node:path";
import type { PoortSoort } from "../../shared/types.ts";

export type Beoordeling = { readonly soort: "veilig" } | { readonly soort: PoortSoort; readonly reden: string };

/** Schrijfacties naar Shopify, het thema of andere buitenwereld: altijd langs Mark. */
const LIVE_TOOL =
  /(graphql_mutation|update-product|create-product|bulk-update-product-status|set-inventory|update-collection|create-collection|add-to-collection|create-discount|theme_publish|theme_commit|publish-digital-product|social-media-post-(create|update|delete)|send_message|__reply$|__forward$|create_draft|trash_|_delete$|-delete$|management-.*-(create|update|delete|add))/i;
const LIVE_BASH =
  /(shopify\s+theme\s+(publish|push)|\bgit\s+push\b|curl\b[^|]*-X\s*(POST|PUT|PATCH|DELETE)|scripts\/[\w-]*(schrijf|publice|publish|push|activeer)[\w-]*\.py)/i;
const MUTATIE = /^\s*mutation\b/m;
const HOOK_LIVE = /(shopify|publice|live|thema|ACTIVE|verkoopkanaal)/i;
const LEZEN = new Set(["Read", "Glob", "Grep", "LS", "TodoWrite", "WebSearch", "Agent", "Task"]);
const SCHRIJVEN = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);
const VERBODEN_PADEN = /(^|\/)(\.git|\.env[^/]*|\.claude\/settings[^/]*\.json)(\/|$)/;

function teksten(x: unknown): string[] {
  if (typeof x === "string") return [x];
  if (Array.isArray(x)) return x.flatMap(teksten);
  if (x && typeof x === "object") return Object.values(x).flatMap(teksten);
  return [];
}

/** Ligt dit pad binnen de map van het team (en niet in .git, .env of de instellingen)? */
export function binnenRepo(pad: unknown, repo: string): boolean {
  if (typeof pad !== "string" || pad.length === 0) return false;
  const volledig = path.resolve(repo, pad);
  const rel = path.relative(repo, volledig);
  return !rel.startsWith("..") && !path.isAbsolute(rel) && !VERBODEN_PADEN.test(rel);
}

/**
 * Beslist wat er gebeurt met een tool-aanroep waar Claude Code om toestemming vraagt (de toegestane
 * tools uit de teaminstellingen komen hier nooit langs). Veilig gaat door, de rest komt bij Mark.
 */
export function beoordeel(tool: string, invoer: Record<string, unknown>, repo: string, hookReden?: string): Beoordeling {
  const alles = teksten(invoer);
  if (LIVE_TOOL.test(tool) || alles.some((t) => MUTATIE.test(t))) {
    return { soort: "live", reden: "Schrijft naar Shopify of een andere live omgeving." };
  }
  if (tool === "Bash" && LIVE_BASH.test(String(invoer.command ?? ""))) {
    return { soort: "live", reden: "Commando publiceert, pusht of schrijft naar buiten." };
  }
  if (hookReden && HOOK_LIVE.test(hookReden)) return { soort: "live", reden: hookReden };
  if (LEZEN.has(tool)) return { soort: "veilig" };
  if (SCHRIJVEN.has(tool) && binnenRepo(invoer.file_path ?? invoer.notebook_path, repo)) return { soort: "veilig" };
  if (SCHRIJVEN.has(tool)) return { soort: "toestemming", reden: "Schrijft buiten de eigen teammap." };
  return { soort: "toestemming", reden: hookReden || "Staat niet in de toegestane tools van dit team." };
}

/** Korte, leesbare omschrijving voor op de toonbank. */
export function samenvatting(tool: string, invoer: Record<string, unknown>): string {
  if (tool === "Bash") return `Commando: ${String(invoer.command ?? "").slice(0, 160)}`;
  if (typeof invoer.file_path === "string") return `${tool} ${invoer.file_path}`;
  const kort = tool.replace(/^mcp__[^_]+(?:_[^_]+)*?__/, "");
  return `${kort}${invoer.query ? `: ${String(invoer.query).slice(0, 120)}` : ""}`;
}
