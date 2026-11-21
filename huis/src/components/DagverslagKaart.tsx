import { useState } from "react";
import type { DagverslagStand, TeamId } from "../../shared/types.ts";
import { useIk } from "../ik.ts";
import { maakDagverslag } from "../schrijven/api.ts";

const DATUM = new Intl.DateTimeFormat("nl-NL", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });

/** Het dagverslag van elke afdeling: één tab per afdeling, met de tekst zoals die ook per mail komt. */
export function DagverslagKaart({ stand, onGewijzigd }: { readonly stand: DagverslagStand; readonly onGewijzigd: () => void }) {
  const ik = useIk();
  const [gekozen, setGekozen] = useState<TeamId | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const actief = stand.verslagen.find((v) => v.team === gekozen) ?? stand.verslagen[0] ?? null;
  const eerste = stand.verslagen[0];

  const maak = async () => {
    setBezig(true);
    setFout(null);
    try {
      await maakDagverslag();
      onGewijzigd();
    } catch (e) {
      setFout((e as Error).message);
    } finally {
      setBezig(false);
    }
  };

  return (
    <section className="kaart dagverslag" aria-labelledby="dagverslag-kop">
      <div className="kaart-kop">
        <h3 id="dagverslag-kop">Dagverslag</h3>
        <span className="onder">{eerste ? `${DATUM.format(new Date(`${eerste.datum}T12:00:00Z`))}${eerste.soort === "tussendoor" ? ", tussendoor" : ""}` : "nog geen verslag"}</span>
      </div>
      <p className="onder">
        Elke avond om {stand.tijd} uur vertelt elke afdeling wat ze die dag deed.{" "}
        {stand.mailIngesteld ? "Je krijgt elk verslag ook apart per mail." : "Per mail staat nog uit: draai eenmalig scripts/zet-mail.sh."}
      </p>
      {stand.bezig && <p className="rustig" role="status">De verslaggever is aan het schrijven…</p>}
      {actief && (
        <>
          <div className="dagverslag-tabs" role="tablist" aria-label="Afdeling">
            {stand.verslagen.map((v) => (
              <button key={v.team} role="tab" aria-selected={v.team === actief.team} className={`dagverslag-tab${v.team === actief.team ? " actief" : ""}`} onClick={() => setGekozen(v.team)}>
                {v.naam}
              </button>
            ))}
          </div>
          <div className="dagverslag-tekst" role="tabpanel">
            {actief.tekst}
          </div>
          <p className="onder">
            {actief.door === "nood" ? "Kaal verslag uit de logboeken. " : ""}
            {stand.mailIngesteld ? (actief.gemaild ? "Gemaild." : "Nog niet gemaild.") : ""}
          </p>
        </>
      )}
      {stand.melding && <p className="onder" role="status">{stand.melding}</p>}
      {ik === "mark" && (
        <button className="knop" disabled={bezig || stand.bezig} onClick={() => void maak()}>
          Verslag van vandaag tot nu toe
        </button>
      )}
      {fout && <p className="signaal" role="alert">{fout}</p>}
    </section>
  );
}
