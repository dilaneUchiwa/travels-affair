#!/usr/bin/env node
/**
 * Télécharge de vraies photos (villes, hôtels, transports, voitures, activités) depuis Wikimedia Commons
 * (images sous licence libre) dans public/img/p/<slug>.jpg, puis écrit public/img/p/CREDITS.md
 * (auteur + licence de chaque image, à conserver si vous publiez le site).
 *
 *   npm run photos      puis      rm dev.db && npm run setup      (le seed utilise les .jpg s'ils existent)
 *
 * Nécessite un accès Internet. Les images déjà présentes ne sont pas retéléchargées (--force pour forcer).
 * Pour les hôtels de l'agence, remplacez ensuite par vos propres photos via l'admin (Hôtels > Modifier).
 */
import { writeFile, mkdir, access } from "node:fs/promises";

const OUT = "public/img/p";
const FORCE = process.argv.includes("--force");
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "TravelsAffairDemo/1.0 (contact: admin@travels-affair.com)";

// slug -> termes de recherche (du plus précis au plus général)
const Q = {
  "city-douala": ["Douala skyline", "Douala Cameroun"], "city-yaounde": ["Yaoundé Cameroun", "Yaoundé skyline"],
  "city-kribi": ["Kribi plage", "Kribi Cameroun"], "city-paris": ["Paris Tour Eiffel", "Paris skyline"],
  "city-bruxelles": ["Bruxelles Grand-Place", "Brussels Grand Place"], "city-istanbul": ["Istanbul Bosphorus", "Istanbul Sainte-Sophie"],
  "city-casablanca": ["Casablanca Hassan II mosque", "Casablanca skyline"], "city-addis": ["Addis Ababa skyline", "Addis Ababa Ethiopia"],
  "hotel-akwa": ["Hôtel Douala", "hotel lobby luxury"], "hotel-palmiers": ["résidence hôtelière Yaoundé", "apartment hotel palm trees"],
  "hotel-rive-gauche": ["Hôtel Quartier latin Paris", "small hotel Paris facade"],
  "transport-bus": ["autocar Cameroun", "intercity coach bus"], "transport-train": ["Camrail train", "express train Cameroon"],
  "transport-shuttle": ["airport shuttle minibus", "minibus taxi airport"],
  "car-yaris": ["Toyota Yaris", "compact car Toyota"], "car-landcruiser": ["Toyota Land Cruiser", "Land Cruiser 4x4"], "car-minibus": ["Toyota Hiace minibus", "minibus van"],
  "activity-lobe": ["Chutes de la Lobé", "Lobé waterfalls Kribi"], "activity-paris-velo": ["Paris vélo touristes", "bicycle tour Paris"],
};

const strip = (h = "") => h.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
async function api(params) {
  const r = await fetch(`${API}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function find(term) {
  const j = await api({ action: "query", generator: "search", gsrsearch: `${term} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "12", prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1280" });
  const pages = Object.values(j.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  for (const p of pages) {
    const i = p.imageinfo?.[0]; if (!i || i.mime !== "image/jpeg" || i.width < 1200 || i.width / i.height < 1.2 || i.width / i.height > 2.2) continue;
    const m = i.extmetadata ?? {}; const lic = strip(m.LicenseShortName?.value);
    if (!/^(CC0|CC BY|CC BY-SA|Public domain|PD)/i.test(lic)) continue;
    return { url: i.thumburl || i.url, title: p.title, author: strip(m.Artist?.value) || "inconnu", license: lic, page: i.descriptionurl };
  }
  return null;
}

await mkdir(OUT, { recursive: true });
const credits = ["# Crédits photos", "", "Images issues de Wikimedia Commons — respectez les licences ci-dessous (attribution requise pour CC BY / CC BY-SA).", ""];
let ok = 0, ko = 0;
for (const [slug, terms] of Object.entries(Q)) {
  const file = `${OUT}/${slug}.jpg`;
  if (!FORCE && await access(file).then(() => true, () => false)) { console.log("=", slug, "(déjà présent)"); continue; }
  let done = false;
  for (const term of terms) {
    try {
      const f = await find(term); if (!f) continue;
      const r = await fetch(f.url, { headers: { "User-Agent": UA } }); if (!r.ok) continue;
      await writeFile(file, Buffer.from(await r.arrayBuffer()));
      credits.push(`- **${slug}** — ${f.title.replace("File:", "")} — ${f.author} — ${f.license} — ${f.page}`);
      console.log("✓", slug, "←", f.title); done = true; ok++; break;
    } catch (e) { console.log("  ", slug, term, e.message); }
  }
  if (!done) { console.log("✗", slug, "(illustration par défaut conservée)"); ko++; }
  await new Promise((r) => setTimeout(r, 400));
}
if (ok) await writeFile(`${OUT}/CREDITS.md`, credits.join("\n") + "\n");
console.log(`\n${ok} photo(s) téléchargée(s), ${ko} échec(s). Relancez : rm dev.db && npm run setup`);
