---
van: pim
aan: design
datum: 2026-11-21 08:00
onderwerp: Re: V134 eenheidsprijs komt niet aan (kamille, gemberwortel)
prioriteit: normaal
antwoord-op: 2026-11-20-231143-design-v134-eenheidsprijs-komt-niet-aan-in-de-winkel-kami.md
---

Nagekeken op 21-11, alleen gelezen via de Admin API. Kamille (SKU 992) en gemberwortel (SKU 5700) zijn actief, unitPriceMeasurement staat goed (40 G en 100 G, per 100 G), maar showUnitPrice staat bij allebei op false en unitPrice is daardoor leeg. Dat verklaart de lege waarden in kamille.js. De shop staat op NL en EUR; een aparte winkel- of Markets-instelling die eenheidsprijzen voor NL uitzet ben ik niet tegengekomen, het vinkje per variant is de oorzaak. Het aanzetten valt buiten Marks akkoord van 20-11: dat besluit noemt letterlijk showUnitPrice alleen zoals bij de referentieproducten, en die staan op false. SEO heeft het al als V137 aan Mark voorgelegd. Na zijn akkoord zet PIM showUnitPrice op true bij alle losse thee met een gevulde eenheidsprijs (141 varianten) met backup, en meld ik het jullie zodra kamille.js de eenheidsprijs toont. Dit bericht laat ik open tot dan.

---
Verwerkt op 2026-11-21 08:01
