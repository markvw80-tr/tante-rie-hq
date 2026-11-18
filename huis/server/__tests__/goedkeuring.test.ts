import { describe, expect, test } from "vitest";
import { RunBeheer, type Starter, type Toestemming } from "../regie/beheer.ts";
import { geheugenGoedkeuring, geldigeGoedkeuring } from "../regie/goedkeuring.ts";
import { geheugenOpslag } from "../regie/opslag.ts";
import { behandelPost, type Omgeving } from "../routes.ts";

const REPO = "/Users/m/Tante Rie PIM";
const wacht = () => new Promise((r) => setTimeout(r, 5));
const verzoek = { team: "pim" as const, repo: REPO, agent: "pim-orchestrator", opdracht: "Werk de inbox af", budgetUsd: 1 };
function nepStarter(script: (t: Toestemming, signal: AbortSignal) => AsyncGenerator<unknown>): Starter {
  return { start: ({ toestemming, signal }) => script(toestemming, signal) };
}

describe("automatisch goedkeuren", () => {
  test("staat de schakelaar aan, dan gaat een toestemmingsvraag direct door en komt in het logboek", async () => {
    const uitkomsten: boolean[] = [];
    const beheer = new RunBeheer(
      nepStarter(async function* (t, signal) {
        uitkomsten.push((await t("Bash", { command: "npm test" }, { signal })).toestaan);
        yield { type: "result", subtype: "success", is_error: false, total_cost_usd: 0, result: "ok" };
      }),
      geheugenOpslag(),
      undefined,
      geheugenGoedkeuring(true),
    );
    const run = beheer.start(verzoek);
    await wacht();
    expect(uitkomsten).toEqual([true]);
    const d = beheer.detail(run.id)!;
    expect(d.status).toBe("klaar");
    expect(d.regels.some((r) => r.soort === "besluit" && r.tekst.startsWith("Automatisch goedgekeurd"))).toBe(true);
  });

  test("live acties wachten altijd op Mark, ook met de schakelaar aan", async () => {
    const beheer = new RunBeheer(
      nepStarter(async function* (t, signal) {
        await t("mcp__shop__update-product", { id: 1 }, { signal });
        yield { type: "result", subtype: "success", is_error: false, total_cost_usd: 0, result: "ok" };
      }),
      geheugenOpslag(),
      undefined,
      geheugenGoedkeuring(true),
    );
    const run = beheer.start(verzoek);
    await wacht();
    expect(beheer.detail(run.id)).toMatchObject({ status: "wacht", poort: { soort: "live" } });
    beheer.stop(run.id);
  });

  test("aanzetten keurt een wachtende toestemmingsvraag goed, maar laat een live vraag staan", async () => {
    const uitkomsten: Record<string, boolean> = {};
    const maak = (tool: string, invoer: Record<string, unknown>) =>
      nepStarter(async function* (t, signal) {
        uitkomsten[tool] = (await t(tool, invoer, { signal })).toestaan;
        yield { type: "result", subtype: "success", is_error: false, total_cost_usd: 0, result: "ok" };
      });
    const schakelaar = geheugenGoedkeuring(false);
    const gewoon = new RunBeheer(maak("Bash", { command: "npm test" }), geheugenOpslag(), undefined, schakelaar);
    const r1 = gewoon.start(verzoek);
    await wacht();
    expect(gewoon.detail(r1.id)?.status).toBe("wacht");
    expect(gewoon.zetAutoGoedkeuring(true)).toBe(true);
    await wacht();
    expect(uitkomsten.Bash).toBe(true);
    expect(gewoon.detail(r1.id)?.status).toBe("klaar");
    expect(schakelaar.lees()).toBe(true);

    const live = new RunBeheer(maak("mcp__shop__graphql_mutation", {}), geheugenOpslag(), undefined, geheugenGoedkeuring(false));
    const r2 = live.start(verzoek);
    await wacht();
    live.zetAutoGoedkeuring(true);
    await wacht();
    expect(live.detail(r2.id)?.status).toBe("wacht");
    live.stop(r2.id);
  });

  test("uitzetten werkt weer zoals voorheen", async () => {
    const beheer = new RunBeheer(nepStarter(async function* () {}), geheugenOpslag(), undefined, geheugenGoedkeuring(true));
    expect(beheer.autoGoedkeuring()).toBe(true);
    expect(beheer.zetAutoGoedkeuring(false)).toBe(false);
    expect(beheer.autoGoedkeuring()).toBe(false);
  });

  test("opgeslagen instelling wordt verdraagzaam gelezen", () => {
    expect(geldigeGoedkeuring({ aan: true })).toBe(true);
    expect(geldigeGoedkeuring({ aan: "ja" })).toBe(false);
    expect(geldigeGoedkeuring(null)).toBe(false);
  });

  test("POST /api/regie/goedkeuring zet de schakelaar en weigert onzin", async () => {
    const beheer = new RunBeheer(nepStarter(async function* () {}), geheugenOpslag(), undefined, geheugenGoedkeuring(false));
    const omg = { regie: beheer } as unknown as Omgeving;
    expect((await behandelPost("/api/regie/goedkeuring", { aan: "ja" }, omg)).status).toBe(400);
    expect((await behandelPost("/api/regie/goedkeuring", [], omg)).status).toBe(400);
    const goed = await behandelPost("/api/regie/goedkeuring", { aan: true }, omg);
    expect(goed).toEqual({ status: 200, body: { aan: true } });
    expect(beheer.autoGoedkeuring()).toBe(true);
  });
});
