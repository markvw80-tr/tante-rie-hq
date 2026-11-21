import type { Agent, RunStatus, Stemming } from "../../../shared/types.ts";
import { figuurStap } from "./maten.ts";

interface Props {
  readonly agents: readonly Agent[];
  readonly x: number;
  readonly breedte: number;
  readonly vloerY: number;
  readonly kleur: string;
  readonly stemming: Stemming;
  readonly werk: ReadonlyMap<string, RunStatus>;
  /** Agents met ongelezen post die aan hen persoonlijk is gericht. */
  readonly post?: ReadonlySet<string>;
}


/** Agents als figuurtjes op de vloer van een kamer. Bezig: wiebelen. Stil: theepauze. Achterstand: ingedut. */
export function Figuurtjes({ agents, x, breedte, vloerY, kleur, stemming, werk, post }: Props) {
  if (agents.length === 0) return null;
  const stap = figuurStap(agents.length, breedte);
  const start = x + (breedte - stap * (agents.length - 1)) / 2;

  return (
    <g aria-hidden="true">
      {agents.map((a, i) => (
        <Figuur key={a.naam} naam={a.naam} cx={start + i * stap} vloerY={vloerY} kleur={kleur} stemming={stemming} run={werk.get(a.naam) ?? null} heeftPost={Boolean(post?.has(a.naam) || post?.has(a.bestand))} vertraging={i * 0.17} />
      ))}
    </g>
  );
}

interface FiguurProps {
  readonly naam: string;
  readonly cx: number;
  readonly vloerY: number;
  readonly kleur: string;
  readonly stemming: Stemming;
  readonly run: RunStatus | null;
  readonly heeftPost: boolean;
  readonly vertraging: number;
}

function Figuur({ naam, cx, vloerY, kleur, stemming, run, heeftPost, vertraging }: FiguurProps) {
  const top = vloerY - 34;
  const werkt = run === "bezig";
  const wacht = run === "wacht";
  // Een agent die echt draait, overstemt de stemming van de kamer.
  const houding: Stemming = werkt || wacht ? "bezig" : stemming;
  const dut = houding === "achterstand";
  return (
    <g className={`figuur ${houding}${werkt ? " werkt" : ""}${wacht ? " wacht" : ""}`} style={{ animationDelay: `${vertraging}s` }} opacity={dut ? 0.55 : 1}>
      <title>{`${naam}${werkt ? ", aan het werk" : wacht ? ", wacht op Mark" : ""}${heeftPost ? ", er ligt post voor deze agent" : ""}`}</title>
      {(werkt || wacht) && <circle className="werk-ring" cx={cx} cy={top + 18} r={17} fill="none" stroke={wacht ? "#c0392b" : kleur} strokeWidth={2} />}
      {wacht && (
        <g>
          <rect x={cx - 7} y={top - 22} width={14} height={14} rx={7} fill="#c0392b" />
          <text x={cx} y={top - 11} fontSize={11} fontWeight={700} fill="#fff" textAnchor="middle">!</text>
        </g>
      )}
      {heeftPost && <Envelopje cx={wacht ? cx + 13 : cx} y={top - 22} kleur={kleur} />}
      <ellipse cx={cx} cy={vloerY} rx={11} ry={2.5} fill="#000" opacity={0.08} />
      <path d={`M${cx - 10} ${vloerY} Q${cx - 11} ${top + 14} ${cx} ${top + 12} Q${cx + 11} ${top + 14} ${cx + 10} ${vloerY} Z`} fill={kleur} />
      <circle cx={cx} cy={top + 5} r={7.5} fill="#f2d9bf" stroke={kleur} strokeWidth={1.2} />
      {houding === "stil" && <Theekopje x={cx + 9} y={top + 20} />}
      {houding === "bezig" && <rect x={cx - 6} y={top + 19} width={12} height={8} rx={1.5} fill="#faf8f2" stroke="#1c1c14" strokeWidth={0.8} />}
      {dut && (
        <text x={cx + 9} y={top - 2} fontSize={10} fill="#6b6152" fontStyle="italic">
          z
        </text>
      )}
    </g>
  );
}

/** Envelopje boven het hoofd: er ligt ongelezen post die aan deze agent persoonlijk is gericht. */
function Envelopje({ cx, y, kleur }: { readonly cx: number; readonly y: number; readonly kleur: string }) {
  return (
    <g className="envelopje">
      <rect x={cx - 8} y={y} width={16} height={11} rx={1.5} fill="#fff" stroke={kleur} strokeWidth={1.2} />
      <path d={`M${cx - 8} ${y + 1} l8 5.5 l8 -5.5`} fill="none" stroke={kleur} strokeWidth={1.2} />
    </g>
  );
}

function Theekopje({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <g>
      <path d={`M${x} ${y} h8 v3 a4 4 0 0 1 -8 0 Z`} fill="#faf8f2" stroke="#6b4c30" strokeWidth={0.8} />
      <path d={`M${x + 8} ${y + 1} a2 2 0 0 1 0 4`} fill="none" stroke="#6b4c30" strokeWidth={0.8} />
      <path className="rook" d={`M${x + 4} ${y - 2} q2 -3 0 -6`} fill="none" stroke="#c8c4b8" strokeWidth={1} />
    </g>
  );
}
