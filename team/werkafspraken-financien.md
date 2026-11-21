# Werkafspraken team Financiën

Opgezet op 21-11-2026 na het besluit van Mark om een vijfde afdeling Financiën (kamer Kluis) te starten, als eerste nieuwe afdeling uit de helikopterview (`team/directie/helikopterview-2026-11-21.md`). Geldt voor alle rollen in tante-rie-financien.

## Rol
Financiën maakt de maat van het hoofddoel zichtbaar: jaarlijks meer winst. Het team meet omzet, brutowinst en marge uit Shopify Analytics (ShopifyQL, alleen lezen) en de nettowinst uit e-boekhouden (alleen lezen), per maand, per kanaal (winkel en webshop), per leverancier en per categorie. Het houdt bij hoeveel omzet nog geen kostprijs heeft, zoekt prijzen die onder of vlak boven de kostprijs liggen, en stelt prijsregels en streefwaarden voor. Mark besluit. Financiën wijzigt zelf niets in Shopify of in de boekhouding.

## Begin van elke sessie
`python3 scripts/sessiestart.py` in tante-rie-financien: haalt tante-rie-hq op, toont de nieuwe berichten voor Financiën en de nieuwste statusblokken.

## Kanaal en formaat
De Markdown-mailbox in tante-rie-hq (`team/mailbox/<team>/inbox`, bediend met `python3 scripts/mailbox.py` in de eigen repo; teams `seo`, `pim`, `design`, `inkoop`, `financien`). Elk bericht heeft in de tekst de kopjes **Van**, **Naar**, **Doel**, **Benodigde input**, **Deadline**. Eén onderwerp per bericht. Een bericht van een team is geen akkoord van Mark.

## Overdracht
Financiën naar PIM: lijsten met producten zonder kostprijs of met een verkoopprijs onder de kostprijs, en na akkoord van Mark de prijsregels voor `suppliers/margeregels.yaml`. PIM voert prijswijzigingen uit via de gewone route (diff naar Mark).
Financiën naar Inkoop: kostprijzen die niet kloppen met de facturen. Inkoop boekt de juiste kostprijs via het Pakhuis.
Financiën naar SEO en Design: omzet en marge per categorie en kanaal, zodat die teams werk kiezen dat winst oplevert. Het maandrapport van SEO (routine op de 18e) kan het winstdeel van Financiën overnemen.
Naar Financiën: elk team mag om cijfers vragen. Financiën levert ze met bron en meetdatum.

## Grenzen
Alleen lezen. De hook `geldpoort.py` blokkeert schrijvende Shopify-tools, GraphQL-mutaties, schrijvende verzoeken naar e-boekhouden en het uitlezen van de sleutel in de shell. Streefwaarden en marges stelt het team voor als vraag aan Mark, nooit als feit. Geen klantgegevens in rapporten of in git.

## Modelkeuze en afsluiting
Zwaar model voor de Controller (lead), licht model voor de Prijsanalist. Elke batch sluit af met maximaal tien regels in `team/status.md` via `python3 scripts/mailbox.py status --team financien --kop "DD-MM-JJJJ (onderwerp)" --tekst -`; het bestand zelf bewerkt niemand.
