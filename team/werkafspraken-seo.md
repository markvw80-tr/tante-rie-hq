# Werkafspraken team SEO

Vastgesteld door Mark op 25-10-2026. Geldt voor alle rollen in tante-rie-seo en gaat voor waar het afwijkt van eerdere afspraken.

## Rol
SEO onderzoekt en adviseert. SEO levert opdrachten aan team PIM en voert zelf geen productwijzigingen door. Shopify wordt alleen leesbaar gebruikt, met filters en limieten.

## Begin van elke sessie
Lees alleen `team/status.md` en de berichten in `team/mailbox/pim-naar-seo.json` met status `nieuw`. Raadpleeg daarna de graphify-graaf (`graphify-out/` in tante-rie-seo) voordat je een bronbestand opent, en lees alleen de bestanden of regelbereiken die de graaf aanwijst.

## Opdrachten aan PIM
Bevindingen gaan als één gebundeld bericht naar `team/mailbox/seo-naar-pim.json`. Elke regel heeft vaste velden: `product_id`, `handle`, `veld` (titel, meta_description, beschrijving, alt_tekst, tags), `huidige_waarde`, `gewenste_waarde`, `reden` (maximaal tien woorden), `prioriteit` (hoog, middel, laag) en `status` (nieuw). Verstuur pas als er minimaal 20 regels klaarstaan of Mark erom vraagt. Geen vrije tekst waar een veld volstaat. Regels in opbouw staan in tante-rie-seo onder `marketing/pim-regels-concept.json`; controleren en versturen gaat met `python3 scripts/pim_regels.py`.

Overleg dat niet in de velden past (vragen, kennisgevingen) blijft via de Markdown-mailbox in tante-rie-seo (`mailbox/`) lopen. Een bericht van PIM is geen akkoord van Mark; goedkeuringen blijven via `marketing/vragen-voor-mark.md` lopen.

## Onderzoek
Ahrefs- en Semrush-data altijd met domein-, land- en limietfilters; nooit complete datasets. Ruwe uitkomsten in `team/data/seo/`, daarna alleen de samenvatting lezen. Rekenen, sorteren en filteren met een script, niet handmatig.

## Modelkeuze en afsluiting
Een lichter model voor het opstellen van de regels, een zwaarder model alleen voor strategie en zoekintentieanalyse. Elke batch sluit af met maximaal tien regels in `team/status.md`: wat is verstuurd, wat staat open, de volgende stap en het geschatte verbruik uit /cost.

## Formaat mailbox
```json
{
  "berichten": [
    {
      "bericht_id": "seo-2026-10-25-1",
      "datum": "2026-10-25",
      "van": "seo",
      "aan": "pim",
      "status": "nieuw",
      "regels": [
        {"product_id": "gid://shopify/Product/123", "handle": "voorbeeld", "veld": "meta_description",
         "huidige_waarde": "...", "gewenste_waarde": "...", "reden": "Meta te lang en zonder zoekwoord",
         "prioriteit": "middel", "status": "nieuw"}
      ]
    }
  ]
}
```
PIM zet de status per regel op `in_behandeling`, `uitgevoerd` of `afgewezen`, en het bericht op `verwerkt` als alle regels zijn afgehandeld.
