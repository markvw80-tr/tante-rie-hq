import { useState } from "react";
import type { Agenda, MailboxTeam, RunSamenvatting, TeamStand } from "../../../shared/types.ts";
import { useSchrijven } from "../../schrijven/SchrijfContext.tsx";
import { TEAM_KLEUR, dagenTekst } from "../../teamKleur.ts";
import { useTeamWerk } from "../../useTeamWerk.ts";
import { AgentsTab } from "./AgentsTab.tsx";
import { OverzichtTab } from "./OverzichtTab.tsx";
import { PostTab } from "./PostTab.tsx";
import { WerkTab } from "./WerkTab.tsx";

interface Props {
  readonly team: TeamStand;
  readonly agenda: Agenda | null;
  readonly drempel: number;
  readonly bijgewerkt: Date | null;
  readonly runs: readonly RunSamenvatting[];
  readonly onTerug: () => void;
}

type Tab = "overzicht" | "post" | "werk" | "agents";

export function TeamPaneel({ team, agenda, drempel, bijgewerkt, runs, onTerug }: Props) {
  const [tab, setTab] = useState<Tab>("overzicht");
  const { open: schrijf } = useSchrijven();
  const { werk, fout, opnieuw } = useTeamWerk(team.id, bijgewerkt);
  const laatste = team.id === "directie" ? "Laatste agenda" : "Laatste statusblok";
  const openGesprekken = werk?.gesprekken.filter((g) => g.open && !g.gearchiveerd).length ?? 0;
  const documenten = werk?.bronnen.reduce((n, b) => n + b.totaal, 0);

  const tabs: ReadonlyArray<readonly [Tab, string]> = [
    ["overzicht", "Overzicht"],
    ["post", `Post${openGesprekken ? ` (${openGesprekken})` : ""}`],
    ["werk", `Werk${documenten !== undefined ? ` (${documenten})` : ""}`],
    ["agents", `Agents (${team.agents.length})${runs.some((r) => r.team === team.id && (r.status === "bezig" || r.status === "wacht")) ? " ●" : ""}`],
  ];

  return (
    <div className="paneel" style={{ ["--c" as string]: TEAM_KLEUR[team.id] }}>
      <section className="kaart kamer-kop">
        <div className="kaart-kop">
          <h2>{team.kamer}</h2>
          <div className="kop-knoppen">
            {team.id !== "directie" && (
              <button className="knop klein" onClick={() => schrijf({ aan: team.id as MailboxTeam })}>
                Opdracht geven
              </button>
            )}
            <button className="terug" onClick={onTerug}>
              Naar de toonbank
            </button>
          </div>
        </div>
        <p className="onder">
          Team {team.naam} · {laatste}: {dagenTekst(team.statusLeeftijdDagen)}
        </p>
        <div className="tabs" role="tablist" aria-label={`Onderdelen van ${team.kamer}`}>
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "tab actief" : "tab"} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {fout && tab !== "overzicht" && tab !== "agents" && <p className="signaal">Werk van dit team laden mislukt: {fout}</p>}
      {tab === "overzicht" && <OverzichtTab team={team} agenda={agenda} />}
      {tab === "post" && <PostTab gesprekken={werk?.gesprekken ?? null} team={team.id} drempel={drempel} onGewijzigd={opnieuw} />}
      {tab === "werk" && <WerkTab werk={werk} />}
      {tab === "agents" && <AgentsTab team={team} runs={runs} />}
    </div>
  );
}
