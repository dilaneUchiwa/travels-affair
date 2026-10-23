#!/usr/bin/env node
/** Crawl ponctuel de travels-affair.com (Playwright) : récupère le texte de chaque page et télécharge toutes les images en pleine résolution dans /tmp/ta-crawl. Script jetable. */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";

const BASE = "http://travels-affair.com/";
const PAGES = ["index.html", "crbst_1.html", "crbst_3.html", "crbst_4.html"];
const OUT = "/tmp/ta-crawl";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 TravelsAffairCrawl" });
const page = await ctx.newPage();
const imgs = new Set();

for (const p of PAGES) {
  await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 60000 });
  const text = await page.evaluate(() => document.body.innerText);
  const srcs = await page.evaluate(() =>
    Array.from(document.images).map((i) => i.currentSrc || i.src).filter(Boolean)
  );
  srcs.forEach((s) => imgs.add(s));
  await writeFile(`${OUT}/${p}.txt`, `URL: ${BASE + p}\n\n${text}\n`);
  console.log(`\n===== ${p} (${srcs.length} images) =====`);
}

console.log(`\n--- ${imgs.size} images uniques ---`);
let n = 0;
for (const url of imgs) {
  try {
    const resp = await ctx.request.get(url);
    if (!resp.ok()) { console.log("skip", resp.status(), url); continue; }
    const buf = await resp.body();
    const name = decodeURIComponent(url.split("/").pop().split("?")[0]) || `img${n}`;
    await writeFile(`${OUT}/${name}`, buf);
    console.log(`${(buf.length / 1024).toFixed(0)}k  ${name}  <- ${url}`);
    n++;
  } catch (e) { console.log("err", url, e.message); }
}
await browser.close();
console.log(`\n${n} images téléchargées dans ${OUT}`);
