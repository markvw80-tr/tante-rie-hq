import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "../parsers/frontmatter.ts";

/**
 * De instructies (tekst onder de kop) van een agent uit `.claude/agents/` in de teammap, op bestandsnaam of `name:`.
 * Nodig omdat de Agent SDK met `agent` wel de tools en het model van de agent toepast, maar zijn eigen systeemprompt
 * meestuurt die de instructies van de agent verdringt (gezien 21-11-2026, SDK 0.3.316). Null als er geen agent is.
 */
export function agentInstructies(repo: string, agent: string): string | null {
  const map = path.join(repo, ".claude", "agents");
  let namen: string[];
  try {
    namen = readdirSync(map).filter((n) => n.endsWith(".md")).sort();
  } catch {
    return null;
  }
  const lees = (n: string) => {
    try {
      return parseFrontmatter(readFileSync(path.join(map, n), "utf8"));
    } catch {
      return null;
    }
  };
  const opNaam = namen.includes(`${agent}.md`) ? lees(`${agent}.md`) : null;
  const gevonden = opNaam ?? namen.map(lees).find((f) => f?.velden.name === agent) ?? null;
  return gevonden?.body ? gevonden.body : null;
}
