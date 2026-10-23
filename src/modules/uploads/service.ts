import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { invalid } from "@/shared/errors";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./data/uploads");
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTOS = 8;
const NAME_RE = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;

/** Type réel de l'image d'après ses premiers octets (on ne fait pas confiance au nom ni au type MIME déclarés). */
function sniff(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}

/** Enregistre des images (JPEG, PNG, WebP ≤ 5 Mo) et renvoie leurs URL publiques. */
export async function saveImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  await mkdir(UPLOAD_DIR, { recursive: true });
  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (file.size > MAX_IMAGE_BYTES) throw invalid("Image trop lourde (5 Mo maximum).");
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = sniff(buf);
    if (!ext) throw invalid("Format d'image non pris en charge (JPEG, PNG ou WebP).");
    const name = `${crypto.randomUUID()}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, name), buf);
    urls.push(`/api/uploads/${name}`);
  }
  return urls;
}

export async function readImage(name: string): Promise<{ data: Buffer; type: string } | null> {
  if (!NAME_RE.test(name)) return null; // aucune traversée de répertoire possible
  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    const ext = name.split(".").pop()!;
    return { data, type: ext === "jpg" ? "image/jpeg" : `image/${ext}` };
  } catch {
    return null;
  }
}

export const parsePhotos = (json: string): string[] => {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};
