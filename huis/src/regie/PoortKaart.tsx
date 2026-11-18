import { useState } from "react";
import type { PoortVerzoek, PoortWijziging } from "../../shared/types.ts";
import { beslisPoort } from "./api.ts";

/** De goedkeuringspoort. Live acties vragen een extra vinkje voordat Toestaan werkt. */
export function PoortKaart({ runId, verzoek, agent }: { readonly runId: string; readonly verzoek: PoortVerzoek; readonly agent: string }) {
  const [notitie, setNotitie] = useState("");
  const [zeker, setZeker] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const live = verzoek.soort === "live";

  const beslis = async (toestaan: boolean) => {
    setBezig(true);
    setFout(null);
    try {
      await beslisPoort(runId, verzoek.id, toestaan, notitie);
    } catch (e) {
      setFout((e as Error).message);
      setBezig(false);
    }
  };

  return (
    <div className={`poort ${live ? "live" : "toestemming"}`} role="alertdialog" aria-label={`${agent} vraagt toestemming`}>
      <div className="poort-kop">{live ? "Live, wacht op jou" : "Vraagt toestemming"}</div>
      <p className="poort-wat">
        <strong>{agent}</strong> wil:
      </p>
      <p className="poort-actie">{verzoek.uitleg?.kop ?? verzoek.samenvatting}</p>
      {verzoek.uitleg && verzoek.uitleg.punten.length > 0 && (
        <ul className="poort-punten">
          {verzoek.uitleg.punten.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {verzoek.agentZegt && (
        <blockquote className="poort-agent">
          <span className="onder">Wat de agent erbij zei</span>
          {verzoek.agentZegt}
        </blockquote>
      )}
      {verzoek.uitleg?.wijzigingen.map((w, i) => (
        <Wijziging key={`${w.bestand}-${i}`} wijziging={w} />
      ))}
      <p className="onder">Waarom dit langs jou gaat: {verzoek.reden}</p>
      <details>
        <summary>Technische details</summary>
        <p className="onder">{verzoek.samenvatting}</p>
        <pre className="voorbeeld">{verzoek.invoer}</pre>
      </details>
      <label className="poort-notitie">
        Notitie voor de agent (optioneel)
        <input value={notitie} maxLength={1000} onChange={(e) => setNotitie(e.target.value)} />
      </label>
      {live && (
        <label className="vinkje">
          <input type="checkbox" checked={zeker} onChange={(e) => setZeker(e.target.checked)} /> Ik weet dat dit direct in de webshop of het live thema terechtkomt.
        </label>
      )}
      {fout && <p className="signaal">{fout}</p>}
      <div className="knoppen">
        <button className="knop nee" onClick={() => beslis(false)} disabled={bezig}>
          Weigeren
        </button>
        <button className={`knop ${live ? "goed" : ""}`} onClick={() => beslis(true)} disabled={bezig || (live && !zeker)}>
          Toestaan
        </button>
      </div>
    </div>
  );
}

/** Regels die verdwijnen (rood, met min) en regels die erbij komen (groen, met plus). */
function Wijziging({ wijziging }: { readonly wijziging: PoortWijziging }) {
  return (
    <figure className="poort-wijziging">
      <figcaption>{wijziging.nieuw ? `Nieuwe inhoud van ${wijziging.bestand}` : `Wijziging in ${wijziging.bestand}`}</figcaption>
      <pre>
        {wijziging.voor.map((r, i) => (
          <span key={`v${i}`} className="weg">
            {`− ${r}\n`}
          </span>
        ))}
        {wijziging.na.map((r, i) => (
          <span key={`n${i}`} className="erbij">
            {`+ ${r}\n`}
          </span>
        ))}
      </pre>
    </figure>
  );
}
