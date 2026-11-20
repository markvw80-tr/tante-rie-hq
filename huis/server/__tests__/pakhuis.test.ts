import { describe, expect, test, vi } from "vitest";
import { httpPakhuis, leesStand, pakhuisSignalen } from "../pakhuis.ts";

const ruw = {
  bijgewerkt: "2026-11-20T12:00:00Z",
  wachtend: [
    { id: "abc", leverancier: "Blond", document: "VF1", soort: "levering", binnen: "2026-11-15", dagen: 5, regels: 3 },
    { id: "def", leverancier: "Rice", document: "SI2", soort: "levering", binnen: "2026-11-19", dagen: 1, regels: 2 },
  ],
  backorder: { bestellingen: 2, stuks: 8, oudste: { poNumber: "VO2", leverancier: "Rice", dagen: 20 } },
  ontvangsten: [{ wanneer: "2026-11-20T16:01:59Z", leverancier: "—", document: "TEST", stuks: 1 }],
};

describe("leesStand", () => {
  test("neemt een geldig antwoord over met het app-adres", () => {
    const s = leesStand(ruw, "https://nas");
    expect(s?.wachtend).toHaveLength(2);
    expect(s?.appUrl).toBe("https://nas");
    expect(s?.backorder.oudste?.poNumber).toBe("VO2");
  });
  test("gooit een ongeldig antwoord weg", () => {
    expect(leesStand({ fout: "Niet gevonden" }, "x")).toBeNull();
    expect(leesStand(null, "x")).toBeNull();
  });
  test("maakt een id veilig voor in een link", () => {
    const s = leesStand({ ...ruw, wachtend: [{ ...ruw.wachtend[0], id: "abc/../x?y" }] }, "x");
    expect(s?.wachtend[0].id).toBe("abcxy");
  });
});

describe("pakhuisSignalen", () => {
  const stand = leesStand(ruw, "x");
  test("te lang wachtende levering en oude backorder", () => {
    expect(pakhuisSignalen(stand, 3, true)).toEqual([
      "1 levering wacht 3 dagen of langer op afvinken",
      "Backorder VO2 van Rice staat al 20 dagen open",
    ]);
  });
  test("niet bereikbaar is zelf een signaal", () => {
    expect(pakhuisSignalen(null, 3, false)).toHaveLength(1);
  });
  test("rustige stand geeft geen signalen", () => {
    expect(pakhuisSignalen(leesStand({ ...ruw, wachtend: [], backorder: { bestellingen: 0, stuks: 0, oudste: null } }, "x"), 3, true)).toEqual([]);
  });
});

describe("httpPakhuis", () => {
  test("stuurt de sleutel mee, leidt het app-adres af en cachet een minuut", async () => {
    const haal = vi.fn(async () => new Response(JSON.stringify(ruw), { status: 200 }));
    const bron = httpPakhuis("https://nas.example/api/pakhuis", "geheim", haal as unknown as typeof fetch);
    const a = await bron.stand();
    await bron.stand();
    expect(haal).toHaveBeenCalledTimes(1);
    expect((haal.mock.calls[0] as unknown as [string, RequestInit])[1].headers).toEqual({ "x-pakhuis-token": "geheim" });
    expect(a).toMatchObject({ bereikbaar: true, stand: { appUrl: "https://nas.example" } });
  });
  test("een fout of 404 betekent niet bereikbaar", async () => {
    const bron = httpPakhuis("https://nas/api/pakhuis", "x", (async () => new Response("{}", { status: 404 })) as unknown as typeof fetch);
    expect(await bron.stand()).toEqual({ stand: null, bereikbaar: false });
  });
});

describe("metPakhuis", () => {
  const team = (id: string) => ({ id, naam: id, kamer: id, agents: [], mailbox: null, statusHistorie: [], statusLeeftijdDagen: 0, pipeline: null, stemming: "bezig" as const, signalen: [] as string[], fouten: [] });
  const huis = { vandaag: "2026-11-20", drempelDagen: 3, teams: [team("seo"), team("inkoop")], agenda: null, doelen: null, besluiten: [], jsonMailbox: [] } as unknown as import("../../shared/types.ts").HuisStand;

  test("zet signalen bij Inkoop en kleurt de stemming, andere teams blijven gelijk", async () => {
    const { metPakhuis } = await import("../routes.ts");
    const bron = { stand: async () => ({ stand: leesStand(ruw, "https://nas"), bereikbaar: true }) };
    const uit = await metPakhuis(huis, bron);
    const inkoop = uit.teams.find((t) => t.id === "inkoop")!;
    expect(inkoop.signalen).toHaveLength(2);
    expect(inkoop.stemming).toBe("achterstand");
    expect(uit.teams.find((t) => t.id === "seo")!.signalen).toEqual([]);
    expect(uit.pakhuis?.backorder.stuks).toBe(8);
  });

  test("zonder bron geen stand en geen signalen", async () => {
    const { metPakhuis } = await import("../routes.ts");
    const uit = await metPakhuis(huis, undefined);
    expect(uit.pakhuis).toBeNull();
    expect(uit.teams.find((t) => t.id === "inkoop")!.signalen).toEqual([]);
  });
});
