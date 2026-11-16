import { readdir, readFile } from "node:fs/promises";
import type { Dirent } from "node:fs";

/** Alleen-lezen toegang tot bestanden. Het huis schrijft in fase 1 nergens naartoe. */
export interface Bron {
  lees(pad: string): Promise<string | null>;
  bestanden(map: string, extensie: string): Promise<string[]>;
  mappen(map: string): Promise<string[]>;
}

const bestaatNiet = (e: unknown) => (e as NodeJS.ErrnoException).code === "ENOENT";

async function inhoud(map: string): Promise<Dirent[]> {
  try {
    return await readdir(map, { withFileTypes: true });
  } catch (e) {
    if (bestaatNiet(e)) return [];
    throw e;
  }
}

export const schijfBron: Bron = {
  async lees(pad) {
    try {
      return await readFile(pad, "utf8");
    } catch (e) {
      if (bestaatNiet(e)) return null;
      throw e;
    }
  },
  async bestanden(map, extensie) {
    return (await inhoud(map))
      .filter((d) => d.isFile() && d.name.endsWith(extensie) && !d.name.startsWith("."))
      .map((d) => d.name)
      .sort();
  },
  async mappen(map) {
    return (await inhoud(map))
      .filter((d) => d.isDirectory() && !d.name.startsWith("."))
      .map((d) => d.name)
      .sort();
  },
};
