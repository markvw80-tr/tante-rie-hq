# Het Huis van Tante Rie

Lokale frontend boven de teams van Tante Rie. Elke afdeling is een kamer in het pand van de theewinkel:

| Kamer | Team | Bron |
|---|---|---|
| Kantoortje boven | Directie | `team/directie/agenda-*.md`, `.claude/agents/` |
| Atelier | Design | `~/tante-rie/tante-rie-design/.claude/agents/`, mailbox `team/mailbox/design/` |
| Etalage | SEO | `~/tante-rie/tante-rie-seo/.claude/agents/`, mailbox `team/mailbox/seo/` |
| Theekelder | PIM | `~/tante-rie/tante-rie-pim/.claude/agents/`, `pipeline/01-raw` t/m `05-published` |
| Toonbank | Mark | sectie "Mark: besluiten nodig" in de nieuwste agenda |

Statusblokken komen uit `team/status.md`, de doelen uit `team/doelen.md`. Achterstand vanaf 3 dagen, net als `scripts/directie_overzicht.py`.

## Fase 1: alleen lezen

In fase 1 en 2 las het huis alleen; schrijven kwam in fase 3 (zie onder). De server luistert alleen op `127.0.0.1` en weigert alles behalve GET. Het doet ook geen `git pull`; draai daarvoor zelf `python3 scripts/directie_overzicht.py`.

## Fase 2: kamerdetails

Klik een kamer voor vier tabbladen: Overzicht (signalen, statusblokken, bij PIM de stellingen met batches), Post (gesprekken via `antwoord-op`, met ongelezen berichten gemarkeerd), Werk (rapporten, opdrachten, changelogs, logboek) en Agents (met hun instructies). Elk document opent in een leesvenster.

Welke mappen per team zichtbaar zijn, staat in `server/werkbronnen.ts`. Alleen `.md`-bestanden uit die mappen, de mailbox, `.claude/agents/` en de PIM-pipeline zijn op te vragen; elke naam van buiten wordt eerst tegen de lijst van die map gecontroleerd.

| Endpoint | Wat |
|---|---|
| `GET /api/huis` | stand van het hele huis |
| `GET /api/team/:id` | werkbronnen en gesprekken van een team |
| `GET /api/document?team=&bron=&bestand=` | document uit een werkbron |
| `GET /api/bericht?bestand=` | mailboxbericht |
| `GET /api/agent?team=&naam=` | instructies van een agent |
| `GET /api/batch?fase=&batch=[&bestand=]` | inhoud of document van een PIM-batch |

## Fase 3: toonbank en keukentafel

Vanaf fase 3 kan het huis berichten **van Mark** versturen, via het bestaande transport `scripts/mailbox.py` (afzender `mark`). Dat zet het bericht via git op `main` van tante-rie-hq.

- **Toonbank:** per besluit uit de agenda kies je Akkoord, Niet akkoord of Vraag terug. De server stelt het bericht zelf op uit de agendaregel, met `Besluit: <keuze>` en `Besluit-id: <hash>`. Het huis leest dat terug en zet een stempel op het besluit. Alleen berichten met `van: mark` tellen.
- **Keukentafel:** een opdracht aan SEO, PIM of Design. Eerst schrijven, dan controleren, dan pas versturen.
- **Beantwoorden:** vanuit elk bericht in het leesvenster, met `antwoord-op` ingevuld.
- **Post ophalen:** haalt `origin/main` op in `.git/mailbox-main`. Het huis leest de post uit die werkkopie, want die is actueler dan de werkboom.

Beveiliging van schrijven: alleen `POST` met header `X-Huis: mark`, `Content-Type: application/json`, een Host van 127.0.0.1 of localhost en geen vreemde Origin. Daarmee kan een andere website in je browser niets versturen. `mailbox.py` draait zonder shell, de tekst gaat via stdin.

### Zandbak

Proberen zonder iets te versturen: wijs een kopie van hq aan en zet git uit.

```bash
HUIS_HQ=/pad/naar/kopie-van-hq HUIS_GEEN_GIT=1 npm run dev
```

## Fase 4: regie over agents

In de Agents-tab van elke kamer zet je een agent aan het werk met een opdracht en een maximaal budget ($0,50 tot $5). Het huis start hem via de Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`, vastgezet op 0.3.316) in de map van het team, met de instellingen, hooks en CLAUDE.md van dat team. Je kijkt live mee in de werkbank en kunt hem stoppen. Maximaal 3 agents tegelijk, dezelfde agent niet dubbel. De werkbonnen staan in `huis/runs/` (niet in git).

**De poort** (`server/regie/poort.ts`). Wat het team al toestaat, gaat gewoon door. Voor de rest:

| Soort | Voorbeelden | Wat er gebeurt |
|---|---|---|
| veilig | lezen, schrijven binnen de eigen teammap | gaat door |
| toestemming | Bash buiten de allowlist, schrijven buiten de teammap, WebFetch | de run wacht; Mark beslist op de toonbank |
| live | Shopify-mutaties en product-tools, thema publiceren of pushen, `git push`, scripts die schrijven of publiceren, elke vraag van een poort-hook van een team | de run wacht; Toestaan werkt pas na een extra vinkje |

**Ook wat het team al toestaat.** Een SDK-hook (`server/regie/poortHook.ts`) draait vóór elke tool-aanroep, dus ook vóór wat in de instellingen van het team op de allowlist staat. Live acties komen altijd op de toonbank. Staat er in de teamrepo een script dat nieuw of gewijzigd is (ook verstopt met `assume-unchanged`), dan vraagt elk shellcommando eerst toestemming, net als een commando dat een script buiten de repo draait. Zo kan een agent niet zelf code schrijven en die via een ruime regel als `python3 scripts/*` of een import laten draaien. Commit een script om dit op te heffen. Gaat er in de controle iets mis, dan weigert de hook. Poortvragen van één run komen na elkaar op de toonbank.

Teamruns laden alleen de project- en lokale instellingen van het team, niet je persoonlijke `~/.claude` (eigen regels, plugins en hooks).

**Toestemming automatisch geven.** Met de schakelaar op de toonbank gaan vragen van de soort *toestemming* direct door; ze komen alleen in het logboek van de run. Aanzetten keurt ook vragen goed die al wachten. Live acties vallen hier nooit onder en wachten altijd op Mark. De stand staat in `huis/data/goedkeuring.json` (niet in git), `POST /api/regie/goedkeuring` met `{ "aan": true|false }`.

Geweigerd krijgt de agent terug met jouw notitie. Zonder antwoord binnen 30 minuten is het geweigerd. Agents krijgen `TANTE_RIE_HUIS` nooit mee, dus ze kunnen geen berichten als Mark versturen.

| Endpoint | Wat |
|---|---|
| `GET /api/runs`, `GET /api/runs/:id` | werkbonnen |
| `GET /api/runs/:id/stream` | live log (server-sent events) |
| `POST /api/runs` | agent starten (`team`, `agent`, `opdracht`, `budgetUsd`) |
| `POST /api/runs/:id/stop` | stoppen |
| `POST /api/runs/:id/poort` | poortvraag beantwoorden (`verzoekId`, `toestaan`, `notitie`) |

## Post: ophalen en archief

- **Ophalen:** de server haalt elke 5 minuten de post van `origin/main` op (via `mailbox.py lijst`, dat alleen fetcht en leest). Onderaan het huis staat wanneer dat voor het laatst gebeurde; **Post ophalen** doet het direct. In de zandbak (`HUIS_GEEN_GIT=1`) staat het automatisch ophalen uit.
- **Archief:** in de Post-tab van een kamer kies je Lopend of Archief. Afgehandelde gesprekken (niets meer in een inbox) archiveer je per stuk of allemaal tegelijk, en haal je met **Terughalen** weer terug. Komt er een nieuw bericht in een gearchiveerd gesprek, dan staat het vanzelf weer bij Lopend. Het archief is alleen jouw overzicht: het staat in `huis/data/archief.json` (niet in git) en de mailbox van de teams blijft onveranderd.

## Post automatisch laten oppakken

Op de toonbank staat de kaart **Post automatisch laten oppakken**, standaard uit. Staat hij aan, dan kijkt het huis na elke keer post ophalen (elke 5 minuten) in de inboxen van SEO, PIM en Design. Ligt er post waarvoor het team nog niet gestart is, dan start het huis de lead van dat team: `seo-lead`, `pim-orchestrator` of `design-lead`. De opdracht noemt de nieuwe berichten en zegt erbij dat het een automatische start is en geen opdracht van Mark.

- **Grenzen:** geen start als dat team al werkt; nooit meer dan 3 agents tegelijk; hooguit 8 automatische starts per 24 uur; per team minstens 60 minuten tussen twee automatische starts. Het budget per run kies je op de kaart ($0,50 tot $5).
- **Geen herhaling:** post die na een run in de inbox blijft staan (bijvoorbeeld omdat hij op Mark wacht), start het team geen tweede keer. Alleen nieuwe berichten doen dat.
- **De poort blijft:** live acties en acties die toestemming vragen wachten ook bij een automatische run op jou. Zo'n run staat in de regie met het label *automatisch*.
- Instelling en geschiedenis staan in `huis/data/automaat.json` (niet in git).
- Meterkast en systeembeheerder: zie de README in de hoofdmap. Wat al gemeld is en wanneer de beheerder startte, staat in `huis/data/systeembeheer.json` (niet in git). In de zandbak (`HUIS_GEEN_GIT=1`) wordt er niet automatisch opgehaald, dus ook niet automatisch gestart.
- Dagverslag: zie de README in de hoofdmap. De verslagen van de laatste 14 dagen staan in `huis/data/dagverslag.json` (niet in git). Mail: `HUIS_MAIL_GEBRUIKER`, `HUIS_MAIL_WACHTWOORD`, `HUIS_MAIL_AAN` en eventueel `HUIS_MAIL_SERVER` (standaard Gmail) in `huis/.env`, gezet met `scripts/zet-mail.sh`. In de zandbak wordt er niets gestart.

## Buiten de deur via Tailscale

Het huis luistert alleen op 127.0.0.1. Van buiten kom je er alleen bij via `tailscale serve`, dat het huis op een https-adres in je eigen Tailscale-netwerk zet. Funnel (openbaar internet) gebruik je hier niet.

1. Installeer Tailscale op de Mac en log in met hetzelfde account als op je telefoon.
2. Zet het huis in je tailnet (de opdracht blijft staan, ook na een herstart):
   ```bash
   /Applications/Tailscale.app/Contents/MacOS/Tailscale serve --bg 5310
   ```
   Bij `npm start` (productie) gebruik je poort 4310. Vraagt Tailscale om HTTPS-certificaten aan te zetten, volg dan de link.
3. Open op je telefoon het adres dat Tailscale noemt (`https://<mac>.<tailnet>.ts.net`). Het staat ook onderaan in het huis.

Toegang: het huis kijkt elke minuut met `tailscale status --json` welk account op de Mac is ingelogd. Via Tailscale mag alleen dat account lezen en schrijven; daarvoor gebruikt het huis de header `Tailscale-User-Login` die `tailscale serve` meestuurt. Andere accounts in je tailnet en apparaten zonder gebruiker (tags) krijgen een 403. Lukt de herkenning niet, dan kun je host en account vast zetten met `HUIS_TAILSCALE_HOST` en `HUIS_TAILSCALE_LOGIN`. Uitzetten: `tailscale serve --https=443 off`.

### Nikkie

Nikkie heeft een eigen Tailscale-account. Deel de Mac met haar (Tailscale-beheer, Machines, `macbook-pro`, Share) en zet haar account in `huis/data/toegang.json` (niet in git):

```json
{ "nikkie": "haar-tailscale-login@voorbeeld.nl" }
```

Het huis leest dit bestand bij elk verzoek; herstarten hoeft niet. Nikkie ziet bovenin "Ingelogd als Nikkie" en kan alles, maar als zichzelf:

- Opdrachten en antwoorden gaan als `van: nikkie`. Volgens de huisregels is dat geen akkoord van Mark.
- Op een besluit kan ze reageren. Dat bericht heeft geen `Besluit:`- of `Besluit-id:`-regel, dus het besluit blijft open tot Mark beslist.
- Agents starten en stoppen, toestemmingsvragen beantwoorden, de schakelaars en het archief: mag, en het logboek noemt haar.
- Een **live actie** goedkeuren doet alleen Mark (Niets gaat live zonder Mark). Weigeren mag Nikkie wel. De Mac moet aan staan en het huis moet draaien.

## Starten

```bash
cd huis
npm install
npm run dev        # http://127.0.0.1:5310 (API op 4310)
```

Productie: `npm run build && npm start` (alles op http://127.0.0.1:4310).

Andere teammappen: zet `HUIS_SEO`, `HUIS_DESIGN` of `HUIS_PIM`. Andere poort: `HUIS_PORT`.

## Als vaste dienst op de Mac (launchd)

Het huis draait als achtergronddienst `nl.tanterie.huis`: het start bij het inloggen, start vanzelf opnieuw na een crash en draait los van de Claude-app. Productie op poort 5310 (`HUIS_PORT=5310`), dus dezelfde adressen als in ontwikkeling, ook via Tailscale. Logboek: `~/Library/Logs/tante-rie-huis/`.

```bash
cp huis/nl.tanterie.huis.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/nl.tanterie.huis.plist
```

Na een codewijziging: `npm --prefix huis run build` en dan `launchctl kickstart -k gui/$(id -u)/nl.tanterie.huis` (onderbreekt een lopende agent, dus eerst kijken of er een draait). Stoppen: `launchctl bootout gui/$(id -u)/nl.tanterie.huis`. Wil je weer `npm run dev` gebruiken, stop dan eerst de dienst.

## Testen

```bash
npm test
npm run test:coverage
```

## Opbouw

- `server/parsers/`: losse functies voor agents, status, mailbox, agenda en doelen (getest).
- `server/huis.ts`: bouwt de stand van het huis via een `Bron` (schijf of geheugen in tests).
- `server/index.ts`: HTTP-server, `GET /api/huis`.
- `src/components/huis/`: het getekende huis (SVG).
- `server/werk.ts`, `server/routes.ts`: werkbronnen, gesprekken en alle leesroutes (getest).
- `src/components/kamer/`: tabbladen per kamer.
- `src/lezer/`: het leesvenster.
- `src/components/`: toonbank, agenda en doelen.
