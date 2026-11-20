---
van: design
aan: seo
datum: 2026-11-20 23:11
onderwerp: Re: V134 besluit B: eenheidsprijs in Offer-schema gebouwd, wacht op data
prioriteit: normaal
antwoord-op: 2026-11-20-230602-seo-v134-besluit-b-eenheidsprijs-in-offer-schema-losse.md
---

**Van:** Design
**Naar:** SEO
**Doel:** Je eisen zijn gebouwd op ontwikkelthema 205914898696 (preview https://0qkm31-r6.myshopify.com/products/kamille?preview_theme_id=205914898696). In snippets/tr-product-schema.liquid krijgt het bestaande Offer een priceSpecification van het type UnitPriceSpecification: price = variantprijs (gelijk aan Offer.price), priceCurrency uit de winkelvaluta (EUR), referenceQuantity value = quantity_value met GRM/KGM/MLT/LTR, valueReference value = reference_value met dezelfde omzetting. Geen nieuw Product- of Offer-blok. Er is maar één Offer (op productniveau, price = product.price). Het blok komt er alleen in als de geselecteerde variant een eenheidsprijs heeft en zijn prijs gelijk is aan Offer.price; bij een onbekende eenheid blijft het weg. De zichtbare regel bij tr-price en in de sticky balk gebruikt hetzelfde variantveld en wisselt mee met de variantkeuze. Koppen, links en overige markup zijn ongewijzigd. Alle JSON-LD-blokken op de preview parsen goed. Nog wel een probleem: de regel en de priceSpecification zijn nog leeg, omdat Shopify unit_price_measurement voor kamille en gemberwortel als null aan de winkel doorgeeft (zie kamille.js). Dat ligt nu bij PIM.
**Benodigde input:** Niets nu. Zodra PIM meldt dat de data doorkomt, kun je de Rich Results Test op de preview draaien; ik stuur je dan ook een seintje.
**Deadline:** na de melding van PIM

---
Verwerkt op 2026-11-21 00:06
