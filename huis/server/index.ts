import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { magLezen, magSchrijven, MAX_BODY } from "./beveiliging.ts";
import { TailscaleWacht } from "./tailscale.ts";
import { schijfBron } from "./bron.ts";
import { API_PORT, GEEN_GIT, HOST, HQ, mailboxMap, TEAMS, WEB_PORT } from "./config.ts";
import { vandaagIso } from "./parsers/datum.ts";
import { mailboxPostbode } from "./postbode.ts";
import { schijfArchief } from "./archief.ts";
import { Ophaler } from "./ophaler.ts";
import { Automaat, POST_LEADS, schijfAutomaat } from "./automaat.ts";
import { parseBericht } from "./parsers/mailbox.ts";
import { parseAgent } from "./parsers/agents.ts";
import { behandel, behandelPost, type Omgeving } from "./routes.ts";
import { RunBeheer } from "./regie/beheer.ts";
import { schijfGoedkeuring } from "./regie/goedkeuring.ts";
import { schijfOpslag } from "./regie/opslag.ts";
import { runId } from "./regie/routes.ts";
import { sdkStarter } from "./regie/sdkStarter.ts";
import type { MailboxTeam, RunRegel, RunSamenvatting } from "../shared/types.ts";

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};
const postbode = mailboxPostbode(HQ, GEEN_GIT);
const regie = new RunBeheer(
  sdkStarter,
  schijfOpslag(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "runs")),
  undefined,
  schijfGoedkeuring(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "goedkeuring.json")),
);
const HARTSLAG_MS = 20_000;
const OPHAAL_MS = 5 * 60_000;
const archief = schijfArchief(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "archief.json"));
const PORTEN = [API_PORT, WEB_PORT] as const;
const tailscale = new TailscaleWacht(PORTEN);
const ophaler = new Ophaler(postbode, GEEN_GIT ? null : OPHAAL_MS);
const automaat = new Automaat({
  regie,
  opslag: schijfAutomaat(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "automaat.json")),
  async inbox(team: MailboxTeam) {
    const map = path.join(mailboxMap(HQ), team, "inbox");
    const namen = await schijfBron.bestanden(map, ".md");
    return Promise.all(namen.map(async (n) => parseBericht(n, (await schijfBron.lees(path.join(map, n))) ?? "", "inbox", vandaagIso())));
  },
  async lead(team: MailboxTeam) {
    const cfg = TEAMS.find((t) => t.id === team);
    if (!cfg) return null;
    const bestand = path.join(cfg.repo, ".claude/agents", `${POST_LEADS[team]}.md`);
    const tekst = await schijfBron.lees(bestand);
    return tekst === null ? null : { repo: cfg.repo, agent: parseAgent(tekst, `${POST_LEADS[team]}.md`).naam };
  },
});
ophaler.naOphalen(() => automaat.controleer());

const omgeving = (): Omgeving => ({ bron: schijfBron, hq: HQ, mailbox: mailboxMap(HQ), teams: TEAMS, vandaag: vandaagIso(), postbode, regie, archief, ophaler, automaat, opAfstand: tailscale.opAfstand() });

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

async function leesBody(req: IncomingMessage): Promise<unknown> {
  let tekst = "";
  for await (const stuk of req) {
    tekst += stuk;
    if (tekst.length > MAX_BODY) throw new Error("te groot");
  }
  return JSON.parse(tekst);
}

async function statisch(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://huis");
  const gevraagd = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
  const pad = path.join(DIST, gevraagd || "index.html");
  if (pad !== DIST && !pad.startsWith(DIST + path.sep)) return json(res, 400, { fout: "Ongeldig pad" });
  try {
    const data = await readFile(pad);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(pad)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    const index = await readFile(path.join(DIST, "index.html")).catch(() => null);
    if (!index) return json(res, 404, { fout: "Niet gevonden. Draai eerst npm run build, of gebruik npm run dev." });
    res.writeHead(200, { "Content-Type": TYPES[".html"] });
    res.end(index);
  }
}

async function schrijf(req: IncomingMessage, res: ServerResponse, pad: string): Promise<void> {
  const geweigerd = magSchrijven(req.headers, PORTEN, tailscale.huidig());
  if (geweigerd) return json(res, 403, { fout: geweigerd });
  let body: unknown;
  try {
    body = await leesBody(req);
  } catch {
    return json(res, 400, { fout: "Ongeldige JSON" });
  }
  try {
    const antwoord = await behandelPost(pad, body, omgeving());
    return json(res, antwoord.status, antwoord.body);
  } catch (e) {
    console.error(`[huis] ${pad} mislukt:`, e);
    return json(res, 502, { fout: `Versturen mislukt: ${(e as Error).message}` });
  }
}

/** Live log van één run als server-sent events: eerst alles wat er is, daarna elke nieuwe regel en status. */
function stroom(req: IncomingMessage, res: ServerResponse, pad: string): void {
  let id: string | null;
  try {
    id = runId(pad, "/stream");
  } catch {
    return json(res, 400, { fout: "Ongeldig run-id" });
  }
  const run = id ? regie.detail(id) : null;
  if (!id || !run) return json(res, 404, { fout: "Run niet gevonden" });
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" });
  const stuur = (soort: string, data: unknown) => res.write(`event: ${soort}\ndata: ${JSON.stringify(data)}\n\n`);
  stuur("begin", run);
  const opRegel = (r: RunRegel) => stuur("regel", r);
  const opStatus = (s: RunSamenvatting) => stuur("status", s);
  regie.on(`regel:${id}`, opRegel);
  regie.on(`status:${id}`, opStatus);
  const hartslag = setInterval(() => res.write(": hartslag\n\n"), HARTSLAG_MS);
  req.on("close", () => {
    clearInterval(hartslag);
    regie.off(`regel:${id}`, opRegel);
    regie.off(`status:${id}`, opStatus);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://huis");
  if (req.method === "POST" && url.pathname.startsWith("/api/")) return schrijf(req, res, url.pathname);
  if (req.method !== "GET") return json(res, 405, { fout: "Niet toegestaan" });
  const nietLezen = magLezen(req.headers, PORTEN, tailscale.huidig());
  if (nietLezen) return json(res, 403, { fout: nietLezen });
  if (url.pathname.endsWith("/stream") && url.pathname.startsWith("/api/runs/")) return stroom(req, res, url.pathname);
  if (url.pathname.startsWith("/api/")) {
    try {
      const antwoord = await behandel(url.pathname, url.searchParams, omgeving());
      return json(res, antwoord.status, antwoord.body);
    } catch (e) {
      console.error(`[huis] ${url.pathname} mislukt:`, e);
      return json(res, 500, { fout: "Er ging iets mis bij het lezen. Zie de serverlog." });
    }
  }
  return statisch(req, res);
});

server.on("error", (e: NodeJS.ErrnoException) => {
  if (e.code === "EADDRINUSE") {
    console.error(
      `[huis] Poort ${API_PORT} is al bezet: het huis draait waarschijnlijk al in een ander venster.\n` +
        `[huis] Open http://${HOST}:${WEB_PORT} of stop het andere exemplaar (Ctrl+C) en start opnieuw.`,
    );
    process.exit(1);
  }
  throw e;
});

server.listen(API_PORT, HOST, () => {
  ophaler.start();
  tailscale.start();
  console.log(`[huis] luistert op http://${HOST}:${API_PORT} (alleen deze Mac)`);
  console.log(`[huis] hq: ${HQ}, post uit ${mailboxMap(HQ)}${GEEN_GIT ? ", zandbak zonder git" : ""}`);
});
