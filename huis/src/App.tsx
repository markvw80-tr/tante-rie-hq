import { useCallback, useEffect, useRef, useState } from "react";
import { Doelen } from "./components/Doelen.tsx";
import { Huis } from "./components/huis/Huis.tsx";
import type { Plek } from "./components/huis/maten.ts";
import { TeamPaneel } from "./components/kamer/TeamPaneel.tsx";
import { LezerProvider } from "./lezer/LezerContext.tsx";
import { haalPostOp, type Verstuurd } from "./schrijven/api.ts";
import { SchrijfProvider } from "./schrijven/SchrijfContext.tsx";
import { RegieProvider } from "./regie/RegieContext.tsx";
import { TEAM_LABEL } from "./teamKleur.ts";
import { ToonbankPaneel } from "./components/ToonbankPaneel.tsx";
import { TEAM_KLEUR, langeDatum } from "./teamKleur.ts";
import { useHuis } from "./useHuis.ts";

export function App() {
  const { huis, fout, laadt, bijgewerkt, ververs } = useHuis();
  const [gekozen, setGekozen] = useState<Plek>("toonbank");
  const paneelRef = useRef<HTMLDivElement>(null);
  const [melding, setMelding] = useState<string | null>(null);
  const [ophalen, setOphalen] = useState(false);

  useEffect(() => {
    if (!melding) return;
    const id = window.setTimeout(() => setMelding(null), 6000);
    return () => window.clearTimeout(id);
  }, [melding]);

  const naVersturen = useCallback(
    (v: Verstuurd) => {
      setMelding(`Verstuurd aan ${TEAM_LABEL[v.aan]}: ${v.bestand}`);
      ververs();
    },
    [ververs],
  );

  const postOphalen = async () => {
    setOphalen(true);
    try {
      await haalPostOp();
      setMelding("Post opgehaald van origin/main.");
      ververs();
    } catch (e) {
      setMelding((e as Error).message);
    } finally {
      setOphalen(false);
    }
  };

  const kies = (plek: Plek) => {
    setGekozen(plek);
    // Op een smal scherm staat het paneel onder het huis: breng het in beeld.
    if (window.matchMedia("(max-width: 980px)").matches) {
      requestAnimationFrame(() => paneelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  if (!huis) {
    return (
      <main className="app">
        <div className="melding">{fout ?? (laadt ? "Het huis wordt opgebouwd..." : "Geen gegevens.")}</div>
      </main>
    );
  }

  const team = gekozen === "toonbank" ? null : huis.teams.find((t) => t.id === gekozen) ?? null;
  const ongelezen = huis.teams.reduce((n, t) => n + (t.mailbox?.inbox.length ?? 0), 0);
  const achterstand = huis.teams.filter((t) => t.stemming === "achterstand");
  const agents = huis.teams.reduce((n, t) => n + t.agents.length, 0);
  const aanHetWerk = (huis.runs ?? []).filter((r) => r.status === "bezig").length;
  const wachtOpJou = (huis.runs ?? []).filter((r) => r.status === "wacht").length;

  return (
    <SchrijfProvider onVerstuurd={naVersturen}>
    <RegieProvider>
    <LezerProvider>
    <main className="app">
      <header className="kop">
        <div>
          <div className="datum">{langeDatum(huis.vandaag)}</div>
          <h1>
            Het Huis van <em>Tante Rie</em>
          </h1>
        </div>
        <div className="tellers">
          <span className="tag">{agents} agents in 4 kamers</span>
          <span className="tag">{ongelezen} berichten onderweg</span>
          <span className="tag">{huis.besluiten.filter((b) => !b.antwoord).length} besluiten voor jou</span>
          {aanHetWerk > 0 && <span className="tag werkt">{aanHetWerk} aan het werk</span>}
          {wachtOpJou > 0 && <span className="tag let-op">{wachtOpJou} agent wacht op jou</span>}
          {achterstand.map((t) => (
            <span key={t.id} className="tag let-op">
              {t.naam}: {t.signalen[0]}
            </span>
          ))}
        </div>
      </header>

      {fout && <p className="signaal">Verversen mislukt: {fout}. Je ziet de laatste stand.</p>}

      <div className="indeling">
        <div className="huis-kader">
          <Huis huis={huis} gekozen={gekozen} onKies={kies} />
          <div className="legenda">
            {huis.teams.map((t) => (
              <span key={t.id} style={{ ["--c" as string]: TEAM_KLEUR[t.id] }}>
                {t.naam}
              </span>
            ))}
            <span style={{ ["--c" as string]: "#b9b2a3" }}>Post ouder dan {huis.drempelDagen} dagen</span>
          </div>
        </div>
        <div ref={paneelRef}>
          {team ? (
            <TeamPaneel team={team} agenda={huis.agenda} drempel={huis.drempelDagen} bijgewerkt={bijgewerkt} runs={huis.runs ?? []} onTerug={() => setGekozen("toonbank")} />
          ) : (
            <ToonbankPaneel huis={huis} />
          )}
        </div>
      </div>

      {huis.doelen && <Doelen doelen={huis.doelen} />}

      <footer className="voet">
        Klik een kamer voor post, werk en agents · ververst elke minuut
        {bijgewerkt && ` · bijgewerkt ${bijgewerkt.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`} ·{" "}
        <button className="terug" onClick={ververs}>
          Nu verversen
        </button>{" "}
        <button className="terug" onClick={postOphalen} disabled={ophalen}>
          {ophalen ? "Post ophalen..." : "Post ophalen"}
        </button>
      </footer>
      {melding && (
        <div className="toast" role="status">
          {melding}
        </div>
      )}
    </main>
    </LezerProvider>
    </RegieProvider>
    </SchrijfProvider>
  );
}
