# Opdracht voor PIM: kostprijzen aanvullen (concept voor Mark)

Dit is een concept. Mark verstuurt het zelf via de Keukentafel in het Huis (afzender mark), of past het eerst aan. De directie verstuurt niets namens Mark.

---

**Van:** Mark
**Naar:** PIM
**Doel:** Elke actieve variant in Shopify krijgt een kostprijs (exclusief btw), zodat Shopify de brutowinst per product en per kanaal kan berekenen. Achtergrond: van de omzet sinds juni heeft 32 procent geen kostprijs (zie `team/directie/nulmeting-winst-2026-11.md`).

**Werkwijze:**
1. Haal met een eigen script de volledige lijst op van varianten zonder kostprijs (`inventoryItem.unitCost` leeg), per leverancier, en zet die in een nieuwe batch in `pipeline/04-review/`.
2. Begin met de verkochte producten in `team/data/pim/2026-11-18-kostprijs-ontbreekt.md` (tante-rie-hq), in die volgorde: eerst de eigen artikelen van Tante Rie en Bunzlau Castle, daarna Luminlique, Joeff, Geels, Dutch Tea Maestro en Voets.
3. Kostprijs alleen uit een bron: prijslijst of portaal van de leverancier, inkoopfactuur, of voor eigen theemelanges de kiloprijs van de grondstof maal het verkochte gewicht. Geen schattingen. Ontbreekt de bron, dan op de ontbrekend-lijst voor Mark met wat er nodig is (bijvoorbeeld de factuur van Flash Studio voor de kaarten).
4. Alle bedragen exclusief btw (besluit Mark 18-11-2026).
5. Per leverancier één diff met huidige en nieuwe kostprijs voor Mark. Pas na akkoord uitvoeren, in bulk, met een steekproef achteraf.
6. Nieuwe vaste regel: een product gaat niet naar actief zonder kostprijs. Neem dat op in de controle van de pim-qa-auditor.

**Benodigde input:** toegang tot de leveranciersportalen die al in `suppliers/` staan; voor kaarten, textiel, Luminlique en koffie de inkoopfacturen van Mark.
**Deadline:** eerste diff (Tante Rie en Bunzlau) binnen een week; de rest per leverancier daarna.
