import type { MdDocument, MdSectie, TeamId } from "../../shared/types.ts";

export interface AgendaBesluit {
  readonly tekst: string;
  readonly team: TeamId | null;
}

const ITEM = /^(?:\d+\.|-)\s+(.*)$/;
const TEAM_STAART = /\s*\((PIM|SEO|Design|Directie)\)\.?\s*$/i;

interface Sectie {
  readonly titel: string;
  readonly alineas: string[];
  readonly items: string[];
}

/** Leest een Markdown-document met één `#`-titel en `##`-secties (agenda, doelen). */
export function parseMarkdown(tekst: string): MdDocument {
  let titel = "";
  const intro: string[] = [];
  const secties: Sectie[] = [];

  for (const ruw of tekst.replace(/\r\n/g, "\n").split("\n")) {
    const regel = ruw.trim();
    if (!regel) continue;
    if (regel.startsWith("# ") && !titel) {
      titel = regel.slice(2).trim();
      continue;
    }
    if (regel.startsWith("## ")) {
      secties.push({ titel: regel.slice(3).trim(), alineas: [], items: [] });
      continue;
    }
    const doel = secties.at(-1);
    const item = ITEM.exec(regel);
    if (!doel) intro.push(regel);
    else if (item) doel.items.push(item[1].trim());
    else doel.alineas.push(regel);
  }
  return { titel, intro, secties: secties.map((s): MdSectie => ({ ...s })) };
}

/** Besluiten voor Mark staan in de agenda onder een sectie die met "Mark" begint. */
export function besluitenUitAgenda(agenda: MdDocument): AgendaBesluit[] {
  const sectie = agenda.secties.find((s) => /^mark\b/i.test(s.titel));
  if (!sectie) return [];
  return sectie.items.map((item) => {
    const m = TEAM_STAART.exec(item);
    return {
      tekst: m ? item.slice(0, m.index).trim() : item,
      team: m ? (m[1].toLowerCase() as TeamId) : null,
    };
  });
}
