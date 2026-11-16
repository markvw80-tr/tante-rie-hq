import { useState } from "react";
import type { RunSamenvatting, TeamId } from "../../shared/types.ts";
import { BUDGETTEN, EIND, STATUS_TEKST, startRun } from "./api.ts";
import { useMeekijken } from "./RegieContext.tsx";

interface Props {
  readonly team: TeamId;
  readonly agentBestand: string;
  readonly agentNaam: string;
  readonly runs: readonly RunSamenvatting[];
}

/** Knop en formulier om één agent aan het werk te zetten, of meekijken als hij al bezig is. */
export function AgentStart({ team, agentBestand, agentNaam, runs }: Props) {
  const [open, setOpen] = useState(false);
  const [opdracht, setOpdracht] = useState("");
  const [budget, setBudget] = useState<number>(1);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const meekijken = useMeekijken();

  const eigen = runs.filter((r) => r.team === team && r.agent === agentNaam);
  const lopend = eigen.find((r) => !EIND.has(r.status));
  const vorige = eigen.find((r) => EIND.has(r.status));

  if (lopend) {
    return (
      <div className={`agent-run ${lopend.status}`}>
        <span className="pulse" aria-hidden="true" /> {STATUS_TEKST[lopend.status]}
        <button className="doclink" onClick={() => meekijken(lopend.id)}>
          Meekijken
        </button>
      </div>
    );
  }

  const start = async () => {
    setBezig(true);
    setFout(null);
    try {
      const run = await startRun(team, agentBestand, opdracht.trim(), budget);
      setOpen(false);
      setOpdracht("");
      meekijken(run.id);
    } catch (e) {
      setFout((e as Error).message);
    } finally {
      setBezig(false);
    }
  };

  if (!open) {
    return (
      <div className="agent-acties">
        <button className="knop klein" onClick={() => setOpen(true)}>
          Aan het werk zetten
        </button>
        {vorige && (
          <button className="doclink" onClick={() => meekijken(vorige.id)}>
            Laatste werkbon ({STATUS_TEKST[vorige.status]})
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="besluit-form agent-start">
      <label>
        Opdracht voor {agentNaam}
        <textarea rows={4} value={opdracht} maxLength={4000} onChange={(e) => setOpdracht(e.target.value)} autoFocus />
      </label>
      <fieldset className="prioriteit">
        <legend>Maximaal budget</legend>
        {BUDGETTEN.map((b) => (
          <label key={b}>
            <input type="radio" name={`budget-${agentBestand}`} checked={budget === b} onChange={() => setBudget(b)} /> ${b}
          </label>
        ))}
      </fieldset>
      <p className="onder">
        De agent werkt in de map van het team met de eigen regels en hooks. Lezen en schrijven in die map gaat vanzelf; al het andere, en alles wat live gaat, komt eerst bij jou.
      </p>
      {fout && <p className="signaal">{fout}</p>}
      <div className="knoppen">
        <button className="knop-tweede" onClick={() => setOpen(false)} disabled={bezig}>
          Annuleren
        </button>
        <button className="knop" onClick={start} disabled={bezig || opdracht.trim().length < 5}>
          {bezig ? "Starten..." : "Starten"}
        </button>
      </div>
    </div>
  );
}
