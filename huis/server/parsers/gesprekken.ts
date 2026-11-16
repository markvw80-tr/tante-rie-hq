import type { Bericht, Gesprek } from "../../shared/types.ts";
import { datumUitNaam } from "./datum.ts";

/** Groepeert mailboxberichten tot gesprekken via `antwoord-op`. Lussen of ontbrekende berichten breken niets. */
export function bouwGesprekken(berichten: readonly Bericht[]): Gesprek[] {
  const opNaam = new Map(berichten.map((b) => [b.bestand, b]));
  const groepen = new Map<string, Bericht[]>();

  for (const b of berichten) {
    const wortel = zoekWortel(b, opNaam);
    groepen.set(wortel, [...(groepen.get(wortel) ?? []), b]);
  }

  return [...groepen.entries()]
    .map(([id, lijst]) => maakGesprek(id, lijst, opNaam))
    .sort((a, b) => b.berichten.at(-1)!.bestand.localeCompare(a.berichten.at(-1)!.bestand));
}

function zoekWortel(start: Bericht, opNaam: ReadonlyMap<string, Bericht>): string {
  const pad: string[] = [start.bestand];
  let huidig = start;
  while (huidig.antwoordOp && opNaam.has(huidig.antwoordOp)) {
    if (pad.includes(huidig.antwoordOp)) return [...pad].sort()[0];
    huidig = opNaam.get(huidig.antwoordOp)!;
    pad.push(huidig.bestand);
  }
  return huidig.bestand;
}

function maakGesprek(id: string, lijst: readonly Bericht[], opNaam: ReadonlyMap<string, Bericht>): Gesprek {
  const berichten = [...lijst].sort((a, b) => a.bestand.localeCompare(b.bestand));
  const wortel = opNaam.get(id) ?? berichten[0];
  const deelnemers = [...new Set(berichten.flatMap((b) => [b.van, b.aan]).filter((d) => d && d !== "?"))].sort();
  const laatste = berichten.at(-1)!;
  return {
    id,
    onderwerp: wortel.onderwerp,
    deelnemers,
    berichten,
    laatsteDatum: datumUitNaam(laatste.bestand) ?? laatste.datum,
    open: berichten.some((b) => b.map === "inbox"),
  };
}
