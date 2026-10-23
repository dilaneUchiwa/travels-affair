export type Layover = { place: string; duration: string };

/** « Istanbul (IST) | 2 h 10 » → { place: "Istanbul (IST)", duration: "2 h 10" } (une escale par ligne). */
export function parseLayovers(text: string): Layover[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [place, ...rest] = l.split("|");
      return { place: place.trim(), duration: rest.join("|").trim() };
    });
}

export const layoverSummary = (text: string) => parseLayovers(text).map((l) => (l.duration ? `${l.place} · ${l.duration}` : l.place)).join(", ");
