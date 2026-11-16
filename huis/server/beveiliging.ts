import type { IncomingHttpHeaders } from "node:http";

export const HUIS_HEADER = "x-huis";
export const HUIS_WAARDE = "mark";
const MAX_BODY = 32_000;

/**
 * Schrijven mag alleen vanuit het huis zelf. Een andere website in dezelfde browser kan geen eigen header
 * met JSON sturen zonder CORS-preflight (die we nooit goedkeuren), en de Host-check houdt DNS-rebinding tegen.
 */
export function magSchrijven(headers: IncomingHttpHeaders, poorten: readonly number[]): string | null {
  const toegestaan = new Set(poorten.flatMap((p) => [`127.0.0.1:${p}`, `localhost:${p}`]));
  if (!headers.host || !toegestaan.has(headers.host)) return "Onbekende host";
  const origin = headers.origin;
  if (origin && !toegestaan.has(origin.replace(/^http:\/\//, ""))) return "Onbekende herkomst";
  if (headers[HUIS_HEADER] !== HUIS_WAARDE) return "Verzoek komt niet uit het huis";
  if (!String(headers["content-type"] ?? "").startsWith("application/json")) return "Verwacht JSON";
  const lengte = Number(headers["content-length"] ?? 0);
  if (lengte > MAX_BODY) return "Bericht is te groot";
  return null;
}

export { MAX_BODY };
