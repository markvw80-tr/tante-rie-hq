import type { PakhuisStand } from "../../../shared/types.ts";

const tijd = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Stand van het Pakhuis uit de inkoop-app: wat wacht op afvinken, backorder en laatste ontvangsten. Alleen lezen. */
export function PakhuisKaart({ stand }: { readonly stand: PakhuisStand | null | undefined }) {
  if (stand === undefined) return null;
  if (stand === null) {
    return (
      <section className="kaart">
        <h3>Leveringen</h3>
        <p className="onder">De stand uit de inkoop-app is niet beschikbaar. Controleer of de app op de NAS draait en of de sleutel in huis/.env staat.</p>
      </section>
    );
  }
  const app = stand.appUrl;
  return (
    <section className="kaart">
      <h3>Leveringen</h3>
      <p className="onder">
        {stand.wachtend.length} {stand.wachtend.length === 1 ? "levering wacht" : "leveringen wachten"} op afvinken · {stand.backorder.stuks} stuks backorder in{" "}
        {stand.backorder.bestellingen} {stand.backorder.bestellingen === 1 ? "bestelling" : "bestellingen"}
        {stand.backorder.oudste && ` (oudste: ${stand.backorder.oudste.poNumber}, ${stand.backorder.oudste.dagen} dagen)`}
      </p>
      {stand.wachtend.length > 0 && (
        <ul className="pakhuis-lijst">
          {stand.wachtend.map((w) => (
            <li key={w.id}>
              <a href={`${app}/confirmations/${w.id}/ontvangen`} target="_blank" rel="noreferrer">
                {w.leverancier} · {w.document}
              </a>{" "}
              <span className="onder">
                {w.regels} regels · {w.dagen === 0 ? "vandaag" : `${w.dagen} dagen`} binnen
              </span>
            </li>
          ))}
        </ul>
      )}
      <p style={{ margin: "8px 0 4px" }}>
        <a href={`${app}/backorders`} target="_blank" rel="noreferrer">Backorders</a> · <a href={`${app}/ontvangsten`} target="_blank" rel="noreferrer">Ontvangsten</a> ·{" "}
        <a href={`${app}/dashboard`} target="_blank" rel="noreferrer">Dashboard</a>
      </p>
      {stand.ontvangsten.length > 0 && (
        <>
          <h4 style={{ margin: "12px 0 4px" }}>Laatst geboekt</h4>
          <ul className="pakhuis-lijst">
            {stand.ontvangsten.map((o) => (
              <li key={`${o.wanneer}-${o.document}`}>
                {tijd.format(new Date(o.wanneer))} · {o.leverancier} · {o.document} · {o.stuks} stuks
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
