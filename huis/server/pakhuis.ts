// Haalt de stand van het Pakhuis op uit de inkoop-app (po-confirmations) en vertaalt die naar signalen.
// Alleen lezen. Adres en sleutel komen uit huis/.env (HUIS_PAKHUIS_URL, HUIS_PAKHUIS_TOKEN).
import type { PakhuisStand } from "../shared/types.ts";

export const BACKORDER_SIGNAAL_DAGEN = 14;
const CACHE_MS = 60_000;
const TIMEOUT_MS = 4_000;

/** Controleert de vorm van het antwoord; alles wat niet klopt wordt weggegooid in plaats van doorgegeven. */
export function leesStand(ruw: unknown, appUrl: string): PakhuisStand | null {
  if (!ruw || typeof ruw !== "object") return null;
  const o = ruw as Record<string, unknown>;
  const b = o.backorder as Record<string, unknown> | undefined;
  if (typeof o.bijgewerkt !== "string" || !Array.isArray(o.wachtend) || !b || typeof b.stuks !== "number" || !Array.isArray(o.ontvangsten)) return null;
  const tekst = (v: unknown, standaard = "") => (typeof v === "string" ? v.slice(0, 120) : standaard);
  const getal = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const oudste = b.oudste as Record<string, unknown> | null | undefined;
  return {
    bijgewerkt: o.bijgewerkt,
    appUrl,
    wachtend: o.wachtend
      .filter((w): w is Record<string, unknown> => !!w && typeof w === "object" && typeof (w as Record<string, unknown>).id === "string")
      .map((w) => ({
        id: tekst(w.id).replace(/[^A-Za-z0-9_-]/g, ""),
        leverancier: tekst(w.leverancier, "Onbekend"),
        document: tekst(w.document, "zonder nummer"),
        soort: tekst(w.soort, "onbekend"),
        binnen: tekst(w.binnen),
        dagen: getal(w.dagen),
        regels: getal(w.regels),
      })),
    backorder: {
      bestellingen: getal(b.bestellingen),
      stuks: getal(b.stuks),
      oudste: oudste && typeof oudste === "object" ? { poNumber: tekst(oudste.poNumber), leverancier: tekst(oudste.leverancier), dagen: getal(oudste.dagen) } : null,
    },
    ontvangsten: o.ontvangsten
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .map((r) => ({ wanneer: tekst(r.wanneer), leverancier: tekst(r.leverancier, "Onbekend"), document: tekst(r.document), stuks: getal(r.stuks) })),
  };
}

/** Signalen voor de kamer en de directie: leveringen die te lang wachten en een oude backorder. */
export function pakhuisSignalen(stand: PakhuisStand | null, drempelDagen: number, bereikbaar: boolean): string[] {
  if (!bereikbaar) return ["De inkoop-app is niet bereikbaar, de stand van het Pakhuis is onbekend"];
  if (!stand) return [];
  const signalen: string[] = [];
  const oud = stand.wachtend.filter((w) => w.dagen >= drempelDagen);
  if (oud.length) signalen.push(`${oud.length} ${oud.length === 1 ? "levering wacht" : "leveringen wachten"} ${drempelDagen} dagen of langer op afvinken`);
  const o = stand.backorder.oudste;
  if (o && o.dagen >= BACKORDER_SIGNAAL_DAGEN) signalen.push(`Backorder ${o.poNumber} van ${o.leverancier} staat al ${o.dagen} dagen open`);
  return signalen;
}

export interface PakhuisBron {
  /** Laatste stand (hooguit een minuut oud) en of de app bereikbaar was. */
  stand(): Promise<{ stand: PakhuisStand | null; bereikbaar: boolean }>;
}

/** Bron via HTTP met een korte cache, zodat het Huis de app niet bij elke verversing bevraagt. */
export function httpPakhuis(url: string, sleutel: string, haal: typeof fetch = fetch): PakhuisBron {
  const appUrl = url.replace(/\/api\/pakhuis\/?$/, "");
  let cache: { tijd: number; waarde: { stand: PakhuisStand | null; bereikbaar: boolean } } | null = null;
  return {
    async stand() {
      if (cache && Date.now() - cache.tijd < CACHE_MS) return cache.waarde;
      let waarde: { stand: PakhuisStand | null; bereikbaar: boolean };
      try {
        const res = await haal(url, { headers: { "x-pakhuis-token": sleutel }, signal: AbortSignal.timeout(TIMEOUT_MS) });
        waarde = res.ok ? { stand: leesStand(await res.json(), appUrl), bereikbaar: true } : { stand: null, bereikbaar: false };
      } catch {
        waarde = { stand: null, bereikbaar: false };
      }
      cache = { tijd: Date.now(), waarde };
      return waarde;
    },
  };
}
