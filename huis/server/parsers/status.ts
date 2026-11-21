import type { MailboxTeam, StatusBlok } from "../../shared/types.ts";
import { nlNaarIso } from "./datum.ts";

/** Teamnaam zoals in de kop van een statusblok (STATUS_LABEL in scripts/mailbox.py). */
const TEAM: Readonly<Record<string, MailboxTeam>> = { SEO: "seo", PIM: "pim", Design: "design", Inkoop: "inkoop", "Financiën": "financien", Klant: "klant" };
const KOP = new RegExp(`^## (${Object.keys(TEAM).join("|")}), (\\d{2}-\\d{2}-\\d{4})(?: \\((.*)\\))?\\s*$`);

interface Bezig {
  readonly team: MailboxTeam;
  readonly datum: string;
  readonly titel: string;
  readonly regels: string[];
}

/** Splitst team/status.md in blokken per team (nieuwste bovenaan, zoals in het bestand). */
export function parseStatus(tekst: string): StatusBlok[] {
  const blokken: Bezig[] = [];
  let huidig: Bezig | null = null;

  for (const regel of tekst.replace(/\r\n/g, "\n").split("\n")) {
    if (regel.startsWith("## ")) {
      huidig = startBlok(regel);
      if (huidig) blokken.push(huidig);
      continue;
    }
    if (huidig) voegRegelToe(huidig.regels, regel);
  }
  return blokken.map((b) => ({ ...b, regels: [...b.regels] }));
}

function startBlok(regel: string): Bezig | null {
  const m = KOP.exec(regel);
  const datum = m ? nlNaarIso(m[2]) : null;
  if (!m || !datum) return null;
  return { team: TEAM[m[1]], datum, titel: m[3] ?? "", regels: [] };
}

function voegRegelToe(regels: string[], regel: string): void {
  if (regel.startsWith("- ")) {
    regels.push(regel.slice(2).trim());
  } else if (regel.trim() && regels.length > 0 && /^\s/.test(regel)) {
    regels[regels.length - 1] = `${regels[regels.length - 1]} ${regel.trim()}`;
  }
}
