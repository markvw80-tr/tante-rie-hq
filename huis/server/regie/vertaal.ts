import type { RunRegel } from "../../shared/types.ts";

const MAX_TEKST = 1200;
const kort = (s: string, max = MAX_TEKST) => (s.length > max ? `${s.slice(0, max)}...` : s);
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

export interface Afloop {
  readonly gelukt: boolean;
  readonly kostenUsd: number | null;
  readonly resultaat: string | null;
  readonly fouten: readonly string[];
}

/** Zet een bericht uit de Agent SDK om naar logregels. Onbekende soorten worden overgeslagen. */
export function vertaal(bericht: unknown, nu: string): { regels: RunRegel[]; afloop: Afloop | null } {
  if (!isObj(bericht)) return { regels: [], afloop: null };
  const regel = (soort: RunRegel["soort"], tekst: string): RunRegel => ({ t: nu, soort, tekst: kort(tekst) });

  if (bericht.type === "system" && bericht.subtype === "init") {
    return { regels: [regel("systeem", `Gestart met ${String(bericht.model ?? "model onbekend")}`)], afloop: null };
  }
  if ((bericht.type === "assistant" || bericht.type === "user") && isObj(bericht.message) && Array.isArray(bericht.message.content)) {
    const regels = bericht.message.content.flatMap((blok: unknown): RunRegel[] => {
      if (!isObj(blok)) return [];
      if (blok.type === "text" && typeof blok.text === "string" && blok.text.trim()) return [regel("tekst", blok.text.trim())];
      if (blok.type === "tool_use") return [regel("tool", `${String(blok.name)} ${kort(JSON.stringify(blok.input ?? {}), 300)}`)];
      if (blok.type === "tool_result") {
        const inhoud = Array.isArray(blok.content)
          ? blok.content.map((c: unknown) => (isObj(c) && typeof c.text === "string" ? c.text : "")).join("\n")
          : String(blok.content ?? "");
        return [regel(blok.is_error ? "fout" : "resultaat", kort(inhoud.trim() || "(leeg)", 600))];
      }
      return [];
    });
    return { regels, afloop: null };
  }
  if (bericht.type === "result") {
    const gelukt = bericht.subtype === "success" && bericht.is_error !== true;
    const kosten = typeof bericht.total_cost_usd === "number" ? bericht.total_cost_usd : null;
    const fouten = Array.isArray(bericht.errors) ? bericht.errors.map(String) : [];
    const resultaat = typeof bericht.result === "string" ? bericht.result : null;
    const tekst = gelukt ? "Klaar." : `Gestopt: ${String(bericht.subtype)}${fouten.length ? ` (${fouten.join("; ")})` : ""}`;
    return { regels: [regel(gelukt ? "systeem" : "fout", tekst)], afloop: { gelukt, kostenUsd: kosten, resultaat, fouten } };
  }
  return { regels: [], afloop: null };
}
