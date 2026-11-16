import { useState } from "react";
import type { PoortVerzoek } from "../../shared/types.ts";
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
        <strong>{agent}</strong> wil: {verzoek.samenvatting}
      </p>
      <p className="onder">{verzoek.reden}</p>
      <details>
        <summary>Precieze invoer</summary>
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
