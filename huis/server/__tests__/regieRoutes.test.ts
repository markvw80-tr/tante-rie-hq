import path from "node:path";
import { describe, expect, test } from "vitest";
import type { Bron } from "../bron.ts";
import type { TeamConfig } from "../config.ts";
import { RunBeheer } from "../regie/beheer.ts";
import { geheugenOpslag } from "../regie/opslag.ts";
import { behandelRunGet, behandelRunPost } from "../regie/routes.ts";

const bestanden: Record<string, string> = { "/pim/.claude/agents/media-agent.md": "---\nname: media-agent\n---\n" };
const bron: Bron = {
  lees: async (p) => bestanden[p] ?? null,
  bestanden: async (map) => Object.keys(bestanden).filter((p) => path.dirname(p) === map).map((p) => path.basename(p)),
  mappen: async () => [],
};
const teams: TeamConfig[] = [{ id: "pim", naam: "PIM", kamer: "Theekelder", repo: "/pim", heeftPipeline: true }];
const gestart: { repo: string; agent: string }[] = [];
const regie = new RunBeheer(
  { start: (a) => (gestart.push({ repo: a.repo, agent: a.agent }), (async function* () { yield { type: "result", subtype: "success", is_error: false, total_cost_usd: 0, result: "" }; })()) },
  geheugenOpslag(),
);
const post = (pad: string, body: unknown) => behandelRunPost(pad, body, regie, bron, teams);
const goed = { team: "pim", agent: "media-agent", opdracht: "Zoek foto's voor 172691", budgetUsd: 1 };

describe("run-routes", () => {
  test("start een bestaande agent in de map van het team", async () => {
    const r = await post("/api/runs", goed);
    expect(r?.status).toBe(201);
    expect(gestart).toEqual([{ repo: "/pim", agent: "media-agent" }]);
    expect(behandelRunGet("/api/runs", regie)?.body).toHaveLength(1);
  });

  test.each([
    ["onbekend team", { ...goed, team: "hr" }, 400],
    ["pad als agent", { ...goed, agent: "../../evil" }, 400],
    ["agent bestaat niet", { ...goed, agent: "shopify-publisher" }, 404],
    ["te korte opdracht", { ...goed, opdracht: "ja" }, 400],
    ["vrij budget", { ...goed, budgetUsd: 50 }, 400],
  ])("weigert %s", async (_n, body, status) => {
    await expect(post("/api/runs", body).then((r) => r?.status)).resolves.toBe(status);
  });

  test("ongeldige ids en onbekende runs", async () => {
    expect(await post("/api/runs/../../x/stop", {})).toBeNull();
    expect((await post("/api/runs/niet-een-id/stop", {}))?.status).toBe(400);
    const nep = "00000000-0000-0000-0000-000000000000";
    expect((await post(`/api/runs/${nep}/stop`, {}))?.status).toBe(409);
    expect((await post(`/api/runs/${nep}/poort`, { verzoekId: "x", toestaan: true }))?.status).toBe(409);
    expect((await post(`/api/runs/${nep}/poort`, { toestaan: "ja" }))?.status).toBe(400);
    expect(behandelRunGet(`/api/runs/${nep}`, regie)?.status).toBe(404);
  });
});
