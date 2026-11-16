import { useState } from "react";
import type { Gesprek, TeamId } from "../../../shared/types.ts";
import { useLezer } from "../../lezer/LezerContext.tsx";
import { TEAM_HEX, dagenTekst, korteDatum } from "../../teamKleur.ts";

interface Props {
  readonly gesprekken: readonly Gesprek[] | null;
  readonly team: TeamId;
  readonly drempel: number;
}

const kleurVan = (afzender: string) => TEAM_HEX[afzender as TeamId] ?? "#6b6152";

export function PostTab({ gesprekken, team, drempel }: Props) {
  const [alleenOpen, setAlleenOpen] = useState(false);
  const lees = useLezer();
  if (!gesprekken) return <section className="kaart onder">Post wordt opgehaald...</section>;
  const zichtbaar = alleenOpen ? gesprekken.filter((g) => g.open) : gesprekken;

  return (
    <section className="kaart">
      <div className="kaart-kop">
        <h3>Gesprekken</h3>
        <label className="schakel">
          <input type="checkbox" checked={alleenOpen} onChange={(e) => setAlleenOpen(e.target.checked)} /> alleen open
        </label>
      </div>
      {zichtbaar.length === 0 && <p className="onder">Geen gesprekken.</p>}
      {zichtbaar.map((g, i) => (
        <details key={g.id} className="gesprek" open={g.open && i < 3}>
          <summary>
            <span className={g.open ? "punt open" : "punt"} aria-label={g.open ? "open" : "afgerond"} />
            <span className="gesprek-titel">{g.onderwerp}</span>
            <span className="onder">
              {g.deelnemers.join(" en ")} · {g.berichten.length} · {korteDatum(g.laatsteDatum)}
            </span>
          </summary>
          <ol className="tijdlijn">
            {g.berichten.map((b) => {
              const uitgaand = b.van === team;
              const oud = b.map === "inbox" && (b.leeftijdDagen ?? 0) >= drempel;
              return (
                <li key={b.bestand} className={uitgaand ? "uit" : "in"}>
                  <button className="ballon" style={{ ["--c" as string]: kleurVan(b.van) }} onClick={() => lees({ soort: "bericht", bestand: b.bestand })}>
                    <span className="ballon-meta">
                      {b.van} aan {b.aan} · {dagenTekst(b.leeftijdDagen)}
                      {b.prioriteit === "hoog" && <strong> · hoog</strong>}
                    </span>
                    <span>{b.onderwerp}</span>
                    <span className={oud ? "ballon-status oud" : "ballon-status"}>{b.map === "inbox" ? (oud ? "ongelezen, ligt te lang" : "ongelezen") : "verwerkt"}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </details>
      ))}
    </section>
  );
}
