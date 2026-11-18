import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { Toestemming } from "../regie/beheer.ts";
import { gitVuilIn, moetLangsPoort, poortHook } from "../regie/poortHook.ts";

const REPO = "/Users/m/Tante Rie SEO";
const vuil = (paden: string[] = []) => () => paden;

describe("moetLangsPoort", () => {
  test("toegestane live-scripts gaan toch langs Mark", () => {
    expect(moetLangsPoort("Bash", { command: "python3 scripts/gbp_schrijf.py --post 17-11" }, REPO, vuil())).toMatchObject({ soort: "live" });
    expect(moetLangsPoort("Bash", { command: "python3 scripts/merchant_schrijf.py" }, REPO, vuil())).toMatchObject({ soort: "live" });
  });

  test("Shopify-mutaties gaan langs Mark, ook als het team ze toestaat", () => {
    expect(moetLangsPoort("mcp__shop__graphql_mutation", {}, REPO, vuil())).toMatchObject({ soort: "live" });
  });

  test("zolang er een nieuw of gewijzigd script in de repo staat, vraagt elk shellcommando toestemming", () => {
    for (const command of ["python3 scripts/oud.py", "python3 -m scripts.oud", "python3 scripts/*.py", "cd scripts && python3 oud.py", "ls"]) {
      const oordeel = moetLangsPoort("Bash", { command }, REPO, vuil(["scripts/nieuw.py"]));
      expect(oordeel, command).toMatchObject({ soort: "toestemming" });
    }
    expect(moetLangsPoort("Bash", { command: "ls" }, REPO, vuil(["scripts/a.py", "scripts/b", "c.sh", "d.py"]))).toMatchObject({
      reden: expect.stringContaining("scripts/a.py, scripts/b, c.sh en 1 meer"),
    });
  });

  test("een script buiten de repo vraagt toestemming", () => {
    expect(moetLangsPoort("Bash", { command: "python3 /tmp/x.py" }, REPO, vuil())).toMatchObject({ soort: "toestemming" });
    expect(moetLangsPoort("Bash", { command: 'bash "../Tante Rie PIM/x.sh"' }, REPO, vuil())).toMatchObject({ soort: "toestemming" });
  });

  test("met een schone repo laten gewone acties de poort met rust", () => {
    expect(moetLangsPoort("Bash", { command: "python3 scripts/mailbox.py lijst seo" }, REPO, vuil())).toBeNull();
    expect(moetLangsPoort("Bash", { command: "ls marketing" }, REPO, vuil())).toBeNull();
    expect(moetLangsPoort("Read", { file_path: "CLAUDE.md" }, REPO, vuil(["scripts/nieuw.py"]))).toBeNull();
    expect(moetLangsPoort("Write", { file_path: `${REPO}/scripts/nieuw.py` }, REPO, vuil())).toBeNull();
  });
});

describe("poortHook", () => {
  const signal = new AbortController().signal;
  const invoer = (tool_name: string, tool_input: unknown) =>
    ({ hook_event_name: "PreToolUse", tool_name, tool_input, tool_use_id: "t1", session_id: "s", transcript_path: "/tmp/t", cwd: REPO }) as never;

  test("live actie: Mark staat toe, hook geeft allow", async () => {
    const vragen: string[] = [];
    const toestemming: Toestemming = async (tool, _i, o) => {
      vragen.push(`${tool}:${o.hookReden}`);
      return { toestaan: true, bericht: "" };
    };
    const uit = await poortHook(REPO, toestemming, vuil())(invoer("Bash", { command: "python3 scripts/gbp_schrijf.py" }), "t1", { signal });
    expect(uit).toMatchObject({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "allow" } });
    expect(vragen).toHaveLength(1);
  });

  test("live actie: Mark weigert, hook geeft deny met zijn bericht", async () => {
    const toestemming: Toestemming = async () => ({ toestaan: false, bericht: "Geweigerd door Mark." });
    const uit = await poortHook(REPO, toestemming, vuil())(invoer("mcp__shop__update-product", {}), "t1", { signal });
    expect(uit).toMatchObject({ hookSpecificOutput: { permissionDecision: "deny", permissionDecisionReason: "Geweigerd door Mark." } });
  });

  test("als er iets misgaat, weigert de hook (fail-closed)", async () => {
    const toestemming: Toestemming = async () => {
      throw new Error("toonbank kapot");
    };
    const uit = await poortHook(REPO, toestemming, vuil())(invoer("mcp__shop__update-product", {}), "t1", { signal });
    expect(uit).toMatchObject({ hookSpecificOutput: { permissionDecision: "deny" } });
    const gitKapot = () => {
      throw new Error("git ontbreekt");
    };
    const uit2 = await poortHook(REPO, async () => ({ toestaan: true, bericht: "" }), gitKapot)(invoer("Bash", { command: "ls" }), "t1", { signal });
    expect(uit2).toMatchObject({ hookSpecificOutput: { permissionDecision: "deny" } });
  });

  test("gewone actie: hook bemoeit zich er niet mee en vraagt niets", async () => {
    let gevraagd = false;
    const toestemming: Toestemming = async () => {
      gevraagd = true;
      return { toestaan: true, bericht: "" };
    };
    expect(await poortHook(REPO, toestemming, vuil())(invoer("Read", { file_path: "x" }), "t1", { signal })).toEqual({});
    expect(gevraagd).toBe(false);
  });

  test("andere hook-events worden genegeerd", async () => {
    const toestemming: Toestemming = async () => ({ toestaan: false, bericht: "" });
    expect(await poortHook(REPO, toestemming, vuil())({ hook_event_name: "Stop" } as never, undefined, { signal })).toEqual({});
  });
});

describe("gitVuilIn", () => {
  let repo = "";
  const git = (...a: string[]) => execFileSync("git", ["-C", repo, ...a], { stdio: "ignore" });
  beforeAll(() => {
    repo = mkdtempSync(path.join(tmpdir(), "poort-"));
    git("init", "-q");
    git("config", "user.email", "t@t");
    git("config", "user.name", "t");
    mkdirSync(path.join(repo, "scripts"));
    mkdirSync(path.join(repo, "data"));
    for (const f of ["scripts/oud.py", "scripts/aangepast.py", "scripts/verstopt.py", "data/a.json"]) writeFileSync(path.join(repo, f), "1\n");
    git("add", ".");
    git("commit", "-qm", "init");
  });
  afterAll(() => rmSync(repo, { recursive: true, force: true }));

  test("schone repo is niet vuil", () => {
    expect(gitVuilIn(repo)()).toEqual([]);
  });

  test("nieuwe, gewijzigde en verstopte scripts tellen; data niet", () => {
    writeFileSync(path.join(repo, "scripts/aangepast.py"), "2\n");
    writeFileSync(path.join(repo, "scripts/nieuw"), "3\n");
    writeFileSync(path.join(repo, "los.sh"), "4\n");
    writeFileSync(path.join(repo, "data/a.json"), "5\n");
    writeFileSync(path.join(repo, "data/b.json"), "6\n");
    git("update-index", "--assume-unchanged", "scripts/verstopt.py");
    writeFileSync(path.join(repo, "scripts/verstopt.py"), "7\n");
    expect([...gitVuilIn(repo)()].sort()).toEqual(["los.sh", "scripts/aangepast.py", "scripts/nieuw", "scripts/verstopt.py"]);
  });

  test("geen git-repo telt als vuil", () => {
    const leeg = mkdtempSync(path.join(tmpdir(), "geen-git-"));
    expect(() => gitVuilIn(leeg)()).toThrow();
    rmSync(leeg, { recursive: true, force: true });
  });
});
