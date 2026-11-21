import type { Kengetal, TeamKengetallen } from "../../shared/types.ts";
import { korteDatum, TEAM_KLEUR, TEAM_LABEL } from "../teamKleur.ts";

/** Na zoveel dagen zonder nieuwe meting staat er "verouderd" bij een team. */
const VEROUDERD_DAGEN = 8;
const DAG_MS = 86_400_000;
const getalNl = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 });

function opmaak(waarde: number | null, eenheid: string): string {
  if (waarde === null) return "nog niet gemeten";
  const n = getalNl.format(Math.abs(waarde));
  const min = waarde < 0 ? "−" : "";
  if (eenheid === "€") return `${min}€ ${n}`;
  if (min) return `${min}${n}${eenheid ? (eenheid === "%" ? "%" : ` ${eenheid}`) : ""}`;
  return eenheid ? `${n}${eenheid === "%" ? "" : " "}${eenheid}` : n;
}

/** Verschil met de vorige meting, met een kleur die zegt of dat goed of slecht is. */
function Verschil({ k }: { readonly k: Kengetal }) {
  if (k.waarde === null || k.vorige === null || k.waarde === k.vorige) return k.vorige !== null && k.waarde === k.vorige ? <span className="kg-gelijk">gelijk</span> : null;
  const hoger = k.waarde > k.vorige;
  const goed = hoger === (k.beter === "hoger");
  const delta = k.eenheid === "%" ? `${getalNl.format(Math.abs(k.waarde - k.vorige))} procentpunt` : opmaak(Math.abs(k.waarde - k.vorige), k.eenheid);
  return (
    <span className={goed ? "kg-goed" : "kg-slecht"}>
      <span aria-hidden="true">{hoger ? "▲" : "▼"}</span> {hoger ? "+" : "−"}
      {delta} <span className="kg-was">(was {opmaak(k.vorige, k.eenheid)})</span>
    </span>
  );
}

function verouderd(bijgewerkt: string, vandaag: string): boolean {
  const t = Date.parse(bijgewerkt);
  return Number.isFinite(t) && Date.parse(vandaag) - t > VEROUDERD_DAGEN * DAG_MS;
}

/** De meetpunten van het hoofddoel op één plek: winst, omzet, reviews en vindbaarheid, uit data/kengetallen.json per team. */
export function DoelenKaart({ teams, vandaag }: { readonly teams: readonly TeamKengetallen[]; readonly vandaag: string }) {
  return (
    <section className="kaart doelen-kaart" aria-labelledby="doelen-kop">
      <div className="kaart-kop">
        <h3 id="doelen-kop">Hoe staat Tante Rie ervoor</h3>
        <span className="onder">meetpunten van het hoofddoel</span>
      </div>
      {teams.length === 0 && <p className="onder">Nog geen kengetallen. De teams schrijven ze in data/kengetallen.json.</p>}
      {teams.map((t) => (
        <div key={t.team} className="kg-team">
          <h4>
            <span className="kosten-stip" style={{ background: TEAM_KLEUR[t.team] }} aria-hidden="true" />
            {TEAM_LABEL[t.team]}
            <span className="onder"> · bijgewerkt {korteDatum(t.bijgewerkt.slice(0, 10))}</span>
            {verouderd(t.bijgewerkt, vandaag) && <span className="kg-oud"> verouderd</span>}
          </h4>
          <ul className="kg-lijst">
            {t.cijfers.map((k) => (
              <li key={k.id} className="kg-cijfer">
                <span className="kg-label">{k.label}</span>
                <span className="kg-waarde">{opmaak(k.waarde, k.eenheid)}</span>
                <Verschil k={k} />
                <span className="kg-bron">
                  {k.periode}
                  {k.bron ? ` · ${k.bron}` : ""}
                </span>
              </li>
            ))}
          </ul>
          {t.fouten.length > 0 && <p className="kg-fout">Niet gelukt: {t.fouten.join("; ")}</p>}
        </div>
      ))}
    </section>
  );
}
