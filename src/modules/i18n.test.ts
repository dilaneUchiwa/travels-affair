import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DICTIONARY } from "@/i18n/dictionary";
import { makeT } from "@/i18n";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : [];
  });
}

describe("i18n", () => {
  it("chaque entrée est traduite dans les deux langues", () => {
    for (const [key, [fr, en]] of Object.entries(DICTIONARY)) {
      expect(fr.trim(), `${key} (fr)`).not.toBe("");
      expect(en.trim(), `${key} (en)`).not.toBe("");
    }
  });

  it("toutes les clés littérales t(\"…\") du code existent dans le dictionnaire", () => {
    const missing = new Set<string>();
    for (const file of walk("src").filter((f) => !f.includes(`${path.sep}dict${path.sep}`) && !f.endsWith(".test.ts"))) {
      for (const m of readFileSync(file, "utf8").matchAll(/\bt\(\s*"([a-zA-Z0-9_.-]+)"/g)) if (!DICTIONARY[m[1]]) missing.add(`${m[1]} (${file})`);
    }
    expect([...missing]).toEqual([]);
  });

  it("interpole les variables et replie sur la clé inconnue", () => {
    expect(makeT("en")("account.hello", { name: "Ada" })).toBe("Hello Ada");
    expect(makeT("fr")("clé.inconnue")).toBe("clé.inconnue");
  });

  it("les clés dynamiques usuelles existent (statuts, services, documents, modes)", () => {
    for (const k of ["status.CONFIRMED", "service.HOTEL", "doc.invoice", "val.BUS", "pay.method.PAYPAL", "flight.trip.ROUND_TRIP", "hotel.cat.LODGE", "unit.CAR", "multiplier.HOTEL", "mail.REMINDER.subject", "mail.REMINDER.intro"]) expect(DICTIONARY[k], k).toBeTruthy();
  });
});
