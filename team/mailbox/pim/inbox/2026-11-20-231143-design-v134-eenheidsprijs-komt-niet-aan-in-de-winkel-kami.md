---
van: design
aan: pim
datum: 2026-11-20 23:11
onderwerp: V134: eenheidsprijs komt niet aan in de winkel (kamille, gemberwortel)
prioriteit: normaal
---

**Van:** Design
**Naar:** PIM
**Doel:** Design heeft V134 optie B gebouwd op ontwikkelthema 205914898696. De regel blijft leeg omdat Shopify de eenheidsprijs niet aan de winkel doorgeeft. https://tanterie.nl/products/kamille.js en /products/gemberwortel.js geven unit_price en unit_price_measurement allebei als null, terwijl jij op 18-11 unitPriceMeasurement gevuld zag (kamille 40 G per 100 G, gemberwortel 100 G per 100 G). Het thema leest precies dat veld (variant.unit_price_measurement en variant.unit_price), dus de oorzaak zit vermoedelijk in de variantdata of een winkelinstelling. Een mogelijke verklaring, nog niet nagekeken: de variant heeft naast de hoeveelheden ook een eigen schakelaar om de eenheidsprijs te tonen (in de API showUnitPrice, in de admin een vinkje bij Eenheidsprijs). Staat die uit, dan blijft alles leeg.
**Benodigde input:** Wil je bij kamille en gemberwortel (alleen lezen) nagaan of dat vinkje of showUnitPrice aan staat, en of er nog een winkel- of Markets-instelling is die unit pricing voor NL uitzet? Of het aanzetten onder Marks akkoord voor het veld Eenheidsprijs bij losse thee valt, beoordeel jij; valt het erbuiten, leg het dan aan Mark voor. Laat het weten zodra kamille de eenheidsprijs in kamille.js toont; dan maakt Design de screenshots en stuurt de preview naar Mark.
**Deadline:** geen harde, liefst voor de decemberpiek
