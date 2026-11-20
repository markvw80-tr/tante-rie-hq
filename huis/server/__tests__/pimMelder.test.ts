import { describe, expect, test, vi } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { meldSleutel, PimMelder, pimBericht, schijfMelderOpslag, teMelden, type MelderOpslag } from "../pimMelder.ts";
import type { PakhuisNieuwArtikel, PakhuisStand } from "../../shared/types.ts";
import type { Verzending } from "../postbode.ts";

const artikel = (o: Partial<PakhuisNieuwArtikel> = {}): PakhuisNieuwArtikel => ({
  sku: "GE-101", omschrijving: "Rooibos vanille 1 kg", leverancier: "Geels", document: "VO-77", confirmationId: "c1", aantal: 2, inkoopprijs: 18.5, sinds: "2026-11-20T10:00:00Z", ...o,
});
const stand = (nieuweArtikelen: PakhuisNieuwArtikel[]): PakhuisStand => ({
  bijgewerkt: "2026-11-20T12:00:00Z", wachtend: [], backorder: { bestellingen: 0, stuks: 0, oudste: null }, ontvangsten: [], nieuweArtikelen, appUrl: "https://nas",
});
const geheugen = (begin: string[] = []): MelderOpslag & { data: string[] } => {
  const o = { data: begin, lees: () => o.data, schrijf: (s: readonly string[]) => void (o.data = [...s]) };
  return o;
};

describe("teMelden", () => {
  test("slaat eerder gemelde artikelen over, hoofdletterongevoelig", () => {
    const l = teMelden([artikel(), artikel({ sku: "GE-102" })], new Set([meldSleutel(artikel({ sku: "ge-101", leverancier: "GEELS" }))]));
    expect(l.map((a) => a.sku)).toEqual(["GE-102"]);
  });
});

describe("pimBericht", () => {
  test("tabel met SKU, leverancier, prijs en link; zegt dat het geen akkoord van Mark is", () => {
    const { onderwerp, tekst } = pimBericht([artikel(), artikel({ sku: "BL-9", leverancier: "Blond", omschrijving: "Mok | groen" })], "https://nas");
    expect(onderwerp).toBe("2 nieuwe artikelen aanmaken (Geels, Blond)");
    expect(tekst).toContain("| GE-101 | Rooibos vanille 1 kg | Geels | VO-77 | 2 | € 18,50 | https://nas/confirmations/c1 |");
    expect(tekst).toContain("Mok / groen");
    expect(tekst).toContain("geen opdracht of akkoord van Mark");
  });
  test("enkelvoud bij één artikel", () => {
    expect(pimBericht([artikel()], "x").onderwerp).toBe("1 nieuw artikel aanmaken (Geels)");
  });
});

describe("PimMelder", () => {
  const bron = (s: PakhuisStand | null, bereikbaar = true) => ({ stand: vi.fn(async () => ({ stand: s, bereikbaar })) });

  test("stuurt één bericht van inkoop aan pim en onthoudt wat gemeld is", async () => {
    const stuur = vi.fn(async (_v: Verzending) => ({ bestand: "x.md" }));
    const opslag = geheugen();
    const melder = new PimMelder({ pakhuis: bron(stand([artikel(), artikel({ sku: "GE-102" })])), postbode: { stuur }, opslag });
    expect(await melder.controleer()).toBe(2);
    expect(stuur).toHaveBeenCalledTimes(1);
    expect(stuur.mock.calls[0][0]).toMatchObject({ van: "inkoop", aan: "pim", prioriteit: "normaal" });
    expect(opslag.data).toEqual(["geels|ge-101", "geels|ge-102"]);
    expect(await melder.controleer()).toBe(0);
    expect(stuur).toHaveBeenCalledTimes(1);
  });

  test("meldt alleen het nieuwe artikel bij een volgende controle", async () => {
    const stuur = vi.fn(async (_v: Verzending) => ({ bestand: "x.md" }));
    const melder = new PimMelder({ pakhuis: bron(stand([artikel(), artikel({ sku: "GE-103" })])), postbode: { stuur }, opslag: geheugen(["geels|ge-101"]) });
    expect(await melder.controleer()).toBe(1);
    expect(stuur.mock.calls[0]![0].tekst).toContain("GE-103");
    expect(stuur.mock.calls[0]![0].tekst).not.toContain("GE-101");
  });

  test("niets sturen als de app onbereikbaar is of er niets nieuws is", async () => {
    const stuur = vi.fn(async (_v: Verzending) => ({ bestand: "x.md" }));
    expect(await new PimMelder({ pakhuis: bron(null, false), postbode: { stuur }, opslag: geheugen() }).controleer()).toBe(0);
    expect(await new PimMelder({ pakhuis: bron(stand([])), postbode: { stuur }, opslag: geheugen() }).controleer()).toBe(0);
    expect(stuur).not.toHaveBeenCalled();
  });

  test("mislukt versturen: niets onthouden, zodat de volgende controle het opnieuw probeert", async () => {
    const opslag = geheugen();
    const melder = new PimMelder({ pakhuis: bron(stand([artikel()])), postbode: { stuur: vi.fn(async () => { throw new Error("git"); }) }, opslag });
    await expect(melder.controleer()).rejects.toThrow("git");
    expect(opslag.data).toEqual([]);
  });
});

describe("schijfMelderOpslag", () => {
  test("schrijft en leest terug; ontbrekend bestand is leeg", () => {
    const o = schijfMelderOpslag(path.join(mkdtempSync(path.join(tmpdir(), "melder-")), "sub", "m.json"));
    expect(o.lees()).toEqual([]);
    o.schrijf(["a|b"]);
    expect(o.lees()).toEqual(["a|b"]);
  });
});
