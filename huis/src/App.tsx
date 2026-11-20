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
import { useVolledigScherm } from "./useVolledigScherm.ts";
import { VolledigKnop } from "./components/VolledigKnop.tsx";
import type { PostStand } from "../shared/types.ts";
import { IkContext } from "./ik.ts";

export function App() {
  const { huis, fout, laadt, bijgewerkt, ververs } = useHuis();
  const [gekozen, setGekozen] = useState<Plek>("toonbank");
  const paneelRef = useRef<HTMLDivElement>(null);
  const [melding, setMelding] = useState<string | null>(null);
  const [ophalen, setOphalen] = useState(false);
  const { aan: volledig, zet: zetVolledig } = useVolledigScherm();
  const [ladeOpen, setLadeOpen] = useState(false);
  // Pas animeren nadat de lade een keer open is geweest, anders schuift hij zichtbaar weg bij het aanzetten.
  const [ladeBeweegt, setLadeBeweegt] = useState(false);

  useEffect(() => {
    if (!volledig) {
      setLadeOpen(false);
      setLadeBeweegt(false);
    }
  }, [volledig]);

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
    // In volledig scherm opent een kamer als lade over het huis.
    if (volledig) {
      setLadeBeweegt(true);
      setLadeOpen(true);
      return;
    }
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
    <IkContext.Provider value={huis.ik ?? "mark"}>
    <SchrijfProvider onVerstuurd={naVersturen}>
    <RegieProvider>
    <LezerProvider>
    <main className={volledig ? "app volledig" : "app"}>
      <header className="kop">
        <div>
          <div className="datum">{langeDatum(huis.vandaag)}</div>
          <h1>
            Het Huis van <em>Tante Rie</em>
          </h1>
        </div>
        <div className="tellers">
          {huis.ik === "nikkie" && <span className="tag ik-tag">Ingelogd als Nikkie</span>}
          <span className="tag">{agents} agents in 4 kamers</span>
          <span className="tag">{ongelezen} berichten onderweg</span>
          <span className="tag">{huis.besluiten.filter((b) => !b.antwoord).length} besluiten voor jou</span>
          {aanHetWerk > 0 && <span className="tag werkt">{aanHetWerk} aan het werk</span>}
          {wachtOpJou > 0 && <span className="tag let-op">{wachtOpJou} agent wacht op jou</span>}
          {volledig && (
            <button type="button" className="tag tag-knop" onClick={() => kies("toonbank")}>
              Naar de toonbank
            </button>
          )}
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
          <VolledigKnop aan={volledig} onWissel={() => zetVolledig(!volledig)} />
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
        <div
          ref={paneelRef}
          className={volledig ? `lade${ladeOpen ? " open" : ""}${ladeBeweegt ? " beweegt" : ""}` : undefined}
          aria-hidden={volledig && !ladeOpen ? true : undefined}
        >
          {volledig && (
            <button type="button" className="terug lade-sluit" onClick={() => setLadeOpen(false)}>
              Terug naar het huis
            </button>
          )}
          {team ? (
            <TeamPaneel team={team} agenda={huis.agenda} drempel={huis.drempelDagen} bijgewerkt={bijgewerkt} runs={huis.runs ?? []} onTerug={() => setGekozen("toonbank")} pakhuis={huis.pakhuis} />
          ) : (
            <ToonbankPaneel huis={huis} onGewijzigd={ververs} />
          )}
        </div>
      </div>

      {!volledig && huis.doelen && <Doelen doelen={huis.doelen} />}

      {!volledig && (
      <footer className="voet">
        Klik een kamer voor post, werk en agents · ververst elke minuut
        {huis.post && <PostRegel stand={huis.post} />}
        {huis.opAfstand && (
          <>
            {" · op afstand via Tailscale: "}
            <a href={huis.opAfstand}>{huis.opAfstand.replace(/^https:\/\//, "")}</a>
          </>
        )}
        {bijgewerkt && ` · bijgewerkt ${bijgewerkt.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`} ·{" "}
        <button className="terug" onClick={ververs}>
          Nu verversen
        </button>{" "}
        <button className="terug" onClick={postOphalen} disabled={ophalen}>
          {ophalen ? "Post ophalen..." : "Post ophalen"}
        </button>
      </footer>
      )}
      {melding && (
        <div className="toast" role="status">
          {melding}
        </div>
      )}
    </main>
    </LezerProvider>
    </RegieProvider>
    </SchrijfProvider>
    </IkContext.Provider>
  );
}

const tijdstip = (iso: string) => new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

/** Wanneer de post van origin/main voor het laatst is opgehaald, en of dat automatisch gebeurt. */
function PostRegel({ stand }: { readonly stand: PostStand }) {
  if (stand.fout) return <span className="post-fout"> · post ophalen mislukt: {stand.fout}</span>;
  const auto = stand.automatischMinuten ? `, automatisch elke ${stand.automatischMinuten} min` : "";
  return <span> · post {stand.opgehaald ? `opgehaald om ${tijdstip(stand.opgehaald)}` : "nog niet opgehaald"}{auto}</span>;
}
