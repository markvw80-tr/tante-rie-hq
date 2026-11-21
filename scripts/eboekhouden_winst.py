#!/usr/bin/env python3
"""Winst-en-verliesrekening per maand uit e-boekhouden (alleen lezen).

De API-sleutel staat in de macOS-sleutelhanger (dienst `tante-rie-e-boekhouden`) en wordt nooit
geprint of opgeslagen. Het script vraagt per maand de saldi van de winst-en-verliesrekeningen
(categorie VW) op en groepeert ze naar het eerste cijfer van de grootboekcode.

Gebruik:
  python3 scripts/eboekhouden_winst.py                 # 2025-01 t/m deze maand, tabel op scherm
  python3 scripts/eboekhouden_winst.py --van 2026-01 --json team/data/financien/winst.json
  python3 scripts/eboekhouden_winst.py --rekeningen    # welke VW-rekeningen er zijn (code, omschrijving)
"""
import argparse
import calendar
import datetime
import json
import os
import ssl
import subprocess
import sys
import urllib.error
import urllib.request

API = "https://api.e-boekhouden.nl"
DIENST = "tante-rie-e-boekhouden"
BRON = "TanteRie"
# Python van python.org (ook die van de Huis-dienst) heeft geen eigen certificatenbundel: dan die van macOS.
# De verificatie blijft altijd aan.
MACOS_CA = "/etc/ssl/cert.pem"
SSL_CONTEXT = (ssl.create_default_context(cafile=MACOS_CA)
               if not ssl.get_default_verify_paths().cafile and os.path.exists(MACOS_CA)
               else ssl.create_default_context())
# Indeling naar het eerste cijfer van de grootboekcode (gangbare Nederlandse indeling).
GROEP = {"8": "omzet", "7": "kostprijs_omzet", "4": "bedrijfskosten", "9": "financieel_en_overig"}


def sleutel():
    try:
        return subprocess.run(["security", "find-generic-password", "-s", DIENST, "-w"],
                              capture_output=True, text=True, check=True).stdout.strip()
    except subprocess.CalledProcessError:
        sys.exit(f"Geen sleutel gevonden in de sleutelhanger (dienst {DIENST}).")


def vraag(methode, pad, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + pad, data=data, method=methode)
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json")
    if token:
        req.add_header("Authorization", token)
    try:
        with urllib.request.urlopen(req, timeout=30, context=SSL_CONTEXT) as r:
            tekst = r.read().decode()
            return json.loads(tekst) if tekst else {}
    except urllib.error.HTTPError as e:
        melding = e.read().decode()[:300]
        sys.exit(f"e-boekhouden {methode} {pad}: HTTP {e.code} {melding}")


def maanden(van, tot):
    j, m = van
    while (j, m) <= tot:
        yield j, m
        j, m = (j + 1, 1) if m == 12 else (j, m + 1)


def vw_rekeningen(token):
    rekeningen, offset = {}, 0
    while True:
        r = vraag("GET", f"/v1/ledger?category=VW&limit=500&offset={offset}", token)
        items = r.get("items", [])
        for i in items:
            rekeningen[i["code"]] = i.get("description", "")
        if len(items) < 500:
            return rekeningen
        offset += 500


def maandcijfers(token, codes, j, m):
    laatste = calendar.monthrange(j, m)[1]
    r = vraag("GET", f"/v1/ledger/balances?from={j}-{m:02d}-01&to={j}-{m:02d}-{laatste}", token)
    groepen = {g: 0.0 for g in set(GROEP.values()) | {"overig"}}
    for i in r.get("items", []):
        if i.get("code") not in codes:
            continue
        groepen[GROEP.get(str(i["code"])[:1], "overig")] += float(i.get("balance") or 0)
    # In de boekhouding staat omzet als credit (negatief); winst is daarom min de som van alle VW-saldi.
    uit = {k: round(-v, 2) for k, v in groepen.items()}
    uit["nettowinst"] = round(sum(uit[k] for k in groepen), 2)
    uit["brutomarge"] = round(uit["omzet"] + uit["kostprijs_omzet"], 2)
    return uit


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--van", default="2025-01", help="eerste maand, JJJJ-MM")
    p.add_argument("--tot", default=datetime.date.today().strftime("%Y-%m"), help="laatste maand, JJJJ-MM")
    p.add_argument("--json", help="schrijf de maandcijfers ook naar dit bestand")
    p.add_argument("--rekeningen", action="store_true", help="toon alleen de VW-rekeningen")
    a = p.parse_args()

    token = vraag("POST", "/v1/session", body={"accessToken": sleutel(), "source": BRON})["token"]
    try:
        codes = vw_rekeningen(token)
        if a.rekeningen:
            for code, oms in sorted(codes.items()):
                print(f"{code:>8}  {GROEP.get(str(code)[:1], 'overig'):<22} {oms}")
            return
        van = tuple(int(x) for x in a.van.split("-"))
        tot = tuple(int(x) for x in a.tot.split("-"))
        rijen = {f"{j}-{m:02d}": maandcijfers(token, set(codes), j, m) for j, m in maanden(van, tot)}
    finally:
        vraag("DELETE", "/v1/session", token)

    print(f"{'maand':<8} {'omzet':>10} {'kostprijs':>10} {'brutomarge':>11} {'bedrijfsk.':>11} {'overig':>9} {'nettowinst':>11}")
    for maand, c in rijen.items():
        overig = c["financieel_en_overig"] + c["overig"]
        print(f"{maand:<8} {c['omzet']:>10.0f} {c['kostprijs_omzet']:>10.0f} {c['brutomarge']:>11.0f} {c['bedrijfskosten']:>11.0f} {overig:>9.0f} {c['nettowinst']:>11.0f}")
    if a.json:
        os.makedirs(os.path.dirname(os.path.abspath(a.json)), exist_ok=True)
        with open(a.json, "w", encoding="utf-8") as f:
            json.dump({"bron": "e-boekhouden, categorie VW", "opgehaald": datetime.datetime.now().isoformat(timespec="seconds"), "maanden": rijen}, f, indent=2)
        print("Opgeslagen:", a.json)


if __name__ == "__main__":
    main()
