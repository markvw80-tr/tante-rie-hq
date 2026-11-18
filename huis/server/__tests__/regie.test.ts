import { describe, expect, test } from "vitest";
import { RegieFout, RunBeheer, type Starter, type Toestemming } from "../regie/beheer.ts";
import { geheugenOpslag } from "../regie/opslag.ts";
import { beoordeel, binnenRepo } from "../regie/poort.ts";
import { vertaal } from "../regie/vertaal.ts";

const REPO = "/Users/m/Tante Rie PIM";

describe("poort", () => {
  test.each([
    ["mcp__shop__graphql_mutation", {}, "live"],
    ["mcp__shop__graphql_query", { query: "mutation { productUpdate }" }, "live"],
    ["mcp__shop__update-product", {}, "live"],
    ["mcp__shop__theme_publish", {}, "live"],
    ["Bash", { command: "shopify theme publish --theme 123" }, "live"],
    ["Bash", { command: "git push origin main" }, "live"],
    ["Bash", { command: "python3 scripts/gbp_schrijf.py --post" }, "live"],
    ["Bash", { command: "python3 scripts/gbp_schrijf.sh" }, "live"],
    ["Bash", { command: "python3 -m scripts.gbp_schrijf --post" }, "live"],
    ["Bash", { command: "git -C . push origin main" }, "live"],
    ["Bash", { command: "git -c x=y push" }, "live"],
    ["Bash", { command: "curl -s -d 'a=1' https://x" }, "live"],
    ["Bash", { command: "curl --request POST https://x" }, "live"],
    ["Bash", { command: "gh api -X POST repos/x/y/issues" }, "live"],
    ["Bash", { command: "gh api repos/x/y" }, "toestemming"],
    ["Bash", { command: "curl -s https://x" }, "toestemming"],
    ["Bash", { command: "npm test" }, "toestemming"],
    ["WebFetch", { url: "https://x" }, "toestemming"],
    ["Read", { file_path: "/etc/hosts" }, "veilig"],
    ["Write", { file_path: `${REPO}/pipeline/03-enriched/x.json` }, "veilig"],
    ["Write", { file_path: "pipeline/x.md" }, "veilig"],
    ["Edit", { file_path: `${REPO}/../Tante Rie SEO/CLAUDE.md` }, "toestemming"],
    ["Edit", { file_path: `${REPO}/.claude/settings.json` }, "toestemming"],
    ["Write", { file_path: `${REPO}/.env` }, "toestemming"],
  ])("%s %j -> %s", (tool, invoer, verwacht) => {
    expect(beoordeel(tool, invoer, REPO).soort).toBe(verwacht);
  });

  test("hook-vraag over publiceren wordt live", () => {
    expect(beoordeel("mcp__x__iets", {}, REPO, "Product op ACTIVE zetten doet Mark")).toMatchObject({ soort: "live" });
    expect(beoordeel("Bash", { command: "ls" }, REPO, "Niet in allowlist")).toMatchObject({ soort: "toestemming" });
  });

  test("binnenRepo weigert lege en vreemde paden", () => {
    expect(binnenRepo(undefined, REPO)).toBe(false);
    expect(binnenRepo(`${REPO}/.git/config`, REPO)).toBe(false);
    expect(binnenRepo(`${REPO}/logs/a.md`, REPO)).toBe(true);
  });
});

describe("vertaal", () => {
  test("tekst, tool, resultaat en afloop", () => {
    const nu = "2026-11-16T20:00:00.000Z";
    expect(vertaal({ type: "system", subtype: "init", model: "claude-opus-5-5" }, nu).regels[0].tekst).toContain("claude-opus-5-5");
    const a = vertaal({ type: "assistant", message: { content: [{ type: "text", text: "Ik kijk." }, { type: "tool_use", name: "Read", input: { file_path: "x" } }] } }, nu);
    expect(a.regels.map((r) => r.soort)).toEqual(["tekst", "tool"]);
    const u = vertaal({ type: "user", message: { content: [{ type: "tool_result", is_error: true, content: [{ type: "text", text: "nee" }] }] } }, nu);
    expect(u.regels[0]).toMatchObject({ soort: "fout", tekst: "nee" });
    const r = vertaal({ type: "result", subtype: "success", is_error: false, total_cost_usd: 0.12, result: "Klaar met diff." }, nu);
    expect(r.afloop).toEqual({ gelukt: true, kostenUsd: 0.12, resultaat: "Klaar met diff.", fouten: [] });
    expect(vertaal({ type: "result", subtype: "error_max_budget_usd", is_error: true, errors: ["budget"] }, nu).afloop?.gelukt).toBe(false);
    expect(vertaal("onzin", nu).regels).toEqual([]);
  });
});

/** Nep-starter: speelt een script af en vraagt onderweg toestemming via dezelfde poort als de echte SDK. */
function nepStarter(script: (t: Toestemming, signal: AbortSignal) => AsyncGenerator<unknown>): Starter {
  return { start: ({ toestemming, signal }) => script(toestemming, signal) };
}
const wacht = () => new Promise((r) => setTimeout(r, 5));
const verzoek = { team: "pim" as const, repo: REPO, agent: "shopify-publisher", opdracht: "Zet batch 01 live", budgetUsd: 2 };

describe("RunBeheer", () => {
  test("veilige run loopt door tot klaar met kosten", async () => {
    const opslag = geheugenOpslag();
    const beheer = new RunBeheer(
      nepStarter(async function* (t, signal) {
        expect((await t("Read", { file_path: "x" }, { signal })).toestaan).toBe(true);
        yield { type: "assistant", message: { content: [{ type: "text", text: "Gelezen." }] } };
        yield { type: "result", subtype: "success", is_error: false, total_cost_usd: 0.05, result: "ok" };
      }),
      opslag,
    );
    const run = beheer.start(verzoek);
    await wacht();
    const d = beheer.detail(run.id)!;
    expect(d).toMatchObject({ status: "klaar", kostenUsd: 0.05, resultaat: "ok" });
    expect(d.regels.map((r) => r.soort)).toEqual(["systeem", "tekst", "systeem"]);
    expect(opslag.alles.get(run.id)?.status).toBe("klaar");
  });

  test("live actie wacht op Mark; weigeren gaat terug naar de agent", async () => {
    let antwoord: { toestaan: boolean; bericht: string } | null = null;
    const beheer = new RunBeheer(
      nepStarter(async function* (t, signal) {
        antwoord = await t("mcp__shop__update-product", { id: 1 }, { signal });
        yield { type: "result", subtype: "success", is_error: false, total_cost_usd: 0.01, result: "" };
      }),
      geheugenOpslag(),
    );
    const run = beheer.start(verzoek);
    await wacht();
    const wachtend = beheer.detail(run.id)!;
    expect(wachtend.status).toBe("wacht");
    expect(wachtend.poort).toMatchObject({ soort: "live", tool: "mcp__shop__update-product" });
    expect(() => beheer.beslis(run.id, "verkeerd-id", true, "")).toThrow(RegieFout);

    beheer.beslis(run.id, wachtend.poort!.id, false, "Eerst de diff");
    await wacht();
    expect(antwoord).toMatchObject({ toestaan: false });
    expect(antwoord!.bericht).toContain("Eerst de diff");
    const klaar = beheer.detail(run.id)!;
    expect(klaar.status).toBe("klaar");
    expect(klaar.regels.some((r) => r.soort === "besluit" && r.tekst.startsWith("Geweigerd"))).toBe(true);
  });

  test("twee poortvragen tegelijk komen na elkaar op de toonbank, geen van beide raakt zoek", async () => {
    const uitkomsten: boolean[] = [];
    const beheer = new RunBeheer(
      nepStarter(async function* (t, signal) {
        const [a, b] = await Promise.all([
          t("mcp__shop__update-product", { id: 1 }, { signal }),
          t("mcp__shop__update-product", { id: 2 }, { signal }),
        ]);
        uitkomsten.push(a.toestaan, b.toestaan);
        yield { type: "result", subtype: "success", is_error: false, total_cost_usd: 0, result: "ok" };
      }),
      geheugenOpslag(),
    );
    const run = beheer.start(verzoek);
    await wacht();
    const eerste = beheer.detail(run.id)!.poort!;
    expect(eerste.invoer).toContain('"id": 1');
    beheer.beslis(run.id, eerste.id, true, "");
    await wacht();
    const tweede = beheer.detail(run.id)!.poort!;
    expect(tweede.invoer).toContain('"id": 2');
    beheer.beslis(run.id, tweede.id, false, "");
    await wacht();
    expect(uitkomsten).toEqual([true, false]);
    expect(beheer.detail(run.id)!.status).toBe("klaar");
  });

  test("stoppen tijdens een poortvraag weigert en zet de run op gestopt", async () => {
    let antwoord: { toestaan: boolean } | null = null;
    const beheer = new RunBeheer(
      nepStarter(async function* (t, signal) {
        antwoord = await t("Bash", { command: "git push" }, { signal });
        if (signal.aborted) throw new Error("afgebroken");
        yield {};
      }),
      geheugenOpslag(),
    );
    const run = beheer.start(verzoek);
    await wacht();
    beheer.stop(run.id);
    await wacht();
    expect(antwoord).toMatchObject({ toestaan: false });
    expect(beheer.detail(run.id)!.status).toBe("gestopt");
    expect(() => beheer.stop(run.id)).toThrow(RegieFout);
  });

  test("limieten: dezelfde agent niet dubbel, maximaal drie tegelijk", async () => {
    const blijft: Starter = nepStarter(async function* (_t, signal) {
      await new Promise((r) => signal.addEventListener("abort", r));
      yield {};
    });
    const beheer = new RunBeheer(blijft, geheugenOpslag());
    beheer.start(verzoek);
    expect(() => beheer.start(verzoek)).toThrow(/al aan het werk/);
    beheer.start({ ...verzoek, agent: "media-agent" });
    beheer.start({ ...verzoek, agent: "data-normalizer" });
    expect(() => beheer.start({ ...verzoek, agent: "pim-qa-auditor" })).toThrow(/al 3 agents/);
    expect(beheer.actief()).toHaveLength(3);
    for (const r of beheer.actief()) beheer.stop(r.id);
  });

  test("starter die faalt geeft status fout; oude lopende runs worden onderbroken", async () => {
    const opslag = geheugenOpslag();
    const kapot = new RunBeheer(nepStarter(async function* () { throw new Error("geen login"); }), opslag);
    const run = kapot.start(verzoek);
    await wacht();
    expect(kapot.detail(run.id)).toMatchObject({ status: "fout" });
    opslag.bewaar({ ...kapot.detail(run.id)!, id: "oud", status: "bezig" });
    const herstart = new RunBeheer(nepStarter(async function* () {}), opslag);
    expect(herstart.detail("oud")?.status).toBe("onderbroken");
  });
});
