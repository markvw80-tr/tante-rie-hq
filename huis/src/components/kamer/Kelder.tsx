import { useEffect, useState } from "react";
import type { BatchInhoud, PipelineFase } from "../../../shared/types.ts";
import { useLezer } from "../../lezer/LezerContext.tsx";
import { haalJson } from "../../lezer/verwijzing.ts";

/** Datum uit een batchnaam (20261115-... of audit-20261028), voor sorteren nieuwste eerst. */
const batchDatum = (naam: string) => /(\d{8})/.exec(naam)?.[1] ?? "";

/** De vijf stellingen van de PIM-pipeline. Kies een stelling, dan een batch, dan een document. */
export function Kelder({ fases }: { readonly fases: readonly PipelineFase[] }) {
  const [fase, setFase] = useState<string>(() => fases.find((f) => f.fase === "04-review")?.fase ?? fases[0]?.fase ?? "");
  const gekozen = fases.find((f) => f.fase === fase);
  const batches = [...(gekozen?.batches ?? [])].sort((a, b) => batchDatum(b).localeCompare(batchDatum(a)) || a.localeCompare(b));

  return (
    <section className="kaart">
      <h3>Stellingen in de kelder</h3>
      <div className="schappen" role="tablist" aria-label="Pipeline-fases">
        {fases.map((f) => (
          <button key={f.fase} role="tab" aria-selected={f.fase === fase} className={f.fase === fase ? "schap actief" : "schap"} onClick={() => setFase(f.fase)}>
            <b>{f.batches.length}</b>
            <span>{f.label}</span>
          </button>
        ))}
      </div>
      {gekozen && (
        <div className="batches">
          {batches.length === 0 && <p className="onder">Deze stelling is leeg.</p>}
          {batches.map((b) => (
            <Batch key={b} fase={gekozen.fase} batch={b} />
          ))}
        </div>
      )}
    </section>
  );
}

function Batch({ fase, batch }: { readonly fase: string; readonly batch: string }) {
  const [open, setOpen] = useState(false);
  const [inhoud, setInhoud] = useState<BatchInhoud | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const lees = useLezer();

  useEffect(() => {
    if (!open || inhoud) return;
    haalJson<BatchInhoud>(`/api/batch?${new URLSearchParams({ fase, batch })}`)
      .then(setInhoud)
      .catch((e: Error) => setFout(e.message));
  }, [open, inhoud, fase, batch]);

  return (
    <details className="status-blok" onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>{batch}</summary>
      {fout && <p className="signaal">{fout}</p>}
      {open && !inhoud && !fout && <p className="onder">Laden...</p>}
      {inhoud && (
        <>
          {inhoud.documenten.length === 0 && <p className="onder">Geen Markdown-documenten in deze batch.</p>}
          <ul className="doclijst">
            {inhoud.documenten.map((d) => (
              <li key={d.bestand}>
                <button className="doclink" onClick={() => lees({ soort: "batch", fase, batch, bestand: d.bestand })}>
                  {d.titel}
                </button>
              </li>
            ))}
          </ul>
          {inhoud.overigeBestanden.length > 0 && <p className="onder">Ook in deze batch: {inhoud.overigeBestanden.join(", ")}</p>}
        </>
      )}
    </details>
  );
}
