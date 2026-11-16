import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Lezer } from "./Lezer.tsx";
import type { Verwijzing } from "./verwijzing.ts";

const LezerContext = createContext<(v: Verwijzing) => void>(() => undefined);

export function LezerProvider({ children }: { readonly children: ReactNode }) {
  const [open, setOpen] = useState<Verwijzing | null>(null);
  const sluit = useCallback(() => setOpen(null), []);
  return (
    <LezerContext.Provider value={setOpen}>
      {children}
      {open && <Lezer verwijzing={open} onSluit={sluit} />}
    </LezerContext.Provider>
  );
}

export const useLezer = () => useContext(LezerContext);
