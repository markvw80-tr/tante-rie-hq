import type { HuisStand, MailboxTeam, RunStatus, TeamStand } from "../../../shared/types.ts";
import { TEAM_HEX } from "../../teamKleur.ts";
import { Buitenkant, Buizenpost } from "./Buitenkant.tsx";
import { AtelierDecor, EtalageDecor, KantoorDecor, KelderDecor, PakhuisDecor, ToonbankDecor } from "./Decor.tsx";
import { Figuurtjes } from "./Figuurtjes.tsx";
import { Kamer, type LampStand } from "./Kamer.tsx";
import { KAMERS, VIEWBOX, type Plek } from "./maten.ts";

interface Props {
  readonly huis: HuisStand;
  readonly gekozen: Plek;
  readonly onKies: (plek: Plek) => void;
}

/** Volgorde van de kokers in de buizenpost: van boven naar beneden, links naar rechts. */
const KOKER_VOLGORDE: readonly MailboxTeam[] = ["design", "inkoop", "seo", "pim"];
const KOKER_STAP = 26;
/** Hoe breed de figuurtjes per kamer mogen staan, zodat ze niet over het decor lopen. */
const LOOPRUIMTE: Record<TeamStand["id"], { readonly links: number; readonly breedte: number }> = {
  directie: { links: 14, breedte: 160 },
  design: { links: 110, breedte: 230 },
  inkoop: { links: 14, breedte: 96 },
  seo: { links: 14, breedte: 160 },
  pim: { links: 30, breedte: 660 },
};

export function Huis({ huis, gekozen, onKies }: Props) {
  const team = (id: TeamStand["id"]) => huis.teams.find((t) => t.id === id);
  const bezig = huis.teams.filter((t) => t.stemming === "bezig").length;
  const openBesluiten = huis.besluiten.filter((b) => !b.antwoord).length;
  const werkVoor = (id: TeamStand["id"]) =>
    new Map((huis.runs ?? []).filter((r) => r.team === id && (r.status === "bezig" || r.status === "wacht")).map((r) => [r.agent, r.status] as const));

  // Kamers op dezelfde verdieping delen één aftakking; hun kokers stapelen door.
  const opVerdieping = new Map<number, number>();
  const kokers = KOKER_VOLGORDE.flatMap((id) => {
    const vloer = KAMERS[id].y;
    return (team(id)?.mailbox?.inbox ?? []).map((b) => {
      const plek = opVerdieping.get(vloer) ?? 0;
      opVerdieping.set(vloer, plek + 1);
      return {
        sleutel: b.bestand,
        y: vloer + 40 + plek * KOKER_STAP,
        oud: (b.leeftijdDagen ?? 0) >= huis.drempelDagen,
        kleur: TEAM_HEX[id],
      };
    });
  });
  const aftakkingen = [...new Set(KOKER_VOLGORDE.map((id) => KAMERS[id].y + 26))];

  return (
    <svg className="huis-svg" viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} role="group" aria-label="Het huis van Tante Rie met alle afdelingen">
      <Buitenkant bezig={bezig} />
      {huis.teams.map((t) => (
        <TeamKamer key={t.id} team={t} gekozen={gekozen === t.id} onKies={() => onKies(t.id)} drempel={huis.drempelDagen} werk={werkVoor(t.id)}>
          {t.id === "directie" && <KantoorDecor heeftAgenda={huis.agenda?.datum === huis.vandaag} />}
          {t.id === "design" && <AtelierDecor />}
          {t.id === "seo" && <EtalageDecor />}
          {t.id === "pim" && t.pipeline && <KelderDecor fases={t.pipeline} />}
          {t.id === "inkoop" && <PakhuisDecor dozen={t.mailbox?.inbox.length ?? 0} />}
        </TeamKamer>
      ))}
      <Kamer
        vlak={KAMERS.toonbank}
        titel="Toonbank"
        ondertitel="Mark"
        kleur="#1c1c14"
        stemming={null}
        gekozen={gekozen === "toonbank"}
        ariaLabel={`Toonbank: ${openBesluiten} besluiten wachten op Mark`}
        onKies={() => onKies("toonbank")}
      >
        <ToonbankDecor besluiten={openBesluiten} />
      </Kamer>
      <Buizenpost kokers={kokers} aftakkingen={aftakkingen} />
    </svg>
  );
}

interface TeamKamerProps {
  readonly team: TeamStand;
  readonly gekozen: boolean;
  readonly drempel: number;
  readonly werk: ReadonlyMap<string, RunStatus>;
  readonly onKies: () => void;
  readonly children?: React.ReactNode;
}

function TeamKamer({ team, gekozen, drempel, werk, onKies, children }: TeamKamerProps) {
  const vlak = KAMERS[team.id];
  const kleur = TEAM_HEX[team.id];
  const ongelezen = team.mailbox?.inbox.length ?? 0;
  const lamp: LampStand = werk.size > 0 ? "werkt" : team.mailbox?.inbox.some((b) => b.van === "mark") ? "mark" : ongelezen > 0 ? "post" : "uit";
  const ruimte = LOOPRUIMTE[team.id];
  const stil = team.statusLeeftijdDagen !== null && team.statusLeeftijdDagen >= drempel ? `${team.statusLeeftijdDagen} dagen stil` : undefined;
  const label = [
    `${team.kamer}, team ${team.naam}`,
    `${team.agents.length} agents`,
    team.mailbox ? `${ongelezen} ongelezen berichten` : null,
    lamp === "werkt" ? "aan het werk" : lamp === "mark" ? "post van Mark wacht" : null,
    team.signalen.join(". ") || null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Kamer
      vlak={vlak}
      titel={team.kamer}
      ondertitel={`${team.naam} · ${team.agents.length} agents`}
      kleur={kleur}
      stemming={team.stemming}
      gekozen={gekozen}
      ariaLabel={label}
      badge={ongelezen > 0 ? `${ongelezen} post` : undefined}
      stilBordje={stil}
      lamp={lamp}
      onKies={onKies}
    >
      {children}
      <Figuurtjes agents={team.agents} x={vlak.x + ruimte.links} breedte={ruimte.breedte} vloerY={vlak.y + vlak.h - 8} kleur={kleur} stemming={team.stemming} werk={werk} />
    </Kamer>
  );
}
