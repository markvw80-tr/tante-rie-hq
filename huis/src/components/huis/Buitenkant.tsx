import { BUIS_X, GROND_Y, VIEWBOX } from "./maten.ts";

/** Dak, schoorsteen, gevel, grond en de kelderwand. De rook neemt toe met het aantal teams dat bezig is. */
export function Buitenkant({ bezig }: { readonly bezig: number }) {
  return (
    <g pointerEvents="none">
      <rect x={0} y={GROND_Y} width={VIEWBOX.w} height={VIEWBOX.h - GROND_Y} fill="#d9cdb5" />
      <rect x={0} y={GROND_Y} width={VIEWBOX.w} height={8} fill="#5c7a67" />
      {Array.from({ length: 22 }, (_, i) => (
        <circle key={i} cx={30 + ((i * 97) % 960)} cy={GROND_Y + 30 + ((i * 53) % 220)} r={2 + (i % 3)} fill="#c8b998" />
      ))}
      <rect x={128} y={258} width={744} height={GROND_Y - 258} fill="#e7d8bc" />
      <rect x={128} y={670} width={744} height={250} fill="#cbbb9b" />

      <rect x={652} y={92} width={46} height={110} fill="#8a5a43" />
      <rect x={646} y={86} width={58} height={12} fill="#6e4634" />
      {Array.from({ length: Math.max(1, bezig) }, (_, i) => (
        <circle key={i} className="rook" cx={675 + (i % 2 ? 8 : -6)} cy={74} r={10 + i * 2} fill="#e0dbd0" style={{ animationDelay: `${i * 0.8}s` }} />
      ))}

      <path d="M96 266 L500 52 L904 266 Z" fill="#9a5a40" />
      <path d="M96 266 L500 52 L904 266" fill="none" stroke="#6e4634" strokeWidth={10} strokeLinejoin="round" />
      {[110, 150, 190, 230].map((yy) => {
        const half = ((yy - 52) / 214) * 404;
        return <line key={yy} x1={500 - half} y1={yy} x2={500 + half} y2={yy} stroke="#86503a" strokeWidth={2} />;
      })}
      <rect x={128} y={258} width={744} height={6} fill="#6e4634" />
      <rect x={128} y={454} width={744} height={6} fill="#c9b48e" />
    </g>
  );
}

interface Koker {
  readonly y: number;
  readonly oud: boolean;
  readonly kleur: string;
  readonly sleutel: string;
}

/** Buizenpost langs de gevel: per ongelezen bericht een koker ter hoogte van de kamer. Oud bericht: grijs en stoffig. */
export function Buizenpost({ kokers, aftakkingen }: { readonly kokers: readonly Koker[]; readonly aftakkingen: readonly number[] }) {
  return (
    <g pointerEvents="none">
      <rect x={BUIS_X} y={190} width={18} height={720} rx={9} fill="#dfe6dd" stroke="#5c7a67" strokeWidth={2} opacity={0.95} />
      {aftakkingen.map((y) => (
        <rect key={y} x={858} y={y - 5} width={40} height={10} rx={5} fill="#dfe6dd" stroke="#5c7a67" strokeWidth={1.6} />
      ))}
      {kokers.map((k) => (
        <g key={k.sleutel} className={k.oud ? "koker" : "koker vers"}>
          <rect x={BUIS_X + 3} y={k.y} width={12} height={22} rx={6} fill={k.oud ? "#b9b2a3" : k.kleur} />
          {k.oud && <circle cx={BUIS_X + 9} cy={k.y + 6} r={1.4} fill="#7d7566" />}
        </g>
      ))}
      <text x={BUIS_X + 9} y={182} fontSize={9} textAnchor="middle" fill="#5c7a67" letterSpacing={1}>
        POST
      </text>
    </g>
  );
}
