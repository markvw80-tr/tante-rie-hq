#!/usr/bin/env python3
"""Doorverwijzing naar het e-boekhoudenscript van Financiën (zelfde opties, zie daar).

Eén bron: ~/tante-rie/tante-rie-financien/scripts/eboekhouden_winst.py (alleen lezen).
"""
import os
import sys

SCRIPT = os.path.join(os.path.expanduser("~"), "tante-rie", "tante-rie-financien", "scripts", "eboekhouden_winst.py")
os.execv(sys.executable, [sys.executable, SCRIPT, *sys.argv[1:]])
