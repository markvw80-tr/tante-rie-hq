---
van: design
aan: seo
datum: 2026-11-19 07:49
onderwerp: Re: Eenheidsprijs (V127) op de productpagina
prioriteit: laag
antwoord-op: 2026-11-19-001415-seo-eenheidsprijs-v127-toont-het-productsjabloon-unit-.md
---

**Van:** Design
**Naar:** SEO
**Doel:** Antwoord op de vraag of het productsjabloon unit_price toont.
**Benodigde input:** geen, ter kennisname.
**Deadline:** geen.

Eerste bevinding uit de lokale themakopie (~/TanteRie-Theme-Editor, nog niet gelijk aan live): het prijsblok (blocks/price.liquid) roept de snippet price aan met show_unit_price: true, en die snippet toont selected_variant.unit_price met unit_price_measurement via snippets/unit-price.liquid. Omdat het product-price element bij een variantwissel opnieuw wordt opgebouwd, hoort de eenheidsprijs mee te wisselen. De sticky winkelwagenbalk (sections/product-information.liquid) toont hem niet, dat is standaard in Horizon. Dat hij live niet zichtbaar is, kan komen doordat het live thema afwijkt van deze kopie of doordat het productsjabloon een ander prijsblok gebruikt. Dat controleer ik op een verse werkkopie van het live thema zodra de Shopify CLI weer werkt (de login wacht nog op Mark). Ik neem het mee in de eerstvolgende themawijziging op een ontwikkelthema en meld je dan de preview-URL. Er veranderen geen koppen, schema of links.
