import { useEffect, useRef, useState } from "react";
import { PERSOON_NAAM, type RunRegel } from "../../shared/types.ts";
import { TEAM_LABEL } from "../teamKleur.ts";
import { EIND, STATUS_TEKST, euro, stopRun } from "./api.ts";
import { PoortKaart } from "./PoortKaart.tsx";
import { useRunStroom } from "./useRunStroom.ts";

const SOORT_LABEL: Record<RunRegel["soort"], string> = {
  systeem: "huis",
  tekst: "agent",
  tool: "doet",
  resultaat: "uitkomst",
  poort: "poort",
  besluit: "Mark",
  fout: "fout",
};
const tijd = (iso: string) => new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Live meekijken met één agent: de werkbon met log, poortvraag en stopknop. */
export function Werkbank({ id, onSluit }: { readonly id: string; readonly onSluit: () => void }) {
  const { run, verbonden } = useRunStroom(id);
  const [stoppen, setStoppen] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [volgen, setVolgen] = useState(true);
  const log = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (volgen && log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [run?.regels.length, volgen]);

  useEffect(() => {
    const toets = (e: KeyboardEvent) => e.key === "Escape" && onSluit();
    window.addEventListener("keydown", toets);
    return () => window.removeEventListener("keydown", toets);
  }, [onSluit]);

  const stop = async () => {
    setStoppen(true);
    try {
      await stopRun(id);
    } catch (e) {
      setFout((e as Error).message);
    } finally {
      setStoppen(false);
    }
  };

  return (
    <div className="lezer-achtergrond" onClick={onSluit}>
      <section className="lezer werkbank" role="dialog" aria-modal="true" aria-label="Werkbank" onClick={(e) => e.stopPropagation()}>
        <header className="lezer-kop">
          <div>
            <div className="onder">{run ? `${TEAM_LABEL[run.team]} · werkbon` : "Verbinden..."}</div>
            <h2>{run?.agent ?? " "}</h2>
          </div>
          <div className="kop-knoppen">
            {run && !EIND.has(run.status) && (
              <button className="knop nee klein" onClick={stop} disabled={stoppen}>
                {stoppen ? "Stoppen..." : "Stoppen"}
              </button>
            )}
            <button className="terug" onClick={onSluit}>
              Sluiten
            </button>
          </div>
        </header>
        {run && (
          <>
            <dl className="lezer-meta">
              <div><dt>status</dt><dd className={`status-${run.status}`}>{STATUS_TEKST[run.status]}{run.budgetOp ? ", budget op" : ""}</dd></div>
              <div><dt>budget</dt><dd>{euro(run.budgetUsd)}</dd></div>
              <div><dt>gestart door</dt><dd>{run.bron === "huis" ? "het huis (nieuwe post)" : PERSOON_NAAM[run.bron ?? "mark"]}</dd></div>
              <div><dt>kosten</dt><dd>{euro(run.kostenUsd)}</dd></div>
              <div><dt>gestart</dt><dd>{tijd(run.gestart)}</dd></div>
              {!verbonden && !EIND.has(run.status) && <div><dt>verbinding</dt><dd>herstellen...</dd></div>}
            </dl>
            <blockquote className="opdracht">{run.opdracht}</blockquote>
            {run.poort && run.status === "wacht" && <PoortKaart runId={run.id} verzoek={run.poort} agent={run.agent} />}
            {fout && <p className="signaal">{fout}</p>}
            <ol className="runlog" ref={log} aria-live="polite" onScroll={(e) => {
              const el = e.currentTarget;
              setVolgen(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
            }}>
              {run.regels.map((r, i) => (
                <li key={`${r.t}-${i}`} className={`log-${r.soort}`}>
                  <span className="log-tijd">{tijd(r.t)}</span>
                  <span className="log-soort">{SOORT_LABEL[r.soort]}</span>
                  <span className="log-tekst">{r.tekst}</span>
                </li>
              ))}
            </ol>
            {run.resultaat && (
              <div className="kaart">
                <h3>Afsluiting van de agent</h3>
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{run.resultaat}</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
