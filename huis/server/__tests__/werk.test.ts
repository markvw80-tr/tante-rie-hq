import { describe, expect, test } from "vitest";
import type { Bericht } from "../../shared/types.ts";
import { bouwGesprekken } from "../parsers/gesprekken.ts";
import { docInfo, filterBestanden, isVeiligeNaam, titelUitMarkdown } from "../parsers/documenten.ts";

const bericht = (bestand: string, extra: Partial<Bericht> = {}): Bericht => ({
  bestand,
  map: "verwerkt",
  van: "seo",
  aan: "pim",
  datum: bestand.slice(0, 10),
  onderwerp: bestand,
  prioriteit: "normaal",
  antwoordOp: null,
  leeftijdDagen: 1,
  ...extra,
});

describe("veilige bestandsnamen", () => {
  test.each([
    ["2026-11-15-rapport.md", true],
    ["effect_design.v2.md", true],
    ["../geheim.md", false],
    ["map/bestand.md", false],
    [".env", false],
    ["rapport.json", false],
    ["", false],
  ])("%s -> %s", (naam, verwacht) => {
    expect(isVeiligeNaam(naam, ".md")).toBe(verwacht);
  });
});

describe("documenten", () => {
  test("maakt een leesbare titel en datum uit de bestandsnaam", () => {
    expect(docInfo("2026-11-15-effect-design.md")).toEqual({ bestand: "2026-11-15-effect-design.md", titel: "Effect design", datum: "2026-11-15" });
    expect(docInfo("effect-design-2026-11-11.md")).toEqual({ bestand: "effect-design-2026-11-11.md", titel: "Effect design", datum: "2026-11-11" });
    expect(docInfo("2026-11-07.md").titel).toBe("Dagnotities");
    expect(docInfo("werkvolgorde.md")).toEqual({ bestand: "werkvolgorde.md", titel: "Werkvolgorde", datum: null });
  });
  test("filtert op patroon en sorteert nieuwste eerst, undated achteraan", () => {
    const namen = ["plan-2026-10.md", "werkvolgorde.md", "changelog.md", "plan-2026-11.md", "meetkalender-2026-11.md"];
    expect(filterBestanden(namen, /^(plan-|werkvolgorde|meetkalender)/).map((d) => d.bestand)).toEqual([
      "meetkalender-2026-11.md",
      "plan-2026-11.md",
      "plan-2026-10.md",
      "werkvolgorde.md",
    ]);
  });
  test("leest titel uit de eerste kop, anders terugval", () => {
    expect(titelUitMarkdown("intro\n# Echte titel\n## sub", "x")).toBe("Echte titel");
    expect(titelUitMarkdown("---\nonderwerp: Bericht\n---\n", "x")).toBe("Bericht");
    expect(titelUitMarkdown("geen kop", "terug")).toBe("terug");
  });
});

describe("gesprekken", () => {
  test("koppelt antwoorden aan het eerste bericht en sorteert op laatste bericht", () => {
    const lijst = [
      bericht("2026-10-25-a.md", { onderwerp: "Gewichten Bunzlau" }),
      bericht("2026-10-26-b.md", { van: "pim", aan: "seo", antwoordOp: "2026-10-25-a.md" }),
      bericht("2026-10-27-c.md", { antwoordOp: "2026-10-26-b.md", map: "inbox" }),
      bericht("2026-11-01-d.md", { van: "design", aan: "seo", onderwerp: "Los" }),
    ];
    const gesprekken = bouwGesprekken(lijst);
    expect(gesprekken.map((g) => g.id)).toEqual(["2026-11-01-d.md", "2026-10-25-a.md"]);
    const [, bunzlau] = gesprekken;
    expect(bunzlau.onderwerp).toBe("Gewichten Bunzlau");
    expect(bunzlau.berichten.map((b) => b.bestand)).toEqual(["2026-10-25-a.md", "2026-10-26-b.md", "2026-10-27-c.md"]);
    expect(bunzlau.deelnemers).toEqual(["pim", "seo"]);
    expect(bunzlau.open).toBe(true);
    expect(bunzlau.laatsteDatum).toBe("2026-10-27");
  });
  test("antwoord op onbekend bericht wordt een eigen gesprek, lussen breken niet", () => {
    const g = bouwGesprekken([
      bericht("2026-10-01-x.md", { antwoordOp: "bestaat-niet.md" }),
      bericht("2026-10-02-p.md", { antwoordOp: "2026-10-03-q.md" }),
      bericht("2026-10-03-q.md", { antwoordOp: "2026-10-02-p.md" }),
    ]);
    expect(g).toHaveLength(2);
    expect(g.find((x) => x.id === "2026-10-01-x.md")?.open).toBe(false);
  });
});
