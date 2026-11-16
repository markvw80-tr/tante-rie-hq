import type { RunSamenvatting } from "../../shared/types.ts";
import { TEAM_LABEL } from "../teamKleur.ts";
import { STATUS_TEKST } from "./api.ts";
import { PoortKaart } from "./PoortKaart.tsx";
import { useMeekijken } from "./RegieContext.tsx";

/** Bovenaan de toonbank: agents die op Mark wachten (live eerst) en agents die nu werken. */
export function WachtOpJou({ runs }: { readonly runs: readonly RunSamenvatting[] }) {
  const meekijken = useMeekijken();
  const wachtend = runs.filter((r) => r.status === "wacht" && r.poort).sort((a, b) => (a.poort!.soort === "live" ? -1 : 1) - (b.poort!.soort === "live" ? -1 : 1));
  const bezig = runs.filter((r) => r.status === "bezig");
  if (wachtend.length === 0 && bezig.length === 0) return null;

  return (
    <section className="kaart wacht-op-jou">
      <h3>{wachtend.length > 0 ? "Wacht op jou" : "Aan het werk"}</h3>
      {wachtend.map((r) => (
        <div key={r.id}>
          <PoortKaart runId={r.id} verzoek={r.poort!} agent={`${r.agent} (${TEAM_LABEL[r.team]})`} />
          <button className="doclink" onClick={() => meekijken(r.id)}>
            Werkbon openen
          </button>
        </div>
      ))}
      {bezig.length > 0 && (
        <ul className="doclijst">
          {bezig.map((r) => (
            <li key={r.id}>
              <button className="doclink" onClick={() => meekijken(r.id)}>
                {r.agent} · {TEAM_LABEL[r.team]}
              </button>
              <span className="onder">
                <span className="pulse" aria-hidden="true" /> {STATUS_TEKST[r.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
