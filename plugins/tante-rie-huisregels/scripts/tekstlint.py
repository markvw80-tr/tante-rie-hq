#!/usr/bin/env python3
"""PostToolUse-hook (plugin tante-rie-huisregels): controleert klanttekst direct na het schrijven.

Geldt in elk team waar de plugin aanstaat:
- Markdown in marketing/content/ en marketing/onpage/ (SEO): geen gedachtestreepjes, geen
  uitroeptekens, geen vulwoorden. Tabelregels, citaten en codeblokken worden overgeslagen.
- JSON in pipeline/03-enriched/ en pipeline/04-review/ (PIM): dezelfde regels op de productvelden,
  plus lengtegrenzen en geen lijsten in de beschrijving.
De regels staan in ../schrijfregels.json. Bij problemen exit 2: de melding gaat terug naar de agent.
Een fout in de hook zelf blokkeert niets (exit 0 met een melding op stderr).
"""
import json
import os
import re
import sys
from pathlib import Path

REGELS = json.loads((Path(__file__).resolve().parent.parent / "schrijfregels.json").read_text())
VULWOORDEN = REGELS["vulwoorden"]
STREPEN = REGELS["gedachtestrepen"]
BEREIK = re.compile(r"(?<=\d)–(?=\d)")  # 5–7 minuten is een bereik, geen gedachtestreep


def tekstfouten(label, tekst):
    fouten = []
    kaal = BEREIK.sub("", tekst)
    kaal = re.sub(r"!\[|!=", "", kaal)  # markdown-afbeelding en != zijn geen uitroeptekens
    if "!" in kaal:
        fouten.append(f"{label}: uitroepteken")
    if any(s in kaal for s in STREPEN):
        fouten.append(f"{label}: gedachtestreep")
    laag = tekst.lower()
    fouten += [f"{label}: vulwoord '{w}'" for w in VULWOORDEN if w in laag]
    return fouten


def markdown(pad):
    fouten, in_code = [], False
    for nr, regel in enumerate(pad.read_text().split("\n"), 1):
        if regel.strip().startswith("```"):
            in_code = not in_code
            continue
        if in_code or not regel.strip() or regel.lstrip().startswith(("|", ">", "#")):
            continue
        # Een opsommingsteken aan het begin van een regel is opmaak, geen gedachtestreep.
        fouten += tekstfouten(f"regel {nr}", re.sub(r"^\s*[-*]\s+", "", regel))
    return fouten


def producten(data):
    if isinstance(data, list):
        return [d for d in data if isinstance(d, dict)]
    if isinstance(data, dict):
        for sleutel in ("producten", "products", "items"):
            if isinstance(data.get(sleutel), list):
                return producten(data[sleutel])
        return [data]
    return []


def productjson(pad):
    fouten = []
    for i, rec in enumerate(producten(json.loads(pad.read_text()))):
        naam = rec.get("handle") or rec.get("sku") or f"product {i + 1}"
        for veld in REGELS["productvelden"]:
            waarden = rec.get(veld)
            waarden = waarden if isinstance(waarden, list) else [waarden]
            for w in waarden:
                if not isinstance(w, str):
                    continue
                label = f"{naam} {veld}"
                fouten += tekstfouten(label, re.sub(r"<[^>]+>", " ", w))
                grens = REGELS["maxTekens"].get(veld)
                if grens and len(w) > grens:
                    fouten.append(f"{label}: {len(w)} tekens, maximaal {grens}")
                if veld == "description_html_nl" and re.search(r"<\s*(ul|ol|li|table)\b", w, re.I):
                    fouten.append(f"{label}: lijst of tabel in de beschrijving")
    return fouten


def main():
    data = json.load(sys.stdin)
    pad = data.get("tool_input", {}).get("file_path", "")
    if not pad:
        return 0
    root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()).resolve()
    try:
        bestand = Path(pad).resolve()
        rel = bestand.relative_to(root).as_posix()
    except ValueError:
        return 0
    if re.match(r"marketing/(content|onpage)/.+\.md$", rel):
        fouten = markdown(bestand)
    elif re.match(r"pipeline/0[34]-[^/]+/.+\.json$", rel):
        fouten = productjson(bestand)
    else:
        return 0
    if not fouten:
        return 0
    print(f"Schrijfregels Tante Rie ({rel}): " + "; ".join(fouten[:20]) + (f" en {len(fouten) - 20} meer" if len(fouten) > 20 else "")
          + ". Herstel dit; de regels staan in de skill huisregels.", file=sys.stderr)
    return 2


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # een kapotte hook mag het werk niet blokkeren
        print(f"tekstlint (plugin tante-rie-huisregels) kon niet controleren: {e}", file=sys.stderr)
        sys.exit(0)
