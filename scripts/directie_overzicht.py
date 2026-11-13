#!/usr/bin/env python3
"""Overzicht voor de directie van Tante Rie: wat ligt er waar en hoe lang al.

Alleen lezen. Toont per team de ongelezen berichten met leeftijd, de open regels in de
JSON-mailboxen tussen SEO en PIM, en hoe oud het laatste statusblok per team is.
Markeert achterstand vanaf DREMPEL dagen.

Gebruik: python3 scripts/directie_overzicht.py [--geen-pull]
"""
import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

HQ = Path(__file__).resolve().parent.parent
TEAMS = ("seo", "pim", "design")
DREMPEL = 3
vandaag = datetime.date.today()

if "--geen-pull" not in sys.argv:
    r = subprocess.run(["git", "-C", str(HQ), "pull", "-q", "--ff-only"], capture_output=True, text=True, timeout=30)
    print("hq pull:", "ok" if r.returncode == 0 else r.stderr.strip()[:120])


def leeftijd(naam):
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", naam)
    return (vandaag - datetime.date(*map(int, m.groups()))).days if m else None


print(f"\nDirectie-overzicht {vandaag.isoformat()} (achterstand vanaf {DREMPEL} dagen)")
print("\nMarkdown-mailbox, ongelezen per team:")
for t in TEAMS:
    inbox = HQ / "team/mailbox" / t / "inbox"
    namen = sorted(p.name for p in inbox.glob("*.md")) if inbox.is_dir() else []
    if not namen:
        print(f"- {t}: leeg")
        continue
    oud = [n for n in namen if (leeftijd(n) or 0) >= DREMPEL]
    print(f"- {t}: {len(namen)} ongelezen, oudste {max(leeftijd(n) or 0 for n in namen)} dagen"
          + (f"  ACHTERSTAND {len(oud)}" if oud else ""))
    for n in namen[:5]:
        print(f"    {n}")

print("\nJSON-mailbox productregels:")
for naam in ("seo-naar-pim", "pim-naar-seo"):
    pad = HQ / "team/mailbox" / f"{naam}.json"
    try:
        berichten = json.loads(pad.read_text()).get("berichten", [])
    except (OSError, ValueError):
        print(f"- {naam}: niet te lezen")
        continue
    open_ = [b for b in berichten if b.get("status") not in ("verwerkt",)]
    if not open_:
        print(f"- {naam}: niets open")
    for b in open_:
        regels = b.get("regels", [])
        nog = sum(r.get("status") in ("nieuw", "in_behandeling") for r in regels)
        dagen = leeftijd(b.get("datum", "")) 
        print(f"- {naam}: {b.get('bericht_id')} status {b.get('status')}, {nog}/{len(regels)} regels open"
              + (f", {dagen} dagen oud" if dagen is not None else "")
              + ("  ACHTERSTAND" if (dagen or 0) >= DREMPEL else ""))

print("\nLaatste statusblok per team:")
laatste = {}
for regel in (HQ / "team/status.md").read_text().splitlines():
    m = re.match(r"## (SEO|PIM|Design), (\d{2})-(\d{2})-(\d{4})", regel)
    if m:
        team = m.group(1).lower()
        d = datetime.date(int(m.group(4)), int(m.group(3)), int(m.group(2)))
        if team not in laatste or d > laatste[team][0]:
            laatste[team] = (d, regel[3:])
for t in TEAMS:
    if t in laatste:
        d, kop = laatste[t]
        print(f"- {t}: {(vandaag - d).days} dagen geleden, {kop}")
    else:
        print(f"- {t}: geen statusblok")
print("\nGedeelde doelen: team/doelen.md")
