# Status teams Tante Rie

Per batch maximaal tien regels: wat is verstuurd, wat staat open, de volgende stap en het geschatte verbruik. Nieuwste batch bovenaan.

## Design, 28-10-2026 (ronde 3, snelheid)
- Ronde 3 op ontwikkelthema 204337217800 (bevat ronde 1, 2 en 3): collectiehero en kaartfoto's responsief, footer-contrast naar AA. Gedrosselde LCP zwarte thee 6,2 naar 5,3 s; echte gebruikers (CrUX) zijn al snel (LCP 1,4 s).
- Voor SEO: Judge.me laadt ongeveer 25 CSS-bestanden op de productpagina; vragen om afstemming voordat Design iets uitstelt.
- Winkel zit op het maximum van 20 thema's; Mark besluit welke oude thema's weg mogen.
- Verbruik: niet gemeten.

## Design, 28-10-2026 (ronde 2)
- Ronde 2 op ontwikkelthema 204342395144 (bevat ronde 1 en USP-balkfix): collecties in twee kolommen op mobiel (zwarte thee 28.845 naar 14.081 px), productpagina met prijs en toevoegen eerder. Alleen weergavevolgorde, koppen en markup ongewijzigd.
- Live 204204900616 ongewijzigd; Mark kijkt en publiceert.
- Open: productfoto op mobiel kleiner (keuze Mark), snelheid (ronde 3), winkelwagen en checkout beoordelen.
- Verbruik: niet gemeten.

## Design, 28-10-2026 (designreview en ronde 1)
- Designreview webshop mobiel eerst: opdrachten/2026-10-28-review-webshop.md in tante-rie-design (mobiel 74 procent van GSC-klikken).
- Ronde 1 gebouwd op ontwikkelthema 204338659592: toevoegen-knoppen mobiel hersteld, zwevende winkelwagen weg op productpagina, aanraakdoelen 44 px, labels 12 px. Live 204204900616 ongewijzigd.
- Open: Mark kijkt naar preview en publiceert; toevoegen testen op dev-thema; verdere rondes (collectie 2 kolommen, productvolgorde, snelheid).
- Vraag aan SEO: sessies en conversie per apparaat (mailbox 28-10).
- Verbruik: niet gemeten.

## Design, 28-10-2026 (opzet team en test)
- Team Design opgezet in ~/Tante Rie Design (CLAUDE.md, stijlgids, vijf agents; start met Design Lead en Theme Developer). Nog geen GitHub-repo.
- Mailbox: team design toegevoegd aan scripts/mailbox.py (branch design-team-mailbox in tante-rie-seo, nog te mergen) en mailbox/design/ op main.
- Test: H2 boven productraster /collections/zwarte-thee op ontwikkelthema 204337217800; live 204204900616 ongewijzigd. SEO-eis gesimuleerd; echte SEO-bevestiging nodig.
- Open: 10 open punten in stijlgids/tante-rie/stijlgids.md (o.a. Inter tegenover DM Sans, knopstijlen).
- Volgende stap: Mark kijkt naar PR/branch en de preview; SEO leest testbericht na.
- Verbruik: niet gemeten.

## PIM, 28-10-2026 (SEO-batches 26-10)
- seo-2026-10-26-1 en -2 verwerkt: 64 regels uitgevoerd na akkoord Mark (SEO-titels, meta's, tags, alt-teksten bij 28 producten).
- Festival-beschrijving afgewezen (ingetrokken door SEO).
- Ingrediënten in nieuwe teksten gecontroleerd tegen metafield en Geels-brondata: klopt.
- Collecties: geen enkele collectie filtert op tags; theecollecties zijn handmatig, dus geen verschuivingen.
- Kanttekening: Cactus Vijg-meta noemt cactusvijgaroma, bron zegt alleen aroma.
- Verbruik: niet gemeten.

## PIM, 27-10-2026 (Rice-opschoning)
- 92 losse dubbele alfabetbekers zonder voorraad gearchiveerd; 12 met voorraad blijven. Moederartikelen Rice A t/m Z intact.
- Rice K: Groen K wordt Donker grijs K (MELCU-ALPKB2). 6ZFUNI per stuk, kostprijs 3,27.
- Gewicht in gram voor 138 Rice-varianten uit het B2B-portaal.
- 5 kerstartikelen op 0,00 naar DRAFT tot prijs bekend.
- Open: lepel-SKU's, gewichten voor artikelen buiten het portaal, adviesprijs kerst.
- Verbruik: niet gemeten.

## SEO, 26-10-2026 (tweede batch aan PIM, Search Console)
- Verstuurd: seo-2026-10-26-2 met 35 regels: 17 theeën waarvan SEO-titel, meta of tags afweken na de Geels-correctie van PIM (17 tags, 8 SEO-titels, 10 meta's).
- Namen Bornse Zomer en Thee van Tante Annie ongemoeid (besluit Mark 26-10); Festival-beschrijving uit batch 1 vervalt.
- Search Console: Verkopersvermeldingen, Productfragmenten en Reviewfragmenten opgelost (Google 26-10); validatie 5xx loopt (kassa-artikel).
- Changelog 26-10 bijgewerkt (thema 204204900616 met TikTok en Bunzlau-voorraad).
- Open: V87 a tot d; tags wijzigen kan collectielidmaatschap veranderen, PIM controleert dat.
- Verbruik: niet gemeten; /cost niet beschikbaar in de cloudsessie.

## SEO, 26-10-2026 (eerste batch aan PIM)
- Verstuurd: seo-2026-10-26-1 met 30 regels in team/mailbox/seo-naar-pim.json.
- Inhoud: rooibos Festival, Inspiratie, Sinaasappel Chai (12); 8 producten met vertoningen maar weinig klikken (18: SEO-titel, meta, alt).
- Selectie per script uit GSC 90 dagen (tot 18-10): positie 3 tot 20, CTR onder 2 procent; ruwe data in team/data/seo/.
- Open: TikTok-themakopie 204160762120 nog niet gepubliceerd; V87 a tot d; V95b.
- Volgende stap: PIM legt de diff aan Mark voor; SEO controleert na uitvoering.
- Verbruik: niet gemeten; /cost niet beschikbaar in de cloudsessie.

## SEO, 25-10-2026 (opvolging PIM)
- V85 live nagelezen via Shopify (alleen lezen): MAIN 204139036936, foundingDate en llms.txt 2014, contactpagina met telefoon en link.
- Changelog bijgewerkt voor V85 en metavelden rooibossen (PR tante-rie-seo#12); vier PIM-berichten verwerkt.
- Open: Rich Results Test homepage en contact (lokaal of Mark); TikTok in sameAs (@tanterie) wijkt af van V87e.
- Concept PIM: 12 regels, nog niet verstuurd; volgende stap aanvullen tot 20.
- Verbruik: niet gemeten; /cost niet beschikbaar in de cloudsessie.

## PIM, 26-10-2026 (thema)
- Live door Mark: thema 204204900616 met Bunzlau-voorraadfix en TikTok-link @tante.rie.borne (V87e); live gecontroleerd.
- Bunzlau-concepten kunnen nu actief; activeren doet Mark.
- Verbruik: niet gemeten; /cost is in deze sessie niet beschikbaar.

## PIM, 26-10-2026 (Geels-catalogus)
- Geels-adapter gebouwd; 120 van 142 losse theeën gekoppeld op artikelnummer, 22 horen bij een andere leverancier.
- QA: ingrediënten kloppen inhoudelijk; 40 kostprijzen wijken af, 14 ontbreken (voorstel ligt bij Mark).
- Doorgevoerd na akkoord Mark: cafeïnelabels, smaakprofielen en 7 omschrijvingen (99 velden, nagelezen).
- Punt 1 doorgevoerd na akkoord Mark: 54 kostprijzen, 108 kiloprijzen, zoethoutwaarschuwing (163 velden, nagelezen).
- Open voor Mark: zakgewichten 5 producten (punt 6), overige punten diff.
- Vaste regel: productnamen in Shopify blijven leidend.
- Verbruik: niet gemeten; /cost is in deze sessie niet beschikbaar.

## PIM, 25-10-2026 (V85 en rooibossen)
- V85: themadelen op kopie 204139036936 (llms.txt, sectiedefaults, foundingDate); homepage stond al op 2014.
- V85 volledig live 25-10: thema 204139036936 gepubliceerd door Mark, contactpagina aangepast; live gecontroleerd.
- Rooibossen: Geels bevestigt rooibos bij 6405 en 5506; 6010 niet bij Geels gevonden.
- Rooibos-diff uitgevoerd na akkoord Mark; nieuwe waarde Cafeïnevrij aangemaakt.
- Kostprijzen 5308 en 6086 gecorrigeerd na akkoord Mark.
- Verbruik: niet gemeten; /cost is in deze sessie niet beschikbaar.

## PIM, 25-10-2026 (Geels-proefbatch)
- Geels is Geels Koffie & Thee (geels1863.com); bron is de ingelogde webshop, artikelnummer = SKU.
- Verwerkt: vijf losse theeën vergeleken; ingrediënten in de shop kloppen al met Geels.
- Open voor Mark: btw-status Geels-prijzen, allergenen opvragen, kostprijzen 5879 en 5308 corrigeren.
- Geen wijzigingen in Shopify; diff ligt bij Mark.
- Verbruik: niet gemeten; /cost is in deze sessie niet beschikbaar.

## PIM, 25-10-2026 (Bunzlau-proefbatch en overstap mailbox)
- Verwerkt: vijf Bunzlau-producten met 32 varianten als concept in Shopify, in geen verkoopkanaal.
- Steekproef: EAN, adviesprijs, foto per variant en DENY bij vier niet-leverbare decors kloppen.
- Mailbox: overgestapt op team/; seo-naar-pim.json bevat nog geen berichten, niets te verwerken.
- Markdown-mailbox: welkom verwerkt; gewichten Bunzlau en Blond in behandeling, eerst diff voor Mark.
- Vaste regel: product pas in de Online winkel met minstens één foto.
- Open voor Mark: concepten activeren nadat de voorraadfix in het thema live staat.
- Volgende stap: SEO-regels verwerken zodra die binnenkomen; wijzigingen aan bestaande producten via diff.
- Verbruik: niet gemeten; /cost is in deze sessie niet beschikbaar.

## SEO, 25-10-2026 (opzet werkafspraken)
- Verstuurd: niets via de JSON-mailbox; teammap team/ opgezet in tante-rie-hq.
- Afgerond vandaag: Serverfout 5xx gesloten (kassa-artikel), V80 verwerkt (koopzondag 29-11 en 20-12, koopavond 12-12 Magisch Borne).
- Beantwoord: V81 (metingen alleen lokaal), V122 (zondagen 12-17 uur, 12-12 tot 21 uur). V106 aangehouden tot PIM is ingericht.
- Open voor Mark: V95a/b Search Console valideren en exporteren, V85, V87; Bunzlau-themakopie wacht op akkoord.
- Open bij PIM (Markdown-mailbox): gewichten Bunzlau en Blond, PIM legt Mark eerst een diff voor.
- Concept PIM: 12 regels (rooibos Festival, Inspiratie, Sinaasappel Chai), niet verstuurd; metavelden via Markdown-mailbox aan PIM.
- Beantwoord: V83, V85 (uitvoering nog beleggen), V95a. PR tante-rie-seo#11 bevat #9 en #10.
- Volgende stap: concept aanvullen tot minimaal 20 regels uit de lopende on-page-voorstellen.
- Verbruik: niet gemeten; /cost is in deze cloudsessie niet beschikbaar voor het team.
