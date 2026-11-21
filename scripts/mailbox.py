#!/usr/bin/env python3
"""Mailbox tussen het SEO-, PIM- en Design-team (Tante Rie).

Berichten zijn Markdown-bestanden in team/mailbox/<team>/inbox/. Na verwerking
gaan ze naar team/mailbox/<team>/verwerkt/. Dit script staat in tante-rie-hq; de
repositories van de teams hebben een scripts/mailbox.py dat hiernaar doorverwijst. Git is het transport: het script werkt in een
aparte werkkopie van origin/main (.git/mailbox-main in tante-rie-hq), zodat de branch waarop je
werkt niet verandert, en zet verzonden of verwerkte berichten direct op main.

Gebruik:
  python3 scripts/mailbox.py lijst seo                 # ongelezen berichten voor het SEO-team (ook pim, design)
  python3 scripts/mailbox.py lees <bestand>            # één bericht tonen
  python3 scripts/mailbox.py stuur --van seo --door zoekwoord-onderzoeker --aan pim --voor content-enricher --onderwerp "..." --tekst "..."
                                                       # --door: jouw agentnaam; --voor: de agent die het moet oppakken (beide optioneel)
                                                       # --van mark: bericht van Mark zelf (akkoord of opdracht)
                                                       # --van nikkie: bericht van Nikkie via het Huis (geen akkoord van Mark)
        [--antwoord-op <bestand>] [--prioriteit hoog|normaal|laag]
  python3 scripts/mailbox.py verwerkt <bestand> [--notitie "..."]
  python3 scripts/mailbox.py status --team seo --kop "18-11-2026 (onderwerp)" --tekst -   # statusblok op main
  python3 scripts/mailbox.py --geen-git ...            # zonder pull/commit/push (testen)
"""
import argparse
import datetime
import os
import re
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEAMS = ("seo", "pim", "design", "inkoop", "financien", "klant")
SENDERS = TEAMS + ("directie", "mark", "nikkie")  # mark en nikkie: alleen via het Huis; alleen mark geldt als akkoord van Mark
BRANCH = "main"
ROOT = os.environ.get("MAILBOX_TEST_ROOT") or REPO  # wordt de werkkopie van main zodra git gebruikt wordt
MAILBOX = os.path.join(ROOT, "team", "mailbox")
# Map met de teamrepo's (tante-rie-seo, tante-rie-pim, ...); daar staan de agents in .claude/agents/.
TEAMS_MAP = os.path.dirname(os.path.realpath(REPO))
AGENT_NAAM = re.compile(r"^[a-z0-9][a-z0-9-]{1,59}$")


def git(*args, check=True, cwd=None):
    p = subprocess.run(["git", "-C", cwd or ROOT, *args], capture_output=True, text=True)
    if check and p.returncode != 0:
        raise RuntimeError("git " + " ".join(args) + ": " + p.stderr.strip())
    return p


def ophalen():
    """Zet de werkkopie .git/mailbox-main op de laatste stand van origin/main."""
    global ROOT, MAILBOX
    gitdir = git("rev-parse", "--git-common-dir", cwd=REPO).stdout.strip()
    wt = os.path.join(os.path.abspath(os.path.join(REPO, gitdir)), "mailbox-main")
    git("fetch", "origin", BRANCH, cwd=REPO)
    if not os.path.isdir(os.path.join(wt, "team", "mailbox")):
        git("worktree", "prune", cwd=REPO)
        git("worktree", "add", "--detach", wt, "origin/" + BRANCH, cwd=REPO)
    else:
        git("reset", "--hard", "origin/" + BRANCH, cwd=wt)
    ROOT, MAILBOX = wt, os.path.join(wt, "team", "mailbox")


def vastleggen(paden, bericht):
    git("add", "-A", "--", *paden)
    git("commit", "-m", bericht, "--", *paden)
    for poging in range(3):
        if git("push", "origin", "HEAD:" + BRANCH, check=False).returncode == 0:
            return
        git("fetch", "origin", BRANCH)
        git("rebase", "origin/" + BRANCH, check=False)
    raise RuntimeError("push naar " + BRANCH + " mislukt; probeer later opnieuw")


def agent_van_team(naam, team):
    """Controleer een agentnaam voor --voor of --door. Staat de agentmap van het team er, dan moet de agent erin staan."""
    if not naam:
        return None
    if not AGENT_NAAM.match(naam):
        sys.exit("Ongeldige agentnaam: %r (alleen kleine letters, cijfers en streepjes)." % naam)
    repo = "tante-rie-hq" if team == "directie" else "tante-rie-" + team
    agents = os.path.join(TEAMS_MAP, repo, ".claude", "agents")
    if os.path.isdir(agents):
        bekend = sorted(n[:-3] for n in os.listdir(agents) if n.endswith(".md"))
        if naam not in bekend:
            sys.exit("Agent %s bestaat niet bij %s. Kies uit: %s" % (naam, team, ", ".join(bekend)))
    return naam


def slug(tekst):
    s = re.sub(r"[^a-z0-9]+", "-", tekst.lower()).strip("-")
    return s[:50] or "bericht"


def kop(pad):
    """Lees de kop (key: value tussen ---) van een bericht."""
    velden = {}
    with open(pad, encoding="utf-8") as f:
        regels = f.read().split("\n")
    if regels and regels[0] == "---":
        for r in regels[1:]:
            if r == "---":
                break
            k, _, v = r.partition(":")
            velden[k.strip()] = v.strip()
    return velden


def zoek(bestand):
    """Vind een bericht op naam in alle inboxen en verwerkt-mappen."""
    naam = os.path.basename(bestand)
    for team in TEAMS:
        for map_ in ("inbox", "verwerkt"):
            pad = os.path.join(MAILBOX, team, map_, naam)
            if os.path.isfile(pad):
                return pad
    sys.exit("Bericht niet gevonden: " + bestand)


def cmd_lijst(a):
    inbox = os.path.join(MAILBOX, a.team, "inbox")
    namen = sorted(n for n in os.listdir(inbox) if n.endswith(".md")) if os.path.isdir(inbox) else []
    if not namen:
        print("Geen nieuwe berichten voor " + a.team + ".")
        return
    for n in namen:
        k = kop(os.path.join(inbox, n))
        van = k.get("van", "?") + (" (" + k["door"] + ")" if k.get("door") else "")
        voor = " voor " + k["voor"] if k.get("voor") else ""
        print("%s  [%s] van %s%s: %s" % (n, k.get("prioriteit", "normaal"), van, voor, k.get("onderwerp", "")))


def cmd_lees(a):
    with open(zoek(a.bestand), encoding="utf-8") as f:
        print(f.read())


def cmd_stuur(a):
    if a.van in ("mark", "nikkie") and os.environ.get("TANTE_RIE_HUIS") != "1":
        sys.exit("Afzender %s is alleen voor %s zelf, via het Huis van Tante Rie. "
                 "Een team of de directie verstuurt nooit namens Mark of Nikkie." % (a.van, a.van.capitalize()))
    if a.van == a.aan:
        sys.exit("Afzender en ontvanger zijn hetzelfde team.")
    if a.door and a.van in ("mark", "nikkie"):
        sys.exit("--door is voor een agent; %s is een persoon." % a.van.capitalize())
    voor = agent_van_team(a.voor, a.aan)
    door = agent_van_team(a.door, a.van)
    tekst = a.tekst
    if tekst == "-":
        tekst = sys.stdin.read()
    nu = datetime.datetime.now()
    naam = "%s-%s-%s.md" % (nu.strftime("%Y-%m-%d-%H%M%S"), a.van, slug(a.onderwerp))
    pad = os.path.join(MAILBOX, a.aan, "inbox", naam)
    kopregels = ["---",
                 "van: " + a.van,
                 "aan: " + a.aan]
    if voor:
        kopregels.append("voor: " + voor)
    if door:
        kopregels.append("door: " + door)
    kopregels += ["datum: " + nu.strftime("%Y-%m-%d %H:%M"),
                  "onderwerp: " + a.onderwerp,
                  "prioriteit: " + a.prioriteit]
    if a.antwoord_op:
        kopregels.append("antwoord-op: " + os.path.basename(a.antwoord_op))
    kopregels.append("---")
    with open(pad, "w", encoding="utf-8") as f:
        f.write("\n".join(kopregels) + "\n\n" + tekst.strip() + "\n")
    if not a.geen_git:
        vastleggen([pad], "mailbox: %s -> %s: %s" % (a.van, a.aan, a.onderwerp))
    print("Verstuurd: " + os.path.relpath(pad, ROOT))


def cmd_verwerkt(a):
    bron = zoek(a.bestand)
    if os.path.basename(os.path.dirname(bron)) != "inbox":
        sys.exit("Dit bericht is al verwerkt.")
    doel = os.path.join(os.path.dirname(os.path.dirname(bron)), "verwerkt", os.path.basename(bron))
    with open(bron, encoding="utf-8") as f:
        inhoud = f.read()
    datum = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    inhoud = inhoud.rstrip("\n") + "\n\n---\nVerwerkt op " + datum
    inhoud += (": " + a.notitie + "\n") if a.notitie else "\n"
    with open(doel, "w", encoding="utf-8") as f:
        f.write(inhoud)
    os.remove(bron)
    if not a.geen_git:
        vastleggen([bron, doel], "mailbox: verwerkt " + os.path.basename(bron))
    print("Verplaatst naar " + os.path.relpath(doel, ROOT))


STATUS_LABEL = {"seo": "SEO", "pim": "PIM", "design": "Design", "inkoop": "Inkoop", "financien": "Financiën", "klant": "Klant", "directie": "Directie"}
MAX_STATUSREGELS = 10


def statusblok_invoegen(pad, blok):
    """Zet het blok bovenaan in team/status.md, direct na de inleiding (nieuwste bovenaan)."""
    with open(pad, encoding="utf-8") as f:
        tekst = f.read()
    m = re.search(r"^## ", tekst, re.M)
    plek = m.start() if m else len(tekst)
    voor = tekst[:plek].rstrip("\n") + "\n\n"
    with open(pad, "w", encoding="utf-8") as f:
        f.write(voor + blok + "\n" + tekst[plek:])


ARCHIEF_NA_DAGEN = 14
STATUSKOP = re.compile(r"^## (\w+), (\d{2})-(\d{2})-(\d{4})", re.M)


def archiveer_oude_blokken(root, vandaag=None):
    """Verplaatst statusblokken ouder dan ARCHIEF_NA_DAGEN naar team/status-archief.md.
    Het nieuwste blok van elk team blijft altijd staan. Geeft de gewijzigde paden terug."""
    vandaag = vandaag or datetime.date.today()
    pad = os.path.join(root, "team", "status.md")
    with open(pad, encoding="utf-8") as f:
        tekst = f.read()
    koppen = list(STATUSKOP.finditer(tekst))
    if not koppen:
        return []
    kop_tekst = tekst[:koppen[0].start()]
    blokken = [tekst[k.start():(koppen[i + 1].start() if i + 1 < len(koppen) else len(tekst))] for i, k in enumerate(koppen)]
    houden, weg, gezien = [], [], set()
    for k, blok in zip(koppen, blokken):
        team = k.group(1)
        try:
            datum = datetime.date(int(k.group(4)), int(k.group(3)), int(k.group(2)))
        except ValueError:
            datum = vandaag
        oud = (vandaag - datum).days > ARCHIEF_NA_DAGEN
        (weg if oud and team in gezien else houden).append(blok)
        gezien.add(team)
    if not weg:
        return []
    with open(pad, "w", encoding="utf-8") as f:
        f.write(kop_tekst + "".join(houden).rstrip("\n") + "\n")
    archief = os.path.join(root, "team", "status-archief.md")
    bestaand = ""
    if os.path.exists(archief):
        with open(archief, encoding="utf-8") as f:
            bestaand = f.read()
    kop = "# Archief statusblokken Tante Rie\n\nBlokken ouder dan %d dagen uit team/status.md, nieuwste bovenaan.\n\n" % ARCHIEF_NA_DAGEN
    oude_inhoud = bestaand.split("\n\n", 2)[2] if bestaand.startswith("# Archief") and bestaand.count("\n\n") >= 2 else bestaand
    with open(archief, "w", encoding="utf-8") as f:
        f.write(kop + "".join(b if b.endswith("\n") else b + "\n" for b in weg) + oude_inhoud)
    return [os.path.join("team", "status.md"), os.path.join("team", "status-archief.md")]


def cmd_status(a):
    tekst = sys.stdin.read() if a.tekst == "-" else a.tekst
    regels = [r.rstrip() for r in tekst.strip().splitlines() if r.strip()]
    if not regels:
        sys.exit("Een statusblok zonder regels heeft geen zin.")
    if len(regels) > MAX_STATUSREGELS:
        sys.exit("Een statusblok heeft maximaal %d regels (nu %d)." % (MAX_STATUSREGELS, len(regels)))
    regels = [r if r.startswith("- ") else "- " + r.lstrip("-* ") for r in regels]
    blok = "## %s, %s\n%s\n" % (STATUS_LABEL[a.team], a.kop.strip(), "\n".join(regels))
    rel = os.path.join("team", "status.md")
    if a.geen_git:
        statusblok_invoegen(os.path.join(ROOT, rel), blok)
        archiveer_oude_blokken(ROOT)
        print(blok)
        return
    # Bij een gelijktijdige push opnieuw beginnen vanaf origin/main, zodat er nooit een rebase-conflict blijft staan.
    for poging in range(3):
        if poging:
            ophalen()
        statusblok_invoegen(os.path.join(ROOT, rel), blok)
        paden = sorted({rel, *archiveer_oude_blokken(ROOT)})
        git("add", "--", *paden)
        git("commit", "-m", "status: %s, %s" % (STATUS_LABEL[a.team], a.kop.strip()), "--", *paden)
        if git("push", "origin", "HEAD:" + BRANCH, check=False).returncode == 0:
            print("Statusblok op main gezet:\n" + blok)
            return
    raise RuntimeError("push van het statusblok naar " + BRANCH + " mislukt; probeer later opnieuw")


def main():
    p = argparse.ArgumentParser(description="Mailbox tussen SEO-, PIM- en Design-team")
    p.add_argument("--geen-git", action="store_true", help="geen pull, commit of push")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("lijst")
    s.add_argument("team", choices=TEAMS)
    s.set_defaults(fn=cmd_lijst)

    s = sub.add_parser("lees")
    s.add_argument("bestand")
    s.set_defaults(fn=cmd_lees)

    s = sub.add_parser("stuur")
    s.add_argument("--van", required=True, choices=SENDERS)
    s.add_argument("--aan", required=True, choices=TEAMS)
    s.add_argument("--onderwerp", required=True)
    s.add_argument("--tekst", required=True, help="berichttekst, of - om van stdin te lezen")
    s.add_argument("--antwoord-op")
    s.add_argument("--prioriteit", default="normaal", choices=("hoog", "normaal", "laag"))
    s.add_argument("--voor", help="agent in het ontvangende team die het moet oppakken (optioneel)")
    s.add_argument("--door", help="jouw eigen agentnaam als afzender (teams en directie)")
    s.set_defaults(fn=cmd_stuur)

    s = sub.add_parser("status", help="statusblok bovenaan team/status.md op main zetten")
    s.add_argument("--team", required=True, choices=tuple(STATUS_LABEL))
    s.add_argument("--kop", required=True, help='datum en onderwerp, bv. "18-11-2026 (inbox)"')
    s.add_argument("--tekst", required=True, help="maximaal 10 regels, of - om van stdin te lezen")
    s.set_defaults(fn=cmd_status)

    s = sub.add_parser("verwerkt")
    s.add_argument("bestand")
    s.add_argument("--notitie")
    s.set_defaults(fn=cmd_verwerkt)

    a = p.parse_args()
    if not a.geen_git:
        ophalen()
    a.fn(a)


if __name__ == "__main__":
    main()
