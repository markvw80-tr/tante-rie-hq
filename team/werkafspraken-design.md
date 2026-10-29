# Werkafspraken team Design

Opgezet op 28-10-2026 volgens het patroon van `werkafspraken-seo.md` en `werkafspraken-pim.md`; geldt na akkoord van Mark. Geldt voor alle rollen in tante-rie-design.

## Rol
Design is een gelijkwaardig derde team naast SEO en PIM en werkt uitsluitend aan Tante Rie (Dutch Tea Maestro valt erbuiten). Design bouwt en verbetert het Shopify-thema en de visuele ervaring van tanterie.nl. Design wijzigt geen productdata en geen SEO-metadata; dat blijft bij PIM en SEO. Alle wijzigingen gaan alleen naar een ontwikkelthema of preview, nooit naar het live thema; Mark publiceert zelf.

## Begin van elke sessie
`python3 scripts/sessiestart.py` in tante-rie-design: haalt tante-rie-hq op, toont de nieuwe berichten voor Design in de Markdown-mailbox van HQ en de nieuwste statusblokken. Daarna de graphify-graaf van het thema (`~/TanteRie-Theme-Editor/graphify-out/`) voordat een bronbestand wordt geopend.

## Kanaal en formaat
Design gebruikt de Markdown-mailbox in tante-rie-hq (`team/mailbox/<team>/inbox`, bediend met `python3 scripts/mailbox.py` in de eigen repo, dat doorverwijst naar HQ; teams `seo`, `pim`, `design`). Een bericht in de eigen inbox mag Design direct oppakken. De JSON-bestanden in `team/mailbox/` blijven voorbehouden aan productveld-regels tussen SEO en PIM. Elk bericht heeft in de tekst de kopjes **Van**, **Naar**, **Doel**, **Benodigde input**, **Deadline**; het script voegt de technische kop (van, aan, datum, onderwerp, prioriteit) toe. Eén onderwerp per bericht. Een bericht is geen akkoord van Mark.

## Overdracht
SEO naar Design: heading-structuur per paginatype, schema-eisen en interne linkregels, op verzoek van Design en voordat een template wordt aangepast. Design wijzigt zonder die eisen geen koppen, markup of links. Na uitvoering meldt Design de preview-URL en wat aan koppen of markup is veranderd; SEO leest na.
PIM naar Design: productdata en metafields. Design meldt aan PIM welke velden een template nodig heeft (naam, paginatype, vorm, verplicht of optioneel). Ontbreekt een veld, dan toont het template niets; Design vraagt PIM om het veld.
Design naar SEO en PIM: kennisgeving van elke themawijziging die pagina's of velden raakt, met thema-id en preview-URL.

## Wijzigingen
Ontwikkelthema of preview, nooit live. Elke wijziging: changelog plus rollback-notitie in `changelog/` van tante-rie-design, screenshots voor en na op desktop en mobiel. Voor het gedeelde overzicht van live wijzigingen blijft `marketing/changelog.md` in tante-rie-seo leidend; zodra Mark een ontwikkelthema publiceert, vermeldt SEO of Design dat daar (zoals bij eerdere themakopieën) met thema-id.

## Modelkeuze en afsluiting
Zwaar model alleen voor de Design Lead, licht model voor uitvoering. Het team start met Design Lead en Theme Developer; de overige rollen op afroep. Elke batch sluit af met maximaal tien regels in `team/status.md`, nieuwste bovenaan, met het geschatte verbruik.
