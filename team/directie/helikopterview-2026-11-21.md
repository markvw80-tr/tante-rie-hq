# Helikopterview Huis van Tante Rie, 21-11-2026

## Context
Mark wil een helikopterblik op het Huis: welke functies missen, zijn de teams goed ingericht (de juiste skills, tools en modellen), welke afdelingen ontbreken, en hoe staan de koppelingen (Google en de rest). De verkenning was alleen lezen, over tante-rie-hq, -seo, -pim, -inkoop, -design, -theme, de connectors en de geplande taken.

**Wat het meest opvalt:** het Huis zelf (regie, poort, meterkast, dagverslag) is sterk. De zwakte zit in drie punten:
1. Skills en tools komen in de praktijk niet aan bij de agents.
2. De afdelingen draaien om de webshop, terwijl die ongeveer 1% van de omzet maakt (nulmeting: €59k netto sinds juni, conversie 0,2 tot 0,4%). De omzet komt uit de winkel.
3. Klant, marketing en geld hebben geen eigen afdeling.

---

## 1. Teaminrichting: wat technisch scheef zit (hoogste rendement, weinig werk)

| # | Probleem | Waar | Gevolg |
|---|---|---|---|
| 1 | Skills worden nergens echt geladen. Geen enkele agent heeft `skills:` in de frontmatter. Design-agents hebben ook geen `Skill`-tool. | alle teams, `.claude/agents/*.md` | Skills zoals shopify-liquid (theme-developer), cro en design-critique doen niets. |
| 2 | PIM-agents noemen Shopify-tools die niet meer bestaan (`search_products`, `get-product`, `create-product`, `update-product`, `validate_graphql_codeblocks`, `mcp__claude_ai_Shopify__*`). content-enricher en pim-qa-auditor kunnen Shopify niet lezen. | tante-rie-pim agents + settings.json | Agents vallen terug op de hoofdsessie. De subagents worden nauwelijks gebruikt (logs: vooral 23-10). |
| 3 | Verkeerd model: price-stock-agent draait op haiku (marge, btw, prijzen) en zoekwoord-onderzoeker op sonnet (CLAUDE.md vraagt opus voor zoekintentie). | PIM, SEO | Risico op fouten in de rekenwerk en op oppervlakkige clusters. |
| 4 | Ontbrekende tools: kwaliteitsredacteur en content-redacteur hebben geen Bash, maar moeten wel lint, `pim_regels.py` en `mailbox.py` draaien. Vijf SEO-agents hebben geen `tools:`-regel en krijgen dus alle MCP's. | SEO | De verplichte eindtoets kan technisch niet. Er zijn te veel rechten. |
| 5 | Dubbel werk tussen PIM en Inkoop: price-stock-agent en de publisher hebben voorraad- en kostprijsrechten, terwijl het besluit van 20-11 zegt dat alleen de Pakhuis-app voorraad en kostprijs boekt. | PIM | Botsende bevoegdheden. |
| 6 | Visuele blindheid bij Design: alleen de reviewer heeft een browser, en dat is claude-in-chrome op gebruikersniveau. Huis-runs laden alleen project- en lokale instellingen, dus waarschijnlijk is die browser er dan niet (nog te testen). visual-brand en ux-cro zien niets. `theme_screenshot` van de Shopify-MCP wordt niet gebruikt. | Design | Er wordt gestyled zonder te kijken. |
| 7 | De tekstlint dekt geen klanttekst van Design (thema, banners). De stijlgids verwijst nog naar het oude live thema, er is een tweede bron (`tante-rie-theme/DESIGN.md`) en de stijlgids spreekt opdrachten tegen. | huisregels, Design | Huisstijl en schrijfregels lekken. |
| 8 | Inkoop-agents hebben geen Shopify-skills (shopify-admin, use-shopify-cli). De ontvangst-controleur moet Shopify lezen, maar heeft geen tool. `voorraadpoort.py` dekt alleen Bash en geen MCP. | Inkoop | Er ontbreekt een controle. |
| 9 | Directie, verslaggever en systeembeheerder laden de huisregels-skill niet zelf. | HQ | Ze leunen op de plugin die het Huis inlaadt. |

**Aanpak:** per teamrepo één ronde `chore: agents op orde`. De stappen:
- `skills:` in de frontmatter.
- `Skill` in de tools.
- Tool-namen gelijkzetten met de huidige Shopify-connector (`graphql_query`, `graphql_mutation`, `set-inventory`, `theme_screenshot`).
- Modellen bijstellen.
- `tools:`-regels voor alle SEO-agents.
- De voorraadrechten weg bij PIM.
- Playwright-screenshots (`scripts/screenshot.py`) toevoegen aan visual-brand en ux-cro.

Dat gebeurt via opdrachten aan de teams met de keukentafel in het Huis, niet door zelf in hun repo's te schrijven.

---

## 2. Koppelingen (Google en de rest)

**Werkt goed, via het SEO-team, met service-account of OAuth in `~/.config/claude-seo/`:**
- Search Console: lezen, wekelijks via de launchd-migratiemonitor.
- GA4 `521523059`: lezen, handmatig.
- Bedrijfsprofiel: lezen en schrijven, via OAuth.
- Merchant Center 5716348221: lezen en schrijven, OAuth. `docs/databronnen.md` zegt ten onrechte "service-account".
- Keyword Planner via de Ads API: lezen, handmatig.
- PageSpeed/CrUX: API-sleutel, sinds 21-10 niet meer gedraaid.
- Gmail via de claude.ai-connector, beperkt tot alleen lezen van mails van sc-noreply. Het logboek staat stil sinds 26-10.
- Gmail SMTP voor het dagverslag, met een app-wachtwoord.

**Gaten en kansen:**

| Koppeling | Stand | Advies |
|---|---|---|
| Google-reviews (33 onbeantwoord) | Bedrijfsprofiel-OAuth bestaat al, scope business.manage dekt reviews | Reviews ophalen en conceptantwoorden laten schrijven. Mark keurt goed op de toonbank. Grootste lokale winst. |
| Kassa/POS-omzet | Nergens opgehaald, terwijl het een meetpunt is in `doelen.md` | ShopifyQL op het POS-kanaal (read_reports) toevoegen aan het maandrapport en het dagverslag. |
| GA4 en Search Console | Handmatig | Wekelijks opnemen in de migratiemonitor of een Huis-taak, en zichtbaar maken in een kamer. |
| Google Calendar | Niet gekoppeld (plugin-connector "failed: no URL") | Koopzondagen, Magisch Borne en workshops als bron voor Bedrijfsprofiel-berichten en social. Optioneel. |
| Google Drive/Sheets | Niet gekoppeld | Alleen nodig als Nikkie of het winkelpersoneel lijsten moet invullen. Nu geen prioriteit. |
| Google Ads-campagnes | Geen SEA. Ads-account bestaat (Keyword Planner) | Klein Performance Max of lokale campagne voor december en de winkel. Besluit van Mark nodig. |
| Ahrefs / Semrush | Connectors staan aan, maar het plan of de units zijn op. Mappen leeg | Opzeggen of upgraden. Nu betaal je mogelijk voor niets. |
| OpenSEO | Connector aan, 0 projecten, nergens gebruikt | Uitzetten, of één project tanterie.nl aanmaken als goedkope vervanger voor Ahrefs (GSC, GA4, GBP-reviews, local rank grid). |
| claude.ai-connectors in Huis-runs | Runs laden alleen project- en lokale instellingen | Testen of de Shopify- en Gmail-connector in een SDK-run beschikbaar zijn. Zo niet, dan uitleggen waarom agents tools "missen". De meterkast meldt dit al deels. |

**Beveiliging, om te controleren:** volgens de Inkoop-README staat het Pakhuis via **Tailscale Funnel** open op het internet, alleen achter `INKOOP_WACHTWOORD`. Het Huis gebruikt bewust geen Funnel. Advies: Pakhuis naar `tailscale serve` (alleen het tailnet), of rate-limiting en sterke auth erbij. Uit de audit van 18-11 staat ook nog open: API-sleutels in `~/.claude/settings.json` vervangen, en de deny op `.env` bij SEO. Die laatste is inmiddels gezet.

---

## 3. Ontbrekende afdelingen (gerangschikt op meerwaarde voor "dé thee- en cadeauwinkel van Twente, meer winst")

1. **Financiën / Controller (nieuw, prioriteit 1).** Kostprijs, marge en winst liggen nu verspreid over HQ (`eboekhouden_winst.py`), PIM (`margeregels.yaml` vrijwel leeg) en Inkoop. Taken:
   - marge per kanaal en per categorie;
   - prijsstrategie (factor, minimummarge en prijsstijl invullen);
   - de 32% omzet zonder kostprijs en de €14k vrije kassabedragen;
   - Bunzlau-kostprijzen boven de verkoopprijs;
   - maandelijkse winst-en-verliesrekening;
   - een streefwaarde voorstellen aan Mark.

   Agents: `controller` (opus) en `prijsanalist` (sonnet). Skills: data:analyze, data:statistical-analysis, xlsx, marketing-skills:pricing. Alleen lezen op Shopify en e-boekhouden.
2. **Klant & Community (nieuw, prioriteit 2).** Google-reviews beantwoorden en reviews vragen, Judge.me, klantvragen, het Bedrijfsprofiel-Q&A en lokale samenwerkingen. Haalt het reviewwerk weg bij SEO's autoriteit-lokaal, dat nu blijft liggen. Skills: seo-local, marketing:brand-review, stop-slop. De huisregels gelden voor elke reactie.
3. **Marketing & Campagnes (nieuw, prioriteit 3).** Er is geen e-mail, nieuwsbrief, social of seizoensplanning, terwijl de decemberpiek, Sinterklaas, Kerst en koopzondagen voor de deur staan. Taken:
   - campagnekalender;
   - nieuwsbrief via Shopify Email (er is geen Klaviyo; die connector vraagt wel auth);
   - Instagram, Facebook en TikTok-posts als concept;
   - in-store acties en workshops/proeverijen;
   - SEA als Mark dat wil.

   Skills: marketing:campaign-plan, marketing:email-sequence, marketing-skills:social, marketing-skills:emails, marketing-skills:ads. SEO blijft vindbaarheid en Marketing doet bereik.
4. **Winkelvloer / Assortiment (later).** Gebruikt de POS-verkoopdata:
   - wat verkoopt in Borne;
   - bestelpunten en minimumvoorraad (bestaat nergens);
   - voorraadprognose voor december;
   - kassaproducten online zetten (V108/V111).

   Kan ook als rol onder Inkoop (`assortiment-planner`) in plaats van een eigen afdeling.

**Bewust niet:** Fulfilment/Klantenservice-webshop (Sendcloud, retouren). Bij 1% webshopomzet is dat nu geen meerwaarde. Opnieuw bekijken als de webshop groeit.

Het Huis krijgt per nieuwe afdeling een kamer, mailbox, `werkafspraken-*.md`, statusblok en directie-dekking, zoals bij Inkoop gebeurde.

---

## 4. Functionaliteit in het Huis die mist

- **Opvolging en flessenhals Mark.** Er liggen veel V-vragen open, waarvan een deel al sinds oktober. Voorstel: de toonbank toont de leeftijd per besluit, de directie bundelt wekelijks, en vooraf goedgekeurde categorieën (audit punt 6), zoals alt-teksten en conceptproducten, gaan zonder akkoord per diff.
- **Doelen-dashboard.** Een kamer of toonbankkaart met de echte meetpunten: winst per maand, marge per kanaal, GSC-klikken niet-merk, Bedrijfsprofiel-acties, reviews en kassaomzet. Nu staan ze alleen in rapporten. Streefwaarden kiest Mark.
- **Kosten per team per maand** in het Huis (de runs hebben `costUsd` al), afgezet tegen bijdrage.
- **Verouderde bronnen opschonen:** `llms.txt` (20× `webshop.tanterie.nl` en een verkeerd openingsjaar), de kop van vragen-voor-mark.md ("25 oktober"), de stijlgids (oud live-id), README-checklist Pakhuis, `databronnen.md` (Merchant-auth).
- **Shopify-token van het Pakhuis** mist read/write_inventory. Live boeken werkt dus niet. Het Pakhuis was ook onbereikbaar op 21-11.

---

## Keuzes voor Mark

1. Agentronde per team (sectie 1): de concept-opdrachten staan klaar in `team/directie/concept-opdrachten-agents-2026-11-21.md`. Versturen via de keukentafel in het Huis.
2. Welke nieuwe afdelingen, en in welke volgorde (advies: Financiën, dan Klant & Community, dan Marketing & Campagnes).
3. Ahrefs en Semrush: opzeggen of upgraden. OpenSEO: uitzetten of als vervanger inrichten.
4. Pakhuis: van Tailscale Funnel naar `tailscale serve`.
5. Google Ads-campagne voor december: ja of nee.

## Controle na de agentronde

- Per team een testrun vanuit het Huis ("noem je tools en skills") en in `huis/runs/*.json` nakijken dat skills laden en de Shopify-tools bestaan.
- De meterkast meldt geen "tools die agents noemen maar niet hebben" meer.
- Een run die `graphql_query` (alleen lezen) aanroept, om te zien of claude.ai-connectors in Huis-runs werken.
