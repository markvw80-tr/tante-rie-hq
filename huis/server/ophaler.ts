import type { PostStand } from "../shared/types.ts";
import type { Postbode } from "./postbode.ts";

/** Haalt de post van origin/main op, automatisch op een vaste tijd en op verzoek. */
export class Ophaler {
  private opgehaald: string | null = null;
  private fout: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private na: (() => Promise<void>) | null = null;

  constructor(
    private readonly postbode: Postbode,
    private readonly intervalMs: number | null,
    private readonly klok: () => Date = () => new Date(),
  ) {}

  start(): void {
    if (this.intervalMs === null || this.timer) return;
    this.timer = setInterval(() => void this.haalNu().catch(() => undefined), this.intervalMs);
    this.timer.unref?.();
    void this.haalNu().catch(() => undefined);
  }

  /** Wat er na elke geslaagde ophaalbeurt moet gebeuren (de automaat). Een fout daarin laat het ophalen niet mislukken. */
  naOphalen(fn: () => Promise<void>): void {
    this.na = fn;
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async haalNu(): Promise<void> {
    try {
      await this.postbode.ophalen();
      this.opgehaald = this.klok().toISOString();
      this.fout = null;
    } catch (e) {
      this.fout = (e as Error).message;
      console.error("[huis] post ophalen mislukt:", e);
      throw e;
    }
    if (this.na) void this.na().catch((e) => console.error("[huis] na het ophalen mislukt:", e));
  }

  stand(): PostStand {
    return {
      opgehaald: this.opgehaald,
      fout: this.fout,
      automatischMinuten: this.intervalMs === null ? null : Math.round(this.intervalMs / 60_000),
    };
  }
}
