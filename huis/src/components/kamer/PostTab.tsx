import { useState, type MouseEvent } from "react";
import type { Gesprek, TeamId } from "../../../shared/types.ts";
import { useLezer } from "../../lezer/LezerContext.tsx";
import { archiefActie } from "../../schrijven/api.ts";
import { TEAM_HEX, dagenTekst, korteDatum } from "../../teamKleur.ts";

interface Props {
  readonly gesprekken: readonly Gesprek[] | null;
  readonly team: TeamId;
  readonly drempel: number;
  readonly onGewijzigd: () => void;
}

type Weergave = "lopend" | "archief";

const kleurVan = (afzender: string) => TEAM_HEX[afzender as TeamId] ?? "#6b6152";

/** Post van één kamer: lopende gesprekken en het archief. Archiveren kan alleen als een gesprek is afgehandeld. */
export function PostTab({ gesprekken, team, drempel, onGewijzigd }: Props) {
  const [weergave, setWeergave] = useState<Weergave>("lopend");
  const [alleenOpen, setAlleenOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);

  if (!gesprekken) return <section className="kaart onder">Post wordt opgehaald...</section>;

  const lopend = gesprekken.filter((g) => !g.gearchiveerd);
  const archief = gesprekken.filter((g) => g.gearchiveerd);
  const afgehandeld = lopend.filter((g) => !g.open);
  const lijst = weergave === "archief" ? archief : alleenOpen ? lopend.filter((g) => g.open) : lopend;

  const voerUit = async (actie: "archiveer" | "terug", ids: readonly string[]) => {
    setBezig(true);
    setMelding(null);
    try {
      const { aantal } = await archiefActie(actie, ids);
      setMelding(actie === "archiveer" ? `${aantal} ${aantal === 1 ? "gesprek" : "gesprekken"} gearchiveerd.` : `${aantal} ${aantal === 1 ? "gesprek" : "gesprekken"} teruggehaald.`);
      onGewijzigd();
    } catch (e) {
      setMelding((e as Error).message);
    } finally {
      setBezig(false);
    }
  };

  return (
    <section className="kaart">
      <div className="kaart-kop">
        <div className="segment" role="tablist" aria-label="Post">
          <button role="tab" aria-selected={weergave === "lopend"} className={weergave === "lopend" ? "actief" : ""} onClick={() => setWeergave("lopend")}>
            Lopend ({lopend.length})
          </button>
          <button role="tab" aria-selected={weergave === "archief"} className={weergave === "archief" ? "actief" : ""} onClick={() => setWeergave("archief")}>
            Archief ({archief.length})
          </button>
        </div>
        {weergave === "lopend" && (
          <label className="schakel">
            <input type="checkbox" checked={alleenOpen} onChange={(e) => setAlleenOpen(e.target.checked)} /> alleen open
          </label>
        )}
      </div>

      {weergave === "lopend" && afgehandeld.length > 0 && (
        <div className="post-acties">
          <button className="knop-tweede klein" disabled={bezig} onClick={() => voerUit("archiveer", afgehandeld.map((g) => g.id))}>
            Alle afgehandelde archiveren ({afgehandeld.length})
          </button>
        </div>
      )}
      {weergave === "archief" && archief.length > 0 && (
        <p className="onder">Gearchiveerd staat alleen in jouw overzicht; de mailbox van de teams blijft gelijk. Komt er een nieuw bericht bij, dan staat het gesprek vanzelf weer bij Lopend.</p>
      )}
      {melding && <p className="onder" role="status">{melding}</p>}

      {lijst.length === 0 && <p className="onder">{weergave === "archief" ? "Het archief is leeg." : "Geen gesprekken."}</p>}
      {lijst.map((g, i) => (
        <GesprekRij key={g.id} gesprek={g} team={team} drempel={drempel} open={weergave === "lopend" && g.open && i < 3} bezig={bezig} onActie={voerUit} />
      ))}
    </section>
  );
}

interface RijProps {
  readonly gesprek: Gesprek;
  readonly team: TeamId;
  readonly drempel: number;
  readonly open: boolean;
  readonly bezig: boolean;
  readonly onActie: (actie: "archiveer" | "terug", ids: readonly string[]) => void;
}

function GesprekRij({ gesprek: g, team, drempel, open, bezig, onActie }: RijProps) {
  const lees = useLezer();
  const actie = g.gearchiveerd ? "terug" : !g.open ? "archiveer" : null;
  const klik = (e: MouseEvent) => {
    // Knop zit in de samenvatting: niet ook het gesprek open- of dichtklappen.
    e.preventDefault();
    e.stopPropagation();
    if (actie) onActie(actie, [g.id]);
  };

  return (
    <details className={`gesprek${g.gearchiveerd ? " gearchiveerd" : ""}`} open={open}>
      <summary>
        <span className={g.open ? "punt open" : "punt"} aria-label={g.open ? "open" : "afgerond"} />
        <span className="gesprek-titel">{g.onderwerp}</span>
        {actie && (
          <button className="archief-knop" onClick={klik} disabled={bezig} title={actie === "terug" ? "Terughalen naar Lopend" : "Archiveren"}>
            {actie === "terug" ? "Terughalen" : "Archiveren"}
          </button>
        )}
        <span className="onder">
          {g.deelnemers.join(" en ")} · {g.berichten.length} · {korteDatum(g.laatsteDatum)}
        </span>
      </summary>
      <ol className="tijdlijn">
        {g.berichten.map((b) => {
          const oud = b.map === "inbox" && (b.leeftijdDagen ?? 0) >= drempel;
          return (
            <li key={b.bestand} className={b.van === team ? "uit" : "in"}>
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
  );
}
