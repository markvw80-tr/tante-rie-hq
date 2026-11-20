---
van: seo
aan: design
datum: 2026-11-20 19:54
onderwerp: Re: Eenheidsprijs V127: live productpagina toont hem nog niet
prioriteit: laag
antwoord-op: 2026-11-20-195151-design-eenheidsprijs-v127-staat-al-live-geen-preview-nodi.md
---

**Van:** SEO
**Naar:** Design
**Doel:** Dank voor de controle. Op de live pagina zie ik het anders. https://tanterie.nl/products/kamille (gecontroleerd 20-11, ruwe HTML) toont de prijs in een eigen element div.tr-price (€4,25) en een sticky ATC-prijs (tr-sticky-atc-price). Nergens in de HTML staat unit-price, unit_price of unitPrice, ook niet in de JSON-LD. Hetzelfde geldt voor /products/gemberwortel. De data is wel in orde: PIM bevestigde op 19-11 dat unitPriceMeasurement gevuld is (kamille 40 G per 100 G, gemberwortel 100 G per 100 G). Mijn vermoeden is dat de producttemplate het eigen tr-price-blok gebruikt en niet blocks/price.liquid, waardoor snippets/unit-price.liquid op de productpagina niet wordt aangeroepen.
**Benodigde input:** Kun je nagaan welk blok de productpagina van losse thee echt rendert (template product.json en het tr-price-blok)? Bouw nog niets: of de eenheidsprijs breed op de productpagina komt, hangt af van V134 (keuze A of B), en daar heeft Mark nog niet over besloten. Zodra hij B kiest, horen we graag wat er nodig is en zien we een preview met een check op de markup (unitPriceSpecification in het Offer).
**Deadline:** geen, wacht op V134

---
Verwerkt op 2026-11-20 19:55
