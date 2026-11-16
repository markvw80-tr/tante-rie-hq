import { useState } from "react";
import type { TeamWerk, WerkBronInfo } from "../../../shared/types.ts";
import { useLezer } from "../../lezer/LezerContext.tsx";
import { korteDatum } from "../../teamKleur.ts";

const EERSTE = 6;

export function WerkTab({ werk }: { readonly werk: TeamWerk | null }) {
  if (!werk) return <section className="kaart onder">Werk wordt opgehaald...</section>;
  const gevuld = werk.bronnen.filter((b) => b.totaal > 0);
  const leeg = werk.bronnen.filter((b) => b.totaal === 0);
  return (
    <>
      {gevuld.map((b) => (
        <BronKaart key={b.id} bron={b} team={werk.team} />
      ))}
      {leeg.length > 0 && <p className="onder">Nog leeg: {leeg.map((b) => b.label).join(", ")}.</p>}
    </>
  );
}

function BronKaart({ bron, team }: { readonly bron: WerkBronInfo; readonly team: TeamWerk["team"] }) {
  const [alles, setAlles] = useState(false);
  const lees = useLezer();
  const docs = alles ? bron.documenten : bron.documenten.slice(0, EERSTE);
  return (
    <section className="kaart">
      <div className="kaart-kop">
        <h3>{bron.label}</h3>
        <span className="onder">{bron.totaal}</span>
      </div>
      <ul className="doclijst">
        {docs.map((d) => (
          <li key={d.bestand}>
            <button className="doclink" onClick={() => lees({ soort: "werk", team, bron: bron.id, bestand: d.bestand })}>
              {d.titel}
            </button>
            {d.datum && <span className="onder">{korteDatum(d.datum)}</span>}
          </li>
        ))}
      </ul>
      {bron.documenten.length > EERSTE && (
        <button className="terug" onClick={() => setAlles(!alles)}>
          {alles ? "Minder tonen" : `Alle ${bron.documenten.length} tonen`}
        </button>
      )}
      {bron.totaal > bron.documenten.length && <p className="onder">De nieuwste {bron.documenten.length} van {bron.totaal} staan hier.</p>}
    </section>
  );
}
