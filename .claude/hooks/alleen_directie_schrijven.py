#!/usr/bin/env python3
"""PreToolUse-hook HQ: Write en Edit alleen in team/directie/.

De directie-agent mag niets in de teams of in de gedeelde afspraken wijzigen. Gebruikt Mark
zelf Claude in tante-rie-hq voor onderhoud van hq, dan kan hij de vraag bevestigen.
"""
import json
import os
import sys
from pathlib import Path

data = json.load(sys.stdin)
pad = data.get("tool_input", {}).get("file_path", "")
if not pad:
    sys.exit(0)
root = Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())).resolve()
try:
    rel = Path(pad).resolve().relative_to(root).as_posix()
except ValueError:
    rel = pad
if not rel.startswith("team/directie/"):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "ask",
        "permissionDecisionReason": f"{rel} ligt buiten team/directie/. De directie schrijft alleen daar; "
                                    "bevestig als dit bewust onderhoud van hq is."}}))
