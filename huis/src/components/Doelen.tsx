import type { MdDocument } from "../../shared/types.ts";

/** De gedeelde doelen, als lijst aan de muur onder het huis. */
export function Doelen({ doelen }: { readonly doelen: MdDocument }) {
  return (
    <section className="doelen" aria-label="Gedeelde doelen">
      <h2>{doelen.titel || "Gedeelde doelen"}</h2>
      {doelen.secties.map((s) => (
        <div key={s.titel}>
          <h3>{s.titel}</h3>
          {s.alineas.map((a) => (
            <p key={a}>{a.replace(/`/g, "")}</p>
          ))}
          {s.items.length > 0 && (
            <ul>
              {s.items.map((i) => (
                <li key={i}>{i.replace(/`/g, "")}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
