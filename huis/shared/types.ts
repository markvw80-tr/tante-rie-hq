export type TeamId = "directie" | "seo" | "pim" | "design";
export type MailboxTeam = Exclude<TeamId, "directie">;

export interface Agent {
  readonly naam: string;
  readonly bestand: string; // bestandsnaam zonder .md, sleutel voor /api/agent
  readonly beschrijving: string;
  readonly model: string | null;
  readonly tools: readonly string[];
}

export interface StatusBlok {
  readonly team: MailboxTeam;
  readonly datum: string; // ISO JJJJ-MM-DD
  readonly titel: string;
  readonly regels: readonly string[];
}

export interface Bericht {
  readonly bestand: string;
  readonly map: "inbox" | "verwerkt";
  readonly van: string;
  readonly aan: string;
  readonly datum: string;
  readonly onderwerp: string;
  readonly prioriteit: "hoog" | "normaal" | "laag";
  readonly antwoordOp: string | null;
  readonly leeftijdDagen: number | null;
}

export interface MailboxStand {
  readonly inbox: readonly Bericht[];
  readonly verwerktAantal: number;
  readonly recentVerwerkt: readonly Bericht[];
}

export interface JsonMailboxOpen {
  readonly berichtId: string;
  readonly status: string;
  readonly regelsOpen: number;
  readonly regelsTotaal: number;
  readonly leeftijdDagen: number | null;
}

export interface JsonMailbox {
  readonly naam: string;
  readonly leesbaar: boolean;
  readonly open: readonly JsonMailboxOpen[];
}

export interface MdSectie {
  readonly titel: string;
  readonly alineas: readonly string[];
  readonly items: readonly string[];
}

export interface MdDocument {
  readonly titel: string;
  readonly intro: readonly string[];
  readonly secties: readonly MdSectie[];
}

export interface Agenda extends MdDocument {
  readonly datum: string;
  readonly bestand: string;
}

export interface PipelineFase {
  readonly fase: string;
  readonly label: string;
  readonly batches: readonly string[];
}

export type BesluitKeuze = "akkoord" | "afgewezen" | "vraag";

export interface BesluitAntwoord {
  readonly keuze: BesluitKeuze;
  readonly aan: string;
  readonly datum: string;
  readonly bestand: string;
}

export interface Besluit {
  readonly id: string;
  readonly tekst: string;
  readonly team: TeamId | null;
  readonly antwoord: BesluitAntwoord | null;
}

export type Stemming = "bezig" | "stil" | "achterstand";

export interface TeamStand {
  readonly id: TeamId;
  readonly naam: string;
  readonly kamer: string;
  readonly agents: readonly Agent[];
  readonly mailbox: MailboxStand | null;
  readonly statusHistorie: readonly StatusBlok[];
  readonly statusLeeftijdDagen: number | null;
  readonly pipeline: readonly PipelineFase[] | null;
  readonly stemming: Stemming;
  readonly signalen: readonly string[];
  readonly fouten: readonly string[];
}

export interface HuisStand {
  readonly vandaag: string;
  readonly drempelDagen: number;
  readonly teams: readonly TeamStand[];
  readonly agenda: Agenda | null;
  readonly doelen: MdDocument | null;
  readonly besluiten: readonly Besluit[];
  readonly jsonMailbox: readonly JsonMailbox[];
  readonly runs?: readonly RunSamenvatting[];
  readonly post?: PostStand;
  readonly automaat?: AutomaatStand;
  readonly kosten?: KostenOverzicht;
  /** Toestemmingsvragen van agents automatisch goedkeuren (live acties nooit). */
  readonly autoGoedkeuring?: boolean;
  /** Het Tailscale-adres waarop het huis ook buiten de deur te openen is, als tailscale serve aanstaat. */
  readonly opAfstand?: string | null;
}

/** Het huis start zelf de lead van een team als er nieuwe post in de inbox ligt. */
export interface AutomaatStand {
  readonly aan: boolean;
  readonly budgetUsd: number;
  readonly maxPerDag: number;
  readonly startsLaatsteDag: number;
  readonly rustMinuten: number;
  readonly melding: string | null;
}

export interface PostStand {
  readonly opgehaald: string | null;
  readonly fout: string | null;
  readonly automatischMinuten: number | null;
}

/* Fase 2: kamerdetails */

export interface DocInfo {
  readonly bestand: string;
  readonly titel: string;
  readonly datum: string | null;
}

export interface WerkBronInfo {
  readonly id: string;
  readonly label: string;
  readonly totaal: number;
  readonly documenten: readonly DocInfo[];
}

export interface Gesprek {
  readonly id: string;
  readonly onderwerp: string;
  readonly deelnemers: readonly string[];
  readonly berichten: readonly Bericht[];
  readonly laatsteDatum: string;
  readonly open: boolean;
  readonly gearchiveerd: boolean;
}

export interface TeamWerk {
  readonly team: TeamId;
  readonly bronnen: readonly WerkBronInfo[];
  readonly gesprekken: readonly Gesprek[];
}

export interface DocumentInhoud {
  readonly titel: string;
  readonly bestand: string;
  readonly herkomst: string;
  readonly inhoud: string;
  readonly ingekort: boolean;
}

export interface BatchInhoud {
  readonly fase: string;
  readonly batch: string;
  readonly documenten: readonly DocInfo[];
  readonly overigeBestanden: readonly string[];
}

/* Fase 4: regie over agents */

export type RunStatus = "bezig" | "wacht" | "klaar" | "gestopt" | "fout" | "onderbroken";
export type RegelSoort = "systeem" | "tekst" | "tool" | "resultaat" | "poort" | "besluit" | "fout";
export type PoortSoort = "toestemming" | "live";

export interface RunRegel {
  readonly t: string; // ISO tijd
  readonly soort: RegelSoort;
  readonly tekst: string;
}

/** Een gewijzigd bestand of tekstblok in een poortvraag: regels voor en na. */
export interface PoortWijziging {
  readonly bestand: string;
  readonly voor: readonly string[];
  readonly na: readonly string[];
  readonly nieuw: boolean;
}

/** Uitleg in gewone taal: wat er gebeurt, met details en eventueel de regels die veranderen. */
export interface PoortUitleg {
  readonly kop: string;
  readonly punten: readonly string[];
  readonly wijzigingen: readonly PoortWijziging[];
}

export interface PoortVerzoek {
  readonly id: string;
  readonly soort: PoortSoort;
  readonly tool: string;
  readonly samenvatting: string;
  readonly invoer: string;
  readonly reden: string;
  readonly sinds: string;
  readonly uitleg?: PoortUitleg;
  /** Wat de agent vlak voor deze vraag schreef, als reden. */
  readonly agentZegt?: string;
}

export interface RunSamenvatting {
  readonly id: string;
  readonly team: TeamId;
  readonly agent: string;
  readonly opdracht: string;
  readonly status: RunStatus;
  readonly gestart: string;
  readonly geeindigd: string | null;
  readonly kostenUsd: number | null;
  readonly budgetUsd: number;
  readonly poort: PoortVerzoek | null;
  readonly laatsteRegel: string;
  /** Wie de run startte: Mark zelf of het huis bij nieuwe post. Ontbreekt bij oude runs (Mark). */
  readonly bron?: RunBron;
  /** De run stopte omdat het budget op was. */
  readonly budgetOp?: boolean;
}

/** Kosten van de agents per team, uit de werkbonnen van het huis. */
export interface KostenTeam {
  readonly team: TeamId;
  readonly weekUsd: number;
  readonly maandUsd: number;
  readonly runsWeek: number;
  readonly budgetOpWeek: number;
  readonly automatischWeekUsd: number;
}

export interface KostenOverzicht {
  readonly teams: readonly KostenTeam[];
  readonly weekUsd: number;
  readonly maandUsd: number;
  /** Runs van de afgelopen week zonder bekend bedrag (gestopt of onderbroken voordat de SDK een bedrag gaf). */
  readonly zonderKostenWeek: number;
}

export type RunBron = "mark" | "huis";

export interface RunDetail extends RunSamenvatting {
  readonly regels: readonly RunRegel[];
  readonly resultaat: string | null;
}
