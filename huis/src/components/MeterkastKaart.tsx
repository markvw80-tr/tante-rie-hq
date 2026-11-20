import type { GezondheidStand, MeterKleur } from "../../shared/types.ts";

const KLEURWOORD: Record<MeterKleur, string> = { groen: "in orde", oranje: "let op", rood: "storing" };
const VOLGORDE: Record<MeterKleur, number> = { rood: 0, oranje: 1, groen: 2 };

/** De meterkast: per controle een lampje, met wat er mis is. Problemen staan bovenaan. */
export function MeterkastKaart({ stand }: { readonly stand: GezondheidStand }) {
  const metingen = [...stand.metingen].sort((a, b) => VOLGORDE[a.kleur] - VOLGORDE[b.kleur]);
  const problemen = metingen.filter((m) => m.kleur !== "groen").length;
  const tijd = new Date(stand.bijgewerkt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  return (
    <section className="kaart meterkast" aria-labelledby="meterkast-kop">
      <div className="kaart-kop">
        <h3 id="meterkast-kop">Meterkast</h3>
        <span className="onder">gecontroleerd om {tijd}</span>
      </div>
      <p className="onder">
        Elke 10 minuten kijkt het huis of alles gezond is. Bij een nieuw probleem start de systeembeheerder: die lost veilige dingen zelf op en legt de rest aan je voor.
      </p>
      {problemen === 0 && <p className="rustig">Alles in orde.</p>}
      <ul className="meters">
        {metingen.map((m) => (
          <li key={m.id} className={`meter ${m.kleur}`}>
            <span className="meter-lamp" aria-hidden="true" />
            <div>
              <strong>{m.naam}</strong> <span className="meter-woord">({KLEURWOORD[m.kleur]})</span>
              <div className="onder">{m.tekst}</div>
              {m.kleur !== "groen" && m.details.length > 0 && (
                <ul>
                  {m.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
      {stand.melding && (
        <p className="onder meterkast-melding" role="status">
          {stand.melding}
        </p>
      )}
    </section>
  );
}
