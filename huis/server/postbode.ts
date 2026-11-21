import { spawn } from "node:child_process";
import path from "node:path";
import type { MailboxTeam } from "../shared/types.ts";

/** Afzenders die het huis zelf mag gebruiken: Mark en Nikkie (via de knoppen) en Inkoop (automatische meldingen uit het Pakhuis). */
export type HuisAfzender = "mark" | "nikkie" | "inkoop";

export interface Verzending {
  /** Standaard mark. */
  readonly van?: HuisAfzender;
  readonly aan: MailboxTeam;
  readonly onderwerp: string;
  readonly tekst: string;
  readonly prioriteit: "hoog" | "normaal" | "laag";
  readonly antwoordOp: string | null;
  /** Agent in het ontvangende team; null of afwezig: het hele team. */
  readonly voor?: string | null;
}

/** Bezorgt berichten van Mark. De echte postbode gebruikt scripts/mailbox.py, het bestaande transport via git. */
export interface Postbode {
  stuur(v: Verzending): Promise<{ readonly bestand: string }>;
  ophalen(): Promise<void>;
}

const TIJDSLIMIET_MS = 90_000;

interface Uitkomst {
  readonly code: number | null;
  readonly uit: string;
  readonly fout: string;
}

function draai(args: readonly string[], invoer: string | null, cwd: string): Promise<Uitkomst> {
  return new Promise((resolve, reject) => {
    // Geen shell: argumenten gaan als lijst naar python, de tekst via stdin.
    // TANTE_RIE_HUIS=1: mailbox.py accepteert --van mark en --van nikkie alleen met deze vlag, zodat agents niet namens hen versturen.
    const proces = spawn("python3", args, { cwd, timeout: TIJDSLIMIET_MS, env: { ...process.env, TANTE_RIE_HUIS: "1" } });
    let uit = "";
    let fout = "";
    proces.stdout.on("data", (d: Buffer) => (uit += d.toString()));
    proces.stderr.on("data", (d: Buffer) => (fout += d.toString()));
    proces.on("error", reject);
    proces.on("close", (code) => resolve({ code, uit, fout }));
    proces.stdin.end(invoer ?? "");
  });
}

export function mailboxPostbode(hq: string, geenGit: boolean): Postbode {
  const script = path.join(hq, "scripts", "mailbox.py");
  const basis = geenGit ? [script, "--geen-git"] : [script];
  let rij: Promise<unknown> = Promise.resolve();

  /** mailbox.py werkt met één git-werkkopie: verzoeken gaan daarom één voor één. */
  const opDeBeurt = <T>(taak: () => Promise<T>): Promise<T> => {
    const volgende = rij.then(taak, taak);
    rij = volgende.catch(() => undefined);
    return volgende;
  };

  return {
    stuur: (v) =>
      opDeBeurt(async () => {
        const args = [...basis, "stuur", "--van", v.van ?? "mark", "--aan", v.aan, "--onderwerp", v.onderwerp, "--tekst", "-", "--prioriteit", v.prioriteit];
        if (v.antwoordOp) args.push("--antwoord-op", v.antwoordOp);
        if (v.voor) args.push("--voor", v.voor);
        const r = await draai(args, v.tekst, hq);
        const m = /Verstuurd: (\S+\.md)/.exec(r.uit);
        if (r.code !== 0 || !m) {
          console.error("[huis] mailbox.py stuur mislukt:", r.code, r.fout || r.uit);
          throw new Error(r.fout.trim().split("\n").at(-1) || "mailbox.py gaf geen bevestiging");
        }
        return { bestand: path.basename(m[1]) };
      }),
    ophalen: () =>
      opDeBeurt(async () => {
        if (geenGit) return;
        // `lijst` haalt eerst origin/main op in .git/mailbox-main en leest daarna alleen.
        const r = await draai([script, "lijst", "seo"], null, hq);
        if (r.code !== 0) {
          console.error("[huis] mailbox.py lijst mislukt:", r.fout);
          throw new Error("Post ophalen mislukt (git fetch).");
        }
      }),
  };
}
