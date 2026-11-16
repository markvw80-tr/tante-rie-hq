import { useCallback, useEffect, useState } from "react";
import type { HuisStand } from "../shared/types.ts";

const VERVERS_MS = 60_000;
const SNEL_MS = 4_000; // terwijl een agent werkt of op Mark wacht

export interface HuisLaden {
  readonly huis: HuisStand | null;
  readonly fout: string | null;
  readonly laadt: boolean;
  readonly bijgewerkt: Date | null;
  readonly ververs: () => void;
}

export function useHuis(): HuisLaden {
  const [huis, setHuis] = useState<HuisStand | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [laadt, setLaadt] = useState(true);
  const [bijgewerkt, setBijgewerkt] = useState<Date | null>(null);

  const ververs = useCallback(async () => {
    setLaadt(true);
    try {
      const res = await fetch("/api/huis");
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const melding = (body as { fout?: string } | null)?.fout;
        throw new Error(melding ?? `Server gaf ${res.status}`);
      }
      setHuis(body as HuisStand);
      setFout(null);
      setBijgewerkt(new Date());
    } catch (e) {
      setFout(e instanceof TypeError ? "De huis-server draait niet. Start hem met npm run dev." : (e as Error).message);
    } finally {
      setLaadt(false);
    }
  }, []);

  const snel = huis?.runs?.some((r) => r.status === "bezig" || r.status === "wacht") ?? false;

  useEffect(() => {
    void ververs();
  }, [ververs]);

  useEffect(() => {
    const id = window.setInterval(() => void ververs(), snel ? SNEL_MS : VERVERS_MS);
    return () => window.clearInterval(id);
  }, [ververs, snel]);

  return { huis, fout, laadt, bijgewerkt, ververs: () => void ververs() };
}
