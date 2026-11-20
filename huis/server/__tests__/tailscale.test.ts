import { describe, expect, test } from "vitest";
import { herkomst, magLezen, magSchrijven } from "../beveiliging.ts";
import { GEEN_EXTRA, geldigeToegang, schijfToegang } from "../toegang.ts";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { leesServe, leesStatus, TailscaleWacht, uitOmgeving, type TailscaleInfo } from "../tailscale.ts";

const TS: TailscaleInfo = { host: "mac-van-mark.tail1234.ts.net", login: "mark@example.com" };
const POORTEN = [4310, 5310];
const status = (over: Record<string, unknown> = {}) => ({
  BackendState: "Running",
  Self: { DNSName: "Mac-van-Mark.tail1234.ts.net.", UserID: 42 },
  User: { "42": { LoginName: "Mark@Example.com" } },
  ...over,
});
const serve = (proxy = "http://127.0.0.1:5310", sleutel = "mac-van-mark.tail1234.ts.net:443") => ({ TCP: { "443": { HTTPS: true } }, Web: { [sleutel]: { Handlers: { "/": { Proxy: proxy } } } } });

describe("tailscale herkennen", () => {
  test("haalt host en login uit tailscale status, in kleine letters en zonder punt aan het eind", () => {
    expect(leesStatus(status())).toEqual(TS);
  });

  test.each([
    ["niet ingelogd", status({ BackendState: "NeedsLogin" })],
    ["geen ts.net-naam", status({ Self: { DNSName: "evil.example.", UserID: 42 } })],
    ["onbekende gebruiker", status({ User: {} })],
    ["geen object", null],
  ])("geen toegang op afstand bij %s", (_n, json) => {
    expect(leesStatus(json)).toBeNull();
  });

  test("serve-adres alleen als het naar een huispoort op deze Mac doorstuurt", () => {
    expect(leesServe(serve(), TS.host, POORTEN)).toBe("https://mac-van-mark.tail1234.ts.net");
    expect(leesServe(serve("http://127.0.0.1:4310/", "mac-van-mark.tail1234.ts.net:8443"), TS.host, POORTEN)).toBe("https://mac-van-mark.tail1234.ts.net:8443");
    expect(leesServe(serve("http://127.0.0.1:3000"), TS.host, POORTEN)).toBeNull();
    expect(leesServe(serve(undefined, "ander.tail1234.ts.net:443"), TS.host, POORTEN)).toBeNull();
    expect(leesServe({}, TS.host, POORTEN)).toBeNull();
    expect(leesServe(null, TS.host, POORTEN)).toBeNull();
  });

  test("omgevingsvariabelen alleen samen en met een ts.net-naam", () => {
    expect(uitOmgeving({ HUIS_TAILSCALE_HOST: "Mac-van-Mark.tail1234.ts.net", HUIS_TAILSCALE_LOGIN: "Mark@example.com" })).toEqual(TS);
    expect(uitOmgeving({ HUIS_TAILSCALE_HOST: TS.host })).toBeNull();
    expect(uitOmgeving({ HUIS_TAILSCALE_HOST: "evil.example", HUIS_TAILSCALE_LOGIN: "x" })).toBeNull();
  });

  test("de wacht ververst status en serve, en valt terug op alleen deze Mac als Tailscale weg is", async () => {
    let aan = true;
    const wacht = new TailscaleWacht(POORTEN, null, async (args) => {
      if (!aan) throw new Error("tailscale: command not found");
      return args[0] === "serve" ? serve() : status();
    });
    await wacht.ververs();
    expect(wacht.huidig()).toEqual(TS);
    expect(wacht.opAfstand()).toBe("https://mac-van-mark.tail1234.ts.net");
    aan = false;
    await wacht.ververs();
    expect(wacht.huidig()).toBeNull();
    expect(wacht.opAfstand()).toBeNull();
  });

  test("vaste instelling uit de omgeving blijft staan, ook als de cli faalt", async () => {
    const wacht = new TailscaleWacht(POORTEN, TS, async (args) => {
      if (args[0] === "status") throw new Error("mag niet aangeroepen worden");
      return serve();
    });
    wacht.start(60_000);
    await wacht.ververs();
    wacht.stop();
    expect(wacht.huidig()).toEqual(TS);
    expect(wacht.opAfstand()).toBe("https://mac-van-mark.tail1234.ts.net");
  });
});

describe("toegang via Tailscale", () => {
  const viaTs = { host: TS.host, origin: `https://${TS.host}`, "tailscale-user-login": "mark@example.com", "x-huis": "mark", "content-type": "application/json" };

  test("Mark via zijn eigen Tailscale-adres mag lezen en schrijven", () => {
    expect(magLezen({ host: TS.host, "tailscale-user-login": "Mark@Example.com" }, POORTEN, TS)).toBeNull();
    expect(magSchrijven(viaTs, POORTEN, TS)).toBeNull();
  });

  test("ook als serve de Host naar localhost herschrijft, telt de Tailscale-identiteit", () => {
    expect(magSchrijven({ ...viaTs, host: "127.0.0.1:5310" }, POORTEN, TS)).toBeNull();
    expect(magSchrijven({ ...viaTs, host: "127.0.0.1:5310", "tailscale-user-login": "iemand@anders.nl" }, POORTEN, TS)).toMatch(/geen toegang tot het huis/);
  });

  test.each([
    ["ander account", { ...viaTs, "tailscale-user-login": "iemand@anders.nl" }],
    ["geen identiteit (gelabeld apparaat)", { ...viaTs, "tailscale-user-login": undefined }],
    ["ander tailnet-adres", { ...viaTs, host: "ander.tail1234.ts.net", origin: "https://ander.tail1234.ts.net" }],
    ["http in plaats van https", { ...viaTs, origin: `http://${TS.host}` }],
  ])("weigert %s", (_n, headers) => {
    expect(magSchrijven(headers, POORTEN, TS)).not.toBeNull();
    expect(magLezen(headers, POORTEN, TS)).not.toBeNull();
  });

  test("zonder actieve Tailscale op de Mac: het ts.net-adres en een losse identiteitsheader worden geweigerd", () => {
    expect(magLezen({ host: TS.host, "tailscale-user-login": "mark@example.com" }, POORTEN, null)).toBe("Onbekende host");
    expect(magLezen({ host: "127.0.0.1:5310", "tailscale-user-login": "mark@example.com" }, POORTEN, null)).toMatch(/niet actief/);
  });

  test("op de Mac zelf verandert niets", () => {
    expect(magLezen({ host: "127.0.0.1:5310" }, POORTEN, TS)).toBeNull();
    expect(magSchrijven({ host: "localhost:4310", origin: "http://localhost:5310", "x-huis": "mark", "content-type": "application/json" }, POORTEN, TS)).toBeNull();
    expect(magLezen({ host: "kwaadwillend.example" }, POORTEN, TS)).toBe("Onbekende host");
  });
});

describe("Nikkie via Tailscale", () => {
  const NIKKIE = { nikkie: "nikkie@example.com" };
  const viaTs = { host: TS.host, origin: `https://${TS.host}`, "x-huis": "mark", "content-type": "application/json" };

  test("het huis herkent Mark en Nikkie aan hun Tailscale-account; de Mac zelf is Mark", () => {
    expect(herkomst({ ...viaTs, "tailscale-user-login": "Nikkie@Example.com" }, POORTEN, TS, NIKKIE)).toEqual({ fout: null, persoon: "nikkie" });
    expect(herkomst({ ...viaTs, "tailscale-user-login": "mark@example.com" }, POORTEN, TS, NIKKIE)).toEqual({ fout: null, persoon: "mark" });
    expect(herkomst({ host: "127.0.0.1:5310" }, POORTEN, TS, NIKKIE)).toEqual({ fout: null, persoon: "mark" });
    expect(magSchrijven({ ...viaTs, "tailscale-user-login": "nikkie@example.com" }, POORTEN, TS, NIKKIE)).toBeNull();
  });

  test("zonder toegangsbestand komt Nikkie er niet in, net als een onbekend account", () => {
    expect(magLezen({ ...viaTs, "tailscale-user-login": "nikkie@example.com" }, POORTEN, TS, GEEN_EXTRA)).toMatch(/geen toegang/);
    expect(magLezen({ ...viaTs, "tailscale-user-login": "iemand@anders.nl" }, POORTEN, TS, NIKKIE)).toMatch(/geen toegang/);
  });

  test("toegangsbestand: geldig, ontbrekend of kapot", () => {
    const map = mkdtempSync(path.join(os.tmpdir(), "toegang-"));
    try {
      const bestand = path.join(map, "toegang.json");
      const lees = schijfToegang(bestand);
      expect(lees()).toEqual(GEEN_EXTRA);
      writeFileSync(bestand, JSON.stringify({ nikkie: " Nikkie@Example.com " }));
      expect(lees()).toEqual({ nikkie: "nikkie@example.com" });
      writeFileSync(bestand, "{kapot");
      const fout = console.error;
      console.error = () => undefined;
      expect(lees()).toEqual(GEEN_EXTRA);
      console.error = fout;
    } finally {
      rmSync(map, { recursive: true, force: true });
    }
    expect(geldigeToegang({ nikkie: "geen mail" })).toEqual(GEEN_EXTRA);
    expect(geldigeToegang([])).toEqual(GEEN_EXTRA);
  });
});
