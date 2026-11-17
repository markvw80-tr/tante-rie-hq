import { execFile } from "node:child_process";
import { existsSync } from "node:fs";

/** Het adres van deze Mac in het eigen Tailscale-netwerk en het account dat erop is ingelogd (Mark). */
export interface TailscaleInfo {
  readonly host: string;
  readonly login: string;
}

const KANDIDATEN = ["/Applications/Tailscale.app/Contents/MacOS/Tailscale", "/opt/homebrew/bin/tailscale", "/usr/local/bin/tailscale"];
const TIMEOUT_MS = 5_000;
const NAAM = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.ts\.net$/;

/** Haalt host en login uit `tailscale status --json`. Alleen een draaiende, ingelogde Tailscale telt. */
export function leesStatus(json: unknown): TailscaleInfo | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (o.BackendState !== "Running") return null;
  const self = o.Self as Record<string, unknown> | undefined;
  const host = typeof self?.DNSName === "string" ? self.DNSName.replace(/\.$/, "").toLowerCase() : "";
  const users = (o.User ?? {}) as Record<string, { LoginName?: unknown } | undefined>;
  const login = users[String(self?.UserID)]?.LoginName;
  if (!NAAM.test(host) || typeof login !== "string" || !login) return null;
  return { host, login: login.toLowerCase() };
}

/**
 * Het adres waarop `tailscale serve` het huis aanbiedt, uit `tailscale serve status --json`.
 * Alleen als serve op dit eigen adres naar een huispoort op deze Mac doorstuurt.
 */
export function leesServe(json: unknown, host: string, poorten: readonly number[]): string | null {
  if (!json || typeof json !== "object") return null;
  const web = (json as { Web?: Record<string, { Handlers?: Record<string, { Proxy?: unknown }> }> }).Web ?? {};
  const doelen = new Set(poorten.flatMap((p) => [`http://127.0.0.1:${p}`, `http://localhost:${p}`, `127.0.0.1:${p}`, `localhost:${p}`, String(p)]));
  for (const [sleutel, cfg] of Object.entries(web)) {
    const [naam, poort] = sleutel.toLowerCase().split(":");
    if (naam !== host) continue;
    const proxy = cfg?.Handlers?.["/"]?.Proxy;
    if (typeof proxy === "string" && doelen.has(proxy.replace(/\/$/, ""))) return poort === "443" ? `https://${host}` : `https://${host}:${poort}`;
  }
  return null;
}

/** Uit omgevingsvariabelen, voor als de detectie niet werkt: HUIS_TAILSCALE_HOST en HUIS_TAILSCALE_LOGIN samen. */
export function uitOmgeving(env: NodeJS.ProcessEnv): TailscaleInfo | null {
  const host = env.HUIS_TAILSCALE_HOST?.trim().toLowerCase();
  const login = env.HUIS_TAILSCALE_LOGIN?.trim().toLowerCase();
  return host && login && NAAM.test(host) ? { host, login } : null;
}

type Lezer = (args: readonly string[]) => Promise<unknown>;

function cliLezer(): Lezer {
  const cli = KANDIDATEN.find((p) => existsSync(p)) ?? "tailscale";
  return (args) =>
    new Promise((resolve, reject) => {
      execFile(cli, [...args], { timeout: TIMEOUT_MS }, (fout, stdout) => {
        if (fout) return reject(fout);
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(e);
        }
      });
    });
}

/**
 * Houdt bij of deze Mac in Tailscale zit. Kijkt elke minuut opnieuw, zodat een later geïnstalleerde
 * of uitgezette Tailscale zonder herstart van het huis wordt opgemerkt.
 */
export class TailscaleWacht {
  private info: TailscaleInfo | null;
  private adres: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly poorten: readonly number[],
    private readonly vast: TailscaleInfo | null = uitOmgeving(process.env),
    private readonly lees: Lezer = cliLezer(),
  ) {
    this.info = vast;
  }

  huidig(): TailscaleInfo | null {
    return this.info;
  }

  /** Het https-adres waarop het huis via Tailscale te openen is, of null als serve niet is ingesteld. */
  opAfstand(): string | null {
    return this.info ? this.adres : null;
  }

  async ververs(): Promise<void> {
    try {
      if (!this.vast) this.info = leesStatus(await this.lees(["status", "--json"]));
    } catch {
      this.info = null; // geen Tailscale (of niet ingelogd): alleen deze Mac zelf
    }
    try {
      this.adres = this.info ? leesServe(await this.lees(["serve", "status", "--json"]), this.info.host, this.poorten) : null;
    } catch {
      this.adres = null;
    }
  }

  start(intervalMs = 60_000): void {
    if (this.timer) return;
    void this.ververs();
    this.timer = setInterval(() => void this.ververs(), intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
