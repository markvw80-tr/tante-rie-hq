import net from "node:net";
import { API_PORT, HOST, WEB_PORT } from "./config.ts";

/** Probeert kort te luisteren; lukt dat niet omdat de poort bezet is, dan draait er al iets. */
function isBezet(poort: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const proef = net.createServer();
    proef.once("error", (e: NodeJS.ErrnoException) => (e.code === "EADDRINUSE" ? resolve(true) : reject(e)));
    proef.once("listening", () => proef.close(() => resolve(false)));
    proef.listen(poort, HOST);
  });
}

/**
 * Draait vóór `npm run dev`. Zo start het huis nooit half: als de server of de webpagina al draait,
 * stopt alles meteen met een duidelijke melding in plaats van een tweede, kapot exemplaar.
 */
// In productie kunnen API en web op dezelfde poort draaien (HUIS_PORT=5310): die poort maar één keer proberen.
const bezet = (await Promise.all([...new Set([API_PORT, WEB_PORT])].map(async (p) => ((await isBezet(p)) ? p : null)))).filter((p) => p !== null);

if (bezet.length > 0) {
  const wat = bezet.length > 1 ? `Poorten ${bezet.join(" en ")} zijn` : `Poort ${bezet[0]} is`;
  console.error(`[huis] ${wat} al bezet: het huis draait waarschijnlijk al in een ander venster.`);
  console.error(`[huis] Open http://${HOST}:${WEB_PORT}, of stop het andere exemplaar met Ctrl+C en start opnieuw.`);
  console.error(`[huis] Zoeken wat de poort bezet houdt: lsof -nP -iTCP:${bezet[0]} -sTCP:LISTEN`);
  process.exit(1);
}
