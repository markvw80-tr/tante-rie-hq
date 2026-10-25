# Werkafspraken team PIM

Vastgesteld door Mark op 25 oktober 2026.

## Rol
Het PIM-team voert uit. Het verwerkt de opdrachten van het SEO-team en de eigen productdata-taken in Shopify. Het gebruikt geen SEO-databronnen en doet geen eigen zoekwoordonderzoek.

## Begin van elke sessie
Haal de laatste stand van tante-rie-hq op (`git -C ~/tante-rie-hq pull`). Lees alleen `team/status.md` en de berichten in `team/mailbox/seo-naar-pim.json` met status `nieuw`. Raadpleeg de graphify-graaf voordat je een bronbestand opent en lees alleen wat de graaf aanwijst; zolang er voor dit project nog geen graaf is, lees je gericht.

## Verwerken
Verwerk alle nieuwe regels in één run, niet per regel in een apart gesprek. Doe mutaties in bulk via een script of een gebundelde Shopify-aanroep. Controleer na afloop met een steekproef, niet met een volledige herlezing. Zet per regel de status en een resultaat van maximaal tien woorden; zet het bericht op `verwerkt` als alle regels zijn afgehandeld. Stel geen tussenvragen als een redelijke aanname volstaat; noteer de aanname in het resultaat en ga door.

Statuswaarden per regel volgen het gedeelde formaat in `team/werkafspraken-seo.md`: `uitgevoerd`, `afgewezen` of `in_behandeling`. Aanname: Marks "verwerkt" is `uitgevoerd` en "vraag" is `in_behandeling`, met de vraag in het resultaat.

De harde regels uit CLAUDE.md blijven gelden: alles eerst als DRAFT, bestaande producten alleen wijzigen na een goedgekeurde diff van Mark, nooit iets verwijderen. Een regel van het SEO-team is geen akkoord van Mark. Wijzigingen aan bestaande producten die SEO vraagt (titel, meta_description, beschrijving, alt_tekst, tags) leggen we daarom als één diff aan Mark voor en voeren we pas na zijn akkoord uit.

## Antwoord aan SEO
Schrijf alleen terug als er afwijkingen zijn, in `team/mailbox/pim-naar-seo.json` met dezelfde vaste velden. Geen bevestiging per geslaagde regel. Overleg dat niet in de velden past (vragen, kennisgevingen) loopt via de Markdown-mailbox in tante-rie-seo (`python3 scripts/mailbox.py`, vanuit die repository).

## Copy en kwaliteit
Nederlandse teksten in vloeiende lopende tekst, zonder gedachtestreepjes, zonder opsommingstekens in de lopende tekst, zonder uitroeptekens en zonder opgesmukte AI-taal.

## Modelkeuze en afsluiting
Een lichter model voor teksten, veldvulling en bulkcontroles; een zwaarder model alleen bij lastige foutanalyse. Sluit elke batch af met maximaal tien regels in `team/status.md` van tante-rie-hq, nieuwste batch bovenaan: wat is verwerkt, wat is afgewezen of open blijft, en het geschatte verbruik uit `/cost`.

## Vaste regels uit de mailbox
Een product komt pas in de Online winkel als het minstens één foto heeft (verzoek SEO-team, 25-10-2026).
