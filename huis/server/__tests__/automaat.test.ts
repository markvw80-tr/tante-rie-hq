import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, test, vi } from "vitest";
import type { Bericht, MailboxTeam, RunSamenvatting } from "../../shared/types.ts";
import { Automaat, geheugenAutomaat, geldigeInstelling, LEGE_INSTELLING, MAX_PER_DAG, opdrachtVoor, schijfAutomaat, type AutomaatInstelling } from "../automaat.ts";
import { Ophaler } from "../ophaler.ts";
import { RegieFout, type StartVerzoek } from "../regie/beheer.ts";
import type { Postbode } from "../postbode.ts";
import { behandelPost, type Omgeving } from "../routes.ts";

const NU = new Date("2026-11-17T09:00:00.000Z");
const bericht = (bestand: string, van = "pim"): Bericht => ({
  bestand, map: "inbox", van, aan: "seo", datum: "2026-11-17", onderwerp: `Over ${bestand}`, prioriteit: "normaal", antwoordOp: null, leeftijdDagen: 0,
});
const run = (team: RunSamenvatting["team"], id = "r"): RunSamenvatting => ({
  id, team, agent: "x", opdracht: "", status: "bezig", gestart: NU.toISOString(), geeindigd: null, kostenUsd: null, budgetUsd: 1, poort: null, laatsteRegel: "",
});

function opzet(post: Partial<Record<MailboxTeam, Bericht[]>>, begin: Partial<AutomaatInstelling> = {}, actief: RunSamenvatting[] = []) {
  const starts: StartVerzoek[] = [];
  const opslag = geheugenAutomaat({ ...LEGE_INSTELLING, aan: true, ...begin });
  let klok = NU;
  const automaat = new Automaat({
    inbox: async (team) => post[team] ?? [],
    lead: async (team) => ({ repo: `/repo/${team}`, agent: `${team}-lead` }),
    regie: {
      start(v) {
        starts.push(v);
        return run(v.team, `run-${starts.length}`);
      },
      actief: () => actief,
    },
    opslag,
    klok: () => klok,
  });
  return { automaat, starts, opslag, zetKlok: (d: Date) => void (klok = d) };
}

describe("automaat", () => {
  test("start de lead van een team met nieuwe post, als automatische run met het ingestelde budget", async () => {
    const { automaat, starts, opslag } = opzet({ seo: [bericht("a.md"), bericht("b.md")] }, { budgetUsd: 2 });
    await automaat.controleer();
    expect(starts).toHaveLength(1);
    expect(starts[0]).toMatchObject({ team: "seo", repo: "/repo/seo", agent: "seo-lead", budgetUsd: 2, bron: "huis" });
    expect(starts[0].opdracht).toContain("a.md (van pim)");
    expect(opslag.lees().behandeld.seo).toEqual(["a.md", "b.md"]);
    expect(automaat.stand()).toMatchObject({ aan: true, startsLaatsteDag: 1 });
    expect(automaat.stand().melding).toMatch(/SEO gestart om .* voor 2 nieuwe berichten/);
  });

  test("uit betekent nooit starten", async () => {
    const { automaat, starts } = opzet({ seo: [bericht("a.md")] }, { aan: false });
    await automaat.controleer();
    expect(starts).toHaveLength(0);
    expect(automaat.stand().melding).toBeNull();
  });

  test("dezelfde post start het team geen tweede keer, ook niet als die in de inbox blijft staan", async () => {
    const { automaat, starts, zetKlok } = opzet({ seo: [bericht("a.md")] });
    await automaat.controleer();
    zetKlok(new Date(NU.getTime() + 3 * 60 * 60_000));
    await automaat.controleer();
    expect(starts).toHaveLength(1);
  });

  test("een team dat al werkt wordt niet nog eens gestart; de post wacht", async () => {
    const { automaat, starts, opslag } = opzet({ seo: [bericht("a.md")], pim: [bericht("p.md", "seo")] }, {}, [run("seo")]);
    await automaat.controleer();
    expect(starts.map((s) => s.team)).toEqual(["pim"]);
    expect(opslag.lees().behandeld.seo).toBeUndefined();
  });

  test("nooit meer dan drie agents tegelijk", async () => {
    const { automaat, starts } = opzet({ seo: [bericht("a.md")] }, {}, [run("pim", "1"), run("design", "2"), run("directie", "3")]);
    await automaat.controleer();
    expect(starts).toHaveLength(0);
    expect(automaat.stand().melding).toContain("Er draaien al 3 agents");
  });

  test("rust per team: binnen het uur na een automatische start wacht nieuwe post", async () => {
    const vorige = { team: "seo" as const, tijd: new Date(NU.getTime() - 20 * 60_000).toISOString(), runId: "oud" };
    const { automaat, starts, zetKlok } = opzet({ seo: [bericht("nieuw.md")] }, { starts: [vorige] });
    await automaat.controleer();
    expect(starts).toHaveLength(0);
    expect(automaat.stand().melding).toContain("volgende automatische start kan vanaf");
    zetKlok(new Date(NU.getTime() + 41 * 60_000));
    await automaat.controleer();
    expect(starts).toHaveLength(1);
  });

  test("post van Mark slaat de rustperiode over: het team start meteen", async () => {
    const vorige = { team: "seo" as const, tijd: new Date(NU.getTime() - 20 * 60_000).toISOString(), runId: "oud" };
    const { automaat, starts } = opzet({ seo: [bericht("akkoord.md", "mark")] }, { starts: [vorige] });
    await automaat.controleer();
    expect(starts.map((s) => s.team)).toEqual(["seo"]);
    expect(starts[0].opdracht).toContain("Er ligt post van Mark zelf");
  });

  test("post van Mark start niet als het team al werkt, en ook niet boven de daglimiet", async () => {
    const bezig = opzet({ seo: [bericht("akkoord.md", "mark")] }, {}, [run("seo")]);
    await bezig.automaat.controleer();
    expect(bezig.starts).toHaveLength(0);
    const vol = Array.from({ length: MAX_PER_DAG }, (_, i) => ({ team: "design" as const, tijd: new Date(NU.getTime() - (i + 2) * 60 * 60_000).toISOString(), runId: `d${i}` }));
    const limiet = opzet({ seo: [bericht("akkoord.md", "mark")] }, { starts: vol });
    await limiet.automaat.controleer();
    expect(limiet.starts).toHaveLength(0);
  });

  test("daglimiet: na acht automatische starts in 24 uur stopt het huis", async () => {
    const oud = Array.from({ length: MAX_PER_DAG }, (_, i) => ({ team: "design" as const, tijd: new Date(NU.getTime() - (i + 2) * 60 * 60_000).toISOString(), runId: `d${i}` }));
    const { automaat, starts } = opzet({ seo: [bericht("a.md")] }, { starts: oud });
    await automaat.controleer();
    expect(starts).toHaveLength(0);
    expect(automaat.stand().melding).toContain("Daglimiet");
  });

  test("daglimiet is instelbaar: met 12 per dag mag een negende start", async () => {
    const oud = Array.from({ length: MAX_PER_DAG }, (_, i) => ({ team: "design" as const, tijd: new Date(NU.getTime() - (i + 2) * 60 * 60_000).toISOString(), runId: `d${i}` }));
    const { automaat, starts } = opzet({ seo: [bericht("a.md")] }, { starts: oud, maxPerDag: 12 });
    await automaat.controleer();
    expect(starts).toHaveLength(1);
    expect(automaat.stand()).toMatchObject({ maxPerDag: 12, startsLaatsteDag: 9 });
  });

  test("onbekende daglimiet in het bestand valt terug op de standaard", () => {
    expect(geldigeInstelling({ aan: true, maxPerDag: 7 }).maxPerDag).toBe(MAX_PER_DAG);
    expect(geldigeInstelling({ aan: true, maxPerDag: 20 }).maxPerDag).toBe(20);
    expect(geldigeInstelling({ aan: true, maxPerDag: 50 }).maxPerDag).toBe(50);
  });

  test("berichten die het team zelf verstuurde tellen niet, en afgehandelde namen worden opgeruimd", async () => {
    const { automaat, starts, opslag } = opzet({ seo: [bericht("eigen.md", "seo")] }, { behandeld: { seo: ["weg.md"] } });
    await automaat.controleer();
    expect(starts).toHaveLength(0);
    expect(opslag.lees().behandeld.seo).toEqual([]);
  });

  test("zonder lead-agent of bij een weigering van de regie wordt niets gestart en blijft de post nieuw", async () => {
    const opslag = geheugenAutomaat({ ...LEGE_INSTELLING, aan: true });
    const zonderLead = new Automaat({ inbox: async () => [bericht("a.md")], lead: async () => null, regie: { start: vi.fn(), actief: () => [] }, opslag, klok: () => NU });
    await zonderLead.controleer();
    expect(zonderLead.stand().melding).toContain("geen agent");

    const weigert = new Automaat({
      inbox: async (t) => (t === "seo" ? [bericht("a.md")] : []),
      lead: async () => ({ repo: "/r", agent: "lead" }),
      regie: { start: () => { throw new RegieFout("lead is al aan het werk."); }, actief: () => [] },
      opslag,
      klok: () => NU,
    });
    await weigert.controleer();
    expect(weigert.stand().melding).toBe("lead is al aan het werk.");
    expect(opslag.lees().behandeld.seo).toBeUndefined();
  });

  test("zet bewaart aan en budget en laat de rest staan", () => {
    const { automaat, opslag } = opzet({}, { aan: false, behandeld: { pim: ["x.md"] } });
    expect(automaat.zet(true, 5)).toMatchObject({ aan: true, budgetUsd: 5 });
    expect(opslag.lees().behandeld.pim).toEqual(["x.md"]);
    expect(automaat.zet(false, 1).melding).toBeNull();
  });

  test("de opdracht noemt hooguit tien berichten en zegt dat het geen opdracht van Mark is", () => {
    const tekst = opdrachtVoor("pim", Array.from({ length: 12 }, (_, i) => bericht(`m${i}.md`, "seo")));
    expect(tekst).toContain("niet een opdracht van Mark");
    expect(tekst).toContain("mailbox.py lijst pim");
    expect(tekst).toContain("en nog 2 berichten");
    expect(tekst).not.toContain("m11.md");
  });
});

describe("automaat opslag", () => {
  const map = mkdtempSync(path.join(os.tmpdir(), "automaat-"));
  afterAll(() => rmSync(map, { recursive: true, force: true }));

  test("ontbrekend of kapot bestand is uit; een geldig bestand komt heel terug", () => {
    const bestand = path.join(map, "sub", "automaat.json");
    const opslag = schijfAutomaat(bestand);
    expect(opslag.lees()).toEqual(LEGE_INSTELLING);
    const instelling: AutomaatInstelling = { aan: true, budgetUsd: 2, maxPerDag: 12, behandeld: { seo: ["a.md"] }, starts: [{ team: "pim", tijd: NU.toISOString(), runId: "r1" }] };
    opslag.schrijf(instelling);
    expect(opslag.lees()).toEqual(instelling);
    writeFileSync(bestand, "{kapot");
    vi.spyOn(console, "error").mockImplementationOnce(() => undefined);
    expect(opslag.lees().aan).toBe(false);
    writeFileSync(bestand, JSON.stringify({ aan: "ja", budgetUsd: -1, behandeld: { seo: ["a.md", 3], onbekend: ["x"] }, starts: [{ team: "boef" }] }));
    expect(opslag.lees()).toEqual({ aan: false, budgetUsd: 1, maxPerDag: 8, behandeld: { seo: ["a.md"] }, starts: [] });
  });
});

describe("automaat in het huis", () => {
  test("na het ophalen kijkt de automaat in de inboxen; een fout daarin laat het ophalen slagen", async () => {
    const postbode = { ophalen: vi.fn(async () => undefined) } as unknown as Postbode;
    const ophaler = new Ophaler(postbode, null, () => NU);
    const na = vi.fn(async () => { throw new Error("stuk"); });
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    ophaler.naOphalen(na);
    await ophaler.haalNu();
    await new Promise((r) => setTimeout(r, 0));
    expect(na).toHaveBeenCalledOnce();
    expect(ophaler.stand().fout).toBeNull();
    log.mockRestore();
  });

  test("POST /api/automaat zet hem aan met een geldig budget en weigert onzin", async () => {
    const { automaat, starts } = opzet({ design: [bericht("d.md", "seo")] }, { aan: false });
    const omg = { automaat } as unknown as Omgeving;
    expect((await behandelPost("/api/automaat", { aan: "ja", budgetUsd: 1 }, omg)).status).toBe(400);
    expect((await behandelPost("/api/automaat", { aan: true, budgetUsd: 3 }, omg)).status).toBe(400);
    expect((await behandelPost("/api/automaat", [], omg)).status).toBe(400);
    const goed = await behandelPost("/api/automaat", { aan: true, budgetUsd: 0.5 }, omg);
    expect(goed).toMatchObject({ status: 200, body: { aan: true, budgetUsd: 0.5, maxPerDag: 8 } });
    expect((await behandelPost("/api/automaat", { aan: true, budgetUsd: 0.5, maxPerDag: 7 }, omg)).status).toBe(400);
    expect(await behandelPost("/api/automaat", { aan: true, budgetUsd: 0.5, maxPerDag: 12 }, omg)).toMatchObject({ status: 200, body: { maxPerDag: 12 } });
    expect(await behandelPost("/api/automaat", { aan: true, budgetUsd: 1 }, omg)).toMatchObject({ status: 200, body: { maxPerDag: 12 } });
    await new Promise((r) => setTimeout(r, 0));
    expect(starts.map((s) => s.team)).toEqual(["design"]);
  });

  test("een bericht van Mark vanuit het huis laat de automaat meteen kijken", async () => {
    let gekeken = 0;
    const omg = {
      postbode: { stuur: async () => ({ bestand: "2026-11-20-x.md" }), ophalen: async () => undefined },
      automaat: { controleer: async () => void gekeken++ },
    } as unknown as Omgeving;
    const r = await behandelPost("/api/opdracht", { aan: "design", onderwerp: "Verder met de punten", tekst: "Pak punt 2 en 3 op.", prioriteit: "normaal" }, omg);
    expect(r.status).toBe(201);
    await new Promise((x) => setTimeout(x, 0));
    expect(gekeken).toBe(1);
  });
});
