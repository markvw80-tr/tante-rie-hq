import { describe, expect, test } from "vitest";
import { besluitOnderwerp, eersteVermelding, metSinds } from "../besluiten.ts";

describe("besluitOnderwerp", () => {
  test("een vraagnummer wint, ook als de tekst eromheen verandert", () => {
    expect(besluitOnderwerp("Merchant Center (V127): maak een regel in de feed")).toBe("v127");
    expect(besluitOnderwerp("Merchant Center (V127): de feedregel maak je zelf")).toBe("v127");
  });
  test("zonder vraagnummer: de kop voor de dubbele punt, zonder opmaak", () => {
    expect(besluitOnderwerp("**Kostprijzen (PIM)**: de koppeling is akkoord")).toBe("kostprijzen (pim)");
    expect(besluitOnderwerp("Kostprijzen (PIM): Shopify Admin API-token toevoegen")).toBe("kostprijzen (pim)");
  });
  test("geen herkenbaar onderwerp: null", () => {
    expect(besluitOnderwerp("Geen nieuwe besluiten open. De drie punten zijn afgehandeld.")).toBeNull();
    expect(besluitOnderwerp(`${"a".repeat(80)}: rest`)).toBeNull();
  });
});

describe("eersteVermelding en metSinds", () => {
  const agendas = [
    { datum: "2026-11-18", besluiten: ["Antwoord van SEO over de eenheidsprijs (V127) volgt nog"] },
    { datum: "2026-11-19", besluiten: ["Merchant Center (V127): maak een regel", "Kostprijzen (PIM): token toevoegen"] },
    { datum: "2026-11-20", besluiten: ["Merchant Center (V127): de feedregel", "Kostprijzen (PIM): wacht op facturen", "Nieuw punt: iets anders"] },
  ];
  test("onthoudt per onderwerp de oudste agenda", () => {
    const eerste = eersteVermelding(agendas);
    expect(eerste.get("v127")).toBe("2026-11-18");
    expect(eerste.get("kostprijzen (pim)")).toBe("2026-11-19");
    expect(eerste.get("nieuw punt")).toBe("2026-11-20");
  });
  test("zet sinds bij elk besluit; zonder onderwerp de datum van de huidige agenda", () => {
    const besluiten = [
      { id: "a", tekst: "Merchant Center (V127): de feedregel", team: null, antwoord: null },
      { id: "b", tekst: "Losse opmerking zonder kop", team: null, antwoord: null },
    ];
    expect(metSinds(besluiten, eersteVermelding(agendas), "2026-11-20").map((b) => b.sinds)).toEqual(["2026-11-18", "2026-11-20"]);
  });
});
