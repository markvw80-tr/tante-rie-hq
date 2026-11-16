# Het Huis van Tante Rie

Lokale frontend boven de teams van Tante Rie. Elke afdeling is een kamer in het pand van de theewinkel:

| Kamer | Team | Bron |
|---|---|---|
| Kantoortje boven | Directie | `team/directie/agenda-*.md`, `.claude/agents/` |
| Atelier | Design | `~/Tante Rie Design/.claude/agents/`, mailbox `team/mailbox/design/` |
| Etalage | SEO | `~/Tante Rie SEO/.claude/agents/`, mailbox `team/mailbox/seo/` |
| Theekelder | PIM | `~/Tante Rie PIM/.claude/agents/`, `pipeline/01-raw` t/m `05-published` |
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

## Starten

```bash
cd huis
npm install
npm run dev        # http://127.0.0.1:5310 (API op 4310)
```

Productie: `npm run build && npm start` (alles op http://127.0.0.1:4310).

Andere teammappen: zet `HUIS_SEO`, `HUIS_DESIGN` of `HUIS_PIM`. Andere poort: `HUIS_PORT`.

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
