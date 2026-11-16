import path from "node:path";
import { describe, expect, test } from "vitest";
import type { Bron } from "../bron.ts";
import type { TeamConfig } from "../config.ts";
import { behandel, type Omgeving } from "../routes.ts";

const bestanden: Record<string, string> = {
  "/hq/team/directie/agenda-2026-11-16.md": "# Agenda\n",
  "/hq/team/status.md": "# Status\n",
  "/hq/team/doelen.md": "# Doelen\n",
  "/hq/team/geheim.md": "niet tonen",
  "/hq/team/mailbox/seo/inbox/2026-11-15-100000-pim-vraag.md": "---\nvan: pim\naan: seo\nonderwerp: Vraag\n---\n\nKun je kijken?",
  "/hq/team/mailbox/pim/verwerkt/2026-11-16-090000-seo-antwoord.md": "---\nvan: seo\naan: pim\nonderwerp: Re: Vraag\nantwoord-op: 2026-11-15-100000-pim-vraag.md\n---\n\nJa.",
  "/seo/marketing/rapporten/effect-design-2026-11-15.md": "# Effect design\nKlikken 226 naar 240.",
  "/seo/marketing/changelog.md": "# Changelog\n",
  "/seo/marketing/vragen-voor-mark.md": "# Vragen\n",
  "/seo/.claude/agents/analist.md": "---\nname: analist\n---\nMeet alles.",
  "/pim/pipeline/04-review/20261031-blond-01/voorstel-voor-mark.md": "# Voorstel Blond\n",
  "/pim/pipeline/04-review/20261031-blond-01/goedgekeurd.json": "{}",
  "/pim/logs/2026-11-07.md": "## 07-11 Hanger\n",
};
const mappen = ["/pim/pipeline/04-review/20261031-blond-01"];

const geheugen: Bron = {
  lees: async (p) => bestanden[p] ?? null,
  bestanden: async (map, ext) => Object.keys(bestanden).filter((p) => path.dirname(p) === map && p.endsWith(ext)).map((p) => path.basename(p)).sort(),
  mappen: async (map) => mappen.filter((p) => path.dirname(p) === map).map((p) => path.basename(p)),
};

const TEAMS: TeamConfig[] = [
  { id: "directie", naam: "Directie", kamer: "Kantoortje boven", repo: "/hq", heeftPipeline: false },
  { id: "seo", naam: "SEO", kamer: "Etalage", repo: "/seo", heeftPipeline: false },
  { id: "design", naam: "Design", kamer: "Atelier", repo: "/design", heeftPipeline: false },
  { id: "pim", naam: "PIM", kamer: "Theekelder", repo: "/pim", heeftPipeline: true },
];
const geenPost = { stuur: async () => ({ bestand: "x.md" }), ophalen: async () => undefined };
const omg: Omgeving = { bron: geheugen, hq: "/hq", mailbox: "/hq/team/mailbox", teams: TEAMS, vandaag: "2026-11-16", postbode: geenPost };
const vraag = (pad: string, params: Record<string, string> = {}) => behandel(pad, new URLSearchParams(params), omg);

describe("routes", () => {
  test("team-werk geeft bronnen en gesprekken", async () => {
    const r = await vraag("/api/team/seo");
    expect(r.status).toBe(200);
    const body = r.body as { bronnen: { id: string; totaal: number }[]; gesprekken: { onderwerp: string; berichten: unknown[]; open: boolean }[] };
    expect(body.bronnen.find((b) => b.id === "rapporten")?.totaal).toBe(1);
    expect(body.bronnen.find((b) => b.id === "plannen")?.totaal).toBe(0);
    expect(body.gesprekken).toHaveLength(1);
    expect(body.gesprekken[0]).toMatchObject({ onderwerp: "Vraag", open: true });
    expect(body.gesprekken[0].berichten).toHaveLength(2);
  });

  test("document uit een werkbron", async () => {
    const r = await vraag("/api/document", { team: "seo", bron: "rapporten", bestand: "effect-design-2026-11-15.md" });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ titel: "Effect design", herkomst: "SEO · Rapporten", ingekort: false });
  });

  test("enkelbestand-bron geeft alleen dat ene bestand vrij", async () => {
    expect((await vraag("/api/document", { team: "directie", bron: "status", bestand: "status.md" })).status).toBe(200);
    expect((await vraag("/api/document", { team: "directie", bron: "status", bestand: "geheim.md" })).status).toBe(404);
  });

  test.each([
    ["traversal", { team: "seo", bron: "rapporten", bestand: "../changelog.md" }, 400],
    ["absoluut pad", { team: "seo", bron: "rapporten", bestand: "/etc/passwd" }, 400],
    ["geen md", { team: "seo", bron: "rapporten", bestand: "x.json" }, 400],
    ["onbekende bron", { team: "seo", bron: "geheim", bestand: "x.md" }, 400],
    ["onbekend team", { team: "hr", bron: "x", bestand: "x.md" }, 400],
    ["bestaat niet", { team: "seo", bron: "rapporten", bestand: "nope.md" }, 404],
  ])("document weigert %s", async (_naam, params, status) => {
    expect((await vraag("/api/document", params)).status).toBe(status);
  });

  test("bericht en agent lezen, onveilige namen weigeren", async () => {
    expect((await vraag("/api/bericht", { bestand: "2026-11-16-090000-seo-antwoord.md" })).body).toMatchObject({ titel: "Re: Vraag", herkomst: "Mailbox pim · verwerkt" });
    expect((await vraag("/api/bericht", { bestand: "../status.md" })).status).toBe(400);
    expect((await vraag("/api/agent", { team: "seo", naam: "analist" })).status).toBe(200);
    expect((await vraag("/api/agent", { team: "seo", naam: "../../x" })).status).toBe(400);
    expect((await vraag("/api/agent", { team: "seo", naam: "onbekend" })).status).toBe(404);
  });

  test("batch-inhoud en batchdocument", async () => {
    const inhoud = await vraag("/api/batch", { fase: "04-review", batch: "20261031-blond-01" });
    expect(inhoud.body).toMatchObject({ documenten: [{ bestand: "voorstel-voor-mark.md" }], overigeBestanden: ["goedgekeurd.json"] });
    expect((await vraag("/api/batch", { fase: "04-review", batch: "20261031-blond-01", bestand: "voorstel-voor-mark.md" })).status).toBe(200);
    expect((await vraag("/api/batch", { fase: "99-geheim", batch: "x" })).status).toBe(400);
    expect((await vraag("/api/batch", { fase: "04-review", batch: ".." })).status).toBe(400);
    expect((await vraag("/api/batch", { fase: "04-review", batch: "bestaat-niet" })).status).toBe(404);
  });

  test("ontbrekende parameter en onbekend adres", async () => {
    expect((await vraag("/api/document", { team: "seo" })).status).toBe(400);
    expect((await vraag("/api/iets")).status).toBe(404);
    expect((await vraag("/api/huis")).status).toBe(200);
  });
});
