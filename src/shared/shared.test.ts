import { describe, expect, it } from "vitest";
import { convertRounded } from "./money";
import { parseLayovers, layoverSummary } from "./layovers";

describe("conversion d'affichage", () => {
  it("laisse le XAF → XAF inchangé", () => expect(convertRounded(12345, "XAF", "XAF")).toBe(12345));
  it("arrondit le XAF au multiple de 5 et l'EUR à l'unité", () => {
    expect(convertRounded(100, "EUR", "XAF") % 5).toBe(0);
    expect(Number.isInteger(convertRounded(395000, "XAF", "EUR"))).toBe(true);
  });
  it("EUR → XAF → EUR reste proche", () => expect(Math.abs(convertRounded(convertRounded(640, "EUR", "XAF"), "XAF", "EUR") - 640)).toBeLessThanOrEqual(1));
});

describe("escales", () => {
  it("lit « Ville (CODE) | durée » ligne par ligne", () => {
    expect(parseLayovers("Istanbul (IST) | 2 h 05\n\nVienne (VIE) | 1 h 30")).toEqual([
      { place: "Istanbul (IST)", duration: "2 h 05" }, { place: "Vienne (VIE)", duration: "1 h 30" },
    ]);
  });
  it("accepte une escale sans durée et un texte vide", () => {
    expect(parseLayovers("Casablanca (CMN)")).toEqual([{ place: "Casablanca (CMN)", duration: "" }]);
    expect(parseLayovers("  ")).toEqual([]);
    expect(layoverSummary("A | 1 h\nB")).toBe("A · 1 h, B");
  });
});
