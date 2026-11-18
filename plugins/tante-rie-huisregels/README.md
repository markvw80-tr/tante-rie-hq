# tante-rie-huisregels

Gedeelde plugin voor de teams van Tante Rie (SEO, PIM, Design en directie).

- `skills/huisregels`: de werkwijze die in elk team gelijk is (akkoord van Mark, mailbox, statusblok, klanttekst, veilig werken).
- `hooks/hooks.json` en `scripts/tekstlint.py`: controleert klanttekst direct na het schrijven.
- `schrijfregels.json`: één bron voor vulwoorden, gedachtestrepen en lengtegrenzen.

De marketplace `tante-rie` staat in `.claude-plugin/marketplace.json` van tante-rie-hq. De teams zetten de plugin aan in hun `.claude/settings.json`; het Huis laadt hem bij elke run als lokale plugin.

Installeren in een teammap: `claude plugin install tante-rie-huisregels@tante-rie --scope project` (eerst eenmalig `claude plugin marketplace add ~/tante-rie-hq`).

Wijzigen: pas de bestanden aan, verhoog `version` in `.claude-plugin/plugin.json`, push naar main en draai in een teamsessie `/plugin marketplace update tante-rie`.
