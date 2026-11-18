import type { KostenOverzicht } from "../../shared/types.ts";
import { euro } from "../regie/api.ts";
import { TEAM_KLEUR, TEAM_LABEL } from "../teamKleur.ts";

/** Wat de agents kosten per team, uit de werkbonnen van het huis (afgelopen 7 dagen en deze maand). */
export function KostenKaart({ kosten }: { readonly kosten: KostenOverzicht }) {
  const budgetOp = kosten.teams.reduce((s, t) => s + t.budgetOpWeek, 0);
  return (
    <section className="kaart kosten" aria-labelledby="kosten-kop">
      <div className="kaart-kop">
        <h3 id="kosten-kop">Kosten van de agents</h3>
        <span className="onder">
          7 dagen {euro(kosten.weekUsd)} · maand {euro(kosten.maandUsd)}
        </span>
      </div>
      {kosten.teams.length === 0 ? (
        <p className="onder">Nog geen runs via het huis in de afgelopen 7 dagen of deze maand.</p>
      ) : (
        <table className="kosten-tabel">
          <thead>
            <tr>
              <th scope="col">Team</th>
              <th scope="col">7 dagen</th>
              <th scope="col">waarvan automatisch</th>
              <th scope="col">maand</th>
              <th scope="col">runs</th>
            </tr>
          </thead>
          <tbody>
            {kosten.teams.map((t) => (
              <tr key={t.team}>
                <th scope="row">
                  <span className="kosten-stip" style={{ background: TEAM_KLEUR[t.team] }} aria-hidden="true" />
                  {TEAM_LABEL[t.team]}
                </th>
                <td>{euro(t.weekUsd)}</td>
                <td>{euro(t.automatischWeekUsd)}</td>
                <td>{euro(t.maandUsd)}</td>
                <td>
                  {t.runsWeek}
                  {t.budgetOpWeek > 0 && <span className="kosten-budget"> ({t.budgetOpWeek} budget op)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {budgetOp > 0 && (
        <p className="signaal">
          {budgetOp === 1 ? "Eén run stopte" : `${budgetOp} runs stopten`} deze week omdat het budget op was; dat werk is waarschijnlijk niet af. Kies eventueel een hoger budget.
        </p>
      )}
      {kosten.zonderKostenWeek > 0 && (
        <p className="onder">{kosten.zonderKostenWeek} run(s) zonder bekend bedrag (gestopt of onderbroken), niet meegeteld.</p>
      )}
      <p className="onder">Alleen runs die via het huis liepen; sessies die je zelf in Claude start tellen hier niet mee.</p>
    </section>
  );
}
