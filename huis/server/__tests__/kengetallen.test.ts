import { describe, expect, test } from "vitest";
import { leesKengetallen, parseKengetallen } from "../kengetallen.ts";
import type { Bron } from "../bron.ts";
import type { TeamConfig } from "../config.ts";

const goed = {
  team: "seo",
  bijgewerkt: "2026-11-21T10:00",
  cijfers: [{ id: "gsc-niet-merk", label: "Klikken zonder merknaam", waarde: 49, vorige: 36, periode: "28 dagen", bron: "Search Console", beter: "hoger", eenheid: "" }],
  fouten: [],
};

describe("parseKengetallen", () => {
  test("leest een geldig bestand", () => {
    const k = parseKengetallen(JSON.stringify(goed), "seo");
    expect(k?.cijfers[0]).toMatchObject({ id: "gsc-niet-merk", waarde: 49, vorige: 36, beter: "hoger" });
    expect(k?.team).toBe("seo");
  });
  test("ongeldige JSON of verkeerde vorm geeft null", () => {
    expect(parseKengetallen("{kapot", "seo")).toBeNull();
    expect(parseKengetallen(JSON.stringify({ team: "seo" }), "seo")).toBeNull();
  });
  test("slaat cijfers zonder label of met een vreemde waarde over, en kapt lange teksten af", () => {
    const k = parseKengetallen(
      JSON.stringify({ ...goed, cijfers: [{ id: "x", waarde: 1 }, { ...goed.cijfers[0], waarde: "veel" }, { ...goed.cijfers[0], label: "a".repeat(500) }] }),
      "seo",
    );
    expect(k?.cijfers).toHaveLength(1);
    expect(k?.cijfers[0].label.length).toBeLessThanOrEqual(120);
  });
  test("waarde null mag (nog niet gemeten), beter valt terug op hoger", () => {
    const k = parseKengetallen(JSON.stringify({ ...goed, cijfers: [{ ...goed.cijfers[0], waarde: null, vorige: null, beter: "anders" }] }), "seo");
    expect(k?.cijfers[0]).toMatchObject({ waarde: null, vorige: null, beter: "hoger" });
  });
  test("het team komt uit de configuratie, niet uit het bestand", () => {
    expect(parseKengetallen(JSON.stringify({ ...goed, team: "pim" }), "klant")?.team).toBe("klant");
  });
});

describe("leesKengetallen", () => {
  const teams: TeamConfig[] = [
    { id: "seo", naam: "SEO", kamer: "Etalage", repo: "/seo", heeftPipeline: false },
    { id: "pim", naam: "PIM", kamer: "Theekelder", repo: "/pim", heeftPipeline: true },
    { id: "klant", naam: "Klant", kamer: "Theesalon", repo: "/klant", heeftPipeline: false },
  ];
  const bron = (bestanden: Record<string, string>): Bron => ({
    lees: async (p) => bestanden[p] ?? null,
    bestanden: async () => [],
    mappen: async () => [],
  });
  test("leest alleen teams met kengetallen en slaat ontbrekende bestanden over", async () => {
    const k = await leesKengetallen(bron({ "/seo/data/kengetallen.json": JSON.stringify(goed), "/pim/data/kengetallen.json": JSON.stringify(goed) }), teams);
    expect(k.map((t) => t.team)).toEqual(["seo"]);
  });
});
