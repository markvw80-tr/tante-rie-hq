import type { PipelineFase } from "../../../shared/types.ts";
import { KAMERS } from "./maten.ts";

const BLIK_KLEUREN = ["#3b5240", "#6b4c30", "#2c5f8a", "#c44f1c", "#5c7a67", "#c03a6a", "#b5502e"];
const MAX_BLIKKEN = 14;

/** Kantoortje: bureau, ingelijste doelen en de agenda van vandaag. */
export function KantoorDecor({ heeftAgenda }: { readonly heeftAgenda: boolean }) {
  const { x, y, w } = KAMERS.directie;
  const r = x + w;
  return (
    <g pointerEvents="none">
      <rect x={r - 92} y={y + 18} width={34} height={26} rx={2} fill="#fff" stroke="#6b4c30" strokeWidth={2} />
      {[25, 31, 37].map((d) => (
        <line key={d} x1={r - 86} y1={y + d} x2={r - 64} y2={y + d} stroke="#c8c4b8" strokeWidth={1.4} />
      ))}
      <rect x={r - 120} y={y + 58} width={98} height={6} rx={2} fill="#6b4c30" />
      <rect x={r - 114} y={y + 64} width={4} height={14} fill="#6b4c30" />
      <rect x={r - 34} y={y + 64} width={4} height={14} fill="#6b4c30" />
      {heeftAgenda && <rect x={r - 100} y={y + 51} width={22} height={7} fill="#faf8f2" stroke="#1c1c14" strokeWidth={0.6} transform={`rotate(-6 ${r - 89} ${y + 54})`} />}
    </g>
  );
}

/** Atelier: ezel met schilderij, een kleurenwaaier en een ontwerpbord aan de muur. */
export function AtelierDecor() {
  const { x, y, w } = KAMERS.design;
  const ex = x + w - 62;
  const wx = x + 24;
  const bx = x + 190;
  const by = y + 62;
  return (
    <g pointerEvents="none">
      {["#3b5240", "#e9efea", "#6b4c30", "#c44f1c", "#faf8f2", "#2c5f8a"].map((c, i) => (
        <rect key={c} x={wx + i * 15} y={y + 70} width={13} height={34} rx={3} fill={c} stroke="#e0dbd0" transform={`rotate(${(i - 2.5) * 6} ${wx + 40} ${y + 120})`} />
      ))}
      <path d={`M${ex} ${y + 166} L${ex + 30} ${y + 44} L${ex + 60} ${y + 166} M${ex + 30} ${y + 44} L${ex + 30} ${y + 166}`} stroke="#6b4c30" strokeWidth={3} fill="none" />
      <rect x={ex + 2} y={y + 58} width={56} height={46} fill="#fff" stroke="#6b4c30" strokeWidth={2} />
      <path d={`M${ex + 8} ${y + 96} q12 -22 22 -8 q10 -18 22 4`} fill="none" stroke="#3b5240" strokeWidth={2} />
      <circle cx={ex + 44} cy={y + 70} r={5} fill="#c44f1c" />
      <rect x={bx} y={by} width={150} height={60} rx={4} fill="#e9efea" stroke="#c8c4b8" />
      <rect x={bx + 10} y={by + 10} width={60} height={40} rx={2} fill="#faf8f2" />
      <rect x={bx + 78} y={by + 10} width={62} height={8} rx={2} fill="#3b5240" />
      <rect x={bx + 78} y={by + 24} width={44} height={5} rx={2} fill="#c8c4b8" />
      <rect x={bx + 78} y={by + 34} width={34} height={12} rx={6} fill="#1c1c14" />
    </g>
  );
}

const DOOS = "#c9a46a";
const DOOS_RAND = "#8a6420";
const MAX_DOZEN = 6;
/** Plek per doos op de stelling: [x-verschuiving, plank (0 boven, 1 onder), breedte]. */
const DOOS_PLEKKEN: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 34], [38, 1, 30], [72, 1, 34], [0, 0, 30], [34, 0, 36], [74, 0, 28],
];

/** Pakhuis: stelling met een doos per wachtende levering, een bordje met de stand, een pakbon aan de spijker en een weegschaal. */
export function PakhuisDecor({ dozen, bordje }: { readonly dozen: number; readonly bordje?: string }) {
  const { x, y, w, h } = KAMERS.inkoop;
  const sx = x + w - 122;
  const vloer = y + h - 8;
  const aantal = Math.min(Math.max(dozen, 0), MAX_DOZEN);
  return (
    <g pointerEvents="none">
      {[0, 1, 2].map((p) => (
        <rect key={p} x={sx} y={y + 84 + p * 42} width={112} height={4} fill="#6b4c30" />
      ))}
      <rect x={sx} y={y + 60} width={4} height={vloer - y - 60} fill="#6b4c30" />
      <rect x={sx + 108} y={y + 60} width={4} height={vloer - y - 60} fill="#6b4c30" />
      {DOOS_PLEKKEN.slice(0, aantal).map(([dx, plank, bw], i) => {
        const bh = 22 + (i % 2) * 6;
        const bodem = y + 84 + (plank + 1) * 42;
        return (
          <g key={i}>
            <rect x={sx + 6 + dx} y={bodem - bh} width={bw} height={bh} rx={1.5} fill={DOOS} stroke={DOOS_RAND} strokeWidth={1} />
            <line x1={sx + 6 + dx} y1={bodem - bh + 6} x2={sx + 6 + dx + bw} y2={bodem - bh + 6} stroke={DOOS_RAND} strokeWidth={0.8} />
          </g>
        );
      })}
      {bordje && (
        <g>
          <rect x={sx - 4} y={y + 62} width={120} height={16} rx={3} fill="#fff" stroke={DOOS_RAND} strokeWidth={1} />
          <text x={sx + 56} y={y + 73.5} fontSize={9.5} textAnchor="middle" fill="#4e3622">
            {bordje}
          </text>
        </g>
      )}
      <circle cx={x + 34} cy={y + 64} r={2} fill="#6b6152" />
      <g transform={`rotate(4 ${x + 34} ${y + 64})`}>
        <rect x={x + 22} y={y + 66} width={24} height={32} fill="#faf8f2" stroke="#c8c4b8" />
        {[74, 80, 86, 92].map((d) => (
          <line key={d} x1={x + 26} y1={y + d} x2={x + 42} y2={y + d} stroke="#c8c4b8" strokeWidth={1.2} />
        ))}
      </g>
      <rect x={x + 112} y={vloer - 6} width={36} height={6} rx={2} fill="#6b6152" />
      <rect x={x + 127} y={vloer - 24} width={6} height={18} fill="#6b6152" />
      <rect x={x + 114} y={vloer - 28} width={32} height={5} rx={2} fill="#8c8270" />
      <circle cx={x + 130} cy={vloer - 14} r={6} fill="#faf8f2" stroke="#6b6152" strokeWidth={1.2} />
      <line x1={x + 130} y1={vloer - 14} x2={x + 133} y2={vloer - 18} stroke="#c0392b" strokeWidth={1} />
    </g>
  );
}

/** Etalage: luifel, groot winkelraam met theeblikken en het uithangbord. */
export function EtalageDecor() {
  const { x, y, w } = KAMERS.seo;
  const rx = x + w - 250;
  return (
    <g pointerEvents="none">
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d={`M${rx + i * 23} ${y + 8} h23 v18 q-11.5 9 -23 0 Z`} fill={i % 2 ? "#faf8f2" : "#3b5240"} />
      ))}
      <rect x={rx + 6} y={y + 32} width={218} height={112} rx={4} fill="#e9efea" stroke="#263830" strokeWidth={3} />
      <line x1={rx + 115} y1={y + 32} x2={rx + 115} y2={y + 144} stroke="#263830" strokeWidth={2} />
      <rect x={rx + 6} y={y + 118} width={218} height={5} fill="#d9c8a8" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={rx + 18 + i * 25 + (i > 3 ? 8 : 0)} y={y + 92 - (i % 3) * 5} width={17} height={26 + (i % 3) * 5} rx={2} fill={BLIK_KLEUREN[i % BLIK_KLEUREN.length]} />
      ))}
      <text className="bordje" x={rx + 115} y={y + 66} fontSize={16} textAnchor="middle" fill="#263830" fontStyle="italic">
        Tante Rie
      </text>
      <text x={rx + 115} y={y + 80} fontSize={8.5} textAnchor="middle" fill="#5c7a67" letterSpacing={1.5}>
        THEE · BORNE · SINDS 2014
      </text>
    </g>
  );
}

/** Toonbank: de plek van Mark, met een stapel besluitkaarten en een bel. */
export function ToonbankDecor({ besluiten }: { readonly besluiten: number }) {
  const { x, y, w, h } = KAMERS.toonbank;
  const tx = x + 40;
  const ty = y + h - 66;
  const stapel = Math.min(besluiten, 8);
  return (
    <g pointerEvents="none">
      <rect x={x + w - 70} y={y + 60} width={46} height={h - 68} rx={23} fill="#3b5240" />
      <circle cx={x + w - 32} cy={y + 128} r={3} fill="#e0dbd0" />
      <rect x={tx} y={ty} width={150} height={58} rx={4} fill="#6b4c30" />
      <rect x={tx - 6} y={ty - 6} width={162} height={8} rx={3} fill="#4e3622" />
      {Array.from({ length: stapel }, (_, i) => (
        <rect key={i} x={tx + 18 + (i % 2) * 3} y={ty - 12 - i * 4} width={46} height={10} rx={1.5} fill="#faf8f2" stroke="#c8c4b8" strokeWidth={0.7} transform={`rotate(${(i % 3) - 1} ${tx + 40} ${ty})`} />
      ))}
      {besluiten > 0 && (
        <g transform={`translate(${tx + 41} ${ty - 22 - stapel * 4})`}>
          <circle r={14} fill="#c0392b" />
          <text y={4.5} fontSize={13} fontWeight={700} fill="#fff" textAnchor="middle">
            {besluiten}
          </text>
        </g>
      )}
      <path d={`M${tx + 104} ${ty - 6} a14 14 0 0 1 28 0 Z`} fill="#c8a24a" />
      <circle cx={tx + 118} cy={ty - 22} r={2.5} fill="#c8a24a" />
      <text x={tx + 75} y={ty + 34} fontSize={11} textAnchor="middle" fill="#faf8f2" letterSpacing={1}>
        WACHT OP MARK
      </text>
    </g>
  );
}

/** Theekelder: de PIM-pipeline als vijf stellingen, batches als theeblikken. */
export function KelderDecor({ fases }: { readonly fases: readonly PipelineFase[] }) {
  const { x, y, w } = KAMERS.pim;
  const kol = (w - 40) / Math.max(fases.length, 1);
  // Smalle kolommen (kelder gedeeld met de Kluis): kleinere letters, zodat de fasenamen elkaar niet raken.
  const letter = kol < 85 ? 8 : kol < 100 ? 9 : 11;
  return (
    <g pointerEvents="none">
      {fases.map((f, i) => {
        const sx = x + 20 + i * kol;
        const blikken = Math.min(f.batches.length, MAX_BLIKKEN);
        return (
          <g key={f.fase}>
            {[0, 1].map((plank) => (
              <rect key={plank} x={sx + 6} y={y + 104 + plank * 40} width={kol - 12} height={4} fill="#6b4c30" />
            ))}
            {Array.from({ length: blikken }, (_, b) => {
              const plank = b < 7 ? 1 : 0;
              const pos = b % 7;
              return <rect key={b} x={sx + 12 + pos * ((kol - 24) / 7)} y={y + 82 + plank * 40} width={(kol - 24) / 7 - 3} height={22} rx={2} fill={BLIK_KLEUREN[(i + b) % BLIK_KLEUREN.length]} />;
            })}
            <text x={sx + kol / 2} y={y + 166} fontSize={letter} textAnchor="middle" fill="#1c1c14" fontWeight={600}>
              {f.label}
            </text>
            <text x={sx + kol / 2} y={y + 180} fontSize={letter - 0.5} textAnchor="middle" fill="#6b6152">
              {f.batches.length} {f.batches.length === 1 ? "batch" : "batches"}
            </text>
            {i < fases.length - 1 && <path d={`M${sx + kol - 4} ${y + 160} l8 0 m-3 -3 l3 3 l-3 3`} stroke="#c8c4b8" strokeWidth={1.4} fill="none" />}
          </g>
        );
      })}
    </g>
  );
}

/** Kluis: een kluisdeur met draaiknop en hendel, een opengeslagen kasboek op een lessenaar en drie stapels munten. */
export function KluisDecor() {
  const { x, y, w, h } = KAMERS.financien;
  const vloer = y + h - 8;
  const kx = x + w - 104;
  const ky = y + 58;
  return (
    <g pointerEvents="none">
      <rect x={kx} y={ky} width={92} height={vloer - ky} rx={6} fill="#4a4d55" stroke="#2f3137" strokeWidth={2} />
      <rect x={kx + 8} y={ky + 8} width={76} height={vloer - ky - 16} rx={4} fill="#5b5f68" stroke="#3a3c42" strokeWidth={1.2} />
      <circle cx={kx + 46} cy={ky + 58} r={20} fill="#c9b37a" stroke="#8a7440" strokeWidth={2} />
      <circle cx={kx + 46} cy={ky + 58} r={6} fill="#8a7440" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((hoek) => (
        <line key={hoek} x1={kx + 46} y1={ky + 41} x2={kx + 46} y2={ky + 45} stroke="#5b4a22" strokeWidth={1.5} transform={`rotate(${hoek} ${kx + 46} ${ky + 58})`} />
      ))}
      <rect x={kx + 66} y={ky + 96} width={8} height={30} rx={3} fill="#c9b37a" stroke="#8a7440" />
      <rect x={kx + 30} y={ky + 98} width={32} height={6} rx={2} fill="#3a3c42" />
      <rect x={x + 24} y={vloer - 52} width={4} height={52} fill="#6b4c30" />
      <path d={`M${x + 8} ${vloer - 52} l20 -10 l20 10 Z`} fill="#6b4c30" />
      <rect x={x + 6} y={vloer - 66} width={22} height={14} fill="#faf8f2" stroke="#c8c4b8" transform={`rotate(-8 ${x + 17} ${vloer - 59})`} />
      <rect x={x + 26} y={vloer - 68} width={22} height={14} fill="#faf8f2" stroke="#c8c4b8" transform={`rotate(8 ${x + 37} ${vloer - 61})`} />
      {[0, 1, 2].map((s) =>
        Array.from({ length: 3 + s * 2 }, (_, m) => (
          <ellipse key={`${s}-${m}`} cx={kx - 46 + s * 18} cy={vloer - 3 - m * 4} rx={7} ry={2.5} fill="#d4b04c" stroke="#9a7a24" strokeWidth={0.8} />
        )),
      )}
    </g>
  );
}

/** Theesalon: serre tegen de linkergevel met een glazen dak, een tafeltje met theepot en kopjes en een bordje met vijf sterren. */
export function TheesalonDecor() {
  const { x, y, w, h } = KAMERS.klant;
  const vloer = y + h - 8;
  const tx = x + w - 52;
  return (
    <g pointerEvents="none">
      <path d={`M${x - 4} ${y} L${x + w + 8} ${y - 26} L${x + w + 8} ${y} Z`} fill="#dbe8ea" stroke="#6b8a8f" strokeWidth={1.5} opacity={0.9} />
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={x - 4 + f * (w + 12)} y1={y - 26 * f} x2={x - 4 + f * (w + 12)} y2={y} stroke="#6b8a8f" strokeWidth={1} />
      ))}
      <rect x={x + 6} y={y + 44} width={w - 12} height={34} rx={2} fill="#eef5f6" stroke="#b6cdd0" strokeWidth={1} />
      <line x1={x + w / 2} y1={y + 44} x2={x + w / 2} y2={y + 78} stroke="#b6cdd0" strokeWidth={1} />
      <rect x={x + 10} y={y + 84} width={44} height={14} rx={3} fill="#fff" stroke="#a0466b" strokeWidth={1} />
      {[0, 1, 2, 3, 4].map((s) => (
        <path key={s} d={`M${x + 16 + s * 8} ${y + 87} l1.6 3.4 3.7 0.4 -2.8 2.5 0.8 3.6 -3.3 -1.9 -3.3 1.9 0.8 -3.6 -2.8 -2.5 3.7 -0.4 Z`} fill="#d4a017" />
      ))}
      <rect x={tx + 20} y={vloer - 28} width={4} height={28} fill="#6b4c30" />
      <ellipse cx={tx + 22} cy={vloer - 28} rx={24} ry={4} fill="#8a6a48" />
      <path d={`M${tx + 12} ${vloer - 32} q0 -12 10 -12 q10 0 10 12 Z`} fill="#a0466b" />
      <path d={`M${tx + 32} ${vloer - 40} q7 2 5 8`} fill="none" stroke="#a0466b" strokeWidth={2} />
      <rect x={tx + 19} y={vloer - 47} width={6} height={3} rx={1} fill="#7a3352" />
      <rect x={tx - 2} y={vloer - 35} width={8} height={5} rx={1.5} fill="#faf8f2" stroke="#c8c4b8" strokeWidth={0.8} />
      <rect x={tx + 38} y={vloer - 35} width={8} height={5} rx={1.5} fill="#faf8f2" stroke="#c8c4b8" strokeWidth={0.8} />
    </g>
  );
}
