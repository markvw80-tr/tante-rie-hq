import { createContext, useContext } from "react";
import type { Persoon } from "../shared/types.ts";

/** Wie het huis nu bekijkt: Mark (ook op de Mac zelf) of Nikkie via Tailscale. De server bepaalt dit, niet de browser. */
export const IkContext = createContext<Persoon>("mark");

export const useIk = (): Persoon => useContext(IkContext);
