#!/bin/zsh
# Dagelijks de kengetallen van de teams bijwerken voor de doelenkaart in het Huis (launchd: nl.tanterie.kengetallen).
# Alleen lezen: Search Console, GA4, Bedrijfsprofiel, e-boekhouden en Google-reviews. Geen agents, geen kosten.
export PYTHONWARNINGS=ignore
PY=/Users/markvanwijk/micromamba/bin/python3
LOG="$HOME/Library/Logs/tante-rie-huis/kengetallen.log"
mkdir -p "${LOG:h}"
echo "=== $(date '+%Y-%m-%d %H:%M') start" >> "$LOG"
fout=0
for repo in tante-rie-seo tante-rie-financien tante-rie-klant; do
  echo "--- $repo" >> "$LOG"
  ( cd "$HOME/tante-rie/$repo" && "$PY" scripts/kengetallen.py ) >> "$LOG" 2>&1 || fout=1
done
echo "=== $(date '+%Y-%m-%d %H:%M') klaar, fout=$fout" >> "$LOG"
exit $fout
