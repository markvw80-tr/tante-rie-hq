// Echte bronnen voor het dagverslag: vastgelegd werk uit git, runs uit de regie, en mail via SMTP (curl).
import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { TeamConfig } from "./config.ts";
import type { RunDetail, RunSamenvatting } from "../shared/types.ts";
import { AFDELINGEN, eigenWerk, hqBerichtenPerAfdeling, runsVanDag, type Feiten, type Mailer } from "./dagverslag.ts";

const exec = promisify(execFile);
const GIT_TIMEOUT_MS = 15_000;
const MAIL_TIMEOUT_S = 60;

/** Omschrijvingen van alle commits van één dag (lokale tijd van deze Mac), op alle takken. */
export async function commitsVanDag(repo: string, datum: string): Promise<string[]> {
  try {
    const { stdout } = await exec("git", ["-C", repo, "log", "--all", `--since=${datum} 00:00:00`, `--until=${datum} 23:59:59`, "--pretty=%s"], { timeout: GIT_TIMEOUT_MS });
    return stdout.split("\n").map((r) => r.trim()).filter(Boolean);
  } catch (e) {
    console.error(`[huis] dagverslag: git log in ${repo} mislukt:`, (e as Error).message);
    return [];
  }
}

export async function verzamelFeiten(
  datum: string,
  teams: readonly TeamConfig[],
  hq: string,
  runs: () => readonly RunSamenvatting[],
  detail: (id: string) => RunDetail | null,
): Promise<Feiten[]> {
  const hqCommits = await commitsVanDag(hq, datum);
  const berichten = hqBerichtenPerAfdeling(hqCommits);
  const lijst = runs();
  return Promise.all(
    AFDELINGEN.map(async (a) => {
      const repo = teams.find((t) => t.id === a.id)?.repo;
      const werk = repo === hq ? eigenWerk(hqCommits) : repo ? eigenWerk(await commitsVanDag(repo, datum)) : [];
      return { team: a.id, naam: a.naam, runs: runsVanDag(lijst, detail, a.id, datum), werk, berichten: berichten.get(a.id) ?? [] };
    }),
  );
}

export interface MailInstelling {
  readonly server: string;
  readonly gebruiker: string;
  readonly wachtwoord: string;
  readonly aan: string;
}

const ADRES = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

/** Uit huis/.env: HUIS_MAIL_GEBRUIKER, HUIS_MAIL_WACHTWOORD (app-wachtwoord), HUIS_MAIL_AAN en eventueel HUIS_MAIL_SERVER. */
export function mailInstelling(env: NodeJS.ProcessEnv): MailInstelling | null {
  const gebruiker = env.HUIS_MAIL_GEBRUIKER?.trim() ?? "";
  const wachtwoord = env.HUIS_MAIL_WACHTWOORD?.replace(/\s+/g, "") ?? "";
  const aan = env.HUIS_MAIL_AAN?.trim() || gebruiker;
  const server = env.HUIS_MAIL_SERVER?.trim() || "smtps://smtp.gmail.com:465";
  if (!ADRES.test(gebruiker) || !ADRES.test(aan) || !wachtwoord || !/^smtps?:\/\/[\w.-]+(:\d+)?$/.test(server)) return null;
  return { server, gebruiker, wachtwoord, aan };
}

const mimeWoord = (t: string) => (/^[\x20-\x7e]*$/.test(t) ? t : `=?UTF-8?B?${Buffer.from(t, "utf8").toString("base64")}?=`);

/** Een eenvoudige platte-tekstmail (UTF-8). Regels met CRLF; geen kopregels uit de tekst zelf. */
export function bouwMail(van: string, aan: string, onderwerp: string, tekst: string, nu: Date = new Date()): string {
  const schoon = (t: string) => t.replace(/[\r\n]+/g, " ");
  const kop = [
    `From: ${mimeWoord("Huis van Tante Rie")} <${van}>`,
    `To: <${aan}>`,
    `Subject: ${mimeWoord(schoon(onderwerp))}`,
    `Date: ${nu.toUTCString().replace("GMT", "+0000")}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
  ];
  // Punten aan het begin van een regel ontsnapt curl zelf (SMTP).
  const romp = tekst.replace(/\r\n?/g, "\n").split("\n");
  return [...kop, "", ...romp, ""].join("\r\n");
}

const curlTekst = (t: string) => `"${t.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/** Verstuurt via curl. Het wachtwoord gaat via stdin (niet zichtbaar in de proceslijst), de mail via een tijdelijk bestand. */
export function curlMailer(m: MailInstelling): Mailer {
  return {
    async stuur(onderwerp, tekst) {
      const map = await mkdtemp(path.join(os.tmpdir(), "huis-mail-"));
      const bestand = path.join(map, "bericht.eml");
      try {
        await writeFile(bestand, bouwMail(m.gebruiker, m.aan, onderwerp, tekst), { mode: 0o600 });
        const config = [`url = ${curlTekst(m.server)}`, `user = ${curlTekst(`${m.gebruiker}:${m.wachtwoord}`)}`, `mail-from = ${curlTekst(m.gebruiker)}`, `mail-rcpt = ${curlTekst(m.aan)}`, `upload-file = ${curlTekst(bestand)}`].join("\n");
        await new Promise<void>((klaar, faal) => {
          const p = spawn("curl", ["--silent", "--show-error", "--ssl-reqd", "--max-time", String(MAIL_TIMEOUT_S), "-K", "-"], { stdio: ["pipe", "ignore", "pipe"] });
          let fout = "";
          p.stderr.on("data", (d) => (fout += d));
          p.on("error", faal);
          p.on("close", (code) => (code === 0 ? klaar() : faal(new Error(`curl stopte met code ${code}: ${fout.trim().slice(0, 200)}`))));
          p.stdin.end(config);
        });
      } finally {
        await rm(map, { recursive: true, force: true });
      }
    },
  };
}
