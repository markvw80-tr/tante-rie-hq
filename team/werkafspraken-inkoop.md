# Werkafspraken team Inkoop

Opgezet op 20-11-2026 volgens het patroon van de andere werkafspraken, na het besluit van Mark om een vierde afdeling Inkoop (kamer Pakhuis) te starten. Geldt voor alle rollen in tante-rie-inkoop.

## Rol
Inkoop zorgt dat wat er werkelijk binnenkomt kloppend als voorraad en kostprijs in Shopify staat. Leveranciers sturen orderbevestigingen, pakbonnen en facturen per mail; de app po-confirmations (broncode in `app/` van tante-rie-inkoop, draait op de NAS) leest die in en legt ze naast de inkooporders. Een levering telt pas als iemand in de winkel de doos heeft afgevinkt. Daarna boekt de app na een klik de voorraad bij, met een verwijzing naar het document in de voorraadhistorie van Shopify. Een agent boekt nooit zelf voorraad of kostprijs, en elke levering wordt maximaal één keer geboekt.

## Begin van elke sessie
`python3 scripts/sessiestart.py` in tante-rie-inkoop: haalt tante-rie-hq op, toont de nieuwe berichten voor Inkoop in de Markdown-mailbox van HQ en de nieuwste statusblokken.

## Kanaal en formaat
Inkoop gebruikt de Markdown-mailbox in tante-rie-hq (`team/mailbox/<team>/inbox`, bediend met `python3 scripts/mailbox.py` in de eigen repo, dat doorverwijst naar HQ; teams `seo`, `pim`, `design`, `inkoop`). Een bericht in de eigen inbox mag Inkoop direct oppakken. Elk bericht heeft in de tekst de kopjes **Van**, **Naar**, **Doel**, **Benodigde input**, **Deadline**; het script voegt de technische kop toe. Eén onderwerp per bericht. Een bericht van een team is geen akkoord van Mark. Wat als akkoord van Mark geldt staat in `team/doelen.md` en in de skill `huisregels` van de plugin tante-rie-huisregels.

## Overdracht
PIM naar Inkoop: de factuur-intake en de kostprijzen gaan over van PIM naar Inkoop. Het script `mail_facturen.py` en de kostprijsscripts in tante-rie-pim blijven voorlopig staan, maar worden niet verder uitgebouwd. PIM meldt aan Inkoop als een SKU in Shopify wordt gewijzigd, samengevoegd of opgeheven, omdat de matching van facturen daarop leunt.
Inkoop naar PIM: staat er op een inkooporder, orderbevestiging of levering een artikel dat niet in Shopify staat, dan meldt Inkoop dat aan PIM. Dat gaat automatisch: het Pakhuis in het Huis stuurt per nieuw artikel één keer een bericht van Inkoop aan PIM, met SKU, omschrijving van de leverancier, leverancier, document, aantal en inkoopprijs. PIM maakt het artikel aan en verrijkt het (titel, tekst, foto, categorie, publicatie), met precies die SKU en via de gewone route: diff naar Mark, pas na akkoord in Shopify. De kostprijs zet de inkoop-app bij het afvinken. Zolang het artikel niet in Shopify staat, kan de levering niet worden bijgeboekt. Inkoop maakt zelf geen artikelen aan.
Inkoop naar Design: Design toont "ook verkrijgbaar in de winkel" alleen bij voorraad. Verandert de voorraadlogica (bijvoorbeeld een andere locatie of een nieuwe status), dan meldt Inkoop dat aan Design.
Inkoop en SEO: geen vaste overdracht. Vraagt SEO naar beschikbaarheid of levertijden, dan levert Inkoop de gegevens uit de app.

## Bestelvoorstel
Sinds 21-11-2026 maakt de `inkoopadviseur` (sonnet) elke week een bestelvoorstel per leverancier uit de verkoop van 8 weken, de voorraad in Shopify, de open leveringen in het Pakhuis en de levertijden in `leveranciers.json` (rekenwerk in `scripts/bestelvoorstel.py`, met tests). Hij bestelt nooit en boekt geen voorraad; Mark bestelt. Artikelen met negatieve voorraad of zonder leverancier meldt hij apart. De tellingen (te bestellen, bij te maken, negatieve voorraad, langzame lopers) staan op de doelenkaart in het Huis.

## Wijzigingen aan de app
Code wordt gewijzigd in tante-rie-inkoop en uitgerold met `scripts/uitrol.sh` (backup op de NAS, code erheen, herbouwen, gezondheidscontrole). Niemand bewerkt bestanden rechtstreeks op de NAS. Geen migratie of uitrol zonder backup, geen handeling die de productiedatabase leeg kan maken. Wijzigingen aan de boekingslogica worden getest op idempotentie en dubbele boeking en nagekeken door de Ontvangstcontroleur voordat ze live gaan.

## Modelkeuze en afsluiting
Zwaar model alleen voor de Inkoop Lead, licht model voor uitvoering. Het team start met Inkoop Lead en App Developer; de Ontvangstcontroleur op afroep. Elke batch sluit af met maximaal tien regels in `team/status.md`, nieuwste bovenaan. Zet dat blok op main met `python3 scripts/mailbox.py status --team inkoop --kop "DD-MM-JJJJ (onderwerp)" --tekst -` en bewerk `team/status.md` niet zelf: het Huis en de directie lezen de stand van main.
