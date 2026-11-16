import { useEffect, useState } from "react";
import type { TeamId, TeamWerk } from "../shared/types.ts";
import { haalJson } from "./lezer/verwijzing.ts";

/** Haalt werkbronnen en gesprekken van één team op; ververst mee met het huis. */
export function useTeamWerk(team: TeamId, ververs: Date | null) {
  const [werk, setWerk] = useState<TeamWerk | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    let actief = true;
    haalJson<TeamWerk>(`/api/team/${team}`)
      .then((w) => {
        if (!actief) return;
        setWerk(w);
        setFout(null);
      })
      .catch((e: Error) => actief && setFout(e.message));
    return () => {
      actief = false;
    };
  }, [team, ververs]);

  return { werk: werk?.team === team ? werk : null, fout };
}
