# Werkafspraken team Klant & Community

Opgezet op 21-11-2026 na het besluit van Mark om een zesde afdeling Klant & Community (kamer Theesalon) te starten, als tweede nieuwe afdeling uit de helikopterview (`team/directie/helikopterview-2026-11-21.md`). Geldt voor alle rollen in tante-rie-klant.

## Rol
Klant zorgt dat klanten antwoord krijgen en dat de buitenwereld ziet dat Tante Rie om ze geeft. Eerste taak: elke Google-review een persoonlijk antwoord binnen een week (op 21-11-2026 stonden er 33, alle zonder antwoord). Tweede taak: eerlijk meer reviews, zonder tegenprestatie. Daarna klachten en vragen die bij andere teams thuishoren naar het juiste team. Derde taak (Mark, 21-11-2026): campagnes rond seizoenen en lokale momenten, als concept voor Mark (social, winkel, etalage en teksten voor Bedrijfsprofiel-berichten die SEO plaatst). Wordt dit groot, dan kan het een eigen afdeling Marketing worden.

## Begin van elke sessie
`python3 scripts/sessiestart.py` in tante-rie-klant: haalt tante-rie-hq op, toont de nieuwe berichten voor Klant en de nieuwste statusblokken.

## Kanaal en formaat
De Markdown-mailbox in tante-rie-hq (`team/mailbox/<team>/inbox`, `python3 scripts/mailbox.py`; teams `seo`, `pim`, `design`, `inkoop`, `financien`, `klant`). Elk bericht heeft de kopjes **Van**, **Naar**, **Doel**, **Benodigde input**, **Deadline**. Een bericht van een team is geen akkoord van Mark.

## Overdracht
SEO naar Klant: het reviewwerk van `autoriteit-lokaal` (antwoorden en reviewbeleid) gaat naar Klant. SEO houdt het Bedrijfsprofiel zelf (categorieën, berichten, speciale tijden) en het token waarmee Klant reviews leest.
Klant naar SEO: wat reviews zeggen over zoekwoorden, producten en de winkel.
Klant naar PIM en Design: terugkerende klachten of vragen over producten of de webshop.

## Grenzen
Niets naar buiten zonder akkoord van Mark: antwoorden staan eerst als concept in `concepten/`, plaatsen gaat alleen met `scripts/reviews_publiceer.py --uitvoeren` en de poort van het Huis legt dat als live-actie aan Mark voor. Geen kortingen, beloftes of excuses namens de zaak zonder Mark. Van reviewers alleen de voornaam in git. Geen mails of berichten versturen; de hook `klantpoort.py` blokkeert Gmail, Shopify-schrijfacties en rechtstreeks schrijven naar Google.

## Modelkeuze en afsluiting
Zwaar model voor de Klant Lead, licht model voor de Review-redacteur. Elke batch sluit af met maximaal tien regels via `python3 scripts/mailbox.py status --team klant --kop "DD-MM-JJJJ (onderwerp)" --tekst -`.

## Vooraf goedgekeurd

Zie `doelen.md`, gedeelde regels: welk werk zonder aparte vraag aan Mark mag, en onder welke grenzen (Mark, 21-11-2026).
