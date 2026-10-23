import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const ok = (c, m) => { console.log((c ? "OK   " : "FAIL ") + m); if (!c) process.exitCode = 1; };
const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: ["--no-sandbox"] });
const ctx = await br.newContext(); const p = await ctx.newPage();
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
// register
const email = `t${Date.now()}@ex.com`;
await p.goto(B + "/inscription");
await p.fill("[name=name]", "Test User"); await p.fill("[name=email]", email); await p.fill("[name=password]", "Passw0rd!x");
const ph = p.locator("[name=phone]"); if (await ph.count()) await ph.fill("670000000");
await p.click("form button[type=submit]"); await p.waitForURL(/mon-compte/, { timeout: 15000 });
ok(true, "inscription");
// hotel booking
await p.goto(B + "/hotels"); const hurl = B + await p.getAttribute("a[href^='/hotels/']", "href");
await p.goto(`${hurl}?in=${day(30)}&out=${day(32)}&units=1`);
const book = p.locator("form:has([name=serviceType]) button[type=submit]").first();
ok(await book.count() > 0, "formulaire réservation hôtel");
await p.fill("[name=participants]", "Jean Test").catch(()=>{});
await book.click(); await p.waitForTimeout(3000); console.log(await p.$$eval(".error,[role=alert],.form-error",e=>e.map(x=>x.textContent)), await p.$$eval("form:has([name=serviceType])",f=>f.map(x=>x.textContent))); await p.waitForURL(/paiement/, { timeout: 15000 }); ok(true, "hôtel → paiement");
const id = p.url().match(/reservation\/([^/]+)\/paiement/)[1];
await p.locator(".pay-tile:has(input[value=CARD])").click();
await p.fill("[name=cardNumber]", "4242 4242 4242 4242").catch(()=>{});
const exp = p.locator("[name=expiry]"); if (await exp.count()) await exp.fill("12/30");
const cvc = p.locator("[name=cvc]"); if (await cvc.count()) await cvc.fill("123");
const holder = p.locator("[name=holder]"); if (await holder.count()) await holder.fill("Jean Test");
await p.click("form:has([name=bookingId]) button[type=submit]"); await p.waitForURL(/paye=1/, { timeout: 20000 }); ok(true, "paiement carte");
const r = await ctx.request.get(`${B}/api/documents/${id}/invoice`);
ok(r.headers()["content-type"]?.includes("pdf") && (await r.body()).length > 1000, "PDF facture");
// overlap
await p.goto(`${hurl}?in=${day(30)}&out=${day(32)}&units=1`);
// english
await p.goto(B + "/api/lang?l=en&next=/faq"); ok((await p.content()).includes("Frequently") || (await p.content()).includes("FAQ"), "switch EN");
// forgot password
await p.goto(B + "/mot-de-passe-oublie"); await p.fill("[name=email]", email); await p.click("form:has([name=email]) button[type=submit]");
await p.waitForTimeout(1500); ok(true, "mot de passe oublié soumis");
// contact
await p.goto(B + "/contact"); await p.fill("[name=name]", "Alice"); await p.fill("[name=email]", "a@b.com"); await p.fill("[name=subject]", "Hello"); await p.fill("[name=message]", "Bonjour message de test");
await p.click("form:has([name=subject]) button[type=submit]"); await p.waitForTimeout(1500); ok(true, "contact");
// admin
const a = await br.newContext(); const ap = await a.newPage();
await ap.goto(B + "/connexion"); await ap.fill("[name=email]", "admin@travels-affair.com"); await ap.fill("[name=password]", "Admin123!");
await ap.click("form button[type=submit]"); await ap.waitForURL(/admin/, { timeout: 15000 });
for (const e of ["", "vols", "hotels", "biens", "transports", "vehicules", "activites", "pages", "faq", "messages", "reservations"]) {
  const x = await ap.goto(`${B}/admin${e ? "/" + e : ""}`); ok(x.status() === 200, "admin /" + e);
}
const txt = await ap.textContent("body"); await ap.goto(B + "/admin/messages"); ok((await ap.textContent("body")).includes("Hello"), "message contact visible admin");
await br.close();
