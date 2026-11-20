import type { IncomingHttpHeaders } from "node:http";
import type { Persoon } from "../shared/types.ts";
import type { TailscaleInfo } from "./tailscale.ts";
import { GEEN_EXTRA, type Toegang } from "./toegang.ts";

export const HUIS_HEADER = "x-huis";
export const HUIS_WAARDE = "mark";
export const TAILSCALE_LOGIN_HEADER = "tailscale-user-login";
const MAX_BODY = 32_000;

interface Herkomst {
  readonly fout: string | null;
  readonly persoon: Persoon | null;
}

const NEE = (fout: string): Herkomst => ({ fout, persoon: null });

/**
 * Waar komt een verzoek vandaan, en van wie? Van deze Mac zelf (127.0.0.1 of localhost op een huispoort): dat is Mark.
 * Of via `tailscale serve` vanaf een apparaat in Marks Tailscale-netwerk (ook een met Nikkie gedeelde Mac).
 * Het huis luistert alleen op 127.0.0.1, dus Tailscale serve is de enige weg van buiten. Serve zet de header
 * Tailscale-User-Login en haalt een meegestuurde versie weg; via Tailscale moet die header Marks account zijn,
 * of het account van Nikkie uit huis/data/toegang.json.
 */
export function herkomst(headers: IncomingHttpHeaders, poorten: readonly number[], ts: TailscaleInfo | null, toegang: Toegang = GEEN_EXTRA): Herkomst {
  const lokaal = new Set(poorten.flatMap((p) => [`127.0.0.1:${p}`, `localhost:${p}`]));
  const tsOrigin = ts ? `https://${ts.host}` : null;
  const host = headers.host?.toLowerCase();
  const origin = headers.origin?.toLowerCase();
  const login = headers[TAILSCALE_LOGIN_HEADER];

  const hostViaTs = !!ts && host === ts.host;
  if (!host || !(lokaal.has(host) || hostViaTs)) return NEE("Onbekende host");
  const originViaTs = !!tsOrigin && origin === tsOrigin;
  if (origin && !(lokaal.has(origin.replace(/^http:\/\//, "")) || originViaTs)) {
    return NEE(`Dit kan alleen vanuit het huis zelf (deze pagina komt van ${origin}).`);
  }

  const viaTailscale = hostViaTs || originViaTs || login !== undefined;
  if (!viaTailscale) return { fout: null, persoon: "mark" };
  if (!ts) return NEE("Tailscale is op deze Mac niet actief; het huis kan je niet herkennen.");
  const wie = typeof login === "string" ? login.toLowerCase() : null;
  if (wie && wie === ts.login) return { fout: null, persoon: "mark" };
  if (wie && toegang.nikkie && wie === toegang.nikkie) return { fout: null, persoon: "nikkie" };
  return NEE("Dit Tailscale-account heeft geen toegang tot het huis.");
}

/** Lezen mag vanaf deze Mac en via Tailscale voor Mark en Nikkie. */
export function magLezen(headers: IncomingHttpHeaders, poorten: readonly number[], ts: TailscaleInfo | null = null, toegang: Toegang = GEEN_EXTRA): string | null {
  return herkomst(headers, poorten, ts, toegang).fout;
}

/**
 * Schrijven mag alleen vanuit het huis zelf. Een andere website in dezelfde browser kan geen eigen header
 * met JSON sturen zonder CORS-preflight (die we nooit goedkeuren), en de Host-check houdt DNS-rebinding tegen.
 */
export function magSchrijven(headers: IncomingHttpHeaders, poorten: readonly number[], ts: TailscaleInfo | null = null, toegang: Toegang = GEEN_EXTRA): string | null {
  return schrijver(headers, poorten, ts, toegang).fout;
}

/** Als magSchrijven, maar zegt ook wie er schrijft. */
export function schrijver(headers: IncomingHttpHeaders, poorten: readonly number[], ts: TailscaleInfo | null, toegang: Toegang = GEEN_EXTRA): Herkomst {
  const h = herkomst(headers, poorten, ts, toegang);
  if (h.fout) return h;
  if (headers[HUIS_HEADER] !== HUIS_WAARDE) return NEE("Verzoek komt niet uit het huis");
  if (!String(headers["content-type"] ?? "").startsWith("application/json")) return NEE("Verwacht JSON");
  const lengte = Number(headers["content-length"] ?? 0);
  if (lengte > MAX_BODY) return NEE("Bericht is te groot");
  return h;
}

export { MAX_BODY };
