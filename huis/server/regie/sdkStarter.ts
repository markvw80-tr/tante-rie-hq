import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Starter } from "./beheer.ts";

const VOETTEKST = [
  "",
  "---",
  "Deze opdracht komt van Mark via het Huis van Tante Rie. Mark kijkt mee in het Huis, niet in een terminal.",
  "Acties die zijn toestemming nodig hebben, vraag je gewoon aan via je tools; het Huis legt ze aan Mark voor.",
  "Sluit af volgens je werkafspraken (statusblok in team/status.md als je een batch afrondt).",
].join("\n");

/** Echte starter: Claude Code als bibliotheek, in de map van het team, met de instellingen en hooks van dat team. */
export const sdkStarter: Starter = {
  start({ repo, agent, opdracht, budgetUsd, toestemming, signal }) {
    const abortController = new AbortController();
    signal.addEventListener("abort", () => abortController.abort(), { once: true });
    // Agents krijgen de afzendervlag van Mark nooit mee: zo kunnen ze niet namens hem berichten sturen.
    const env = Object.fromEntries(
      Object.entries(process.env).filter((e): e is [string, string] => e[0] !== "TANTE_RIE_HUIS" && typeof e[1] === "string"),
    );
    return query({
      prompt: opdracht + VOETTEKST,
      options: {
        cwd: repo,
        agent,
        settingSources: ["user", "project", "local"],
        permissionMode: "default",
        permissionPrompts: "host",
        maxBudgetUsd: budgetUsd,
        abortController,
        env,
        canUseTool: async (toolName, input, opties) => {
          const besluit = await toestemming(toolName, input, { signal: opties.signal, hookReden: opties.decisionReason });
          return besluit.toestaan ? { behavior: "allow", updatedInput: input } : { behavior: "deny", message: besluit.bericht };
        },
      },
    });
  },
};
