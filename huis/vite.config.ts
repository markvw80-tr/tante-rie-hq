/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_PORT = Number(process.env.HUIS_PORT ?? 4310);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5310,
    proxy: { "/api": `http://127.0.0.1:${API_PORT}` },
  },
  test: {
    include: ["server/**/*.test.ts"],
    coverage: { include: ["server/parsers/**", "server/huis.ts", "server/werk.ts", "server/routes.ts", "server/besluiten.ts", "server/verzoek.ts", "server/beveiliging.ts", "server/postbode.ts", "server/regie/beheer.ts", "server/regie/poort.ts", "server/regie/vertaal.ts"] },
  },
});
