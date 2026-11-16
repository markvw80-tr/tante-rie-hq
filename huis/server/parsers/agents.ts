import type { Agent } from "../../shared/types.ts";
import { parseFrontmatter } from "./frontmatter.ts";

export function parseAgent(tekst: string, bestandsnaam: string): Agent {
  const { velden } = parseFrontmatter(tekst);
  const tools = (velden.tools ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const stam = bestandsnaam.replace(/\.md$/, "");
  return {
    bestand: stam,
    naam: velden.name || stam,
    beschrijving: velden.description ?? "",
    model: velden.model || null,
    tools,
  };
}
