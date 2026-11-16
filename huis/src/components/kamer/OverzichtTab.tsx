import type { Agenda, TeamStand } from "../../../shared/types.ts";
import { korteDatum } from "../../teamKleur.ts";
import { AgendaKaart } from "../AgendaKaart.tsx";
import { Kelder } from "./Kelder.tsx";

export function OverzichtTab({ team, agenda }: { readonly team: TeamStand; readonly agenda: Agenda | null }) {
  const meldingen = [...team.signalen, ...team.fouten];
  return (
    <>
      <section className="kaart">
        <h3>Hoe staat het ervoor</h3>
        {meldingen.length === 0 ? (
          <p className="rustig">Niets blijft liggen.</p>
        ) : (
          meldingen.map((s) => (
            <p className="signaal" key={s}>
              {s}
            </p>
          ))
        )}
      </section>

      {team.pipeline && <Kelder fases={team.pipeline} />}
      {team.id === "directie" && agenda && <AgendaKaart agenda={agenda} />}

      {team.statusHistorie.length > 0 && (
        <section className="kaart">
          <h3>Statusblokken</h3>
          {team.statusHistorie.map((b, i) => (
            <details key={`${b.datum}-${b.titel}`} className="status-blok" open={i === 0}>
              <summary>
                {korteDatum(b.datum)}
                <span>{b.titel}</span>
              </summary>
              <ul>
                {b.regels.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      )}
    </>
  );
}
