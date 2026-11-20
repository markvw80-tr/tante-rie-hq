# Tante Rie HQ

Gedeelde plek voor het SEO-team (tante-rie-seo), het PIM-team (tante-rie-pim), het Design-team (tante-rie-design) en het Inkoop-team (tante-rie-inkoop): status, mailbox (Markdown-berichten per team en JSON voor productregels, `scripts/mailbox.py`) en ruwe onderzoeksdata. Werkafspraken: `team/werkafspraken-seo.md`, `team/werkafspraken-pim.md`, `team/werkafspraken-design.md` en `team/werkafspraken-inkoop.md`.

Directie: `.claude/agents/directie.md` leest status en mailboxen van de vier teams (`scripts/directie_overzicht.py`, ook bij sessiestart), bewaakt `team/doelen.md` en schrijft een agenda voor Mark in `team/directie/`.

Systeembeheer: het Huis controleert elke 10 minuten of alles gezond is (Claude-login, mislukte runs, tools die agents noemen maar niet hebben, niet-gepusht werk, vergeten inboxberichten, Pakhuis, schijfruimte) en toont dat in de Meterkast op de toonbank (`huis/server/gezondheid.ts`). Bij een nieuw probleem start het `.claude/agents/systeembeheerder.md` (hooguit 4 keer per dag, 1 dollar per run): die lost veilige dingen zelf op (afgehandelde berichten op verwerkt zetten) en legt de rest in een statusblok aan Mark voor (besluit Mark 20-11-2026).
