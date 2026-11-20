import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { DocumentInhoud } from "../../shared/types.ts";
import { isMailboxTeam, type MailboxTeam } from "../../shared/types.ts";
import { useSchrijven } from "../schrijven/SchrijfContext.tsx";
import { haalJson, urlVoor, type Verwijzing } from "./verwijzing.ts";


interface Props {
  readonly verwijzing: Verwijzing;
  readonly onSluit: () => void;
}

/** Links openen in een nieuw tabblad, zodat het huis open blijft. */
const MD_ONDERDELEN: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

/** Splitst een `key: value`-kop af, zodat berichten en agents hun kop als labels tonen. */
function splitsKop(tekst: string): { kop: [string, string][]; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(tekst);
  if (!m) return { kop: [], body: tekst };
  const kop = m[1]
    .split("\n")
    .filter((r) => r.includes(":"))
    .filter((r) => !/^(onderwerp|name|description|tools)\s*:/.test(r))
    .map((r): [string, string] => [r.slice(0, r.indexOf(":")).trim(), r.slice(r.indexOf(":") + 1).trim()]);
  return { kop, body: tekst.slice(m[0].length) };
}

export function Lezer({ verwijzing, onSluit }: Props) {
  const [doc, setDoc] = useState<DocumentInhoud | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const sluitKnop = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let actief = true;
    setDoc(null);
    setFout(null);
    haalJson<DocumentInhoud>(urlVoor(verwijzing))
      .then((d) => actief && setDoc(d))
      .catch((e: Error) => actief && setFout(e.message));
    return () => {
      actief = false;
    };
  }, [verwijzing]);

  useEffect(() => {
    sluitKnop.current?.focus();
    const toets = (e: KeyboardEvent) => e.key === "Escape" && onSluit();
    window.addEventListener("keydown", toets);
    const vorige = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", toets);
      document.body.style.overflow = vorige;
    };
  }, [onSluit]);

  const { open: schrijf } = useSchrijven();
  const ruweKop = doc ? Object.fromEntries((/^---\n([\s\S]*?)\n---/.exec(doc.inhoud)?.[1] ?? "").split("\n").map((r) => [r.split(":")[0].trim(), r.slice(r.indexOf(":") + 1).trim()])) : {};
  const { kop, body } = doc ? splitsKop(doc.inhoud) : { kop: [], body: "" };
  const kanAntwoorden = verwijzing.soort === "bericht" && doc !== null;
  const beantwoord = () => {
    if (verwijzing.soort !== "bericht" || !doc) return;
    const van = String(ruweKop.van ?? "");
    const aan = String(ruweKop.aan ?? "");
    const ontvanger: MailboxTeam | null = isMailboxTeam(van) ? van : isMailboxTeam(aan) ? aan : null;
    onSluit();
    schrijf({ aan: ontvanger, onderwerp: `Re: ${doc.titel.replace(/^(Re:\s*)+/i, "")}`.slice(0, 110), antwoordOp: verwijzing.bestand });
  };

  return (
    <div className="lezer-achtergrond" onClick={onSluit}>
      <article className="lezer" role="dialog" aria-modal="true" aria-label={doc?.titel ?? "Document"} onClick={(e) => e.stopPropagation()}>
        <header className="lezer-kop">
          <div>
            <div className="onder">{doc?.herkomst ?? "Laden..."}</div>
            <h2>{doc?.titel ?? " "}</h2>
          </div>
          <div className="kop-knoppen">
            {kanAntwoorden && (
              <button className="knop klein" onClick={beantwoord}>
                Beantwoorden
              </button>
            )}
            <button ref={sluitKnop} className="terug" onClick={onSluit} aria-label="Sluit leesvenster">
              Sluiten
            </button>
          </div>
        </header>
        {fout && <p className="signaal">{fout}</p>}
        {kop.length > 0 && (
          <dl className="lezer-meta">
            {kop.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {doc && (
          <div className="lezer-tekst">
            <Markdown remarkPlugins={[remarkGfm]} components={MD_ONDERDELEN}>
              {body}
            </Markdown>
          </div>
        )}
        {doc?.ingekort && <p className="signaal">Dit document is erg lang en is ingekort weergegeven.</p>}
        {doc && <footer className="onder lezer-voet">{doc.bestand} · alleen lezen</footer>}
      </article>
    </div>
  );
}
