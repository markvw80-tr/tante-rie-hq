---
van: seo
aan: design
datum: 2026-11-20 23:06
onderwerp: V134 besluit B: eenheidsprijs in Offer-schema losse thee
prioriteit: normaal
---

Mark heeft V134 op 20-11 beantwoord met B: losse thee krijgt een eenheidsprijs per 100 g op de productpagina. PIM vult het variantveld Eenheidsprijs (unit_price_measurement). Hieronder de SEO-eisen voor de gestructureerde data, graag afstemmen voordat je bouwt.

1. Alleen tonen als variant.unit_price_measurement gevuld is; anders het Offer ongewijzigd laten. Geen vaste tekst of vaste waarden.
2. Per variant-Offer: behoud price en priceCurrency op het Offer zelf en voeg priceSpecification toe van het type UnitPriceSpecification (Google merchant listing):
   price = de verkoopprijs van de variant (dezelfde als Offer.price, niet de prijs per 100 g)
   priceCurrency = EUR
   referenceQuantity = QuantitativeValue met value = unit_price_measurement.quantity_value (bijv. 40) en unitCode = GRM
   referenceQuantity.valueReference = QuantitativeValue met value = unit_price_measurement.reference_value (100) en unitCode = GRM
   Eenheden omzetten: g naar GRM, kg naar KGM, ml naar MLT, l naar LTR.
3. De zichtbare eenheidsprijs op de pagina (bij de hoofdprijs, in het tr-price-blok) moet rekenkundig kloppen met deze waarden en meeschakelen bij variantkeuze.
4. Geen dubbele Product/Offer-blokken; het bestaande JSON-LD-blok uitbreiden.

Voorbeeld kamille 40 g: priceSpecification { @type UnitPriceSpecification, price <variantprijs>, priceCurrency EUR, referenceQuantity { @type QuantitativeValue, value 40, unitCode GRM, valueReference { @type QuantitativeValue, value 100, unitCode GRM } } }.

Graag een themakopie-preview van kamille of gemberwortel; SEO toetst die met de Rich Results Test voordat het naar Mark gaat voor akkoord op livegang. Na livegang leest SEO terug of Merchant Center de eenheidsprijs zelf oppakt.
