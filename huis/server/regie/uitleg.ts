import { readFileSync } from "node:fs";
import path from "node:path";
import type { PoortUitleg, PoortWijziging } from "../../shared/types.ts";

const MAX_REGELS = 40;
const TEAMNAAM: Record<string, string> = { seo: "SEO", pim: "PIM", design: "Design", directie: "Directie" };
const GBP: Record<string, string> = {
  bericht: "Plaatst een bericht in het Google Bedrijfsprofiel",
  attributen: "Wijzigt kenmerken in het Google Bedrijfsprofiel",
  speciaaltijden: "Zet speciale openingstijden in het Google Bedrijfsprofiel",
  beschrijving: "Wijzigt de beschrijving in het Google Bedrijfsprofiel",
  categorieen: "Wijzigt de categorieën in het Google Bedrijfsprofiel",
};
const MUTATIE: Record<string, string> = {
  productUpdate: "Wijzigt een product in Shopify",
  productCreate: "Maakt een nieuw product in Shopify",
  productSet: "Zet productgegevens in Shopify",
  productVariantsBulkUpdate: "Wijzigt varianten van een product in Shopify",
  productVariantsBulkCreate: "Voegt varianten toe aan een product in Shopify",
  inventoryItemUpdate: "Wijzigt voorraadgegevens (zoals de kostprijs) in Shopify",
  inventorySetQuantities: "Zet voorraadaantallen in Shopify",
  inventoryAdjustQuantities: "Past voorraadaantallen aan in Shopify",
  metafieldsSet: "Zet extra productvelden (metafields) in Shopify",
  collectionAddProducts: "Voegt producten toe aan een collectie in Shopify",
  publishablePublish: "Publiceert iets op een verkoopkanaal in Shopify",
  productDelete: "Verwijdert een product uit Shopify",
};

const uitleg = (kop: string, punten: string[] = [], wijzigingen: PoortWijziging[] = []): PoortUitleg => ({ kop, punten, wijzigingen });

/** Woorden van een shellcommando, met aanhalingstekens als één woord. */
function woorden(command: string): string[] {
  return [...command.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
}

function optie(w: readonly string[], naam: string): string | null {
  const i = w.indexOf(naam);
  return i >= 0 && i + 1 < w.length ? w[i + 1] : null;
}

function regels(tekst: string): string[] {
  const alle = tekst.replace(/\r\n/g, "\n").split("\n");
  return alle.length > MAX_REGELS ? [...alle.slice(0, MAX_REGELS), `… en nog ${alle.length - MAX_REGELS} regels meer`] : alle;
}

function relatief(pad: string, repo: string): string {
  const rel = path.relative(repo, path.resolve(repo, pad));
  return rel.startsWith("..") || path.isAbsolute(rel) ? path.resolve(repo, pad) : rel;
}

/** Eerste regel van de docstring of het eerste commentaar van een script in de teamrepo. */
function scriptBeschrijving(repo: string, script: string): string | null {
  const pad = path.resolve(repo, script);
  if (path.relative(repo, pad).startsWith("..")) return null;
  try {
    const tekst = readFileSync(pad, "utf8").slice(0, 4000);
    const doc = /"""\s*([^\n"]+)/.exec(tekst) ?? /^\s*(?:#|\/\/)\s*(?!!)([^\n]+)/m.exec(tekst.replace(/^#!.*\n/, ""));
    return doc ? doc[1].trim() : null;
  } catch {
    return null;
  }
}

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function legUitBash(command: string, repo: string, toelichting: unknown): PoortUitleg {
  const w = woorden(command);
  const extra = typeof toelichting === "string" && toelichting.trim() ? [`Toelichting van de agent: ${toelichting.trim()}`] : [];
  const metToelichting = (u: PoortUitleg): PoortUitleg => ({ ...u, punten: [...u.punten, ...extra] });
  const scriptIndex = w.findIndex((x) => /\.(py|sh|js|mjs|ts)$/.test(x));
  const script = scriptIndex >= 0 ? path.basename(w[scriptIndex]) : null;
  const sub = scriptIndex >= 0 ? w[scriptIndex + 1] : undefined;

  if (script === "mailbox.py") {
    if (sub === "stuur") return metToelichting(uitleg(`Stuurt een bericht aan ${TEAMNAAM[optie(w, "--aan") ?? ""] ?? optie(w, "--aan")}: ${optie(w, "--onderwerp") ?? "(zonder onderwerp)"}`));
    if (sub === "verwerkt") return metToelichting(uitleg("Markeert een bericht als afgehandeld", optie(w, "--notitie") ? [`Notitie: ${optie(w, "--notitie")}`] : []));
    if (sub === "status") return metToelichting(uitleg(`Zet een statusblok van ${TEAMNAAM[optie(w, "--team") ?? ""] ?? optie(w, "--team")} op de gedeelde status`));
    return metToelichting(uitleg("Leest de post"));
  }
  if (script === "pim_regels.py" && sub === "stuur") return metToelichting(uitleg("Stuurt een bundel productregels van SEO naar PIM"));
  if (script === "gbp_schrijf.py") {
    const nummer = sub === "bericht" && w[scriptIndex + 2] ? ` (bericht ${w[scriptIndex + 2]})` : "";
    const live = w.includes("--uitvoeren");
    return metToelichting(uitleg(`${GBP[sub ?? ""] ?? "Wijzigt het Google Bedrijfsprofiel"}${nummer}`, [live ? "Dit wijzigt het live profiel." : "Proefdraai: toont wat er zou veranderen, wijzigt niets."]));
  }
  if (script === "merchant_schrijf.py") return metToelichting(uitleg("Wijzigt gegevens in Google Merchant Center", ["Dit raakt de producten zoals Google ze toont."]));

  if (w[0] === "git" || w.includes("git")) {
    const g = w.slice(w.indexOf("git") + 1).filter((x) => !x.startsWith("-") || x === "--");
    const actie = g.find((x) => ["push", "commit", "status", "log", "diff", "pull", "fetch", "add", "show"].includes(x));
    if (actie === "push") return metToelichting(uitleg(`Zet de vastgelegde wijzigingen op GitHub${/main|master/.test(command) ? ` (${/master/.test(command) ? "master" : "main"})` : ""}`));
    if (actie === "commit") return metToelichting(uitleg("Legt wijzigingen vast in git", optie(w, "-m") ? [`Omschrijving: ${optie(w, "-m")}`] : []));
    if (actie === "pull" || actie === "fetch") return metToelichting(uitleg("Haalt de laatste stand op van GitHub"));
    if (actie === "add") return metToelichting(uitleg("Zet bestanden klaar om vast te leggen in git"));
    return metToelichting(uitleg("Bekijkt de git-geschiedenis"));
  }
  if (w[0] === "shopify" && w[1] === "theme") {
    if (w[2] === "publish") return metToelichting(uitleg("Publiceert een thema: dat wordt direct het live thema van tanterie.nl"));
    if (w[2] === "push") {
      if (w.includes("--live") || w.includes("-l")) return metToelichting(uitleg("Zet themabestanden direct op het LIVE thema van tanterie.nl"));
      return metToelichting(uitleg("Zet themabestanden op een ontwikkelthema (niet live)", optie(w, "--theme") ? [`Thema: ${optie(w, "--theme")}`] : []));
    }
    if (w[2] === "pull") return metToelichting(uitleg("Haalt een kopie van een thema op (alleen lezen)"));
    return metToelichting(uitleg("Bekijkt of controleert het thema"));
  }
  if (w[0] === "curl") {
    const url = w.find((x) => /^https?:\/\//.test(x)) ?? "";
    const schrijft = /-X\s*(POST|PUT|PATCH|DELETE)|--request\s+(POST|PUT|PATCH|DELETE)|\s(-d|--data[\w-]*|-F|--form)\b/.test(command);
    return metToelichting(uitleg(schrijft ? `Stuurt gegevens naar ${host(url)}` : `Haalt gegevens op van ${host(url)}`));
  }
  if (script && /^(python3?|node|bash|sh|npx|tsx)$/.test(w[0])) {
    const wat = scriptBeschrijving(repo, w[scriptIndex]);
    return metToelichting(uitleg(`Draait het script ${script}`, wat ? [`Wat het script doet: ${wat}`] : []));
  }
  if (/^(cat|grep|rg|ls|head|tail|find|wc|sed|awk|cd)$/.test(w[0])) return metToelichting(uitleg("Leest of zoekt in bestanden"));
  return metToelichting(uitleg(`Voert een commando uit: ${command.length > 80 ? `${command.slice(0, 80)}…` : command}`));
}

function velden(x: unknown): string[] {
  if (!x || typeof x !== "object") return [];
  if (Array.isArray(x)) return x.length ? velden(x[0]) : [];
  const o = x as Record<string, unknown>;
  const binnen = ["input", "product", "variants", "inventoryItem", "metafields"].find((k) => k in o && typeof o[k] === "object");
  if (binnen) return velden(o[binnen]);
  return Object.keys(o).filter((k) => k !== "id" && k !== "productId");
}

function aantal(x: unknown): number {
  if (!x || typeof x !== "object") return 1;
  for (const v of Object.values(x as Record<string, unknown>)) if (Array.isArray(v)) return v.length;
  return 1;
}

function legUitShopify(tool: string, invoer: Record<string, unknown>): PoortUitleg | null {
  const naam = tool.replace(/^mcp__[^_]+(?:_[^_]+)*?__/, "");
  const query = typeof invoer.query === "string" ? invoer.query : "";
  const mutatie = /mutation\b[^{]*\{\s*(\w+)/.exec(query)?.[1];
  if (mutatie) {
    const n = aantal(invoer.variables);
    const punten = [...(n > 1 ? [`Aantal: ${n}`] : []), ...(velden(invoer.variables).length ? [`Velden: ${velden(invoer.variables).join(", ")}`] : [])];
    return uitleg(`${MUTATIE[mutatie] ?? "Wijzigt gegevens in Shopify"} (${mutatie})`, punten);
  }
  const status = typeof invoer.status === "string" ? invoer.status : null;
  const statusPunt = status === "ACTIVE" ? ["Zet de status op ACTIVE: het product wordt zichtbaar voor klanten."] : status ? [`Zet de status op ${status}.`] : [];
  const overig = Object.keys(invoer).filter((k) => !["id", "status"].includes(k));
  const veldPunt = overig.length ? [`Velden: ${overig.join(", ")}`] : [];
  if (naam === "update-product") return uitleg("Wijzigt een product in Shopify", [...statusPunt, ...veldPunt]);
  if (naam === "create-product") return uitleg("Maakt een nieuw product in Shopify", [...statusPunt, ...veldPunt]);
  if (naam === "set-inventory") return uitleg("Zet voorraad in Shopify", veldPunt);
  if (/collection/.test(naam)) return uitleg("Wijzigt een collectie in Shopify", veldPunt);
  if (/theme_publish/.test(naam)) return uitleg("Publiceert een thema: dat wordt direct het live thema van tanterie.nl");
  return null;
}

/** Legt een poortvraag uit in gewone taal: wat er gebeurt, wat er verandert en waarom. */
export function legUit(tool: string, invoer: Record<string, unknown>, repo: string): PoortUitleg {
  if (tool === "Bash") return legUitBash(String(invoer.command ?? ""), repo, invoer.description);
  if (tool === "Edit" || tool === "MultiEdit") {
    const bestand = relatief(String(invoer.file_path ?? ""), repo);
    const edits = Array.isArray(invoer.edits) ? (invoer.edits as Record<string, unknown>[]) : [invoer];
    const wijzigingen = edits.slice(0, 5).map((e) => ({ bestand, voor: regels(String(e.old_string ?? "")), na: regels(String(e.new_string ?? "")), nieuw: false }));
    return uitleg(`Wijzigt het bestand ${bestand}`, edits.length > 5 ? [`${edits.length} wijzigingen, de eerste 5 staan hieronder`] : [], wijzigingen);
  }
  if (tool === "Write") {
    const bestand = relatief(String(invoer.file_path ?? ""), repo);
    return uitleg(`Schrijft het bestand ${bestand}`, [], [{ bestand, voor: [], na: regels(String(invoer.content ?? "")), nieuw: true }]);
  }
  if (tool === "WebFetch") return uitleg(`Haalt een webpagina op van ${host(String(invoer.url ?? ""))}`, [String(invoer.url ?? "")]);
  if (tool === "WebSearch") return uitleg(`Zoekt op internet naar: ${String(invoer.query ?? "")}`);
  if (tool.startsWith("mcp__")) {
    const shopify = legUitShopify(tool, invoer);
    if (shopify) return shopify;
    return uitleg(`Gebruikt de koppeling ${tool.replace(/^mcp__/, "").split("__").at(-1)}`);
  }
  return uitleg(`Gebruikt de tool ${tool}`);
}
