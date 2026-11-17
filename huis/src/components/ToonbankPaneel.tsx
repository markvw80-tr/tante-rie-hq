import type { HuisStand } from "../../shared/types.ts";
import { BesluitKaart } from "../schrijven/BesluitKaart.tsx";
import { WachtOpJou } from "../regie/WachtOpJou.tsx";
import { useSchrijven } from "../schrijven/SchrijfContext.tsx";
import { korteDatum } from "../teamKleur.ts";
import { AgendaKaart } from "./AgendaKaart.tsx";
import { AutomaatKaart } from "./AutomaatKaart.tsx";

export function ToonbankPaneel({ huis, onGewijzigd }: { readonly huis: HuisStand; readonly onGewijzigd: () => void }) {
  const { open: schrijf } = useSchrijven();
  const open = huis.besluiten.filter((b) => !b.antwoord);
  const beantwoord = huis.besluiten.filter((b) => b.antwoord);
  const openRegels = huis.jsonMailbox.flatMap((j) => j.open.map((o) => ({ ...o, naam: j.naam })));
  return (
    <div className="paneel">
      <WachtOpJou runs={huis.runs ?? []} />
      <section className="kaart" aria-labelledby="toonbank-kop">
        <div className="kaart-kop">
          <h2 id="toonbank-kop">Op de toonbank</h2>
          <span className="onder">{huis.agenda ? `agenda ${korteDatum(huis.agenda.datum)}` : "geen agenda"}</span>
        </div>
        <p className="onder">
          Wat jouw akkoord nodig heeft. Je antwoord gaat als bericht van jou naar het team. Een bericht van een team is geen akkoord.
        </p>
        {open.length === 0 && <p className="rustig">Er wachten geen besluiten op je.</p>}
        {[...open, ...beantwoord].map((b) => (
          <BesluitKaart key={b.id} besluit={b} nummer={huis.besluiten.indexOf(b) + 1} />
        ))}
      </section>

      <section className="kaart keukentafel-kaart">
        <h3>Keukentafel</h3>
        <p className="onder">Geef een team een opdracht. Je ziet het bericht eerst terug voordat het verstuurd wordt.</p>
        <button className="knop" onClick={() => schrijf({})}>
          Opdracht geven
        </button>
      </section>

      {huis.automaat && <AutomaatKaart stand={huis.automaat} onGewijzigd={onGewijzigd} />}

      {huis.agenda && <AgendaKaart agenda={huis.agenda} zonderMark />}

      <section className="kaart">
        <h3>Productregels SEO en PIM</h3>
        {openRegels.length === 0 ? (
          <p className="onder">Geen open regels in seo-naar-pim of pim-naar-seo.</p>
        ) : (
          <ul>
            {openRegels.map((r) => (
              <li key={`${r.naam}-${r.berichtId}`}>
                {r.naam}: {r.berichtId}, {r.regelsOpen} van {r.regelsTotaal} regels open
                {r.leeftijdDagen !== null && r.leeftijdDagen >= huis.drempelDagen ? `, ${r.leeftijdDagen} dagen oud` : ""}
              </li>
            ))}
          </ul>
        )}
        {huis.jsonMailbox.some((j) => !j.leesbaar) && <p className="signaal">Een JSON-mailbox kon niet worden gelezen.</p>}
      </section>
    </div>
  );
}
