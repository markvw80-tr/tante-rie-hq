const MS_PER_DAG = 86_400_000;

/** ISO-datum (JJJJ-MM-DD) aan het begin van een bestandsnaam, of null. */
export function datumUitNaam(naam: string): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(naam);
  return m && isGeldig(m[1]) ? m[1] : null;
}

/** Zet DD-MM-JJJJ om naar JJJJ-MM-DD; null bij een onmogelijke datum. */
export function nlNaarIso(nl: string): string | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(nl.trim());
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  return isGeldig(iso) ? iso : null;
}

export function dagenTussen(van: string | null, tot: string): number | null {
  if (!van || !isGeldig(van) || !isGeldig(tot)) return null;
  return Math.round((Date.parse(tot) - Date.parse(van)) / MS_PER_DAG);
}

export function isGeldig(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

export function vandaagIso(nu: Date = new Date()): string {
  const lokaal = new Date(nu.getTime() - nu.getTimezoneOffset() * 60_000);
  return lokaal.toISOString().slice(0, 10);
}
