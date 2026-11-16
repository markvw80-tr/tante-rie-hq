import type { Agenda } from "../../shared/types.ts";
import { langeDatum } from "../teamKleur.ts";

export function AgendaKaart({ agenda, zonderMark = false }: { readonly agenda: Agenda; readonly zonderMark?: boolean }) {
  const secties = agenda.secties.filter((s) => !(zonderMark && /^mark\b/i.test(s.titel)));
  return (
    <section className="kaart" aria-label="Agenda van de directie">
      <h3>Agenda van de directie</h3>
      <p className="onder">
        {langeDatum(agenda.datum)} · {agenda.bestand}
      </p>
      {secties.map((s) => (
        <details key={s.titel} className="status-blok">
          <summary>
            {s.titel}
            <span>{s.items.length} punten</span>
          </summary>
          {s.alineas.map((a) => (
            <p key={a} className="onder">
              {a}
            </p>
          ))}
          <ol>
            {s.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ol>
        </details>
      ))}
    </section>
  );
}
