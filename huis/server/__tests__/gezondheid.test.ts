import { describe, expect, test } from "vitest";
import type { Meting, RunSamenvatting } from "../../shared/types.ts";
import {
  geheugenBeheer,
  meetGereedschap,
  meetInbox,
  meetLogin,
  meetPakhuis,
  meetRepos,
  meetRuns,
  meetSchijf,
  Systeembeheer,
  type GezondheidDeps,
} from "../gezondheid.ts";
import type { StartVerzoek } from "../regie/beheer.ts";

const NU = new Date("2026-11-20T22:00:00.000Z");
const urenTerug = (u: number) => new Date(NU.getTime() - u * 3_600_000).toISOString();
const run = (o: Partial<RunSamenvatting>): RunSamenvatting => ({
  id: "r", team: "pim", agent: "pim-orchestrator", opdracht: "", status: "klaar", gestart: urenTerug(2), geeindigd: urenTerug(1.9),
  kostenUsd: 0.4, budgetUsd: 5, poort: null, laatsteRegel: "Klaar.", ...o,
});

describe("meetLogin", () => {
  test("uitgelogd is rood", () => {
    expect(meetLogin({ ingelogd: false, verlooptOp: null }, NU).kleur).toBe("rood");
  });
  test("verloopt binnen drie dagen is oranje", () => {
    expect(meetLogin({ ingelogd: true, verlooptOp: "2026-11-22T10:00:00Z" }, NU).kleur).toBe("oranje");
  });
  test("ruim geldig is groen", () => {
    expect(meetLogin({ ingelogd: true, verlooptOp: "2026-12-17T23:21:44Z" }, NU).kleur).toBe("groen");
  });
  test("niet te lezen is oranje", () => {
    expect(meetLogin(null, NU).kleur).toBe("oranje");
  });
});

describe("meetRuns", () => {
  test("laatste run van een team mislukt in de laatste 24 uur is rood, met de fout", () => {
    const m = meetRuns([run({ status: "fout", laatsteRegel: "Fout: OAuth session expired", gestart: urenTerug(1) }), run({ gestart: urenTerug(5) })], NU);
    expect(m.kleur).toBe("rood");
    expect(m.details[0]).toContain("OAuth session expired");
  });
  test("een latere geslaagde run maakt het weer groen", () => {
    expect(meetRuns([run({ gestart: urenTerug(1) }), run({ status: "fout", gestart: urenTerug(3) })], NU).kleur).toBe("groen");
  });
  test("budget op is oranje", () => {
    expect(meetRuns([run({ status: "fout", budgetOp: true, gestart: urenTerug(1) })], NU).kleur).toBe("oranje");
  });
  test("oude fouten tellen niet", () => {
    expect(meetRuns([run({ status: "fout", gestart: urenTerug(30), geeindigd: urenTerug(30) })], NU).kleur).toBe("groen");
  });
});

describe("meetGereedschap", () => {
  const sessie = ["Read", "mcp__claude_ai_Shopify__graphql_query", "mcp__claude_ai_Shopify__graphql_mutation"];
  test("tool van een aanwezige koppeling die ontbreekt is oranje", () => {
    const m = meetGereedschap(
      [{ team: "pim", agent: "shopify-publisher", tools: ["Read", "mcp__claude_ai_Shopify__graphql_mutation", "mcp__claude_ai_Shopify__validate_graphql_codeblocks"] }],
      () => sessie,
    );
    expect(m.kleur).toBe("oranje");
    expect(m.details).toEqual(["PIM, shopify-publisher: validate_graphql_codeblocks (claude_ai_Shopify) bestaat niet"]);
  });
  test("tools van een koppeling die er helemaal niet is, tellen niet (oude naam van dezelfde koppeling)", () => {
    expect(meetGereedschap([{ team: "pim", agent: "p", tools: ["mcp__d064a5fe__graphql_query"] }], () => sessie).kleur).toBe("groen");
  });
  test("zonder bekende sessie geen oordeel", () => {
    expect(meetGereedschap([{ team: "seo", agent: "s", tools: ["mcp__x__y"] }], () => null).kleur).toBe("groen");
  });
  test("vergelijkt per agent: de run van een andere agent van hetzelfde team telt niet", () => {
    const runs: Record<string, readonly string[]> = { controller: ["Read", "mcp__claude_ai_Shopify__run-analytics-query"] };
    const m = meetGereedschap(
      [
        { team: "financien", agent: "controller", tools: ["mcp__claude_ai_Shopify__run-analytics-query"] },
        { team: "financien", agent: "prijsanalist", tools: ["mcp__claude_ai_Shopify__run-analytics-query", "mcp__claude_ai_Shopify__graphql_query"] },
      ],
      (_team, agent) => runs[agent] ?? null,
    );
    expect(m.kleur).toBe("groen");
  });
  test("meldt een tool die in de eigen run van die agent ontbreekt", () => {
    const runs: Record<string, readonly string[]> = { prijsanalist: ["mcp__claude_ai_Shopify__run-analytics-query"] };
    const m = meetGereedschap(
      [{ team: "financien", agent: "prijsanalist", tools: ["mcp__claude_ai_Shopify__run-analytics-query", "mcp__claude_ai_Shopify__graphql_query"] }],
      (_team, agent) => runs[agent] ?? null,
    );
    expect(m.details).toEqual(["Financiën, prijsanalist: graphql_query (claude_ai_Shopify) bestaat niet"]);
  });
});

describe("meetRepos", () => {
  test("niet-gepushte commits en oude wijzigingen zijn oranje", () => {
    const m = meetRepos([
      { naam: "tante-rie-pim", voor: 1, oudeWijzigingen: [".claude/agents/pim-qa-auditor.md"] },
      { naam: "tante-rie-seo", voor: 0, oudeWijzigingen: [] },
    ]);
    expect(m.kleur).toBe("oranje");
    expect(m.details).toEqual(["tante-rie-pim: 1 commit niet gepusht", "tante-rie-pim: wijziging staat al meer dan 24 uur open in .claude/agents/pim-qa-auditor.md"]);
  });
  test("alles schoon is groen", () => {
    expect(meetRepos([{ naam: "a", voor: 0, oudeWijzigingen: [] }]).kleur).toBe("groen");
  });
});

describe("meetInbox", () => {
  test("bericht dat er al lag toen het team een geslaagde run deed, en ouder is dan 24 uur, is oranje", () => {
    const m = meetInbox(
      [{ team: "seo", bestand: "2026-11-19-204850-directie-x.md", binnen: new Date(urenTerug(26)) }],
      [run({ team: "seo", gestart: urenTerug(25) })],
      NU,
    );
    expect(m.kleur).toBe("oranje");
    expect(m.details[0]).toContain("SEO: 2026-11-19-204850-directie-x.md");
  });
  test("vers bericht of nog geen run sindsdien is groen", () => {
    expect(meetInbox([{ team: "seo", bestand: "b.md", binnen: new Date(urenTerug(2)) }], [run({ team: "seo", gestart: urenTerug(1) })], NU).kleur).toBe("groen");
    expect(meetInbox([{ team: "seo", bestand: "b.md", binnen: new Date(urenTerug(30)) }], [run({ team: "seo", gestart: urenTerug(40) })], NU).kleur).toBe("groen");
  });
});

describe("meetPakhuis en meetSchijf", () => {
  test("pakhuis", () => {
    expect(meetPakhuis(true).kleur).toBe("groen");
    expect(meetPakhuis(false).kleur).toBe("rood");
    expect(meetPakhuis(undefined).kleur).toBe("groen");
  });
  test("schijf", () => {
    expect(meetSchijf(50).kleur).toBe("groen");
    expect(meetSchijf(3).kleur).toBe("oranje");
    expect(meetSchijf(0.5).kleur).toBe("rood");
  });
});

function opzet(over: Partial<GezondheidDeps> = {}, actief: RunSamenvatting[] = []) {
  const starts: StartVerzoek[] = [];
  let klok = NU;
  const deps: GezondheidDeps = {
    login: async () => ({ ingelogd: true, verlooptOp: "2026-12-17T00:00:00Z" }),
    runs: () => [],
    gereedschap: () => null,
    agentTools: async () => [],
    repos: async () => [],
    inbox: async () => [],
    schijfVrijGb: async () => 100,
    ...over,
  };
  const opslag = geheugenBeheer();
  const beheer = new Systeembeheer(deps, {
    regie: {
      start(v) {
        starts.push(v);
        return run({ id: `b${starts.length}`, team: "directie", agent: "systeembeheerder", status: "bezig" });
      },
      actief: () => actief,
    },
    repo: "/hq",
    opslag,
    klok: () => klok,
  });
  return { beheer, starts, zetKlok: (d: Date) => void (klok = d) };
}

const vuil = { repos: async () => [{ naam: "tante-rie-pim", voor: 1, oudeWijzigingen: [] }] };
const kleuren = (m: readonly Meting[]) => Object.fromEntries(m.map((x) => [x.id, x.kleur]));

describe("Systeembeheer", () => {
  test("alles groen: geen start", async () => {
    const { beheer, starts } = opzet();
    const stand = await beheer.controleer();
    expect(starts).toHaveLength(0);
    expect(Object.values(kleuren(stand.metingen)).every((k) => k === "groen")).toBe(true);
  });

  test("nieuw probleem start de systeembeheerder één keer, met het probleem in de opdracht", async () => {
    const { beheer, starts, zetKlok } = opzet(vuil);
    await beheer.controleer();
    expect(starts).toHaveLength(1);
    expect(starts[0]).toMatchObject({ team: "directie", repo: "/hq", agent: "systeembeheerder", bron: "huis", budgetUsd: 1 });
    expect(starts[0]!.opdracht).toContain("tante-rie-pim: 1 commit niet gepusht");
    zetKlok(new Date(NU.getTime() + 2 * 3_600_000));
    await beheer.controleer();
    expect(starts).toHaveLength(1);
  });

  test("verlopen login: geen start, want de beheerder kan dan zelf ook niet draaien", async () => {
    const { beheer, starts } = opzet({ ...vuil, login: async () => ({ ingelogd: false, verlooptOp: null }) });
    const stand = await beheer.controleer();
    expect(starts).toHaveLength(0);
    expect(stand.melding).toContain("login");
  });

  test("draait de beheerder al, dan wacht hij", async () => {
    const { beheer, starts } = opzet(vuil, [run({ team: "directie", agent: "systeembeheerder", status: "bezig" })]);
    await beheer.controleer();
    expect(starts).toHaveLength(0);
  });

  test("hooguit een start per uur en vier per dag", async () => {
    let n = 0;
    const { beheer, starts, zetKlok } = opzet({ repos: async () => [{ naam: `r${n++}`, voor: 1, oudeWijzigingen: [] }] });
    await beheer.controleer();
    zetKlok(new Date(NU.getTime() + 30 * 60_000));
    await beheer.controleer();
    expect(starts).toHaveLength(1);
    for (let u = 1; u <= 6; u++) {
      zetKlok(new Date(NU.getTime() + u * 61 * 60_000));
      await beheer.controleer();
    }
    expect(starts).toHaveLength(4);
  });

  test("een controle die zelf faalt, wordt oranje in plaats van dat alles stopt", async () => {
    const { beheer } = opzet({ repos: async () => { throw new Error("git weg"); } });
    const stand = await beheer.controleer();
    expect(kleuren(stand.metingen).repos).toBe("oranje");
  });
});

describe("bronnen", () => {
  test("parseGitStatus leest vooruit en gewijzigde bestanden, zonder ongevolgde", async () => {
    const { parseGitStatus } = await import("../gezondheidBronnen.ts");
    expect(parseGitStatus("## main...origin/main [ahead 2, behind 1]\n M .claude/a.md\nR  oud.md -> nieuw.md\n?? pipeline/x/\n")).toEqual({ voor: 2, gewijzigd: [".claude/a.md", "nieuw.md"] });
    expect(parseGitStatus("## main...origin/main\n")).toEqual({ voor: 0, gewijzigd: [] });
  });
  test("tijdUitNaam leest de lokale tijd uit een berichtnaam", async () => {
    const { tijdUitNaam } = await import("../gezondheidBronnen.ts");
    expect(tijdUitNaam("2026-11-20-204850-directie-x.md")).toEqual(new Date(2026, 10, 20, 20, 48, 50));
    expect(tijdUitNaam("los.md")).toBeNull();
  });
});

describe("metGezondheid", () => {
  test("rood komt als signaal bij de directie, oranje niet", async () => {
    const { metGezondheid } = await import("../routes.ts");
    const directie = { id: "directie", signalen: [], statusLeeftijdDagen: 0, stemming: "rustig" } as never;
    const huis = { teams: [directie] } as never;
    const m = (id: string, kleur: Meting["kleur"]): Meting => ({ id, naam: id, kleur, tekst: "", details: [] });
    const uit = metGezondheid(huis, { bijgewerkt: NU.toISOString(), metingen: [m("runs", "rood"), m("repos", "oranje")], melding: null });
    expect(uit.teams[0]!.signalen).toEqual(["Meterkast: runs staat op rood"]);
    expect(metGezondheid(huis, null).gezondheid).toBeNull();
  });
});
