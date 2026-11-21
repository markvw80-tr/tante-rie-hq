import { describe, expect, test } from "vitest";
import type { RunDetail, RunSamenvatting } from "../../shared/types.ts";
import {
  AFDELINGEN,
  Dagverslag,
  eigenWerk,
  geheugenVerslagen,
  hqBerichtenPerAfdeling,
  knipVerslagen,
  leesbareDatum,
  nederland,
  noodverslag,
  runsVanDag,
  verslagOpdracht,
  type Feiten,
  type Mailer,
} from "../dagverslag.ts";
import { bouwMail, mailInstelling } from "../dagverslagBronnen.ts";
import { RegieFout, type StartVerzoek } from "../regie/beheer.ts";

// 21 november 2026: wintertijd, Nederland = UTC+1.
const om = (uurNl: number, minuut = 0) => new Date(Date.UTC(2026, 10, 21, uurNl - 1, minuut));
const leeg = (team: Feiten["team"], naam: string): Feiten => ({ team, naam, runs: [], werk: [], berichten: [] });
const ALLE_LEEG = AFDELINGEN.map((a) => leeg(a.id, a.naam));
const goedAntwoord = AFDELINGEN.map((a) => `### ${a.id}\nVandaag deed ${a.naam} iets.`).join("\n\n");

function opzet(o: { uur: number; mailer?: Mailer | null; startFout?: Error }) {
  let nu = om(o.uur);
  const runs = new Map<string, RunDetail>();
  const starts: StartVerzoek[] = [];
  const opslag = geheugenVerslagen();
  const verslag = new Dagverslag({
    regie: {
      start(v) {
        if (o.startFout) throw o.startFout;
        starts.push(v);
        const id = `run${starts.length}`;
        runs.set(id, { id, status: "bezig", resultaat: null } as unknown as RunDetail);
        return { id };
      },
      detail: (id) => runs.get(id) ?? null,
    },
    repo: "/hq",
    feiten: async () => ALLE_LEEG,
    mailer: o.mailer ?? null,
    opslag,
    klok: () => nu,
  });
  const klaar = (id: string, resultaat: string | null, status = "klaar") => runs.set(id, { id, status, resultaat } as unknown as RunDetail);
  return { verslag, starts, opslag, klaar, zetTijd: (d: Date) => void (nu = d) };
}

describe("nederland", () => {
  test("rekent naar Nederlandse tijd, ook in de zomer", () => {
    expect(nederland(new Date("2026-11-21T19:00:00Z"))).toEqual({ datum: "2026-11-21", uur: 20 });
    expect(nederland(new Date("2026-07-01T18:30:00Z"))).toEqual({ datum: "2026-07-01", uur: 20 });
    expect(nederland(new Date("2026-11-21T23:30:00Z")).datum).toBe("2026-11-22");
  });
  test("leesbare datum", () => {
    expect(leesbareDatum("2026-11-21")).toBe("zaterdag 21 november");
  });
});

describe("feiten", () => {
  test("berichten tellen bij afzender en ontvanger, standen bij de afdeling", () => {
    const m = hqBerichtenPerAfdeling([
      "mailbox: seo -> design: Re: V134 eenheidsprijs",
      "status: PIM, 20-11-2026 (V134 uitgevoerd)",
      "mailbox: verwerkt 2026-11-20-x.md",
      "status: Directie, 20-11-2026 (meterkast)",
    ]);
    expect(m.get("seo")).toEqual(["Bericht verstuurd aan design: Re: V134 eenheidsprijs"]);
    expect(m.get("design")).toEqual(["Bericht ontvangen van seo: Re: V134 eenheidsprijs"]);
    expect(m.get("pim")).toEqual(["Stand bijgewerkt: V134 uitgevoerd"]);
    expect(m.get("directie")).toEqual(["Stand bijgewerkt: meterkast"]);
    expect(m.get("inkoop")).toEqual([]);
  });
  test("eigen werk zonder post en dubbelen", () => {
    expect(eigenWerk(["feat: x", "mailbox: a -> b: c", "feat: x", "status: SEO, 1-1-2026"])).toEqual(["feat: x"]);
  });
  test("runs van de dag, per afdeling, zonder de verslaggever, met afsluiting", () => {
    const r = (o: Partial<RunSamenvatting>) => ({ id: "a", team: "seo", agent: "seo-lead", opdracht: "Doe X", status: "klaar", gestart: "2026-11-21T09:00:00Z", ...o }) as RunSamenvatting;
    const lijst = [r({}), r({ id: "b", gestart: "2026-11-20T22:30:00Z" }), r({ id: "c", team: "pim" }), r({ id: "d", team: "seo", agent: "verslaggever" }), r({ id: "e", gestart: "2026-11-21T23:30:00Z" })];
    const feiten = runsVanDag(lijst, (id) => ({ resultaat: id === "a" ? "Klaar met X." : null }) as RunDetail, "seo", "2026-11-21");
    // b: 23.30 uur Nederlandse tijd op de 20e telt niet; e is na middernacht (22e).
    expect(feiten).toEqual([{ opdracht: "Doe X", status: "klaar", resultaat: "Klaar met X." }]);
  });
});

describe("opdracht en knippen", () => {
  test("opdracht bakent de feiten af en noemt elke afdeling", () => {
    const o = verslagOpdracht("2026-11-21", [{ ...leeg("seo", "SEO"), werk: ["feat: alt-teksten"] }]);
    expect(o).toContain("zaterdag 21 november");
    expect(o).toContain("<feiten>");
    expect(o).toContain('<afdeling id="seo" naam="SEO">');
    expect(o).toContain("- feat: alt-teksten");
  });
  test("knipt per afdeling, negeert onbekend en leeg", () => {
    const m = knipVerslagen("inleiding\n### seo\nSEO deed A.\n\n### onzin\nX\n### pim\n\n### design\nDesign deed B.");
    expect([...m.entries()]).toEqual([["seo", "SEO deed A."], ["design", "Design deed B."]]);
  });
  test("noodverslag zonder werk en met werk", () => {
    expect(noodverslag(leeg("pim", "PIM"))).toMatch(/geen werk/);
    const t = noodverslag({ ...leeg("pim", "PIM"), runs: [{ opdracht: "Vul eenheidsprijzen\nmeer", status: "klaar", resultaat: null }], werk: ["a", "b"] });
    expect(t).toContain("1 opdracht:");
    expect(t).toContain("- Vul eenheidsprijzen");
    expect(t).toContain("2 keer werk");
  });
});

describe("Dagverslag", () => {
  test("voor 20.00 uur gebeurt niets", async () => {
    const o = opzet({ uur: 19 });
    await o.verslag.tik();
    expect(o.starts).toHaveLength(0);
  });

  test("om 20.00 uur één run, daarna vijf verslagen die apart gemaild worden", async () => {
    const mails: string[] = [];
    const o = opzet({ uur: 20, mailer: { stuur: async (onderwerp) => void mails.push(onderwerp) } });
    await o.verslag.tik();
    await o.verslag.tik();
    expect(o.starts).toHaveLength(1);
    expect(o.starts[0]).toMatchObject({ team: "directie", agent: "verslaggever", repo: "/hq", bron: "huis" });
    expect(o.verslag.stand().bezig).toBe(true);

    o.klaar("run1", goedAntwoord);
    await o.verslag.tik();
    const s = o.verslag.stand();
    expect(s.bezig).toBe(false);
    expect(s.verslagen.map((v) => [v.team, v.door, v.soort, v.gemaild])).toEqual(AFDELINGEN.map((a) => [a.id, "verslaggever", "avond", true]));
    expect(mails).toEqual(AFDELINGEN.map((a) => `Dagverslag ${a.naam}, zaterdag 21 november`));

    // Later op de avond niet nog een keer.
    o.zetTijd(om(21));
    await o.verslag.tik();
    expect(o.starts).toHaveLength(1);
    expect(mails).toHaveLength(5);
  });

  test("ontbrekende afdeling krijgt een noodverslag; mislukte run alleen noodverslagen", async () => {
    const o = opzet({ uur: 20 });
    await o.verslag.tik();
    o.klaar("run1", "### seo\nSEO deed A.");
    await o.verslag.tik();
    const s = o.verslag.stand();
    expect(s.verslagen.find((v) => v.team === "seo")?.door).toBe("verslaggever");
    expect(s.verslagen.filter((v) => v.door === "nood")).toHaveLength(4);

    const p = opzet({ uur: 20 });
    await p.verslag.tik();
    p.klaar("run1", null, "fout");
    await p.verslag.tik();
    expect(p.verslag.stand().verslagen.every((v) => v.door === "nood")).toBe(true);
    expect(p.verslag.stand().melding).toMatch(/kaal verslag/);
  });

  test("te veel agents: wacht en probeert de volgende minuut opnieuw; na 23.00 uur een noodverslag", async () => {
    const o = opzet({ uur: 20, startFout: new RegieFout("Er draaien al 3 agents.") });
    await o.verslag.tik();
    expect(o.verslag.stand().melding).toMatch(/wacht/);
    expect(o.verslag.stand().verslagen).toHaveLength(0);
    o.zetTijd(om(23, 5));
    await o.verslag.tik();
    expect(o.verslag.stand().verslagen.map((v) => v.door)).toEqual(Array(5).fill("nood"));
  });

  test("tussendoor telt niet als avondverslag", async () => {
    const o = opzet({ uur: 14 });
    await o.verslag.maakNu();
    o.klaar("run1", goedAntwoord);
    await o.verslag.tik();
    expect(o.verslag.stand().verslagen[0].soort).toBe("tussendoor");
    o.zetTijd(om(20));
    await o.verslag.tik();
    expect(o.starts).toHaveLength(2);
    o.klaar("run2", goedAntwoord);
    await o.verslag.tik();
    expect(o.verslag.stand().verslagen.every((v) => v.soort === "avond")).toBe(true);
  });

  test("tussendoor terwijl de verslaggever schrijft geeft een fout", async () => {
    const o = opzet({ uur: 20 });
    await o.verslag.tik();
    await expect(o.verslag.maakNu()).rejects.toThrow(/al aan het schrijven/);
  });

  test("mislukte mail: hooguit drie pogingen, verslag blijft staan", async () => {
    let pogingen = 0;
    const o = opzet({ uur: 20, mailer: { stuur: async () => void (pogingen++, (() => { throw new Error("weg"); })()) } });
    await o.verslag.tik();
    o.klaar("run1", goedAntwoord);
    for (let i = 0; i < 5; i++) await o.verslag.tik();
    expect(pogingen).toBe(15);
    expect(o.verslag.stand().verslagen.every((v) => !v.gemaild)).toBe(true);
    expect(o.verslag.stand().melding).toMatch(/Mailen/);
  });
});

describe("mail", () => {
  test("instelling uit env, met Gmail als standaard en aan = gebruiker", () => {
    expect(mailInstelling({})).toBeNull();
    expect(mailInstelling({ HUIS_MAIL_GEBRUIKER: "a@b.nl", HUIS_MAIL_WACHTWOORD: "abcd efgh" })).toEqual({ server: "smtps://smtp.gmail.com:465", gebruiker: "a@b.nl", wachtwoord: "abcdefgh", aan: "a@b.nl" });
    expect(mailInstelling({ HUIS_MAIL_GEBRUIKER: "geen-adres", HUIS_MAIL_WACHTWOORD: "x" })).toBeNull();
    expect(mailInstelling({ HUIS_MAIL_GEBRUIKER: "a@b.nl", HUIS_MAIL_WACHTWOORD: "x", HUIS_MAIL_SERVER: "file:///etc" })).toBeNull();
  });
  test("bouwt een UTF-8-mail met gecodeerd onderwerp en zonder kopregels uit de tekst", () => {
    const m = bouwMail("a@b.nl", "c@d.nl", "Dagverslag PIM, zaterdag 21 november — klaar\r\nBcc: x@y.nl", "Regel één\nRegel twee", new Date("2026-11-21T19:00:00Z"));
    const [kop, romp] = m.split("\r\n\r\n");
    expect(kop).toContain("To: <c@d.nl>");
    expect(kop).toMatch(/^Subject: =\?UTF-8\?B\?/m);
    expect(kop).not.toMatch(/^Bcc:/m);
    expect(kop).toContain("Content-Type: text/plain; charset=utf-8");
    expect(romp).toBe("Regel één\r\nRegel twee\r\n");
  });
});
