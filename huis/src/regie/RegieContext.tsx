import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Werkbank } from "./Werkbank.tsx";

const RegieContext = createContext<(runId: string) => void>(() => undefined);

export function RegieProvider({ children }: { readonly children: ReactNode }) {
  const [open, setOpen] = useState<string | null>(null);
  const sluit = useCallback(() => setOpen(null), []);
  return (
    <RegieContext.Provider value={setOpen}>
      {children}
      {open && <Werkbank id={open} onSluit={sluit} />}
    </RegieContext.Provider>
  );
}

export const useMeekijken = () => useContext(RegieContext);
