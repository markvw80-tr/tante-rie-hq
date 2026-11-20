#!/bin/zsh -l
# Start het Huis van Tante Rie als achtergronddienst (launchd: nl.tanterie.huis).
# Login-shell, zodat node, git en de inlog van Claude Code beschikbaar zijn.
# Productie op poort 5310: dezelfde adressen als in ontwikkeling, ook via Tailscale.
set -e
cd "${0:A:h}"
export HUIS_PORT=5310
# Lokale instellingen (o.a. adres en sleutel van de inkoop-app); staat niet in git.
if [[ -f .env ]]; then
  set -a
  source ./.env
  set +a
fi
# Frontend opnieuw bouwen als er nog geen build is of als de bronnen nieuwer zijn dan de build.
if [[ ! -f dist/index.html ]] || [[ -n "$(find src shared index.html -newer dist/index.html -print -quit)" ]]; then
  npm run build
fi
exec npm start
