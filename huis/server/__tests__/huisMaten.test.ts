import { describe, expect, test } from "vitest";
import { GROND_Y, KAMERS, LOOPRUIMTE, figuurStap } from "../../src/components/huis/maten.ts";

const onder = (k: keyof typeof KAMERS) => KAMERS[k].y + KAMERS[k].h;
const rechts = (k: keyof typeof KAMERS) => KAMERS[k].x + KAMERS[k].w;
const LUCHT = 6;

describe("raster van het huis", () => {
  test("de tussenwand staat op elke verdieping op dezelfde plek", () => {
    expect(new Set([rechts("design"), rechts("seo"), rechts("pim")])).toEqual(new Set([570]));
    expect(new Set([KAMERS.inkoop.x, KAMERS.toonbank.x, KAMERS.financien.x])).toEqual(new Set([580]));
  });

  test("buurkamers op een verdieping hebben dezelfde boven- en onderkant", () => {
    expect([KAMERS.design.y, onder("design")]).toEqual([KAMERS.inkoop.y, onder("inkoop")]);
    expect([KAMERS.seo.y, onder("seo")]).toEqual([KAMERS.toonbank.y, onder("toonbank")]);
    expect([KAMERS.pim.y, onder("pim")]).toEqual([KAMERS.financien.y, onder("financien")]);
    expect(onder("klant")).toBe(onder("seo"));
  });

  test("overal evenveel lucht tot balk, grond en kelderwand", () => {
    expect(KAMERS.design.y - 264).toBe(LUCHT); // onder de gevelbalk (258 + 6)
    expect(454 - onder("design")).toBe(LUCHT); // boven de verdiepingsbalk
    expect(KAMERS.seo.y - 460).toBe(LUCHT); // onder de verdiepingsbalk
    expect(GROND_Y - onder("seo")).toBe(LUCHT);
    expect(KAMERS.pim.y - 670).toBe(LUCHT); // onder de bovenkant van de kelderwand
    expect(920 - onder("pim")).toBe(LUCHT); // boven de onderkant van de kelderwand
  });
});

describe("figuurtjes blijven in hun kamer", () => {
  const bezetting = { directie: 3, design: 5, inkoop: 4, seo: 8, pim: 9, financien: 2, klant: 3 } as const;
  test.each(Object.entries(bezetting))("%s met %i agents", (team, aantal) => {
    const id = team as keyof typeof bezetting;
    const { links, breedte } = LOOPRUIMTE[id];
    const stap = figuurStap(aantal, breedte);
    const start = KAMERS[id].x + links + (breedte - stap * (aantal - 1)) / 2;
    const eind = start + stap * (aantal - 1);
    expect(start - 10).toBeGreaterThanOrEqual(KAMERS[id].x);
    expect(eind + 10).toBeLessThanOrEqual(rechts(id));
  });

  test("een rij die niet past wordt krapper in plaats van breder dan de loopruimte", () => {
    expect(figuurStap(8, 160) * 7).toBeLessThanOrEqual(160);
    expect(figuurStap(3, 300)).toBe(54);
  });
});
