import { describe, expect, test } from "vitest";
import type { RunSamenvatting } from "../../shared/types.ts";
import { kostenOverzicht } from "../regie/kosten.ts";

const NU = new Date("2026-11-18T12:00:00");
let teller = 0;
function run(team: RunSamenvatting["team"], gestart: string, kostenUsd: number | null, extra: Partial<RunSamenvatting> = {}): RunSamenvatting {
  teller += 1;
  return { id: `r${teller}`, team, agent: "a", opdracht: "o", status: "klaar", gestart, geeindigd: null, kostenUsd, budgetUsd: 2, poort: null, laatsteRegel: "", ...extra };
}

describe("kostenOverzicht", () => {
  test("telt per team de afgelopen 7 dagen en de lopende maand", () => {
    const o = kostenOverzicht(
      [
        run("seo", "2026-11-17T08:00:00", 0.58),
        run("seo", "2026-11-05T08:00:00", 1.0), // binnen maand, buiten week
        run("pim", "2026-11-17T07:00:00", 0.78, { bron: "huis" }),
        run("pim", "2026-10-30T07:00:00", 3.0), // vorige maand, buiten week
        run("design", "2026-11-16T07:00:00", 0.45, { bron: "huis", budgetOp: true, status: "fout" }),
      ],
      NU,
    );
    const seo = o.teams.find((t) => t.team === "seo")!;
    expect(seo).toMatchObject({ weekUsd: 0.58, maandUsd: 1.58, runsWeek: 1, budgetOpWeek: 0, automatischWeekUsd: 0 });
    const pim = o.teams.find((t) => t.team === "pim")!;
    expect(pim).toMatchObject({ weekUsd: 0.78, maandUsd: 0.78, automatischWeekUsd: 0.78 });
    expect(o.teams.find((t) => t.team === "design")).toMatchObject({ budgetOpWeek: 1, automatischWeekUsd: 0.45 });
    expect(o.weekUsd).toBeCloseTo(1.81);
    expect(o.maandUsd).toBeCloseTo(2.81);
  });

  test("runs zonder kosten tellen als onbekend, niet als nul dollar zonder melding", () => {
    const o = kostenOverzicht([run("seo", "2026-11-17T08:00:00", null, { status: "onderbroken" }), run("seo", "2026-11-17T09:00:00", 0.2)], NU);
    expect(o.zonderKostenWeek).toBe(1);
    expect(o.teams.find((t) => t.team === "seo")).toMatchObject({ weekUsd: 0.2, runsWeek: 2 });
  });

  test("teams zonder runs staan er niet in en ongeldige datums worden genegeerd", () => {
    const o = kostenOverzicht([run("seo", "onzin", 5)], NU);
    expect(o.teams).toEqual([]);
    expect(o.weekUsd).toBe(0);
  });

  test("teams in vaste volgorde: directie, SEO, PIM, Design, Inkoop, Financiën, Klant", () => {
    const o = kostenOverzicht(
      [
        run("klant", "2026-11-17T08:00:00", 1),
        run("financien", "2026-11-17T08:00:00", 1),
        run("inkoop", "2026-11-17T08:00:00", 1),
        run("design", "2026-11-17T08:00:00", 1),
        run("seo", "2026-11-17T08:00:00", 1),
        run("pim", "2026-11-17T08:00:00", 1),
      ],
      NU,
    );
    expect(o.teams.map((t) => t.team)).toEqual(["seo", "pim", "design", "inkoop", "financien", "klant"]);
  });
});
