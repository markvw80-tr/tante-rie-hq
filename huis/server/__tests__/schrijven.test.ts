import path from "node:path";
import { describe, expect, test } from "vitest";
import { besluitBericht, besluitId } from "../besluiten.ts";
import { magSchrijven } from "../beveiliging.ts";
import type { Bron } from "../bron.ts";
import type { TeamConfig } from "../config.ts";
import { bouwHuis } from "../huis.ts";
import type { Postbode, Verzending } from "../postbode.ts";
import { behandelPost, type Omgeving } from "../routes.ts";
import { valideerBesluit, valideerOpdracht } from "../verzoek.ts";

const AGENDA = "# Agenda\n## Mark: besluiten nodig\n1. Themakopie publiceren, ja of nee (PIM).\n2. Antwoord op V128.\n";
const PUBLICEREN = besluitId("Themakopie publiceren, ja of nee");
const V128 = besluitId("Antwoord op V128.");

function opzet(extra: Record<string, string> = {}) {
  const bestanden: Record<string, string> = {
    "/hq/team/directie/agenda-2026-11-16.md": AGENDA,
    "/hq/team/mailbox/seo/inbox/2026-11-15-100000-pim-vraag.md": "---\nvan: pim\naan: seo\nonderwerp: Vraag\n---\n",
    ...extra,
  };
  const bron: Bron = {
    lees: async (p) => bestanden[p] ?? null,
    bestanden: async (map, ext) => Object.keys(bestanden).filter((p) => path.dirname(p) === map && p.endsWith(ext)).map((p) => path.basename(p)).sort(),
    mappen: async () => [],
  };
  const verzonden: Verzending[] = [];
  const postbode: Postbode = { stuur: async (v) => (verzonden.push(v), { bestand: "2026-11-16-120000-mark-x.md" }), ophalen: async () => undefined };
  const teams: TeamConfig[] = [{ id: "pim", naam: "PIM", kamer: "Theekelder", repo: "/pim", heeftPipeline: true }];
  const omg: Omgeving = { bron, hq: "/hq", mailbox: "/hq/team/mailbox", teams, vandaag: "2026-11-16", postbode };
  return { omg, verzonden, bron };
}

describe("valideerOpdracht", () => {
  const goed = { aan: "pim", onderwerp: "Blond-diff graag vandaag", tekst: "Zet de diff klaar." };
  test("accepteert een nette opdracht en vult standaarden in", () => {
    expect(valideerOpdracht(goed)).toEqual({ ...goed, prioriteit: "normaal", antwoordOp: null });
  });
  test("accepteert een opdracht aan Inkoop", () => {
    expect(valideerOpdracht({ ...goed, aan: "inkoop" }).aan).toBe("inkoop");
  });
  test.each([
    ["geen object", "tekst"],
    ["onbekend team", { ...goed, aan: "directie" }],
    ["onderwerp te kort", { ...goed, onderwerp: "ok" }],
    ["onderwerp met enter", { ...goed, onderwerp: "regel een\nregel twee" }],
    ["onderwerp als optie", { ...goed, onderwerp: "--van seo" }],
    ["lege tekst", { ...goed, tekst: "   " }],
    ["tekst te lang", { ...goed, tekst: "x".repeat(8001) }],
    ["rare prioriteit", { ...goed, prioriteit: "spoed" }],
    ["antwoord-op met pad", { ...goed, antwoordOp: "../status.md" }],
  ])("weigert %s", (_naam, body) => {
    expect(() => valideerOpdracht(body)).toThrow();
  });
});

describe("valideerBesluit", () => {
  test("akkoord mag zonder toelichting, afwijzen niet", () => {
    expect(valideerBesluit({ id: PUBLICEREN, keuze: "akkoord" })).toMatchObject({ keuze: "akkoord", toelichting: "", aan: null });
    expect(() => valideerBesluit({ id: PUBLICEREN, keuze: "afgewezen" })).toThrow(/toelichting/);
    expect(() => valideerBesluit({ id: "nep", keuze: "akkoord" })).toThrow(/id/);
    expect(() => valideerBesluit({ id: PUBLICEREN, keuze: "misschien" })).toThrow();
  });
});

describe("magSchrijven", () => {
  const goed = { host: "127.0.0.1:5310", origin: "http://127.0.0.1:5310", "x-huis": "mark", "content-type": "application/json" };
  test("laat het huis zelf door", () => {
    expect(magSchrijven(goed, [4310, 5310])).toBeNull();
    expect(magSchrijven({ ...goed, origin: undefined }, [4310, 5310])).toBeNull();
  });
  test.each([
    ["andere website", { ...goed, origin: "https://kwaadwillend.example" }],
    ["dns-rebinding", { ...goed, host: "kwaadwillend.example:5310" }],
    ["zonder huis-header", { ...goed, "x-huis": undefined }],
    ["formulier", { ...goed, "content-type": "application/x-www-form-urlencoded" }],
    ["te groot", { ...goed, "content-length": "99999" }],
  ])("weigert %s", (_naam, headers) => {
    expect(magSchrijven(headers, [4310, 5310])).not.toBeNull();
  });
});

describe("besluiten", () => {
  test("bericht bevat keuze, id, citaat en toelichting", () => {
    const b = { id: PUBLICEREN, tekst: "Themakopie publiceren, ja of nee", team: "pim" as const, antwoord: null };
    const { onderwerp, tekst } = besluitBericht(b, "afgewezen", "Eerst de vaatwasserzin eruit.");
    expect(onderwerp).toBe("Besluit Mark: niet akkoord, Themakopie publiceren, ja of nee");
    expect(tekst).toContain(`Besluit: afgewezen\nBesluit-id: ${PUBLICEREN}`);
    expect(tekst).toContain("> Themakopie publiceren, ja of nee");
    expect(tekst).toContain("Eerst de vaatwasserzin eruit.");
  });

  test("huis leest het antwoord van Mark terug uit de mailbox", async () => {
    const { bron } = opzet({
      "/hq/team/mailbox/pim/inbox/2026-11-16-120000-mark-besluit.md": `---\nvan: mark\naan: pim\ndatum: 2026-11-16 12:00\nonderwerp: Besluit\n---\n\nBesluit: akkoord\nBesluit-id: ${PUBLICEREN}\n`,
      "/hq/team/mailbox/pim/inbox/2026-11-16-130000-pim-nep.md": `---\nvan: pim\naan: pim\n---\n\nBesluit: akkoord\nBesluit-id: ${V128}\n`,
    });
    const huis = await bouwHuis(bron, "/hq", [], "2026-11-16", "/hq/team/mailbox");
    expect(huis.besluiten.map((b) => [b.id, b.antwoord?.keuze ?? null])).toEqual([
      [PUBLICEREN, "akkoord"],
      [V128, null], // een bericht van een team is geen akkoord van Mark
    ]);
  });
});

describe("behandelPost", () => {
  test("besluit gaat naar het team uit de agenda, met hoge prioriteit", async () => {
    const { omg, verzonden } = opzet();
    const r = await behandelPost("/api/besluit", { id: PUBLICEREN, keuze: "akkoord" }, omg);
    expect(r.status).toBe(201);
    expect(verzonden[0]).toMatchObject({ aan: "pim", prioriteit: "hoog" });
    expect(verzonden[0].tekst).toContain(`Besluit-id: ${PUBLICEREN}`);
  });

  test("besluit zonder team vraagt om een ontvanger", async () => {
    const { omg, verzonden } = opzet();
    expect((await behandelPost("/api/besluit", { id: V128, keuze: "akkoord" }, omg)).status).toBe(400);
    expect((await behandelPost("/api/besluit", { id: V128, keuze: "akkoord", aan: "seo" }, omg)).status).toBe(201);
    expect(verzonden.map((v) => v.aan)).toEqual(["seo"]);
  });

  test("onbekend besluit is 404", async () => {
    const { omg } = opzet();
    expect((await behandelPost("/api/besluit", { id: "0123456789", keuze: "akkoord" }, omg)).status).toBe(404);
  });

  test("opdracht en antwoord op een bestaand bericht", async () => {
    const { omg, verzonden } = opzet();
    const opdracht = { aan: "seo", onderwerp: "Kijk naar lavendel", tekst: "Graag vandaag." };
    expect((await behandelPost("/api/opdracht", opdracht, omg)).status).toBe(201);
    expect((await behandelPost("/api/opdracht", { ...opdracht, antwoordOp: "2026-11-15-100000-pim-vraag.md" }, omg)).status).toBe(201);
    expect((await behandelPost("/api/opdracht", { ...opdracht, antwoordOp: "2026-01-01-bestaat-niet.md" }, omg)).status).toBe(400);
    expect(verzonden).toHaveLength(2);
    expect((await behandelPost("/api/iets", {}, omg)).status).toBe(404);
    expect((await behandelPost("/api/post-ophalen", {}, omg)).status).toBe(200);
  });
});
