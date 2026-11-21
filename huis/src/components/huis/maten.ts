import type { TeamId } from "../../../shared/types.ts";

export interface Vlak {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export type Plek = TeamId | "toonbank";

export const VIEWBOX = { w: 1000, h: 940 } as const;
export const GROND_Y = 662;
export const BUIS_X = 892;

/**
 * Raster van de kamers: overal 6 eenheden lucht tussen een kamer en de balk, gevel of grond erboven
 * en eronder, 12 tot de zijgevels en 10 tussen buurkamers. Op elke verdieping staat de tussenwand op
 * dezelfde plek (570 tot 580), zodat de wanden van boven naar beneden in één lijn lopen.
 */
export const KAMERS: Record<Plek, Vlak> = {
  directie: { x: 340, y: 168, w: 320, h: 88 },
  design: { x: 140, y: 270, w: 430, h: 178 },
  inkoop: { x: 580, y: 270, w: 280, h: 178 },
  seo: { x: 140, y: 466, w: 430, h: 190 },
  toonbank: { x: 580, y: 466, w: 280, h: 190 },
  pim: { x: 140, y: 676, w: 430, h: 238 },
  financien: { x: 580, y: 676, w: 280, h: 238 },
  /** Serre links tegen het huis, op de begane grond; de vloer ligt gelijk met die van de Etalage. */
  klant: { x: 4, y: 486, w: 120, h: 170 },
};

/** Hoe breed de figuurtjes per kamer mogen staan, zodat ze niet over het decor lopen. */
export const LOOPRUIMTE: Record<TeamId, { readonly links: number; readonly breedte: number }> = {
  directie: { links: 14, breedte: 160 },
  design: { links: 110, breedte: 230 },
  inkoop: { links: 14, breedte: 96 },
  seo: { links: 24, breedte: 382 },
  pim: { links: 24, breedte: 382 },
  financien: { links: 56, breedte: 64 },
  klant: { links: 14, breedte: 44 },
};

const MAX_STAP = 54;
const MIN_STAP = 30;
/** Krapper dan dit gaan figuurtjes elkaar echt overlappen. */
const KRAPSTE_STAP = 22;

/** Afstand tussen figuurtjes: ruim als het kan, en nooit zo breed dat de rij buiten de loopruimte valt. */
export function figuurStap(aantal: number, breedte: number): number {
  const ruim = Math.max(MIN_STAP, Math.min(MAX_STAP, breedte / aantal));
  if (aantal < 2) return ruim;
  return Math.max(KRAPSTE_STAP, Math.min(ruim, breedte / (aantal - 1)));
}
