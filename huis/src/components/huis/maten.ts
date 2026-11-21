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

export const KAMERS: Record<Plek, Vlak> = {
  directie: { x: 340, y: 168, w: 320, h: 88 },
  design: { x: 140, y: 270, w: 430, h: 178 },
  inkoop: { x: 580, y: 270, w: 280, h: 178 },
  seo: { x: 140, y: 462, w: 430, h: 188 },
  toonbank: { x: 580, y: 462, w: 280, h: 188 },
  pim: { x: 140, y: 682, w: 480, h: 228 },
  financien: { x: 630, y: 682, w: 230, h: 228 },
};
