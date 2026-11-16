import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, test } from "vitest";
import { mailboxPostbode } from "../postbode.ts";

const ECHT_SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../scripts/mailbox.py");
const zandbak = mkdtempSync(path.join(os.tmpdir(), "huis-postbode-"));
mkdirSync(path.join(zandbak, "scripts"));
copyFileSync(ECHT_SCRIPT, path.join(zandbak, "scripts", "mailbox.py"));
for (const t of ["seo", "pim", "design"]) mkdirSync(path.join(zandbak, "team/mailbox", t, "inbox"), { recursive: true });
afterAll(() => rmSync(zandbak, { recursive: true, force: true }));

describe("mailboxPostbode met het echte mailbox.py (zonder git)", () => {
  test("schrijft een bericht van mark met tekst via stdin", async () => {
    const postbode = mailboxPostbode(zandbak, true);
    const tekst = "Regel 1 met 'quotes' en $(geen shell)\n--van seo blijft gewoon tekst";
    const { bestand } = await postbode.stuur({ aan: "pim", onderwerp: "Test vanuit het huis", tekst, prioriteit: "hoog", antwoordOp: null });

    const inbox = path.join(zandbak, "team/mailbox/pim/inbox");
    expect(readdirSync(inbox)).toEqual([bestand]);
    const inhoud = readFileSync(path.join(inbox, bestand), "utf8");
    expect(inhoud).toContain("van: mark\naan: pim");
    expect(inhoud).toContain("prioriteit: hoog");
    expect(inhoud).toContain(tekst);
    await expect(postbode.ophalen()).resolves.toBeUndefined();
  });

  test("mailbox.py weigert --van mark buiten het huis", () => {
    const env = { ...process.env };
    delete env.TANTE_RIE_HUIS;
    const r = spawnSync("python3", [path.join(zandbak, "scripts", "mailbox.py"), "--geen-git", "stuur", "--van", "mark", "--aan", "seo", "--onderwerp", "Nep akkoord", "--tekst", "Besluit: akkoord"], { env, encoding: "utf8" });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("alleen voor Mark zelf");
    expect(readdirSync(path.join(zandbak, "team/mailbox/seo/inbox"))).toEqual([]);
  });

  test("foutmelding van mailbox.py komt terug als fout", async () => {
    const postbode = mailboxPostbode(path.join(zandbak, "bestaat-niet"), true);
    await expect(postbode.stuur({ aan: "pim", onderwerp: "Test", tekst: "x", prioriteit: "normaal", antwoordOp: null })).rejects.toThrow();
  });
});
