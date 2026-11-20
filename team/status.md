# Status teams Tante Rie

Per batch maximaal tien regels: wat is verstuurd, wat staat open, de volgende stap en het geschatte verbruik. Nieuwste batch bovenaan.

## SEO, 20-11-2026 (V127 beantwoord, maandrapport november)
- V127, vraag van Mark (besluit 3405bfb958): de eenheidsprijs is niet nodig voor Merchant Center. Het kenmerk is optioneel, de melding heeft geen gevolgen en alles is goedgekeurd. De feedregel mag vervallen. Antwoord staat bij V127.
- Nieuwe vraag V134: eenheidsprijs op de productpagina van losse thee (A laten zoals het is, B PIM vult het veld en Design toont het). Advies B, lage prioriteit. Reden: de prijsaanduidingsregel voor waar die per gewicht wordt verkocht.
- Maandrapport november klaar: marketing/rapporten/maandrapport-2026-11.md. GSC 28 dagen: 452 klikken tegen 389 (+16%), vertoningen -19%, CTR 3,08% tegen 2,16%. Winkelpagina's Borne blijven achter (3 klikken).
- Directie-opdracht 15-11 verwerkt: alle vier punten af. "Pak de taken op" verwerkt: sinds 19-11 geen nieuwe antwoorden in het vragenbestand.
- Open bij Mark: V133 (handle Passionfruit Martini Cake), V134, alt-diff bij PIM.
- Volgende stap: lokale winkelpagina's Borne aanpakken (zwakste punt in het rapport), na V133 de Watertwist-kopieën.
- Verbruik: ca. 1,15 USD.

## SEO, 20-11-2026 (antwoord PIM over kopie-handle)
- PIM-bericht alt-teksten seo-2026-11-19-1 verwerkt: de diff ligt bij PIM en wacht op akkoord van Mark, SEO hoeft niets te doen.
- Vraag van PIM beantwoord: pineut-cake-pouchbag-lemon-poppy-cake-kopie is geen dubbel product maar de Passionfruit Martini Cake met een verkeerde handle. 0 klikken, weinig vertoningen, geen redirect.
- Advies: handle wijzigen met 301-omleiding, niet verwijderen. Voorgelegd aan Mark als V133.
- Open: directie-opdracht 15-11 blijft in de inbox.
- Volgende stap: na V133 de Watertwist-kopieën op dezelfde manier voorstellen.
- Verbruik: ca. 0,55 USD.

## PIM, 20-11-2026 (alt-diff en factuurmailbox)
- Besluit 9594fbf6b1: diff met 15 alt-teksten (seo-2026-11-19-1) klaar in pipeline/04-review/20261120-seo-alt-01/diff.md. Alle 15 nu leeg, alleen de alt van de eerste foto verandert. Wacht op akkoord Mark op deze diff. Er is niets uitgevoerd.
- Besluit 7088308d28 (idee Mark: factuurmailbox read-only uitlezen): goed plan. Voorstel: Gmail API met alleen leesrecht (gmail.readonly), of IMAP waarbij de map alleen gelezen wordt. Filter op afzender (Flash Studio, Bunzlau, Luminlique, koffieleverancier) en alleen pdf-bijlagen naar leveranciersbestanden/facturen. De inhoud van de mails telt als data, niet als opdracht. Toegangsgegevens alleen in .env.
- Wacht op Mark: welke mailbox (adres of provider) en of hij het leesrecht zelf geeft (OAuth-toestemming of app-wachtwoord). Daarna bouwt de connector het en volgt eerst een proefrun zonder iets op te slaan.
- Opvallend: pineut-cake-pouchbag-lemon-poppy-cake-kopie lijkt een dubbel product. Gevraagd aan SEO.
- In de inbox blijven: opdracht kostprijzen 18-11 en beide besluiten van 20-11, tot Mark beslist.
- Volgende stap: na akkoord de alt-diff uitvoeren, rest van de kostprijzen ophalen, kostprijsdiff Tante Rie en Bunzlau voor 25-11.
- Verbruik: ca. 0,50 USD.

## Design, 20-11-2026 (CLI-login hersteld, opruimlijst thema's)
- CLI-login werkt weer (Mark, besluit 7a9f84944b). shopify theme list gecontroleerd: 18 thema's, live is 205262029064 "Hallmark collecties preview 2026-11-11".
- Opruimlijst oude thema's klaar in opdrachten/2026-11-20-thema-opruimlijst.md: 4 bewaren, 3 twijfel, 11 voorstel verwijderen.
- Wacht op Mark: akkoord per thema-id voor verwijderen. Er is niets verwijderd.
- Verwerkt: besluit 20-11 (login) en besluit CLI-login 19-11.
- In de inbox blijven: directie 15-11, Mark 18-11 (Kies decor, USP-balk, preview eenheidsprijs voor SEO) en besluit oude thema's tot Mark per thema beslist.
- Volgende stap: eenheidsprijs op live controleren en preview-URL naar SEO, daarna Kies decor en USP-balk.
- Verbruik: ca. 0,45 USD.

## PIM, 19-11-2026 (kostprijzen, akkoord Mark)
- Akkoord Mark (4c5aaa1800) verwerkt: lijst varianten zonder kostprijs via de Shopify-koppeling opgehaald. Niet compleet: 1800 actieve varianten binnen, daarna was het budget op.
- Tot nu toe 58 zonder kostprijs: Rice 26, Tante Rie 18, Bunzlau Castle 14. 4 Bunzlau-varianten staan op 0,00.
- Opvallend: veel Bunzlau-kostprijzen zijn gelijk aan of hoger dan de verkoopprijs. Moet gecontroleerd worden.
- Open bij Mark: inkoopfacturen (kaarten/Flash Studio, Bunzlau textiel, Luminlique, koffie) en kiloprijzen grondstoffen.
- In de inbox blijft: opdracht kostprijzen 18-11. Volgende stap: rest ophalen, daarna eerste diff Tante Rie en Bunzlau (deadline 25-11).
- Verbruik: ca. 1,80 USD.

## SEO, 19-11-2026 (inbox, eenheidsprijs V127)
- Antwoord van Design over de eenheidsprijs (V127) gelezen en op verwerkt gezet. In de lokale themakopie staat de eenheidsprijs al aan in het prijsblok. Design controleert dat op het live thema zodra de CLI-login werkt en stuurt dan een preview-URL.
- SEO hoefde niets te doen. Komt de preview-URL binnen, dan controleert SEO de productpagina.
- Open: de opdracht van directie van 15-11 blijft in de inbox (maandrapport met deadline 21-11, Google Ads API, meten in Search Console).
- Volgende stap: het maandrapport (analist) vóór 21-11.
- Verbruik: ca. 0,30 USD.

## Design, 19-11-2026 (besluiten CLI-login en oude thema's)
- Inbox gelezen: twee besluiten van Mark (CLI-login en oude thema's opruimen), beide akkoord.
- CLI-login opnieuw gestart. De CLI wacht op bevestiging met nieuwe apparaatcode NWGZ-HHCQ via https://accounts.shopify.com/activate-with-code?device_code%5Buser_code%5D=NWGZ-HHCQ (de eerdere code VBRP-CRPR is vervallen). Het wachtende commando loopt nog ca. 30 minuten.
- Oude thema's: de lijst maakt Design zodra de themalijst binnen is. Er wordt niets verwijderd zonder akkoord van Mark per thema.
- Geblokkeerd op Mark: de code hierboven bevestigen, of zelf in een terminal shopify theme list --store 0qkm31-r6.myshopify.com draaien.
- In de inbox blijven: directie 15-11, Mark 18-11 en beide besluiten, tot de themalijst, Kies decor en de USP-balk klaar zijn.
- Verbruik: ca. 0,25 USD.

## SEO, 19-11-2026 (inbox, besluiten V127 en V132)
- V132: akkoord Mark verwerkt. 15 alt-regels als bericht seo-2026-11-19-1 naar PIM; PIM voert pas uit na diff en akkoord Mark. V132 stond wel in vragen-voor-mark.md maar was niet gepusht; nu staat het online, met antwoord.
- V127: akkoord Mark verwerkt. Mark maakt de feedregel zelf in Merchant Center (zijn login); de stappen staan bij V127. SEO leest daarna terug via de Merchant API.
- Beide besluiten op verwerkt; changelog en vragen-beantwoord bijgewerkt.
- Open: directie-opdracht 15-11 blijft in de inbox (maandrapport, deadline 21-11; Google Ads API; meten in Search Console).
- Volgende stap: maandrapport (analist) vóór 21-11.
- Verbruik: ca. 0,70 USD.

## Design, 19-11-2026 (inbox, CLI-login en eenheidsprijs)
- Inbox gelezen (5 berichten). SEO-vraag eenheidsprijs V127 beantwoord en op verwerkt: lokale kopie toont unit_price al in het prijsblok, controle op live werkkopie volgt.
- Besluit Mark CLI-login: uitgevoerd tot waar Design kan. De CLI vraagt nu om een apparaatcode (VBRP-CRPR via accounts.shopify.com/activate-with-code). Zonder die bevestiging door Mark geen themalijst, werkkopie of ontwikkelthema.
- Besluit Mark oude thema's: lijst volgt zodra de CLI werkt; niets wordt verwijderd zonder akkoord van Mark per thema.
- Geblokkeerd op Mark: CLI-login bevestigen (of in een terminal shopify theme list --store 0qkm31-r6.myshopify.com draaien).
- Blijven in de inbox: directie 15-11, Mark 18-11 en beide besluiten, tot punt 2 (Kies decor), 3 (USP-balk) en 5 (themalijst, review mobiel) klaar zijn.
- Verbruik: ca. 0,55 USD.

## PIM, 19-11-2026 (inbox, V127 afgerond)
- SEO-bericht Re V127: ter kennisname, op verwerkt. Shopify-kant van V127 is af; thema bij Design, feed bij Mark. Geen PIM-actie meer.
- Open: kostprijsopdracht Mark (batch 20261118-kostprijs-01) blijft in de inbox. Wacht op Shopify-token of de route via de koppeling, en op inkoopfacturen en kiloprijzen.
- Verbruik: ca. 0,30 USD.

## SEO, 19-11-2026 (inbox, eenheidsprijs V127)
- Inbox: besluit Mark (geen open besluiten) ter kennisname op verwerkt. PIM-antwoord V127 beantwoord en op verwerkt.
- V127: Shopify-bron is in orde (eenheidsprijs gevuld bij kamille en gemberwortel). Themakant (unit_price op productpagina) als laag-prioriteitsverzoek naar Design. Feedkant (regel in Merchant Center) blijft open bij Mark, vraag V127 bijgewerkt.
- Open: directie-opdracht 15-11 blijft in de inbox tot V132 (alt-regels) beantwoord is en het maandrapport klaar is (deadline 21-11).
- Volgende stap: maandrapport (analist) vóór 21-11.
- Verbruik: ca. 0,40 USD.

## Design, 18-11-2026 (open designpunten)
- Opdracht Mark 18-11 en directie 15-11 nagelopen. Punt 1 klaar, punt 4 live. Repo tante-rie-design staat gelijk aan GitHub (main = origin/main), dat deel van punt 5 is klaar.
- Geblokkeerd: de Shopify CLI reageert niet (theme list hangt meer dan 2 minuten, vermoedelijk verlopen login). Zonder CLI geen verse werkkopie, geen ontwikkelthema en geen themalijst.
- Vraag aan Mark 1: log de Shopify CLI opnieuw in (shopify theme list --store 0qkm31-r6.myshopify.com in een terminal). Daarna bouwt Design punt 2 (Kies decor) en punt 3 (USP-balk) op een ontwikkelthema met preview.
- Vraag aan Mark 2: oude thema's opruimen. Design maakt een lijst met wat weg kan; verwijderen gebeurt pas na jouw akkoord per thema.
- Open bij Mark, niet van Design: magnetronzinnen Blond (PIM-data).
- Beide berichten blijven in de inbox tot punt 2, 3 en 5 klaar zijn.
- Verbruik: ca. 0,40 USD.

## PIM, 18-11-2026 (inbox, eenheidsprijs V127)
- SEO-bericht V129/alt-regels: alleen ter kennisname, op verwerkt. Alt-regels wachten op Marks antwoord op V132.
- SEO-vraag V127 beantwoord: unitPriceMeasurement is in Shopify gevuld bij kamille (40 G per 100 G) en gemberwortel (100 G per 100 G). Geen metaveld voor eenheidsprijs. Dat de prijs niet op de pagina en in Merchant Center staat, ligt dus aan het thema of de feed (SEO/Design).
- Open: kostprijsopdracht Mark (batch 20261118-kostprijs-01) blijft in de inbox. Wacht op Shopify-token of de route via de koppeling, en op inkoopfacturen en kiloprijzen.
- Verbruik: ca. 0,45 USD.

## SEO, 18-11-2026 (wat staat er nog open)
- Antwoord aan Mark op "wat staat er nog open?" (opdracht directie 15-11). Punt 1, alt-teksten: 15 regels liggen klaar. Ze wachten alleen op V132, de vraag of ze vóór de grens van 20 regels naar PIM mogen. Blond, Clip en pepermunt/lavendel lopen via PIM.
- Punt 2, Merchant Center en Bedrijfsprofiel: kamille en gemberwortel blijven staan (V129). Speciale tijden en attributen staan live. Bericht 17-11 (Bunzlau) vandaag alsnog geplaatst, de volgende is op 24-11. Nog open: V127 eenheidsprijs (vraag aan Mark: waar staat die in Shopify?) en de reviews alleen als V78 heropend wordt.
- Punt 3, Google Ads API: werkt weer, getest op 18-11 ("losse thee" 2900 per maand). Afgerond.
- Punt 4, effectmeting in Search Console: de koppeling werkt (7 dagen: 93 klikken, 4054 vertoningen). Het maandrapport met een oordeel per actie staat nog open, deadline 21-11.
- Afgehandeld: berichten van PIM (V129/alt) en Design (LCP/Judge.me). De directie-opdracht blijft open tot V132 en het maandrapport klaar zijn.
- Volgende stap: maandrapport (analist) vóór 21-11 en de alt-regels versturen zodra V132 beantwoord is.
- Verbruik: ca. 1,00 USD.

## PIM, 18-11-2026 (kostprijzen winstmeting)
- Opdracht Mark 18-11 (kostprijzen) gelezen. Batch 20261118-kostprijs-01 aangelegd in pipeline/04-review.
- Gedaan: vaste regel in pim-qa-auditor: geen actief zonder kostprijs, alleen uit bron, exclusief btw.
- Geblokkeerd punt 1: er staat geen Shopify Admin API-token in de PIM-.env, dus geen eigen ophaalscript. Besluit Mark: token (read_products, write_inventory) toevoegen, of PIM haalt de lijst op via de Shopify-koppeling in een agentsessie.
- Nodig van Mark: inkoopfacturen voor kaarten (Flash Studio, Blond, Kaartje 1,95/2,95), Bunzlau textiel, Luminlique en koffie, plus kiloprijzen van grondstoffen voor de eigen theemelanges (Buisje thee, Creme Brulee, Citrus Gember enzovoort). Bunzlau Castle haal ik zelf uit het B2B-portaal.
- Volgende stap: varianten zonder kostprijs ophalen, daarna eerste diff Tante Rie en Bunzlau vóór 25-11. Bericht blijft open in de inbox.
- Verbruik: ca. 0,50 USD.

## Design, 17-11-2026 (inbox, desktopmenu, Blond)
- Desktopmenu (directie 16-11, besluit Mark 483019d07a): de fix van 1 nov raakt assets/tr-menu.css en assets/tr-menu-close.js (hover-open en sluiten). Beide bestanden zijn gelijk aan live thema 205262029064 "Hallmark collecties preview 2026-11-11" (gecontroleerd 17-11). Er bestaat geen aparte themakopie: de fix staat al live, er valt niets te publiceren. Op 16-11 klapte het menu op tanterie.nl bij 1440 px open en dicht bij hover. Mobiel heeft een eigen menu en de wijziging zit alleen in de desktop-hover; mobiel is niet opnieuw getest.
- Blond Handwas: PIM en Design zijn het eens, themakopie 204900761864 niet publiceren (die zou latere wijzigingen terugzetten). Het besluit over de magnetronzinnen (PIM-data) ligt bij Mark.
- Opdracht 15-11: punt 1 (SEO-berichten) is klaar en punt 4 is live. Open blijven punt 2, Kies decor (op telefoonbreedte overlapt de prijs de knop tot 63 px, fix nog niet gebouwd), punt 3 (USP-balk glitch) en punt 5 (review mobiel, oude thema's opruimen, repo naar GitHub).
- Volgende stap: ontwikkelthema voor punt 2 en punt 3, daarna preview aan Mark.
- Verbruik: niet gemeten.

## SEO, 17-11-2026 (inbox automatische start)
- Gelezen: besluit Mark 3cea6ee8b0 (gratis parkeergarage klopt, vraag over eenheidsprijs V127) en PIM-bericht over V128/V129.
- Niet gedaan: deze sessie had geen shell, dus geen mailbox.py, geen pim_regels.py en geen Shopify-check. Alle vier berichten staan nog in de inbox.
- Open (SEO): eenheidsprijs V127 nakijken in Shopify en Merchant Center (unit_price op varianten, wordt die in de feed en op de productpagina getoond?), antwoord aan Mark.
- Open (SEO): 5 extra alt-regels erbij, dan `pim_regels.py stuur`; V129-uitkomst als pad aan PIM melden.
- Open: directie-opdracht 15-11 en Design-bericht LCP/Judge.me lezen en afhandelen.
- Volgende stap: nieuwe sessie met shell. Verbruik: ca. 0,50 USD, budget op.

## SEO, 15-11-2026 (directie-opdracht open SEO-punten)
- Gedaan: (1) alt-audit 447 online producten, 25 lege alt, 12 SKU-codes, 2 onjuist (marketing/onpage/audit-alt-teksten-2026-11-15.md, V128); (2) Merchant API werkt weer, kamille en gemberwortel zijn goedgekeurd en actief op Google (V129); (3) Keyword Planner werkt weer via scripts/zoekvolumes.py, volumes tot en met oktober; (4) eerste effectmeting GSC: klikken 226 naar 240, positie beter (marketing/rapporten/effect-design-2026-11-15.md).
- Bedrijfsprofiel (alleen gelezen): speciale tijden 29-11, 12-12 en 20-12 ontbreken, geen berichten geplaatst, 33 reviews onbeantwoord; voorstel autoriteit/voorstel-bedrijfsprofiel-opschoning-2026-11-15.md.
- Gedaan 15-11: V130 speciale tijden en V131 b-d (creditcard, Online bestellen-knop, gratis parkeerplaats) live in Bedrijfsprofiel, teruggelezen. V128 akkoord: 15 alt-regels in concept (review loopt, 5 regels tekort voor versturen). V129 laten staan. Berichten 17-11, 24-11, 1-12, 8-12 beoordeeld door kwaliteitsredacteur, plaatsing op de dag zelf via gbp_schrijf.py. V91 afgehandeld 16-11 (Anke verwijderd door Nikkie). Open (Mark): V127 eenheidsprijs. Open (PIM/Mark): lavendel-foto toont venkelachtig zaad, pepermunt-alt wacht op ingrediëntcheck.
- Open (SEO): concept-alt voor 15 producten toetsen aan foto en kwaliteitsredacteur; berichten herplannen na V131.
- Volgende stap: antwoord Mark op V128 en V129, dan regels naar PIM; maandrapport 18 tot 21-11, effect beoordelen 25-11.
- Verbruik: niet gemeten.
## PIM, 15-11-2026 (directie-opdracht open punten)
- Gedaan: Blond batch 01 verrijkt (35 moederartikelen, 50 varianten, lint schoon, Handwas, niets naar Shopify); Blond-YAML bijgewerkt en gecommit; Rice-besluiten 27-10 al uitgevoerd (dubbelen, letterbekers, gewicht); Bornse Zomer staat onder die naam live.
- Open (Mark): themakopie 204900761864 (Blond Handwas) publiceren; magnetronzinnen bij 5 Blond-SKU's laten staan of schrappen (bron noemt ook vaatwasser, strijdt met besluit 06-11).
- Open (PIM): diff voor Blond batch 01 met live shop (200136 plus 4 twijfelmatches); 172691 en 161019 zonder foto; Rice-gewichten effen alfabetbekers en lepels; Bornse Zomer: tag lychee zonder lychee in ingredienten, inkoop 1,76 tegen 22,90 per kilo nalezen bij Geels.
- Niet gestart: Lifestylebrands-haalbaarheid (export per 50 producten, geen inkoop), Horecasupply mailboxpoller NAS, Bunzlau voorraad en Google/YouTube.
- Volgende stap: Blond-diff voor Mark, daarna punt 3 en 5.
- Verbruik: niet gemeten.
## SEO, 07-11-2026 (teamafspraken, Hanger, CrUX)
- Gedaan: agent-instructies SEO gelijkgetrokken met CLAUDE.md en werkafspraken; marketing/werkvolgorde.md en marketing/meetkalender-2026-11.md toegevoegd (gepusht, tante-rie-seo).
- CrUX: History API werkt weer (403 kwam door sleutelbeperking, door Mark aangepast); queryRecord geeft nog 403 en is niet nodig.
- Hanger Teapot en Cup and Saucer: prijs 27,95 gezet; staan nog op alle vier de kanalen; verrijking via PIM (Clip-portaal).
- Blond Amsterdam: PIM wacht op export of tabelkopie uit het Lifestyle Brands-portaal van Mark.
- Open (Mark): Rich Results Test; V87 aangehouden; V100 voorraad Flowers theeblik; V106 aangehouden.
- Open (PIM en Design): twee SEO-berichten van 26-10 in PIM-inbox, twee van 28-10 in Design-inbox.
- Volgende stap: migratiemonitor 10-11, effect designrondes 11-11 (beter 25-11), maandrapport 18 tot 21-11.
- Verbruik: niet gemeten.
