#!/bin/zsh
# Zet de mail voor het dagverslag aan: het Huis van Tante Rie verstuurt dan elke avond om 20.00 uur
# het verslag van elke afdeling als aparte mail. Werkt met Gmail via een app-wachtwoord
# (Google-account > Beveiliging > Verificatie in 2 stappen > App-wachtwoorden).
# Het wachtwoord wordt niet getoond en staat alleen in huis/.env (alleen leesbaar voor jou, niet in git).
set -euo pipefail

HUIS_ENV="${0:A:h}/../huis/.env"

print -n "Gmail-adres dat verstuurt: "
read -r GEBRUIKER
print -n "App-wachtwoord (16 tekens, je ziet het niet): "
read -rs WACHTWOORD
print
print -n "Naar welk adres? (Enter = hetzelfde adres): "
read -r AAN
AAN="${AAN:-$GEBRUIKER}"

if [[ "$GEBRUIKER" != *@*.* || "$AAN" != *@*.* || -z "$WACHTWOORD" ]]; then
  print "Adres of wachtwoord klopt niet; er is niets veranderd." >&2
  exit 1
fi

touch "$HUIS_ENV"
chmod 600 "$HUIS_ENV"
grep -v -E '^HUIS_MAIL_(GEBRUIKER|WACHTWOORD|AAN)=' "$HUIS_ENV" > "$HUIS_ENV.tmp" || true
printf 'HUIS_MAIL_GEBRUIKER=%s\nHUIS_MAIL_WACHTWOORD=%s\nHUIS_MAIL_AAN=%s\n' "$GEBRUIKER" "${WACHTWOORD// /}" "$AAN" >> "$HUIS_ENV.tmp"
cat "$HUIS_ENV.tmp" > "$HUIS_ENV"
rm -f "$HUIS_ENV.tmp"
unset WACHTWOORD

launchctl kickstart -k "gui/$(id -u)/nl.tanterie.huis" 2>/dev/null || true
print "Mail staat aan. Het Huis is herstart; het eerstvolgende dagverslag komt ook per mail."
