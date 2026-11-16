import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, test } from "vitest";
import type { Bericht, Gesprek } from "../../shared/types.ts";
import { archiveer, geheugenArchief, haalTerug, pasArchiefToe, schijfArchief } from "../archief.ts";
import type { Bron } from "../bron.ts";
import { Ophaler } from "../ophaler.ts";
import { behandelPost, type Omgeving } from "../routes.ts";

const bericht = (bestand: string, map: Bericht["map"] = "verwerkt"): Bericht => ({
  bestand, map, van: "seo", aan: "pim", datum: "", onderwerp: bestand, prioriteit: "normaal", antwoordOp: null, leeftijdDagen: 1,
});
const gesprek = (id: string, berichten: Bericht[]): Gesprek => ({
  id, onderwerp: id, deelnemers: ["pim", "seo"], berichten, laatsteDatum: "2026-11-16", open: berichten.some((b) => b.map === "inbox"), gearchiveerd: false,
});

const afgehandeld = gesprek("a.md", [bericht("a.md"), bericht("b.md")]);
const lopend = gesprek("c.md", [bericht("c.md", "inbox")]);
const NU = "2026-11-16T21:00:00.000Z";

describe("archief", () => {
  test("alleen afgehandelde gesprekken gaan het archief in", () => {
    const { archief, aantal } = archiveer({}, [afgehandeld, lopend], ["a.md", "c.md", "bestaat-niet.md"], NU);
    expect(aantal).toBe(1);
    expect(archief).toEqual({ "a.md": { laatste: "b.md", sinds: NU } });
    expect(pasArchiefToe([afgehandeld, lopend], archief).map((g) => g.gearchiveerd)).toEqual([true, false]);
  });

  test("een nieuw bericht haalt een gesprek vanzelf uit het archief", () => {
    const { archief } = archiveer({}, [afgehandeld], ["a.md"], NU);
    const metAntwoord = gesprek("a.md", [bericht("a.md"), bericht("b.md"), bericht("d.md", "inbox")]);
    expect(pasArchiefToe([metAntwoord], archief)[0].gearchiveerd).toBe(false);
  });

  test("terughalen en het origineel blijft onveranderd", () => {
    const begin = { "a.md": { laatste: "b.md", sinds: NU }, "x.md": { laatste: "x.md", sinds: NU } };
    const { archief, aantal } = haalTerug(begin, ["a.md", "onbekend.md"]);
    expect(aantal).toBe(1);
    expect(Object.keys(archief)).toEqual(["x.md"]);
    expect(Object.keys(begin)).toHaveLength(2);
  });

  const map = mkdtempSync(path.join(os.tmpdir(), "huis-archief-"));
  afterAll(() => rmSync(map, { recursive: true, force: true }));

  test("schijfopslag: leeg, heen en terug, en kapot bestand", () => {
    const opslag = schijfArchief(path.join(map, "sub", "archief.json"));
    expect(opslag.lees()).toEqual({});
    opslag.schrijf({ "a.md": { laatste: "b.md", sinds: NU } });
    expect(opslag.lees()).toEqual({ "a.md": { laatste: "b.md", sinds: NU } });
    const kapot = path.join(map, "kapot.json");
    writeFileSync(kapot, "{kapot");
    expect(schijfArchief(kapot).lees()).toEqual({});
  });
});

describe("Ophaler", () => {
  const klok = () => new Date(NU);

  test("houdt bij wanneer de post is opgehaald", async () => {
    const o = new Ophaler({ stuur: async () => ({ bestand: "" }), ophalen: async () => undefined }, 300_000, klok);
    expect(o.stand()).toEqual({ opgehaald: null, fout: null, automatischMinuten: 5 });
    await o.haalNu();
    expect(o.stand().opgehaald).toBe(NU);
  });

  test("een mislukte ophaalbeurt staat in de stand en zonder git is er geen automaat", async () => {
    const o = new Ophaler({ stuur: async () => ({ bestand: "" }), ophalen: async () => { throw new Error("git fetch faalt"); } }, null, klok);
    await expect(o.haalNu()).rejects.toThrow();
    expect(o.stand()).toEqual({ opgehaald: null, fout: "git fetch faalt", automatischMinuten: null });
    o.start();
    o.stop();
  });
});

describe("route /api/archief", () => {
  const bestanden: Record<string, string> = {
    "/hq/team/mailbox/pim/verwerkt/2026-11-10-100000-seo-vraag.md": "---\nvan: seo\naan: pim\nonderwerp: Vraag\n---\n",
    "/hq/team/mailbox/seo/inbox/2026-11-16-100000-pim-nieuw.md": "---\nvan: pim\naan: seo\nonderwerp: Nieuw\n---\n",
  };
  const bron: Bron = {
    lees: async (p) => bestanden[p] ?? null,
    bestanden: async (m, ext) => Object.keys(bestanden).filter((p) => path.dirname(p) === m && p.endsWith(ext)).map((p) => path.basename(p)),
    mappen: async () => [],
  };
  const archief = geheugenArchief();
  const omg: Omgeving = { bron, hq: "/hq", mailbox: "/hq/team/mailbox", teams: [], vandaag: "2026-11-16", postbode: { stuur: async () => ({ bestand: "" }), ophalen: async () => undefined }, archief };
  const post = (body: unknown) => behandelPost("/api/archief", body, omg);

  test("archiveert afgehandeld, weigert lopend en haalt terug", async () => {
    expect((await post({ actie: "archiveer", ids: ["2026-11-10-100000-seo-vraag.md", "2026-11-16-100000-pim-nieuw.md"] })).body).toEqual({ aantal: 1 });
    expect(Object.keys(archief.lees())).toEqual(["2026-11-10-100000-seo-vraag.md"]);
    expect((await post({ actie: "terug", ids: ["2026-11-10-100000-seo-vraag.md"] })).body).toEqual({ aantal: 1 });
    expect(archief.lees()).toEqual({});
  });

  test.each([
    ["onbekende actie", { actie: "wis", ids: ["a.md"] }],
    ["geen ids", { actie: "archiveer", ids: [] }],
    ["pad als id", { actie: "archiveer", ids: ["../status.md"] }],
    ["geen object", "archiveer"],
  ])("weigert %s", async (_n, body) => {
    expect((await post(body)).status).toBe(400);
  });
});
