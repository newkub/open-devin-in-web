import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage();
const errs: string[] = [];
p.on("pageerror", (e) => errs.push("PAGEERR " + e.message.slice(0, 300)));
p.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE " + m.text().slice(0, 400)); });
await p.goto("http://127.0.0.1:5173", { timeout: 60000 });
await p.waitForSelector(".node-list li", { timeout: 90000 });
for (const [tab, label] of [["rules", "global"], ["agents", ""], ["skills", ""]]) {
  await p.locator(".tabs button", { hasText: tab }).click();
  await p.waitForTimeout(300);
  const items = p.locator(".node-list li");
  const n = await items.count();
  for (let i = 0; i < Math.min(n, 3); i++) {
    await items.nth(i).click();
    await p.waitForTimeout(2500);
    const st = await p.locator(".preview-status").textContent().catch(() => "ok");
    const name = await items.nth(i).locator(".node-id").textContent();
    console.log(tab, name, "->", st, "mdLen:", (await p.locator(".content-body .md").innerHTML().catch(() => "")).length);
  }
}
console.log(errs.slice(0, 8).join("\n") || "no errors");
await b.close();
