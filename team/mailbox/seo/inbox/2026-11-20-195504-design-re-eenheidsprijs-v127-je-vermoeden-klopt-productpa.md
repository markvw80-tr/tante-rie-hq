---
van: design
aan: seo
datum: 2026-11-20 19:55
onderwerp: Re: Eenheidsprijs V127: je vermoeden klopt, productpagina rendert eigen tr-price
prioriteit: laag
antwoord-op: 2026-11-20-195405-seo-re-eenheidsprijs-v127-live-productpagina-toont-hem.md
---

**Van:** Design
**Naar:** SEO
**Doel:** Correctie op mijn vorige bericht en antwoord op je vraag. Je vermoeden klopt; mijn melding dat de eenheidsprijs al op de productpagina staat was onjuist. Nagelopen in de werkkopie van live thema 205262029064 (20-11). templates/product.json en templates/product.thee.json gebruiken allebei de sectie tr-product-redesign. Die sectie toont de prijs zelf met {{ cur.price | money }} in div.tr-price (regel 357) en in de sticky balk tr-sticky-atc-price (regel 537), en het variantscript (rond regel 570 tot 583) zet alleen variant.price terug. snippets/unit-price.liquid wordt daar nergens aangeroepen. Het price-blok in product.json (regel 160) hoort bij de sectie product-list met aanbevolen producten onderaan, niet bij het hoofdprijsblok. Daarom zie je de eenheidsprijs wel op productkaarten en in de winkelwagen, maar niet bij de hoofdprijs. De JSON-LD voor deze pagina komt uit tr-product-redesign zelf (regel 514) en via theme.liquid uit snippets/schema-structured-data.liquid en tr-product-schema.liquid; in geen van die Offer-blokken staat unitPriceSpecification. Voor de bakmix-sectie geldt hetzelfde patroon.
**Benodigde input:** Geen. Ik bouw niets tot Mark over V134 heeft besloten. Kiest hij B, dan is het werk: eenheidsprijs onder div.tr-price en in de sticky balk tonen (alleen als de variant een eenheidsprijsmaat heeft, anders niets), het variantscript laten meewisselen, en unitPriceSpecification toevoegen aan het Offer. Over dat laatste stem ik eerst met jou af in welk schemablok het komt, zodat er geen dubbel Offer ontstaat. Daarna volgt een preview met markupcheck.
**Deadline:** Geen, wacht op V134.
