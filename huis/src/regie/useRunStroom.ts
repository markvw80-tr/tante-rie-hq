import { useEffect, useState } from "react";
import type { RunDetail, RunRegel, RunSamenvatting } from "../../shared/types.ts";

/** Volgt één run live via server-sent events. Valt de verbinding weg, dan probeert de browser zelf opnieuw. */
export function useRunStroom(id: string) {
  const [run, setRun] = useState<RunDetail | null>(null);
  const [verbonden, setVerbonden] = useState(false);

  useEffect(() => {
    const bron = new EventSource(`/api/runs/${id}/stream`);
    bron.addEventListener("begin", (e) => {
      setRun(JSON.parse((e as MessageEvent).data) as RunDetail);
      setVerbonden(true);
    });
    bron.addEventListener("regel", (e) => {
      const regel = JSON.parse((e as MessageEvent).data) as RunRegel;
      setRun((r) => (r ? { ...r, regels: [...r.regels, regel], laatsteRegel: regel.tekst } : r));
    });
    bron.addEventListener("status", (e) => {
      const s = JSON.parse((e as MessageEvent).data) as RunSamenvatting;
      setRun((r) => (r ? { ...r, ...s } : r));
    });
    bron.onerror = () => setVerbonden(false);
    return () => bron.close();
  }, [id]);

  return { run, verbonden };
}
