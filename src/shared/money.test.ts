import { describe, expect, it } from "vitest";
import { convert, formatMoney } from "./money";

describe("money", () => {
  it("convertit EUR -> XAF avec la parité fixe", () => {
    expect(convert(100, "EUR", "XAF")).toBe(65596);
  });
  it("est neutre pour une même devise", () => {
    expect(convert(1234, "XAF", "XAF")).toBe(1234);
  });
  it("aller-retour EUR -> XAF -> EUR reste proche", () => {
    expect(convert(convert(500, "EUR", "XAF"), "XAF", "EUR")).toBeCloseTo(500, 1);
  });
  it("formate XAF sans décimales", () => {
    expect(formatMoney(805000, "XAF").replace(/\s/g, " ")).toContain("FCFA");
  });
});
