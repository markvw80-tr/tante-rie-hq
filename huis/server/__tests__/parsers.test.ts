import { describe, expect, test } from "vitest";
import { parseFrontmatter } from "../parsers/frontmatter.ts";
import { parseAgent } from "../parsers/agents.ts";
import { parseStatus } from "../parsers/status.ts";
import { parseBericht, parseJsonMailbox } from "../parsers/mailbox.ts";
import { parseMarkdown, besluitenUitAgenda } from "../parsers/markdown.ts";
import { dagenTussen, datumUitNaam, nlNaarIso } from "../parsers/datum.ts";

const VANDAAG = "2026-11-16";

describe("datum", () => {
  test("haalt ISO-datum uit bestandsnaam", () => {
    expect(datumUitNaam("2026-11-15-125443-directie-opdracht.md")).toBe("2026-11-15");
    expect(datumUitNaam("geen-datum.md")).toBeNull();
  });
  test("rekent dagen tussen twee datums", () => {
    expect(dagenTussen("2026-10-28", VANDAAG)).toBe(19);
    expect(dagenTussen(null, VANDAAG)).toBeNull();
  });
  test("zet NL-datum om naar ISO en weigert onzin", () => {
    expect(nlNaarIso("07-11-2026")).toBe("2026-11-07");
    expect(nlNaarIso("31-02-2026")).toBeNull();
  });
});

describe("frontmatter", () => {
  test("leest velden en body", () => {
    const r = parseFrontmatter("---\nname: analist\nmodel: sonnet\n---\n\nTekst hier");
    expect(r.velden).toEqual({ name: "analist", model: "sonnet" });
    expect(r.body).toBe("Tekst hier");
  });
  test("zonder frontmatter blijft alles body", () => {
    expect(parseFrontmatter("Gewoon tekst").velden).toEqual({});
  });
  test("dubbele punt in waarde blijft heel", () => {
    expect(parseFrontmatter("---\nonderwerp: Re: iets: meer\n---\n").velden.onderwerp).toBe("Re: iets: meer");
  });
});

describe("agents", () => {
  test("leest naam, beschrijving, model en tools", () => {
    const a = parseAgent(
      "---\nname: design-lead\ndescription: Aanspreekpunt van Design.\ntools: Read, Write, Agent\nmodel: opus\n---\nbody",
      "design-lead.md",
    );
    expect(a).toEqual({ bestand: "design-lead", naam: "design-lead", beschrijving: "Aanspreekpunt van Design.", model: "opus", tools: ["Read", "Write", "Agent"] });
  });
  test("valt terug op bestandsnaam en lege tools", () => {
    const a = parseAgent("Geen kop", "analist.md");
    expect(a.naam).toBe("analist");
    expect(a.tools).toEqual([]);
    expect(a.model).toBeNull();
  });
});

describe("status", () => {
  const tekst = [
    "# Status teams Tante Rie",
    "",
    "Uitleg.",
    "",
    "## SEO, 15-11-2026 (directie-opdracht)",
    "- Gedaan: alt-audit.",
    "- Volgende stap: rapport.",
    "## PIM, 15-11-2026 (open punten)",
    "- Gedaan: Blond batch 01.",
    "",
    "## Design, 28-10-2026 (live)",
    "- Live gezet.",
    "  vervolgregel",
    "## Onbekend, 01-01-2026 (x)",
    "- negeren",
  ].join("\n");

  test("splitst blokken per team met datum en titel", () => {
    const blokken = parseStatus(tekst);
    expect(blokken.map((b) => [b.team, b.datum, b.titel])).toEqual([
      ["seo", "2026-11-15", "directie-opdracht"],
      ["pim", "2026-11-15", "open punten"],
      ["design", "2026-10-28", "live"],
    ]);
  });
  test("neemt regels mee en plakt vervolgregels aan", () => {
    const [seo, , design] = parseStatus(tekst);
    expect(seo.regels).toEqual(["Gedaan: alt-audit.", "Volgende stap: rapport."]);
    expect(design.regels).toEqual(["Live gezet. vervolgregel"]);
  });
  test("herkent statusblokken van Inkoop", () => {
    const [blok] = parseStatus("## Inkoop, 20-11-2026 (opzet)\n- Pakhuis ingericht.");
    expect([blok.team, blok.datum, blok.titel, blok.regels]).toEqual(["inkoop", "2026-11-20", "opzet", ["Pakhuis ingericht."]]);
  });
  test("herkent statusblokken van Financiën (met trema)", () => {
    const [blok] = parseStatus("## Financiën, 21-11-2026 (opzet)\n- Kluis ingericht.");
    expect([blok.team, blok.datum, blok.titel, blok.regels]).toEqual(["financien", "2026-11-21", "opzet", ["Kluis ingericht."]]);
  });
  test("herkent statusblokken van Klant", () => {
    const [blok] = parseStatus("## Klant, 21-11-2026 (reviews)\n- 33 reviews open.");
    expect([blok.team, blok.datum, blok.titel, blok.regels]).toEqual(["klant", "2026-11-21", "reviews", ["33 reviews open."]]);
  });
});

describe("mailbox", () => {
  const md = "---\nvan: design\naan: seo\ndatum: 2026-11-15 17:38\nonderwerp: Antwoord LCP\nprioriteit: hoog\nantwoord-op: x.md\n---\n\nTekst";

  test("leest kop van een bericht en rekent leeftijd uit bestandsnaam", () => {
    const b = parseBericht("2026-11-12-173810-design-antwoord.md", md, "inbox", VANDAAG);
    expect(b).toMatchObject({ van: "design", aan: "seo", onderwerp: "Antwoord LCP", prioriteit: "hoog", antwoordOp: "x.md", leeftijdDagen: 4, map: "inbox" });
  });
  test("onbekende prioriteit wordt normaal", () => {
    const b = parseBericht("2026-11-16-x.md", "---\nprioriteit: urgent\n---\n", "inbox", VANDAAG);
    expect(b.prioriteit).toBe("normaal");
    expect(b.onderwerp).toBe("2026-11-16-x.md");
  });
  test("json-mailbox telt open regels per niet-verwerkt bericht", () => {
    const json = JSON.stringify({
      berichten: [
        { bericht_id: "a", datum: "2026-11-10", status: "verwerkt", regels: [{ status: "nieuw" }] },
        { bericht_id: "b", datum: "2026-11-10", status: "in_behandeling", regels: [{ status: "nieuw" }, { status: "in_behandeling" }, { status: "uitgevoerd" }] },
      ],
    });
    const r = parseJsonMailbox("seo-naar-pim", json, VANDAAG);
    expect(r.leesbaar).toBe(true);
    expect(r.open).toEqual([{ berichtId: "b", status: "in_behandeling", regelsOpen: 2, regelsTotaal: 3, leeftijdDagen: 6 }]);
  });
  test("kapotte json geeft leesbaar false in plaats van crash", () => {
    expect(parseJsonMailbox("x", "{kapot", VANDAAG)).toEqual({ naam: "x", leesbaar: false, open: [] });
  });
});

describe("markdown en agenda", () => {
  const agenda = [
    "# Agenda 2026-11-16: wat wacht op wie",
    "",
    "Stand per 16-11.",
    "",
    "## Mark: besluiten nodig",
    "1. Themakopie publiceren, ja of nee (PIM).",
    "2. Antwoord op V128 en V129.",
    "",
    "## Design: achterstand",
    "Laatste statusblok 28-10.",
    "1. Knop afgesneden.",
    "- los punt",
  ].join("\n");

  test("leest titel, intro, secties, alinea's en items", () => {
    const d = parseMarkdown(agenda);
    expect(d.titel).toBe("Agenda 2026-11-16: wat wacht op wie");
    expect(d.intro).toEqual(["Stand per 16-11."]);
    expect(d.secties[1]).toEqual({ titel: "Design: achterstand", alineas: ["Laatste statusblok 28-10."], items: ["Knop afgesneden.", "los punt"] });
  });
  test("haalt besluiten van Mark eruit met team uit de staart", () => {
    expect(besluitenUitAgenda(parseMarkdown(agenda))).toEqual([
      { tekst: "Themakopie publiceren, ja of nee", team: "pim", agent: null },
      { tekst: "Antwoord op V128 en V129.", team: null, agent: null },
    ]);
  });
  test("zonder Mark-sectie geen besluiten", () => {
    expect(besluitenUitAgenda(parseMarkdown("# x\n## Iets\n1. a"))).toEqual([]);
  });
});
