import { describe, expect, it } from "vitest";
import { bookingQrPayload, verificationToken, verifyToken } from "./qr";

describe("QR signé", () => {
  it("accepte le bon jeton et refuse les autres", () => {
    const t = verificationToken("TA-ABC123");
    expect(verifyToken("TA-ABC123", t)).toBe(true);
    expect(verifyToken("TA-ABC124", t)).toBe(false);
    expect(verifyToken("TA-ABC123", "0000000000000000")).toBe(false);
    expect(verifyToken("TA-ABC123", "")).toBe(false);
  });
  it("encode une URL de vérification complète", () => {
    expect(bookingQrPayload({ reference: "TA-ABC123" } as never)).toMatch(/^https?:\/\/.+\/verifier\/TA-ABC123\?t=[0-9a-f]{16}$/);
  });
});
