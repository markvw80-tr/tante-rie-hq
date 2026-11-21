import { describe, expect, test } from "vitest";
import { parseBericht } from "../parsers/mailbox.ts";
import { valideerOpdracht } from "../verzoek.ts";

describe("agent in een bericht", () => {
  test("voor en door uit de kop", () => {
    const md = "---\nvan: seo\naan: pim\nvoor: content-enricher\ndoor: zoekwoord-onderzoeker\nonderwerp: x\n---\n\nhoi";
    const b = parseBericht("2026-11-21-120000-seo-x.md", md, "inbox", "2026-11-21");
    expect([b.voor, b.door]).toEqual(["content-enricher", "zoekwoord-onderzoeker"]);
  });
  test("oude berichten zonder agent: null", () => {
    const b = parseBericht("2026-11-21-120000-seo-x.md", "---\nvan: seo\naan: pim\n---\n", "inbox", "2026-11-21");
    expect([b.voor, b.door]).toEqual([null, null]);
  });
  test("een rare agentnaam in de kop telt niet", () => {
    const b = parseBericht("2026-11-21-120000-seo-x.md", "---\nvoor: <script>\n---\n", "inbox", "2026-11-21");
    expect(b.voor).toBeNull();
  });
});

describe("Mark kiest een agent bij het versturen", () => {
  const basis = { aan: "pim", onderwerp: "Vraag", tekst: "Hoi" };
  test("zonder agent gaat het naar het team", () => {
    expect(valideerOpdracht(basis).voor).toBeNull();
  });
  test("met een nette agentnaam", () => {
    expect(valideerOpdracht({ ...basis, voor: "content-enricher" }).voor).toBe("content-enricher");
  });
  test("een agentnaam met rare tekens wordt geweigerd", () => {
    expect(() => valideerOpdracht({ ...basis, voor: "--van mark" })).toThrow();
    expect(() => valideerOpdracht({ ...basis, voor: "Content Enricher" })).toThrow();
  });
});

import { besluitenUitAgenda, parseMarkdown } from "../parsers/markdown.ts";

describe("agent bij een agendapunt", () => {
  const agenda = (regel: string) => besluitenUitAgenda(parseMarkdown(`# Agenda\n\n## Mark\n\n1. ${regel}\n`))[0];
  test("team met agent", () => {
    expect(agenda("Kostprijzen: token toevoegen (PIM, price-stock-agent)")).toEqual({ tekst: "Kostprijzen: token toevoegen", team: "pim", agent: "price-stock-agent" });
  });
  test("alleen team, zoals voorheen", () => {
    expect(agenda("Alt-teksten klaarzetten (SEO)")).toEqual({ tekst: "Alt-teksten klaarzetten", team: "seo", agent: null });
  });
  test("de nieuwe afdelingen worden ook herkend", () => {
    expect(agenda("Winst november (Financiën: controller)").team).toBe("financien");
    expect(agenda("Reviews (Klant)").team).toBe("klant");
    expect(agenda("Bestelvoorstel (Inkoop, inkoopadviseur)").agent).toBe("inkoopadviseur");
  });
  test("zonder staart: geen team en geen agent", () => {
    expect(agenda("Losse opmerking")).toEqual({ tekst: "Losse opmerking", team: null, agent: null });
  });
});
