# Mailbox van de teams (tante-rie-hq)

Deze map in tante-rie-hq is het enige communicatiekanaal tussen het SEO-team (tante-rie-seo), het PIM-team (tante-rie-pim) en het Design-team (tante-rie-design). Elk team heeft een eigen inbox. Berichten zijn gewone Markdown-bestanden, dus Mark kan alles meelezen op GitHub.

| Map | Inhoud |
|---|---|
| `seo/inbox/` | Nieuwe berichten voor het SEO-team |
| `seo/verwerkt/` | Berichten die het SEO-team heeft afgehandeld |
| `pim/inbox/` | Nieuwe berichten voor het PIM-team |
| `pim/verwerkt/` | Berichten die het PIM-team heeft afgehandeld |
| `design/inbox/` | Nieuwe berichten voor het Design-team |
| `design/verwerkt/` | Berichten die het Design-team heeft afgehandeld |

## Werkwijze

1. Begin elke opdracht met het lezen van de eigen inbox: `python3 scripts/mailbox.py lijst <team>` (`seo`, `pim` of `design`; in elke teamrepo verwijst `scripts/mailbox.py` door naar tante-rie-hq). Het script haalt eerst de laatste stand op.
2. Een bericht sturen: `python3 scripts/mailbox.py stuur --van seo --aan pim --onderwerp "..." --tekst "..."`. Voor lange tekst gebruik je `--tekst -` en geef je de tekst via stdin. Het script zet het bericht direct op `main` en pusht het.
3. Antwoorden: stuur een nieuw bericht met `--antwoord-op <bestandsnaam>` zodat de draad te volgen is.
4. Afhandelen: `python3 scripts/mailbox.py verwerkt <bestandsnaam> --notitie "wat er mee gedaan is"`. Het bericht verhuist naar `verwerkt/`.

## Afspraken

Eén onderwerp per bericht. Schrijf wat je nodig hebt, waarom, en vóór wanneer. Berichten tussen de teams gebruiken in de tekst vijf vaste kopjes: **Van**, **Naar**, **Doel**, **Benodigde input**, **Deadline**. Gebruik `--prioriteit hoog` alleen als het andere team erop wacht. Een bericht is geen akkoord van Mark: zaken die Marks goedkeuring nodig hebben gaan nog steeds via `marketing/vragen-voor-mark.md`. Zet geen wachtwoorden, tokens of klantgegevens in een bericht.

Mailboxcommits gaan rechtstreeks naar `main` van tante-rie-hq en raken alleen bestanden in `team/mailbox/`. Ander werk blijft via de gewone branches lopen.

## Wat ontvangt een team

Een bericht in `<team>/inbox/` is voor dat team bedoeld en mag het team direct oppakken: lezen, uitvoeren wat binnen de eigen werkafspraken valt, antwoorden en afhandelen met `verwerkt`. Alleen wat goedkeuring van Mark nodig heeft wacht op een antwoord van Mark. Elk team toont de eigen inbox bij de sessiestart (`scripts/sessiestart.py` of de startregel in de CLAUDE.md).

## JSON-bestanden

`seo-naar-pim.json` en `pim-naar-seo.json` in deze map blijven voor productveld-regels tussen SEO en PIM (`scripts/pim_regels.py` in tante-rie-seo). Al het andere overleg loopt via de Markdown-berichten hierboven.
