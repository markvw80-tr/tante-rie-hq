import { useState } from "react";
import type { AutomaatStand } from "../../shared/types.ts";
import { BUDGETTEN } from "../regie/api.ts";
import { zetAutomaat } from "../schrijven/api.ts";

type Props = {
  readonly stand: AutomaatStand;
  readonly onGewijzigd: () => void;
};

/** Schakelaar voor automatisch oppakken: het huis start de lead van een team als er nieuwe post ligt. */
export function AutomaatKaart({ stand, onGewijzigd }: Props) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const zet = async (aan: boolean, budgetUsd: number) => {
    setBezig(true);
    setFout(null);
    try {
      await zetAutomaat(aan, budgetUsd);
      onGewijzigd();
    } catch (e) {
      setFout((e as Error).message);
    } finally {
      setBezig(false);
    }
  };

  return (
    <section className={`kaart automaat${stand.aan ? " aan" : ""}`} aria-labelledby="automaat-kop">
      <div className="kaart-kop">
        <h3 id="automaat-kop">Post automatisch laten oppakken</h3>
        <label className="schakelaar">
          <input type="checkbox" role="switch" checked={stand.aan} disabled={bezig} onChange={(e) => void zet(e.target.checked, stand.budgetUsd)} />
          <span>{stand.aan ? "Aan" : "Uit"}</span>
        </label>
      </div>
      <p className="onder">
        Na elke keer post ophalen start het huis de lead van een team met nieuwe post (SEO Lead, PIM Orchestrator, Design Lead). Hooguit {stand.maxPerDag} starts per 24 uur, per
        team minstens {stand.rustMinuten} minuten ertussen, en live acties wachten nog steeds op jou.
      </p>
      <fieldset className="prioriteit" disabled={bezig}>
        <legend>Budget per automatische run</legend>
        {BUDGETTEN.map((b) => (
          <label key={b}>
            <input type="radio" name="automaat-budget" checked={stand.budgetUsd === b} onChange={() => void zet(stand.aan, b)} /> ${b}
          </label>
        ))}
      </fieldset>
      {stand.aan && (
        <p className="onder automaat-stand" role="status">
          {stand.startsLaatsteDag} van {stand.maxPerDag} starts gebruikt in de laatste 24 uur{stand.melding ? `. ${stand.melding}` : "."}
        </p>
      )}
      {fout && <p className="signaal">{fout}</p>}
    </section>
  );
}
