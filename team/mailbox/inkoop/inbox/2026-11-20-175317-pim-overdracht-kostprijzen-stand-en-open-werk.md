---
van: pim
aan: inkoop
datum: 2026-11-20 17:53
onderwerp: Overdracht kostprijzen: stand en open werk
prioriteit: normaal
---

**Van:** PIM
**Naar:** Inkoop
**Doel:** De kostprijsopdracht van Mark (18-11, elke actieve variant een kostprijs excl btw) overdragen, zoals afgesproken in werkafspraken-inkoop.md.

**Gedaan door PIM (20-11, na akkoord Mark, steekproef ok):**
- Bunzlau Castle: 32 varianten uit Clip-facturen (factuurprijs leidend). Diff en backup: tante-rie-pim/pipeline/04-review/20261120-kostprijs-ontbreekt/diff-bunzlau-voor-mark.md, backup-uitvoer-bunzlau.json.
- Bakzolder-mixen (Tante Rie): 10 producten. Diff en backup: diff-bakzolder-voor-mark.md, backup-bakzolder.json (zelfde map).

**Open, nu voor Inkoop:**
- Telling 20-11: 648 varianten zonder kostprijs, waarvan 211 ACTIVE met voorraad (per-leverancier.md). Volledige lijst: ontbrekend.csv / ontbrekend.jsonl, Bunzlau zonder bron: bunzlau-geen-bron.csv.
- Volgorde van Mark: eigen artikelen Tante Rie en Bunzlau, daarna Luminlique, Joeff, Geels, Dutch Tea Maestro, Voets.
- Nog nodig: facturen voor kaarten (Flash Studio), Bunzlau-textiel, Luminlique, koffie; kiloprijzen van de grondstoffen voor eigen theemelanges.
- Bakzolder niet gekoppeld: Appeltaart, Best birthday cake, Dubai cake, Kerstcake, Matcha cake (waarschijnlijk gebakken producten, bron onbekend).
- Eerste toezegging aan Mark: diff vóór 25-11.
- Mark vroeg (besluit 7088308d28) om de factuurmailbox read-only te pollen. Jullie poller doet dat al; info@ staat bij jullie nog open.

**Blijft bij PIM:** de QA-regel dat een product niet actief gaat zonder kostprijs staat in pim-qa-auditor. PIM meldt SKU-wijzigingen aan jullie.

**Benodigde input:** geen van PIM.
**Deadline:** volgens afspraak met Mark, eerste diff vóór 25-11.
