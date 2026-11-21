# Concept-opdrachten agentronde, 21-11-2026

Bij `helikopterview-2026-11-21.md`, sectie 1. Dit zijn alleen concepten en ze zijn nog niet verstuurd. Mark verstuurt ze zelf via de keukentafel in het Huis, één per team. Elke opdracht vraagt alleen de agentbestanden en settings van het eigen team aan te passen, met één commit `chore: agents op orde` en een statusblok. Er gaat niets live en er verandert niets in Shopify.

Algemene regel voor elk team: zet de skills die een agent nodig heeft in de frontmatter (`skills:`), geef de agent de tool `Skill`, en gebruik alleen Shopify-toolnamen die de connector nu echt heeft. Controleer die namen in een testrun vanuit het Huis, want de voorvoegsels kunnen per omgeving verschillen.

---

## SEO

Onderwerp: agents op orde (skills, tools, model)

- Geef alle acht agents een `tools:`-regel. Nu hebben technisch-seo, zoekwoord-onderzoeker, onpage-copy, autoriteit-lokaal en analist er geen, en krijgen ze daardoor alle MCP's, waaronder Gmail en Shopify.
- Geef kwaliteitsredacteur en content-redacteur `Bash`, beperkt via de bestaande allowlist. Ze moeten `lint_nl_copy.py`, `pim_regels.py akkoord` en `mailbox.py` kunnen draaien.
- Zet zoekwoord-onderzoeker op opus, zoals CLAUDE.md voor zoekintentie vraagt.
- Zet de skills die nu alleen in de tekst staan in `skills:`. Trek de skilltabel in CLAUDE.md gelijk met de agentbestanden.
- Leg de grens tussen content-redacteur en onpage-copy vast: wie schrijft collectieteksten?
- Werk `docs/databronnen.md` bij: Merchant Center loopt via een OAuth-token, niet via een service-account. Zet de kop van `vragen-voor-mark.md` op de juiste datum.
- Neem het Gmail-logboek van Search Console-mails weer op. Het staat stil sinds 26-10.

## PIM

Onderwerp: agents op orde (Shopify-tools, model, voorraadgrens)

- Vervang in alle agents en in `settings.json` de Shopify-toolnamen die niet meer bestaan: `search_products`, `get-product`, `get-inventory-levels`, `create-product`, `update-product`, `validate_graphql_codeblocks` en `mcp__claude_ai_Shopify__*`. Gebruik in plaats daarvan de huidige tools, zoals `graphql_query`, `graphql_mutation`, `graphql_schema`, `add-to-collection` en `bulk-update-product-status`.
- Geef content-enricher en pim-qa-auditor `graphql_query` (alleen lezen), zodat ze Shopify kunnen lezen.
- Zet price-stock-agent op sonnet in plaats van haiku.
- Haal de voorraad- en kostprijsrechten weg bij price-stock-agent en shopify-publisher (`set-inventory`, voorraad- en kostprijsvelden). Volgens het besluit van Mark van 20-11 boekt alleen het Pakhuis voorraad en kostprijs.
- Zet `skills:` in de frontmatter: content-enricher (copywriting, stop-slop), media-agent (seo-images), pim-qa-auditor (seo-page) en shopify-publisher (shopify-admin).
- Commit de kostprijsregel in `pim-qa-auditor.md`. Die staat nog niet vastgelegd.

## Design

Onderwerp: agents op orde (skills laden, zelf kunnen kijken)

- Geef elke agent `Skill` en zet de skills in `skills:`: theme-developer (shopify-liquid), ux-cro (cro, design-critique), visual-brand (design-system, brandkit), perf-a11y-reviewer (accessibility-review, seo-google) en design-lead (design-handoff). Haal `seo-performance` weg, want die skill bestaat niet.
- Laat visual-brand en ux-cro kijken via `scripts/screenshot.py` (Playwright) of `theme_screenshot` van de Shopify-connector. Nu zien ze de pagina niet.
- Test of claude-in-chrome bij perf-a11y-reviewer werkt in een run vanuit het Huis. Zo niet, schakel dan over op Playwright.
- Werk de stijlgids bij naar het live thema 205262029064. Kies één bron voor de tokens: de stijlgids of `tante-rie-theme/DESIGN.md`. Haal de tegenspraak over de knopkleur in `opdrachten/2026-11-21-open-designpunten.md` weg.
- Werk het aantal openstaande afwijkingen in CLAUDE.md bij: 8, niet 40.
- Meld aan HQ dat de tekstlint geen klanttekst van Design controleert (thema, banners). Bijvoorbeeld via een pad in `schrijfregels.json`.

## Inkoop

Onderwerp: agents op orde (Shopify-skills, controle)

- Geef app-developer en ontvangst-controleur `Skill`, met `skills:` shopify-admin en shopify-use-shopify-cli.
- Geef ontvangst-controleur een manier om Shopify te lezen (alleen lezen). Nu moet hij een query draaien zonder tool.
- Breid `voorraadpoort.py` uit naar MCP-tools (matcher `mcp__.*`), niet alleen Bash.
- Werk de fasechecklist in de README bij. Meld aan Mark dat het Shopify-token nog `read_inventory`/`write_inventory` mist.
- Zoek uit of het Pakhuis via Tailscale Funnel openbaar staat (`tailscale funnel status`) en stel aan Mark de overstap naar `tailscale serve` voor.
