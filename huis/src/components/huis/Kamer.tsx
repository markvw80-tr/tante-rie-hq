import type { KeyboardEvent, ReactNode } from "react";
import type { Stemming } from "../../../shared/types.ts";
import type { Vlak } from "./maten.ts";

interface Props {
  readonly vlak: Vlak;
  readonly titel: string;
  readonly ondertitel: string;
  readonly kleur: string;
  readonly stemming: Stemming | null;
  readonly gekozen: boolean;
  readonly ariaLabel: string;
  readonly badge?: string;
  readonly stilBordje?: string;
  /** Muurlampje: uit, post, post van Mark of aan het werk. */
  readonly lamp?: LampStand;
  readonly onKies: () => void;
  readonly children?: ReactNode;
}

const MUUR = "#fbf6ea";

export type LampStand = "uit" | "post" | "mark" | "werkt";

const LAMP: Record<LampStand, { readonly kleur: string; readonly tekst: string }> = {
  uit: { kleur: "#c8c4b8", tekst: "Lampje uit: geen post" },
  post: { kleur: "#f2b233", tekst: "Lampje amber: er ligt post" },
  mark: { kleur: "#e8590c", tekst: "Lampje oranje: er ligt post van Mark die nog niet is opgepakt" },
  werkt: { kleur: "#3fa34d", tekst: "Lampje groen: het team is aan het werk" },
};

/** Ruimte die de muurlamp naast het bordje nodig heeft. */
const LAMP_RUIMTE = 40;
const SMAL_MARGE = 6;

export function Kamer({ vlak, titel, ondertitel, kleur, stemming, gekozen, ariaLabel, badge, stilBordje, lamp, onKies, children }: Props) {
  const { x, y, w, h } = vlak;
  const toets = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onKies();
    }
  };
  const ruimBordje = Math.max(titel.length, ondertitel.length) * 7.4 + 24;
  // Smalle kamer (zoals de serre): compact bordje binnen de kamer en de lamp eronder, zodat niets over de buurkamer valt.
  const smal = ruimBordje + LAMP_RUIMTE > w;
  const bordjeBreedte = smal ? w - 2 * SMAL_MARGE : ruimBordje;
  const marge = smal ? SMAL_MARGE : 12;

  return (
    <g className={`kamer${gekozen ? " gekozen" : ""}`} role="button" tabIndex={0} aria-label={ariaLabel} aria-pressed={gekozen} onClick={onKies} onKeyDown={toets}>
      <rect className="kamer-vlak" x={x} y={y} width={w} height={h} fill={MUUR} />
      <rect x={x} y={y} width={w} height={5} fill={kleur} />
      <rect x={x} y={y + h - 8} width={w} height={8} fill="#d9c8a8" />
      {children}
      {stemming === "achterstand" && <Stof vlak={vlak} />}

      <g transform={`translate(${x + marge} ${y + 14})`}>
        <rect width={bordjeBreedte} height={40} rx={8} fill="#ffffff" stroke={kleur} strokeOpacity={0.35} />
        <text className="bordje" x={smal ? 8 : 12} y={18} fontSize={smal ? 13 : 15} fill="#1c1c14">
          {titel}
        </text>
        <text x={smal ? 8 : 12} y={33} fontSize={smal ? 8.5 : 10.5} fill={kleur} fontWeight={600} letterSpacing={smal ? 0.2 : 0.6}>
          {ondertitel.toUpperCase()}
        </text>
      </g>

      {lamp && <Muurlamp x={smal ? x + w - 16 : x + 12 + bordjeBreedte + 22} y={smal ? y + 60 : y + 14} stand={lamp} id={titel} />}
      {badge && <Badge x={x + w - 12} y={y + 14} tekst={badge} kleur={kleur} />}
      {stilBordje && <StilBordje x={x + w - 12} y={y + (badge ? 46 : 14)} tekst={stilBordje} />}
      <rect className="kamer-rand" x={x} y={y} width={w} height={h} fill="none" stroke="transparent" rx={2} />
    </g>
  );
}

/** Wandlampje naast het naambordje. Brandt als er post ligt en pulseert als het team werkt. */
function Muurlamp({ x, y, stand, id }: { readonly x: number; readonly y: number; readonly stand: LampStand; readonly id: string }) {
  const { kleur, tekst } = LAMP[stand];
  const gloedId = `lamp-gloed-${id.replace(/\W+/g, "-")}`;
  const aan = stand !== "uit";
  return (
    <g className={`muurlamp lamp-${stand}`} transform={`translate(${x} ${y}) scale(1.5)`} aria-label={tekst}>
      <title>{tekst}</title>
      <defs>
        <radialGradient id={gloedId}>
          <stop offset="0%" stopColor={kleur} stopOpacity={0.75} />
          <stop offset="100%" stopColor={kleur} stopOpacity={0} />
        </radialGradient>
      </defs>
      {aan && <circle className="lamp-gloed" cx={0} cy={22} r={24} fill={`url(#${gloedId})`} />}
      <rect x={-5} y={0} width={10} height={4} rx={1.5} fill="#6b4c30" />
      <line x1={0} y1={4} x2={0} y2={11} stroke="#6b4c30" strokeWidth={1.6} />
      <path d="M-9 11 h18 l-4 9 h-10 Z" fill="#6b4c30" />
      <circle className="lamp-peer" cx={0} cy={23} r={4.5} fill={kleur} stroke={aan ? "#fff" : "#a39d8f"} strokeWidth={1} />
    </g>
  );
}

function Badge({ x, y, tekst, kleur }: { readonly x: number; readonly y: number; readonly tekst: string; readonly kleur: string }) {
  const b = tekst.length * 6.6 + 34;
  return (
    <g transform={`translate(${x - b} ${y})`}>
      <rect width={b} height={24} rx={12} fill={kleur} />
      <path d="M10 8 h14 v9 h-14 Z M10 8 l7 5 l7 -5" fill="none" stroke="#fff" strokeWidth={1.3} />
      <text x={30} y={16.5} fontSize={11.5} fill="#fff" fontWeight={600}>
        {tekst}
      </text>
    </g>
  );
}

function StilBordje({ x, y, tekst }: { readonly x: number; readonly y: number; readonly tekst: string }) {
  const b = tekst.length * 6.4 + 20;
  return (
    <g transform={`translate(${x - b} ${y}) rotate(-3 ${b / 2} 12)`}>
      <line x1={b / 2} y1={-8} x2={6} y2={2} stroke="#6b6152" strokeWidth={0.8} />
      <line x1={b / 2} y1={-8} x2={b - 6} y2={2} stroke="#6b6152" strokeWidth={0.8} />
      <rect width={b} height={24} rx={4} fill="#fde8e8" stroke="#c0392b" strokeWidth={1} />
      <text x={10} y={16} fontSize={11.5} fill="#c0392b" fontWeight={600}>
        {tekst}
      </text>
    </g>
  );
}

/** Spinrag en stof voor een kamer waar het werk blijft liggen. */
function Stof({ vlak }: { readonly vlak: Vlak }) {
  const { x, y, w, h } = vlak;
  const hx = x + w;
  return (
    <g pointerEvents="none" opacity={0.75}>
      <rect x={x} y={y} width={w} height={h} fill="#8c8270" opacity={0.08} />
      <g stroke="#9b917f" strokeWidth={0.8} fill="none">
        <path d={`M${hx} ${y + 5} L${hx - 46} ${y + 5} M${hx} ${y + 5} L${hx} ${y + 51} M${hx} ${y + 5} L${hx - 34} ${y + 39}`} />
        <path d={`M${hx - 14} ${y + 5} Q${hx - 11} ${y + 16} ${hx} ${y + 19}`} />
        <path d={`M${hx - 28} ${y + 5} Q${hx - 22} ${y + 28} ${hx} ${y + 33}`} />
        <path d={`M${hx - 42} ${y + 5} Q${hx - 33} ${y + 40} ${hx} ${y + 47}`} />
      </g>
      {[0.12, 0.3, 0.51, 0.68, 0.86].map((f) => (
        <circle key={f} cx={x + w * f} cy={y + h - 12} r={1.6} fill="#9b917f" />
      ))}
    </g>
  );
}
