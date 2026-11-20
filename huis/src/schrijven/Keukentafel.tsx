import { useEffect, useRef, useState, type FormEvent } from "react";
import { PERSOON_NAAM, type MailboxTeam } from "../../shared/types.ts";
import { useIk } from "../ik.ts";
import { TEAMS, stuurOpdracht, type Concept, type Verstuurd } from "./api.ts";

interface Props {
  readonly begin: Concept;
  readonly onKlaar: (v: Verstuurd) => void;
  readonly onAnnuleer: () => void;
}

const MAX_ONDERWERP = 110;
const MAX_TEKST = 8000;

/** Opdracht of antwoord van Mark aan een team. Eerst schrijven, dan controleren, dan pas versturen. */
export function Keukentafel({ begin, onKlaar, onAnnuleer }: Props) {
  const ik = useIk();
  const [concept, setConcept] = useState<Concept>(begin);
  const [stap, setStap] = useState<"schrijven" | "controleren">("schrijven");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const eerste = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    eerste.current?.focus();
    const toets = (e: KeyboardEvent) => e.key === "Escape" && !bezig && onAnnuleer();
    window.addEventListener("keydown", toets);
    return () => window.removeEventListener("keydown", toets);
  }, [onAnnuleer, bezig]);

  const zet = <K extends keyof Concept>(k: K, v: Concept[K]) => setConcept((c) => ({ ...c, [k]: v }));
  const onderwerp = concept.onderwerp.trim();
  const tekst = concept.tekst.trim();
  const probleem =
    !concept.aan ? "Kies een team." : onderwerp.length < 3 ? "Het onderwerp is te kort." : onderwerp.startsWith("-") ? "Begin het onderwerp niet met een streepje." : tekst.length === 0 ? "Schrijf wat het team moet doen." : null;

  const controleer = (e: FormEvent) => {
    e.preventDefault();
    if (!probleem) setStap("controleren");
  };

  const verstuur = async () => {
    setBezig(true);
    setFout(null);
    try {
      onKlaar(await stuurOpdracht({ ...concept, onderwerp, tekst }));
    } catch (e) {
      setFout((e as Error).message);
      setBezig(false);
    }
  };

  const teamNaam = TEAMS.find(([id]) => id === concept.aan)?.[1] ?? "";

  if (stap === "controleren") {
    return (
      <section className="keukentafel" aria-live="polite">
        <div className="onder">Controleer voor je verstuurt</div>
        <h2>{onderwerp}</h2>
        <dl className="lezer-meta">
          <div><dt>van</dt><dd>mark</dd></div>
          <div><dt>aan</dt><dd>{teamNaam}</dd></div>
          <div><dt>prioriteit</dt><dd>{concept.prioriteit}</dd></div>
          {concept.antwoordOp && <div><dt>antwoord op</dt><dd>{concept.antwoordOp}</dd></div>}
        </dl>
        <pre className="voorbeeld">{tekst}</pre>
        <p className="onder">
          Het bericht komt als bericht van jou in de inbox van {teamNaam}. Het wordt via git op main van tante-rie-hq gezet, dus de teams zien het meteen.
        </p>
        {fout && <p className="signaal">{fout}</p>}
        <div className="knoppen">
          <button className="knop-tweede" onClick={() => setStap("schrijven")} disabled={bezig}>
            Terug
          </button>
          <button className="knop" onClick={verstuur} disabled={bezig}>
            {bezig ? "Versturen..." : "Versturen"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <form className="keukentafel" onSubmit={controleer}>
      <div className="onder">Keukentafel</div>
      <h2>{`${concept.antwoordOp ? "Antwoord" : "Opdracht"} van ${PERSOON_NAAM[ik]}`}</h2>
      <label>
        Aan
        <select ref={eerste} value={concept.aan ?? ""} onChange={(e) => zet("aan", (e.target.value || null) as MailboxTeam | null)} required>
          <option value="">Kies een team</option>
          {TEAMS.map(([id, naam]) => (
            <option key={id} value={id}>
              {naam}
            </option>
          ))}
        </select>
      </label>
      <label>
        Onderwerp
        <input value={concept.onderwerp} maxLength={MAX_ONDERWERP} onChange={(e) => zet("onderwerp", e.target.value.replace(/[\r\n]/g, " "))} required />
      </label>
      <label>
        Wat moet er gebeuren
        <textarea value={concept.tekst} maxLength={MAX_TEKST} rows={8} onChange={(e) => zet("tekst", e.target.value)} required />
        <span className="onder teller">{concept.tekst.length} / {MAX_TEKST}</span>
      </label>
      <fieldset className="prioriteit">
        <legend>Prioriteit</legend>
        {(["laag", "normaal", "hoog"] as const).map((p) => (
          <label key={p}>
            <input type="radio" name="prioriteit" checked={concept.prioriteit === p} onChange={() => zet("prioriteit", p)} /> {p}
          </label>
        ))}
      </fieldset>
      {probleem && (concept.onderwerp || concept.tekst) && <p className="onder">{probleem}</p>}
      <div className="knoppen">
        <button type="button" className="knop-tweede" onClick={onAnnuleer}>
          Annuleren
        </button>
        <button type="submit" className="knop" disabled={Boolean(probleem)}>
          Controleren
        </button>
      </div>
    </form>
  );
}
