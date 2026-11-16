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

/** Atelier: ezel met schilderij en een kleurenwaaier aan de muur. */
export function AtelierDecor() {
  const { x, y, w } = KAMERS.design;
  const ex = x + w - 215;
  return (
    <g pointerEvents="none">
      {["#3b5240", "#e9efea", "#6b4c30", "#c44f1c", "#faf8f2", "#2c5f8a"].map((c, i) => (
        <rect key={c} x={x + w - 420 + i * 15} y={y + 30} width={13} height={34} rx={3} fill={c} stroke="#e0dbd0" transform={`rotate(${(i - 2.5) * 6} ${x + w - 380} ${y + 80})`} />
      ))}
      <path d={`M${ex} ${y + 166} L${ex + 30} ${y + 44} L${ex + 60} ${y + 166} M${ex + 30} ${y + 44} L${ex + 30} ${y + 166}`} stroke="#6b4c30" strokeWidth={3} fill="none" />
      <rect x={ex + 2} y={y + 58} width={56} height={46} fill="#fff" stroke="#6b4c30" strokeWidth={2} />
      <path d={`M${ex + 8} ${y + 96} q12 -22 22 -8 q10 -18 22 4`} fill="none" stroke="#3b5240" strokeWidth={2} />
      <circle cx={ex + 44} cy={y + 70} r={5} fill="#c44f1c" />
      <rect x={x + 120} y={y + 26} width={150} height={60} rx={4} fill="#e9efea" stroke="#c8c4b8" />
      <rect x={x + 130} y={y + 36} width={60} height={40} rx={2} fill="#faf8f2" />
      <rect x={x + 198} y={y + 36} width={62} height={8} rx={2} fill="#3b5240" />
      <rect x={x + 198} y={y + 50} width={44} height={5} rx={2} fill="#c8c4b8" />
      <rect x={x + 198} y={y + 60} width={34} height={12} rx={6} fill="#1c1c14" />
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
  const kol = (w - 60) / Math.max(fases.length, 1);
  return (
    <g pointerEvents="none">
      {fases.map((f, i) => {
        const sx = x + 30 + i * kol;
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
            <text x={sx + kol / 2} y={y + 166} fontSize={11} textAnchor="middle" fill="#1c1c14" fontWeight={600}>
              {f.label}
            </text>
            <text x={sx + kol / 2} y={y + 180} fontSize={10.5} textAnchor="middle" fill="#6b6152">
              {f.batches.length} {f.batches.length === 1 ? "batch" : "batches"}
            </text>
            {i < fases.length - 1 && <path d={`M${sx + kol - 4} ${y + 160} l8 0 m-3 -3 l3 3 l-3 3`} stroke="#c8c4b8" strokeWidth={1.4} fill="none" />}
          </g>
        );
      })}
    </g>
  );
}
