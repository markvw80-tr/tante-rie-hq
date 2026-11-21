import type { TeamId } from "../shared/types.ts";

export const TEAM_KLEUR: Record<TeamId, string> = {
  directie: "var(--kleur-directie)",
  seo: "var(--kleur-seo)",
  design: "var(--kleur-design)",
  pim: "var(--kleur-pim)",
  inkoop: "var(--kleur-inkoop)",
  financien: "var(--kleur-financien)",
};

/** Hex-varianten voor SVG-vullingen die met transparantie werken. */
export const TEAM_HEX: Record<TeamId, string> = {
  directie: "#6b4c30",
  seo: "#3b5240",
  design: "#c44f1c",
  pim: "#2c5f8a",
  inkoop: "#8a6420",
  financien: "#5a4a7a",
};

export const TEAM_LABEL: Record<TeamId, string> = { directie: "Directie", seo: "SEO", design: "Design", pim: "PIM", inkoop: "Inkoop", financien: "Financiën" };

export function initialen(naam: string): string {
  return naam
    .split(/[-\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? "")
    .join("");
}

const DATUM = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long" });
const KORT = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" });

export const langeDatum = (iso: string) => DATUM.format(new Date(`${iso}T12:00:00`));
export const korteDatum = (iso: string) => KORT.format(new Date(`${iso}T12:00:00`));

export function dagenTekst(dagen: number | null): string {
  if (dagen === null) return "onbekend";
  if (dagen === 0) return "vandaag";
  if (dagen === 1) return "gisteren";
  return `${dagen} dagen geleden`;
}
