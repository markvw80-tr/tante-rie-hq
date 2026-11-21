import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { agentInstructies } from "../regie/agentPrompt.ts";

function teamMap(bestanden: Record<string, string>): string {
  const repo = mkdtempSync(path.join(os.tmpdir(), "agentprompt-"));
  mkdirSync(path.join(repo, ".claude", "agents"), { recursive: true });
  for (const [n, t] of Object.entries(bestanden)) writeFileSync(path.join(repo, ".claude", "agents", n), t);
  return repo;
}

describe("agentInstructies", () => {
  test("op bestandsnaam: alleen de tekst onder de kop", () => {
    const repo = teamMap({ "verslaggever.md": "---\nname: verslaggever\ntools: Read\n---\n\nSchrijf kort.\n" });
    expect(agentInstructies(repo, "verslaggever")).toBe("Schrijf kort.");
  });
  test("op name: als de bestandsnaam anders is", () => {
    const repo = teamMap({ "lead.md": "---\nname: seo-lead\n---\nJij leidt SEO." });
    expect(agentInstructies(repo, "seo-lead")).toBe("Jij leidt SEO.");
  });
  test("onbekende agent of geen map: null", () => {
    expect(agentInstructies(teamMap({}), "x")).toBeNull();
    expect(agentInstructies(path.join(os.tmpdir(), "bestaat-niet-xyz"), "x")).toBeNull();
  });
});
