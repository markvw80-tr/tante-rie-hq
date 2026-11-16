import type { RunSamenvatting, TeamStand } from "../../../shared/types.ts";
import { AgentStart } from "../../regie/AgentStart.tsx";
import { useLezer } from "../../lezer/LezerContext.tsx";
import { initialen } from "../../teamKleur.ts";

export function AgentsTab({ team, runs }: { readonly team: TeamStand; readonly runs: readonly RunSamenvatting[] }) {
  const lees = useLezer();
  return (
    <section className="kaart">
      <h3>Wie werkt hier</h3>
      <div className="agents">
        {team.agents.map((a) => (
          <div className="agent" key={a.naam}>
            <span className="stip" aria-hidden="true">
              {initialen(a.naam)}
            </span>
            <div>
              <strong>{a.naam}</strong>
              {a.model && <span className="model">{a.model}</span>}
              <p title={a.beschrijving}>{a.beschrijving || "Geen beschrijving."}</p>
              <Gereedschap tools={a.tools} />
              <button className="doclink" onClick={() => lees({ soort: "agent", team: team.id, naam: a.bestand })}>
                Instructies lezen
              </button>
              <AgentStart team={team.id} agentBestand={a.bestand} agentNaam={a.naam} runs={runs} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Gereedschap({ tools }: { readonly tools: readonly string[] }) {
  const gewoon = tools.filter((t) => !t.startsWith("mcp__"));
  const koppelingen = tools.length - gewoon.length;
  if (tools.length === 0) return null;
  const delen = [gewoon.join(", "), koppelingen > 0 ? `${koppelingen} koppelingen` : ""].filter(Boolean);
  return <p className="tools">Gereedschap: {delen.join(" en ")}</p>;
}
