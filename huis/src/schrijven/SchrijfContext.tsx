import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Concept, Verstuurd } from "./api.ts";
import { Keukentafel } from "./Keukentafel.tsx";

interface Schrijven {
  readonly open: (concept: Partial<Concept>) => void;
  readonly verstuurd: (v: Verstuurd) => void;
}

const SchrijfContext = createContext<Schrijven>({ open: () => undefined, verstuurd: () => undefined });

const LEEG: Concept = { aan: null, onderwerp: "", tekst: "", prioriteit: "normaal", antwoordOp: null };

/** Houdt de keukentafel (opdracht of antwoord van Mark) als venster boven het huis. */
export function SchrijfProvider({ children, onVerstuurd }: { readonly children: ReactNode; readonly onVerstuurd: (v: Verstuurd) => void }) {
  const [concept, setConcept] = useState<Concept | null>(null);
  const open = useCallback((c: Partial<Concept>) => setConcept({ ...LEEG, ...c }), []);
  const sluit = useCallback(() => setConcept(null), []);
  const verstuurd = useCallback(
    (v: Verstuurd) => {
      setConcept(null);
      onVerstuurd(v);
    },
    [onVerstuurd],
  );
  return (
    <SchrijfContext.Provider value={{ open, verstuurd }}>
      {children}
      {concept && (
        <div className="lezer-achtergrond" onClick={sluit}>
          <div className="lezer schrijf-venster" role="dialog" aria-modal="true" aria-label="Opdracht geven" onClick={(e) => e.stopPropagation()}>
            <Keukentafel begin={concept} onKlaar={verstuurd} onAnnuleer={sluit} />
          </div>
        </div>
      )}
    </SchrijfContext.Provider>
  );
}

export const useSchrijven = () => useContext(SchrijfContext);
