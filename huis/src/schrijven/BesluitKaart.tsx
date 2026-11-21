import { useState } from "react";
import type { Besluit, BesluitKeuze, MailboxTeam } from "../../shared/types.ts";
import { TEAM_KLEUR, TEAM_LABEL, korteDatum } from "../teamKleur.ts";
import { TEAMS, stuurBesluit } from "./api.ts";
import { useSchrijven } from "./SchrijfContext.tsx";
import { useIk } from "../ik.ts";

const KEUZE_LABEL: Record<BesluitKeuze, string> = { akkoord: "Akkoord", afgewezen: "Niet akkoord", vraag: "Vraag terug" };
const KEUZE_KLASSE: Record<BesluitKeuze, string> = { akkoord: "goed", afgewezen: "nee", vraag: "vraag" };

const DAG_MS = 86_400_000;

/** Hoe lang een open besluit al op de agenda staat; rood vanaf de drempel van het huis. */
function OpenSinds({ sinds, vandaag, drempel }: { readonly sinds: string; readonly vandaag: string; readonly drempel: number }) {
  const dagen = Math.max(0, Math.round((Date.parse(vandaag) - Date.parse(sinds)) / DAG_MS));
  const tekst = dagen === 0 ? "nieuw vandaag" : `open sinds ${korteDatum(sinds)}, ${dagen} ${dagen === 1 ? "dag" : "dagen"}`;
  return <p className={`open-sinds${dagen >= drempel ? " oud" : ""}`}>{tekst}</p>;
}

export function BesluitKaart({ besluit, nummer, vandaag, drempel }: { readonly besluit: Besluit; readonly nummer: number; readonly vandaag?: string; readonly drempel?: number }) {
  const ik = useIk();
  const [keuze, setKeuze] = useState<BesluitKeuze | null>(null);
  const [toelichting, setToelichting] = useState("");
  const [aan, setAan] = useState<MailboxTeam | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const { verstuurd } = useSchrijven();

  const team = besluit.team && besluit.team !== "directie" ? (besluit.team as MailboxTeam) : null;
  const ontvanger = team ?? aan;
  const toelichtingNodig = keuze !== null && keuze !== "akkoord";
  const klaar = keuze !== null && ontvanger !== null && (!toelichtingNodig || toelichting.trim().length > 0);

  const verstuur = async () => {
    if (!keuze || !klaar) return;
    setBezig(true);
    setFout(null);
    try {
      verstuurd(await stuurBesluit(besluit.id, keuze, toelichting, team ? null : aan));
      setKeuze(null);
      setToelichting("");
    } catch (e) {
      setFout((e as Error).message);
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className={`besluit${besluit.antwoord ? " beantwoord" : ""}`}>
      <span className="nr">{nummer}</span>
      <div>
        {besluit.team && (
          <span className="team" style={{ ["--c" as string]: TEAM_KLEUR[besluit.team] }}>
            {TEAM_LABEL[besluit.team]}
          </span>
        )}
        <p>{besluit.tekst}</p>
        {!besluit.antwoord && besluit.sinds && vandaag && <OpenSinds sinds={besluit.sinds} vandaag={vandaag} drempel={drempel ?? 3} />}

        {besluit.antwoord && (
          <p className={`stempel ${KEUZE_KLASSE[besluit.antwoord.keuze]}`}>
            {KEUZE_LABEL[besluit.antwoord.keuze]} · naar {besluit.antwoord.aan} · {korteDatum(besluit.antwoord.datum.slice(0, 10))}
          </p>
        )}

        {!keuze && (
          <div className="besluit-knoppen" role="group" aria-label="Besluit nemen">
            {(Object.keys(KEUZE_LABEL) as BesluitKeuze[]).map((k) => (
              <button key={k} className={`keuze ${KEUZE_KLASSE[k]}`} onClick={() => setKeuze(k)}>
                {besluit.antwoord ? `${KEUZE_LABEL[k]} (opnieuw)` : KEUZE_LABEL[k]}
              </button>
            ))}
          </div>
        )}

        {keuze && (
          <div className="besluit-form">
            {!team && (
              <label>
                Naar welk team
                <select value={aan ?? ""} onChange={(e) => setAan((e.target.value || null) as MailboxTeam | null)}>
                  <option value="">Kies een team</option>
                  {TEAMS.map(([id, naam]) => (
                    <option key={id} value={id}>
                      {naam}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              {toelichtingNodig ? "Toelichting (verplicht)" : "Toelichting (mag leeg)"}
              <textarea rows={3} value={toelichting} maxLength={4000} onChange={(e) => setToelichting(e.target.value)} autoFocus />
            </label>
            <p className="onder">
              {ik === "mark"
                ? `${KEUZE_LABEL[keuze]} gaat als bericht van jou, met hoge prioriteit, naar ${ontvanger ? TEAM_LABEL[ontvanger] : "het gekozen team"}.`
                : `Je reactie gaat als bericht van Nikkie naar ${ontvanger ? TEAM_LABEL[ontvanger] : "het gekozen team"}. Het is geen besluit van Mark: het punt blijft open tot Mark beslist.`}
            </p>
            {fout && <p className="signaal">{fout}</p>}
            <div className="knoppen">
              <button className="knop-tweede" onClick={() => setKeuze(null)} disabled={bezig}>
                Annuleren
              </button>
              <button className={`knop ${KEUZE_KLASSE[keuze]}`} onClick={verstuur} disabled={!klaar || bezig}>
                {bezig ? "Versturen..." : `${KEUZE_LABEL[keuze]} versturen`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
