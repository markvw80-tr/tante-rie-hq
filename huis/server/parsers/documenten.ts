import type { DocInfo } from "../../shared/types.ts";
import { isGeldig } from "./datum.ts";
import { parseFrontmatter } from "./frontmatter.ts";

const VEILIG = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const VOLLE_DATUM = /(\d{4}-\d{2}-\d{2})/;
const SORTEER_DATUM = /(\d{4}-\d{2}(?:-\d{2})?)/;

/** Alleen een kale bestandsnaam met de juiste extensie: geen paden, geen verborgen bestanden. */
export function isVeiligeNaam(naam: string, extensie: string): boolean {
  return VEILIG.test(naam) && naam.endsWith(extensie) && !naam.includes("..");
}

export function docInfo(bestand: string): DocInfo {
  const m = VOLLE_DATUM.exec(bestand);
  const datum = m && isGeldig(m[1]) ? m[1] : null;
  const kaal = bestand
    .replace(/\.[a-z]+$/i, "")
    .replace(/^\d{4}-\d{2}-\d{2}(?:-\d{6})?-?/, "")
    .replace(/-?\d{4}-\d{2}-\d{2}$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const titel = kaal ? kaal[0].toUpperCase() + kaal.slice(1) : datum ? "Dagnotities" : bestand;
  return { bestand, titel, datum };
}

const sorteerSleutel = (naam: string) => SORTEER_DATUM.exec(naam)?.[1] ?? "";

/** Filtert namen op een patroon en sorteert nieuwste eerst; bestanden zonder datum achteraan op naam. */
export function filterBestanden(namen: readonly string[], patroon?: RegExp): DocInfo[] {
  return namen
    .filter((n) => !patroon || patroon.test(n))
    .slice()
    .sort((a, b) => sorteerSleutel(b).localeCompare(sorteerSleutel(a)) || a.localeCompare(b))
    .map(docInfo);
}

export function titelUitMarkdown(tekst: string, terugval: string): string {
  const { velden, body } = parseFrontmatter(tekst);
  if (velden.onderwerp) return velden.onderwerp;
  const kop = body.split("\n").find((r) => r.startsWith("# "));
  return kop ? kop.slice(2).trim() : terugval;
}
