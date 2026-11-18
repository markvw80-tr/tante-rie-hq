import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Starter } from "./beheer.ts";
import { gitVuilIn, POORT_HOOK_TIMEOUT_S, poortHook } from "./poortHook.ts";

const VOETTEKST = [
  "",
  "---",
  "Deze opdracht komt van Mark via het Huis van Tante Rie. Mark kijkt mee in het Huis, niet in een terminal.",
  "Acties die zijn toestemming nodig hebben, vraag je gewoon aan via je tools; het Huis legt ze aan Mark voor.",
  "Mark is er vaak niet bij. Elke shellvraag laat je run wachten, dus: lees en zoek met Read, Grep en Glob, niet met cat, grep, ls of head in de shell.",
  "Je werkt al in de teammap: draai scripts los als `python3 scripts/...`, zonder `cd` ervoor en zonder ze met && of ; aan andere commando's te koppelen.",
  "Sluit af volgens je werkafspraken: rond je een batch af, zet dan je statusblok op main met `python3 scripts/mailbox.py status --team <team> --kop \"DD-MM-JJJJ (onderwerp)\" --tekst -`.",
].join("\n");

/**
 * Echte starter: Claude Code als bibliotheek, in de map van het team, met de instellingen en hooks van dat team.
 * Alleen project- en lokale instellingen: Marks persoonlijke ~/.claude (eigen regels, plugins, hooks) hoort
 * niet bij een teamrun. De poorthook draait vóór elke tool-aanroep, ook vóór wat het team al toestaat.
 */
export const sdkStarter: Starter = {
  start({ repo, agent, opdracht, budgetUsd, toestemming, signal }) {
    const abortController = new AbortController();
    signal.addEventListener("abort", () => abortController.abort(), { once: true });
    // Agents krijgen de afzendervlag van Mark nooit mee: zo kunnen ze niet namens hem berichten sturen.
    const env = {
      ...Object.fromEntries(
        Object.entries(process.env).filter((e): e is [string, string] => e[0] !== "TANTE_RIE_HUIS" && typeof e[1] === "string"),
      ),
      // Stond in Marks gebruikersinstellingen; blijft zo nu die niet meer geladen worden.
      CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1",
    };
    return query({
      prompt: opdracht + VOETTEKST,
      options: {
        cwd: repo,
        agent,
        settingSources: ["project", "local"],
        permissionMode: "default",
        permissionPrompts: "host",
        maxBudgetUsd: budgetUsd,
        abortController,
        env,
        hooks: {
          PreToolUse: [{ hooks: [poortHook(repo, toestemming, gitVuilIn(repo))], timeout: POORT_HOOK_TIMEOUT_S }],
        },
        canUseTool: async (toolName, input, opties) => {
          const besluit = await toestemming(toolName, input, { signal: opties.signal, hookReden: opties.decisionReason });
          return besluit.toestaan ? { behavior: "allow", updatedInput: input } : { behavior: "deny", message: besluit.bericht };
        },
      },
    });
  },
};
