import type { IncomingHttpHeaders } from "node:http";
import type { TailscaleInfo } from "./tailscale.ts";

export const HUIS_HEADER = "x-huis";
export const HUIS_WAARDE = "mark";
export const TAILSCALE_LOGIN_HEADER = "tailscale-user-login";
const MAX_BODY = 32_000;

interface Herkomst {
  readonly fout: string | null;
}

/**
 * Waar komt een verzoek vandaan? Van deze Mac zelf (127.0.0.1 of localhost op een huispoort) of via
 * `tailscale serve` vanaf een apparaat in Marks Tailscale-netwerk. Het huis luistert alleen op 127.0.0.1,
 * dus Tailscale serve is de enige weg van buiten. Serve zet de header Tailscale-User-Login en haalt een
 * meegestuurde versie weg; via Tailscale moet die header precies Marks account zijn.
 */
function herkomst(headers: IncomingHttpHeaders, poorten: readonly number[], ts: TailscaleInfo | null): Herkomst {
  const lokaal = new Set(poorten.flatMap((p) => [`127.0.0.1:${p}`, `localhost:${p}`]));
  const tsOrigin = ts ? `https://${ts.host}` : null;
  const host = headers.host?.toLowerCase();
  const origin = headers.origin?.toLowerCase();
  const login = headers[TAILSCALE_LOGIN_HEADER];

  const hostViaTs = !!ts && host === ts.host;
  if (!host || !(lokaal.has(host) || hostViaTs)) return { fout: "Onbekende host" };
  const originViaTs = !!tsOrigin && origin === tsOrigin;
  if (origin && !(lokaal.has(origin.replace(/^http:\/\//, "")) || originViaTs)) {
    return { fout: `Dit kan alleen vanuit het huis zelf (deze pagina komt van ${origin}).` };
  }

  const viaTailscale = hostViaTs || originViaTs || login !== undefined;
  if (!viaTailscale) return { fout: null };
  if (!ts) return { fout: "Tailscale is op deze Mac niet actief; het huis kan je niet herkennen." };
  if (typeof login !== "string" || login.toLowerCase() !== ts.login) return { fout: "Alleen het Tailscale-account van Mark heeft toegang tot het huis." };
  return { fout: null };
}

/** Lezen mag vanaf deze Mac en via Tailscale voor Marks eigen account. */
export function magLezen(headers: IncomingHttpHeaders, poorten: readonly number[], ts: TailscaleInfo | null = null): string | null {
  return herkomst(headers, poorten, ts).fout;
}

/**
 * Schrijven mag alleen vanuit het huis zelf. Een andere website in dezelfde browser kan geen eigen header
 * met JSON sturen zonder CORS-preflight (die we nooit goedkeuren), en de Host-check houdt DNS-rebinding tegen.
 */
export function magSchrijven(headers: IncomingHttpHeaders, poorten: readonly number[], ts: TailscaleInfo | null = null): string | null {
  const fout = herkomst(headers, poorten, ts).fout;
  if (fout) return fout;
  if (headers[HUIS_HEADER] !== HUIS_WAARDE) return "Verzoek komt niet uit het huis";
  if (!String(headers["content-type"] ?? "").startsWith("application/json")) return "Verwacht JSON";
  const lengte = Number(headers["content-length"] ?? 0);
  if (lengte > MAX_BODY) return "Bericht is te groot";
  return null;
}

export { MAX_BODY };
