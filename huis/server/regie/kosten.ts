import type { KostenOverzicht, KostenTeam, RunSamenvatting, TeamId } from "../../shared/types.ts";

const WEEK_MS = 7 * 86_400_000;
const VOLGORDE: readonly TeamId[] = ["directie", "seo", "pim", "design"];
const centen = (usd: number) => Math.round(usd * 100) / 100;

/**
 * Wat de agents kosten, per team: de afgelopen 7 dagen en de lopende kalendermaand.
 * Bedragen komen uit de SDK (total_cost_usd); een run zonder bedrag telt als onbekend.
 */
export function kostenOverzicht(runs: readonly RunSamenvatting[], nu: Date): KostenOverzicht {
  const weekGrens = nu.getTime() - WEEK_MS;
  const perTeam = new Map<TeamId, KostenTeam>();
  let zonderKostenWeek = 0;

  for (const r of runs) {
    const gestart = new Date(r.gestart);
    if (Number.isNaN(gestart.getTime())) continue;
    const inWeek = gestart.getTime() >= weekGrens && gestart.getTime() <= nu.getTime();
    const inMaand = gestart.getFullYear() === nu.getFullYear() && gestart.getMonth() === nu.getMonth();
    if (!inWeek && !inMaand) continue;

    const kosten = r.kostenUsd ?? 0;
    if (inWeek && r.kostenUsd === null) zonderKostenWeek += 1;
    const oud = perTeam.get(r.team) ?? { team: r.team, weekUsd: 0, maandUsd: 0, runsWeek: 0, budgetOpWeek: 0, automatischWeekUsd: 0 };
    perTeam.set(r.team, {
      ...oud,
      weekUsd: inWeek ? oud.weekUsd + kosten : oud.weekUsd,
      maandUsd: inMaand ? oud.maandUsd + kosten : oud.maandUsd,
      runsWeek: inWeek ? oud.runsWeek + 1 : oud.runsWeek,
      budgetOpWeek: inWeek && r.budgetOp ? oud.budgetOpWeek + 1 : oud.budgetOpWeek,
      automatischWeekUsd: inWeek && r.bron === "huis" ? oud.automatischWeekUsd + kosten : oud.automatischWeekUsd,
    });
  }

  const teams = VOLGORDE.flatMap((id) => {
    const t = perTeam.get(id);
    return t ? [{ ...t, weekUsd: centen(t.weekUsd), maandUsd: centen(t.maandUsd), automatischWeekUsd: centen(t.automatischWeekUsd) }] : [];
  });
  return {
    teams,
    weekUsd: centen(teams.reduce((s, t) => s + t.weekUsd, 0)),
    maandUsd: centen(teams.reduce((s, t) => s + t.maandUsd, 0)),
    zonderKostenWeek,
  };
}
