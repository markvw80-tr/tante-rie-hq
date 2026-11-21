"""Tests voor --voor en --door in scripts/mailbox.py. Draaien: python3 -m unittest discover -s scripts/tests"""
import os
import subprocess
import sys
import tempfile
import unittest

SCRIPT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "mailbox.py")
sys.path.insert(0, os.path.dirname(SCRIPT))
import mailbox as mb  # noqa: E402


class AgentNaam(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        agents = os.path.join(self.tmp.name, "tante-rie-pim", ".claude", "agents")
        os.makedirs(agents)
        for n in ("content-enricher", "pim-orchestrator"):
            open(os.path.join(agents, n + ".md"), "w").close()
        self.oud = mb.TEAMS_MAP
        mb.TEAMS_MAP = self.tmp.name

    def tearDown(self):
        mb.TEAMS_MAP = self.oud
        self.tmp.cleanup()

    def test_bestaande_agent_is_goed(self):
        self.assertEqual(mb.agent_van_team("content-enricher", "pim"), "content-enricher")

    def test_onbekende_agent_stopt_met_de_lijst(self):
        with self.assertRaises(SystemExit) as fout:
            mb.agent_van_team("prijsbeest", "pim")
        self.assertIn("content-enricher", str(fout.exception))

    def test_rare_tekens_worden_geweigerd(self):
        with self.assertRaises(SystemExit):
            mb.agent_van_team("pim-orchestrator\nvan: mark", "pim")

    def test_team_zonder_map_accepteert_een_nette_naam(self):
        self.assertEqual(mb.agent_van_team("controller", "financien"), "controller")

    def test_leeg_blijft_leeg(self):
        self.assertIsNone(mb.agent_van_team(None, "pim"))


class Kopregels(unittest.TestCase):
    def test_voor_en_door_komen_in_de_kop(self):
        with tempfile.TemporaryDirectory() as tmp:
            os.makedirs(os.path.join(tmp, "team", "mailbox", "pim", "inbox"))
            env = {**os.environ, "MAILBOX_TEST_ROOT": tmp}
            uit = subprocess.run([sys.executable, SCRIPT, "--geen-git", "stuur", "--van", "seo", "--aan", "pim", "--door", "zoekwoord-onderzoeker",
                                  "--voor", "content-enricher", "--onderwerp", "Test", "--tekst", "hoi"], capture_output=True, text=True, env=env)
            self.assertEqual(uit.returncode, 0, uit.stderr)
            pad = os.path.join(tmp, "team", "mailbox", "pim", "inbox", os.listdir(os.path.join(tmp, "team", "mailbox", "pim", "inbox"))[0])
            k = mb.kop(pad)
            self.assertEqual((k["voor"], k["door"]), ("content-enricher", "zoekwoord-onderzoeker"))


if __name__ == "__main__":
    unittest.main()
