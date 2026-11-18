# Nulmeting winst, 18-11-2026

Fase 0 van het plan "winst meetbaar maken". Bron: Shopify Analytics (ShopifyQL), alleen gelezen op 18-11-2026. Bedragen in euro, netto-omzet exclusief btw; kostprijzen in Shopify zijn exclusief btw (Mark, 18-11-2026). Brutowinst = netto-omzet min kostprijs, door Shopify alleen berekend over verkopen waarbij een kostprijs bekend is.

## Samenvatting

1. **Een derde van de omzet heeft geen kostprijs.** Van juni tot en met 18 november is 59.394 euro netto omgezet; bij 18.950 euro (32 procent) ontbreekt de kostprijs. De brutowinst die Shopify toont (15.717 euro) is daardoor te laag.
2. **Het grootste gat is de kassa, niet de productdata.** 14.263 euro daarvan is verkocht als vrij bedrag zonder product (2.164 kassaregels, een kwart van alle omzet). Daar kan Shopify nooit een kostprijs aan koppelen.
3. **De marge waar de kostprijs wel bekend is, is gezond:** gemiddeld 44 procent (40 tot 49 procent per maand).
4. **De webshop is 1 procent van de omzet.** Online 372 euro sinds juni tegenover 59.022 euro in de winkel. Ongeveer 850 sessies per maand, maar een conversie van 0,2 tot 0,4 procent (gangbaar voor een webshop is 1 tot 2 procent); 3 tot 4 procent van de bezoekers legt iets in het winkelmandje.
5. **Vergelijken met vorig jaar kan niet uit Shopify.** De webshop staat sinds januari 2026 in Shopify, de kassa sinds juni 2026. Cijfers van 2025 moeten uit e-boekhouden komen.

## Omzet en brutowinst per maand

Winkel (Point of Sale):

| Maand | Netto-omzet | Zonder kostprijs | Brutowinst (bekend deel) | Marge bekend deel | Orders |
|---|---|---|---|---|---|
| jun 2026 | 10.627 | 4.163 | 2.838 | 44% | 643 |
| jul 2026 | 8.631 | 3.079 | 2.426 | 44% | 576 |
| aug 2026 | 9.725 | 3.985 | 2.541 | 44% | 590 |
| sep 2026 | 8.807 | 3.566 | 2.399 | 46% | 636 |
| okt 2026 | 14.566 | 5.488 | 3.688 | 41% | 776 |
| nov 2026 (t/m 18) | 6.666 | 3.021 | 1.793 | 49% | 384 |

Webshop (Online Store): januari 541, februari 230, maart 212, april 123, mei 138, juni 29, juli 21, augustus 92, september 110, oktober 71, november (t/m 18) 49 euro.

**Schatting, geen meting:** als de omzet zonder kostprijs dezelfde marge heeft als de rest (44 procent), dan was de brutowinst sinds juni ongeveer 26.000 euro in plaats van de 15.717 euro die Shopify toont.

## Waar de kostprijs ontbreekt (juni tot 18 november)

| Bron | Zonder kostprijs | Wie lost het op |
|---|---|---|
| Vrij bedrag in de kassa, zonder product | 14.263 | Mark (werkwijze kassa) |
| Leverancier "Tante Rie" (eigen thee, kaarten, textiel) | 6.787 | PIM |
| Bunzlau Castle | 1.084 | PIM |
| Luminlique | 320 | PIM (alleen kassa) |
| Joeff | 265 | PIM |
| Geels | 243 | PIM |
| Dutch Tea Maestro | 210 | PIM |
| Voets | 135 | PIM |
| Overig (Treasure Tea, Blond Amsterdam, Rice) | 48 | PIM |

Grootste losse producten zonder kostprijs: Bunzlau textiel (825), Buisje thee (397), Rijstkom 500 ml en 300 ml (567 samen), Luminlique 5 opzetters (244), de wenskaarten van 1,95 en 2,95 euro en Flash Studio, Blond en Annelies Vonk (samen ongeveer 940), Creme Brulee (179), Citrus Gember (153).

## Wat dit betekent voor het plan

- **Fase 1 begint bij de kassa.** Zolang een kwart van de omzet als vrij bedrag wordt aangeslagen, is geen enkel winstcijfer uit Shopify betrouwbaar. Vraag aan Mark: wat wordt er als vrij bedrag verkocht? Als dat vooral losse thee per gewicht is, kan PIM producten zoals "Losse thee per 100 gram" per prijsgroep aanmaken, met kostprijs, zodat ze in de kassa te kiezen zijn.
- **PIM vult de ontbrekende kostprijzen** voor de leveranciers hierboven, te beginnen bij "Tante Rie" en Bunzlau (samen 7.871 euro), als diff voor Mark.
- **Nettowinst en 2025 komen uit e-boekhouden.** Shopify is daar al aan gekoppeld. Nodig: de winst-en-verliesrekening per maand over 2025 en 2026, als export of via de API van e-boekhouden.
- **De webshop is de grootste groeikans op omzet,** maar valt buiten deze nulmeting: 850 bezoekers per maand met 0,2 tot 0,4 procent conversie. Een verdubbeling van de conversie levert bij dit verkeer nog steeds weinig op; daar zijn verkeer en conversie samen nodig. Dat hoort bij SEO en Design, met de 70/30-verdeling uit doelen.md.

## Hoe het gemeten is

ShopifyQL op het schema `sales`: `net_sales`, `gross_profit`, `net_sales_with_cost_recorded`, `net_sales_without_cost_recorded` en `orders`, per `sales_channel`, `product_vendor` en `product_title`, per maand sinds november 2024 (data begint in januari 2026). Bezoekers en conversie uit het schema `sessions`. De marge per maand is brutowinst gedeeld door de omzet met kostprijs.
