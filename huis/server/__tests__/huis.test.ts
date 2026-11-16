import path from "node:path";
import { describe, expect, test } from "vitest";
import type { Bron } from "../bron.ts";
import type { TeamConfig } from "../config.ts";
import { bouwHuis, signalenVoor, stemmingVoor } from "../huis.ts";

const HQ = "/hq";
const TEAMS: TeamConfig[] = [
  { id: "directie", naam: "Directie", kamer: "Kantoortje boven", repo: HQ, heeftPipeline: false },
  { id: "seo", naam: "SEO", kamer: "Etalage", repo: "/seo", heeftPipeline: false },
  { id: "pim", naam: "PIM", kamer: "Theekelder", repo: "/pim", heeftPipeline: true },
];

function geheugenBron(bestanden: Record<string, string>, extraMappen: string[] = []): Bron {
  const paden = Object.keys(bestanden);
  const kinderen = (map: string) => paden.filter((p) => path.dirname(p) === map).map((p) => path.basename(p));
  return {
    lees: async (p) => bestanden[p] ?? null,
    bestanden: async (map, ext) => kinderen(map).filter((n) => n.endsWith(ext)).sort(),
    mappen: async (map) => extraMappen.filter((p) => path.dirname(p) === map).map((p) => path.basename(p)).sort(),
  };
}

const bron = geheugenBron(
  {
    "/hq/team/status.md": "# Status\n## SEO, 15-11-2026 (opdracht)\n- Gedaan: iets.\n## PIM, 01-11-2026 (oud)\n- Gedaan: ouder.\n",
    "/hq/team/doelen.md": "# Gedeelde doelen\n## Bedrijfsdoel\nHoger scoren.\n",
    "/hq/team/directie/agenda-2026-11-15.md": "# Oud\n",
    "/hq/team/directie/agenda-2026-11-16.md": "# Agenda vandaag\n## Mark: besluiten nodig\n1. Thema publiceren (PIM).\n",
    "/hq/team/mailbox/seo/inbox/2026-11-10-120000-pim-oud.md": "---\nvan: pim\nonderwerp: Oud bericht\n---\n",
    "/hq/team/mailbox/seo/inbox/2026-11-16-120000-design-nieuw.md": "---\nvan: design\nonderwerp: Nieuw\n---\n",
    "/hq/team/mailbox/seo/verwerkt/2026-10-01-000000-pim-a.md": "---\nonderwerp: A\n---\n",
    "/hq/team/mailbox/seo-naar-pim.json": '{"berichten":[]}',
    "/hq/.claude/agents/directie.md": "---\nname: directie\nmodel: sonnet\n---\n",
    "/seo/.claude/agents/analist.md": "---\nname: analist\n---\n",
    "/pim/.claude/agents/media-agent.md": "---\nname: media-agent\n---\n",
  },
  ["/pim/pipeline/03-enriched/20261031-blond-01", "/pim/pipeline/01-raw/20261101-geels"],
);

describe("bouwHuis", () => {
  test("bouwt per team agents, mailbox, status en stemming", async () => {
    const huis = await bouwHuis(bron, HQ, TEAMS, "2026-11-16");
    const [directie, seo, pim] = huis.teams;

    expect(directie.agents.map((a) => a.naam)).toEqual(["directie"]);
    expect(directie.stemming).toBe("bezig");
    expect(directie.mailbox).toBeNull();

    expect(seo.mailbox?.inbox.map((b) => b.onderwerp)).toEqual(["Oud bericht", "Nieuw"]);
    expect(seo.mailbox?.verwerktAantal).toBe(1);
    expect(seo.statusLeeftijdDagen).toBe(1);
    expect(seo.stemming).toBe("achterstand");
    expect(seo.signalen).toEqual(["1 bericht ligt 3 dagen of langer in de inbox"]);

    expect(pim.statusLeeftijdDagen).toBe(15);
    expect(pim.signalen).toContain("Laatste statusblok is 15 dagen oud");
    expect(pim.pipeline?.find((f) => f.fase === "03-enriched")?.batches).toEqual(["20261031-blond-01"]);
  });

  test("pakt de nieuwste agenda en haalt besluiten eruit", async () => {
    const huis = await bouwHuis(bron, HQ, TEAMS, "2026-11-16");
    expect(huis.agenda?.datum).toBe("2026-11-16");
    expect(huis.besluiten).toEqual([{ id: expect.stringMatching(/^[a-f0-9]{10}$/), tekst: "Thema publiceren", team: "pim", antwoord: null }]);
    expect(huis.doelen?.titel).toBe("Gedeelde doelen");
    expect(huis.jsonMailbox.map((j) => [j.naam, j.leesbaar])).toEqual([["seo-naar-pim", true], ["pim-naar-seo", false]]);
  });

  test("leesfout bij een team komt in fouten en breekt het huis niet", async () => {
    const kapot: Bron = { ...bron, bestanden: async (map, ext) => { if (map.startsWith("/pim")) throw new Error("EACCES"); return bron.bestanden(map, ext); } };
    const huis = await bouwHuis(kapot, HQ, TEAMS, "2026-11-16");
    expect(huis.teams[2].fouten).toEqual(["Agents niet te lezen: EACCES"]);
    expect(huis.teams[1].agents).toHaveLength(1);
  });

  test("zonder bestanden geen crash en duidelijke signalen", async () => {
    const huis = await bouwHuis(geheugenBron({}), HQ, TEAMS, "2026-11-16");
    expect(huis.agenda).toBeNull();
    expect(huis.besluiten).toEqual([]);
    expect(huis.teams[0].signalen).toEqual(["Nog geen agenda gevonden"]);
  });
});

describe("stemming", () => {
  test("stil als er geen signalen zijn maar het werk niet recent is", () => {
    expect(stemmingVoor([], 2)).toBe("bezig");
    expect(stemmingVoor([], null)).toBe("stil");
    expect(signalenVoor(TEAMS[1], null, 2)).toEqual([]);
  });
});
