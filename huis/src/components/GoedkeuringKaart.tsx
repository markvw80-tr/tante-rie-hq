import { useState } from "react";
import { zetGoedkeuring } from "../schrijven/api.ts";

type Props = {
  readonly aan: boolean;
  readonly onGewijzigd: () => void;
};

/** Schakelaar: toestemmingsvragen van agents automatisch goedkeuren. Live acties wachten altijd op Mark. */
export function GoedkeuringKaart({ aan, onGewijzigd }: Props) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const zet = async (nieuw: boolean) => {
    setBezig(true);
    setFout(null);
    try {
      await zetGoedkeuring(nieuw);
      onGewijzigd();
    } catch (e) {
      setFout((e as Error).message);
    } finally {
      setBezig(false);
    }
  };

  return (
    <section className={`kaart automaat${aan ? " aan" : ""}`} aria-labelledby="goedkeuring-kop">
      <div className="kaart-kop">
        <h3 id="goedkeuring-kop">Toestemming automatisch geven</h3>
        <label className="schakelaar">
          <input type="checkbox" role="switch" checked={aan} disabled={bezig} onChange={(e) => void zet(e.target.checked)} />
          <span>{aan ? "Aan" : "Uit"}</span>
        </label>
      </div>
      <p className="onder">
        Gewone vragen van agents (een commando dat niet op hun lijst staat, schrijven buiten de eigen teammap, een webpagina ophalen) gaan dan direct door en
        komen alleen in het logboek van de run. Aanzetten keurt ook de vragen goed die nu al wachten.
      </p>
      <p className="onder">
        <strong>Live acties wachten altijd op jou:</strong> wijzigingen in Shopify, het thema publiceren of pushen, git push en schrijven naar het Bedrijfsprofiel
        of Merchant Center.
      </p>
      {fout && <p className="signaal">{fout}</p>}
    </section>
  );
}
