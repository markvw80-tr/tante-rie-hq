import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, test } from "vitest";
import { legUit } from "../regie/uitleg.ts";

const REPO = mkdtempSync(path.join(tmpdir(), "uitleg-"));
mkdirSync(path.join(REPO, "scripts"));
writeFileSync(path.join(REPO, "scripts/zoekvolumes.py"), '#!/usr/bin/env python3\n"""Haalt zoekvolumes op uit Keyword Planner.\n\nMeer tekst."""\nprint(1)\n');
afterAll(() => rmSync(REPO, { recursive: true, force: true }));
const bash = (command: string, extra: Record<string, unknown> = {}) => legUit("Bash", { command, ...extra }, REPO);

describe("legUit: shell", () => {
  test("mailbox: bericht sturen, afhandelen, statusblok", () => {
    expect(bash('python3 scripts/mailbox.py stuur --van seo --aan pim --onderwerp "Alt-regels V128" --tekst -').kop).toBe("Stuurt een bericht aan PIM: Alt-regels V128");
    expect(bash("python3 scripts/mailbox.py verwerkt 2026-11-15-x.md --notitie klaar").kop).toBe("Markeert een bericht als afgehandeld");
    expect(bash('python3 scripts/mailbox.py status --team pim --kop "18-11-2026 (x)" --tekst -').kop).toBe("Zet een statusblok van PIM op de gedeelde status");
  });

  test("Bedrijfsprofiel: wat er wijzigt en of het een proefdraai is", () => {
    const echt = bash("python3 scripts/gbp_schrijf.py bericht 2 --uitvoeren");
    expect(echt.kop).toBe("Plaatst een bericht in het Google Bedrijfsprofiel (bericht 2)");
    expect(echt.punten).toContain("Dit wijzigt het live profiel.");
    expect(bash("python3 scripts/gbp_schrijf.py speciaaltijden").punten).toContain("Proefdraai: toont wat er zou veranderen, wijzigt niets.");
  });

  test("git en thema", () => {
    expect(bash("git push origin main").kop).toBe("Zet de vastgelegde wijzigingen op GitHub (main)");
    expect(bash("git log --oneline -5").kop).toBe("Bekijkt de git-geschiedenis");
    expect(bash('shopify theme push --unpublished --theme "design-menu-2026-11-18" --path x').kop).toBe("Zet themabestanden op een ontwikkelthema (niet live)");
    expect(bash("shopify theme publish --theme 123").kop).toBe("Publiceert een thema: dat wordt direct het live thema van tanterie.nl");
  });

  test("script: korte beschrijving uit het script zelf", () => {
    const u = bash("python3 scripts/zoekvolumes.py --land nl");
    expect(u.kop).toBe("Draait het script zoekvolumes.py");
    expect(u.punten).toContain("Wat het script doet: Haalt zoekvolumes op uit Keyword Planner.");
  });

  test("lezen, webverzoeken en onbekende commando's", () => {
    expect(bash("grep -rn foo marketing").kop).toBe("Leest of zoekt in bestanden");
    expect(bash("curl -s -X POST https://api.example.com/x -d a=1").kop).toBe("Stuurt gegevens naar api.example.com");
    expect(bash("npm test").kop).toBe("Voert een commando uit: npm test");
  });

  test("toelichting die de agent bij het commando gaf", () => {
    expect(bash("npm test", { description: "Draai de tests" }).punten).toContain("Toelichting van de agent: Draai de tests");
  });
});

describe("legUit: bestanden", () => {
  test("Edit toont de regels voor en na", () => {
    const u = legUit("Edit", { file_path: `${REPO}/marketing/plan.md`, old_string: "Oude regel\nTwee", new_string: "Nieuwe regel\nTwee" }, REPO);
    expect(u.kop).toBe("Wijzigt het bestand marketing/plan.md");
    expect(u.wijzigingen).toEqual([{ bestand: "marketing/plan.md", voor: ["Oude regel", "Twee"], na: ["Nieuwe regel", "Twee"], nieuw: false }]);
  });

  test("Write buiten de teammap noemt het volledige pad en toont het begin van de inhoud", () => {
    const u = legUit("Write", { file_path: "/Users/m/tante-rie-hq/team/status.md", content: "a\nb" }, REPO);
    expect(u.kop).toBe("Schrijft het bestand /Users/m/tante-rie-hq/team/status.md");
    expect(u.wijzigingen[0]).toMatchObject({ nieuw: true, na: ["a", "b"] });
  });

  test("lange wijzigingen worden afgekapt", () => {
    const veel = Array.from({ length: 80 }, (_, i) => `regel ${i}`).join("\n");
    const u = legUit("Write", { file_path: `${REPO}/x.md`, content: veel }, REPO);
    expect(u.wijzigingen[0].na.length).toBeLessThanOrEqual(41);
    expect(u.wijzigingen[0].na.at(-1)).toContain("40 regels meer");
  });
});

describe("legUit: Shopify en web", () => {
  test("GraphQL-mutatie: soort wijziging, aantal en velden", () => {
    const u = legUit(
      "mcp__shop__graphql_mutation",
      {
        query: "mutation productUpdate($input: ProductInput!) { productUpdate(input: $input) { product { id } } }",
        variables: { input: { id: "gid://shopify/Product/1", title: "Rooibos", descriptionHtml: "<p>x</p>" } },
      },
      REPO,
    );
    expect(u.kop).toBe("Wijzigt een product in Shopify (productUpdate)");
    expect(u.punten).toContain("Velden: title, descriptionHtml");
  });

  test("update-product en webpagina", () => {
    expect(legUit("mcp__shop__update-product", { id: "gid://shopify/Product/9", status: "ACTIVE" }, REPO).kop).toBe("Wijzigt een product in Shopify");
    expect(legUit("mcp__shop__update-product", { id: "gid://shopify/Product/9", status: "ACTIVE" }, REPO).punten).toContain("Zet de status op ACTIVE: het product wordt zichtbaar voor klanten.");
    expect(legUit("WebFetch", { url: "https://www.geels1863.com/shop" }, REPO).kop).toBe("Haalt een webpagina op van www.geels1863.com");
  });
});
