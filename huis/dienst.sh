#!/bin/zsh -l
# Start het Huis van Tante Rie als achtergronddienst (launchd: nl.tanterie.huis).
# Login-shell, zodat node, git en de inlog van Claude Code beschikbaar zijn.
# Productie op poort 5310: dezelfde adressen als in ontwikkeling, ook via Tailscale.
set -e
cd "${0:A:h}"
export HUIS_PORT=5310
if [[ ! -f dist/index.html ]]; then
  npm run build
fi
exec npm start
