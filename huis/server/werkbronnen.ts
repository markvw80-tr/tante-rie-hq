import type { TeamId } from "../shared/types.ts";

/** Een map (of één bestand) met werkdocumenten van een team. Paden relatief aan de repo van het team. */
export interface WerkBronConfig {
  readonly id: string;
  readonly label: string;
  readonly map: string;
  readonly patroon?: RegExp;
  readonly bestand?: string;
}

export const WERKBRONNEN: Record<TeamId, readonly WerkBronConfig[]> = {
  directie: [
    { id: "agendas", label: "Agenda's", map: "team/directie", patroon: /^agenda-/ },
    { id: "werkafspraken", label: "Werkafspraken", map: "team", patroon: /^werkafspraken-/ },
    { id: "status", label: "Status alle teams", map: "team", bestand: "status.md" },
    { id: "statusarchief", label: "Archief statusblokken", map: "team", bestand: "status-archief.md" },
  ],
  seo: [
    { id: "rapporten", label: "Rapporten", map: "marketing/rapporten" },
    { id: "vragen", label: "Vragen voor Mark", map: "marketing", bestand: "vragen-voor-mark.md" },
    { id: "changelog", label: "Changelog", map: "marketing", bestand: "changelog.md" },
    { id: "plannen", label: "Plannen", map: "marketing", patroon: /^(plan-|werkvolgorde|meetkalender)/ },
    { id: "review", label: "Reviews kwaliteitsredacteur", map: "marketing/review" },
    { id: "onpage", label: "On-page", map: "marketing/onpage" },
    { id: "autoriteit", label: "Autoriteit en lokaal", map: "marketing/autoriteit" },
    { id: "technisch", label: "Technisch", map: "marketing/technisch" },
    { id: "content", label: "Content", map: "marketing/content" },
  ],
  design: [
    { id: "opdrachten", label: "Opdrachten", map: "opdrachten" },
    { id: "changelog", label: "Changelog", map: "changelog" },
    { id: "stijlgids", label: "Stijlgids", map: "stijlgids/tante-rie", bestand: "stijlgids.md" },
  ],
  pim: [{ id: "logboek", label: "Logboek", map: "logs" }],
  inkoop: [
    { id: "opdrachten", label: "Opdrachten", map: "opdrachten" },
    { id: "app", label: "Over de app", map: "app", bestand: "README.md" },
  ],
  financien: [
    { id: "rapporten", label: "Rapporten", map: "rapporten" },
    { id: "opdrachten", label: "Opdrachten", map: "opdrachten" },
  ],
  klant: [
    { id: "concepten", label: "Concepten", map: "concepten" },
    { id: "opdrachten", label: "Opdrachten", map: "opdrachten" },
  ],
};

export const MAX_DOCUMENTEN = 40;
export const MAX_TEKENS = 600_000;
