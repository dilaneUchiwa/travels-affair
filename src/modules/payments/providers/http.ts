/** fetch avec délai maximal et erreurs lisibles (les prestataires externes tombent en panne). */
export async function http(url: string, init: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 15_000, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, { ...rest, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  } catch {
    throw new Error("Le service de paiement ne répond pas. Réessayez dans un instant.");
  }
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body: body as Record<string, any> | null };
}
