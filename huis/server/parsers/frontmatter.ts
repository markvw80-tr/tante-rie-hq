export interface Frontmatter {
  readonly velden: Readonly<Record<string, string>>;
  readonly body: string;
}

/** Leest een eenvoudige `key: value`-kop tussen `---`-regels, zoals de agents en de mailbox die schrijven. */
export function parseFrontmatter(tekst: string): Frontmatter {
  const regels = tekst.replace(/\r\n/g, "\n").split("\n");
  if (regels[0] !== "---") return { velden: {}, body: tekst.trim() };
  const eind = regels.indexOf("---", 1);
  if (eind === -1) return { velden: {}, body: tekst.trim() };

  const velden = Object.fromEntries(
    regels
      .slice(1, eind)
      .filter((r) => r.includes(":"))
      .map((r) => {
        const i = r.indexOf(":");
        return [r.slice(0, i).trim(), r.slice(i + 1).trim()] as const;
      })
      .filter(([k]) => k.length > 0),
  );
  return { velden, body: regels.slice(eind + 1).join("\n").trim() };
}
