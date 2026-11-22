const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(20000);
  await page.goto("https://smartlifecm.com/admin", { waitUntil: "networkidle" });
  const pwd = page.locator('input[type="password"]').first();
  if (await pwd.isVisible()) { await pwd.fill("ADMIN237"); await page.keyboard.press("Enter"); await page.waitForTimeout(3000); }
  await page.locator("button").filter({ hasText: /annonce/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "C:\\Users\\Administrator\\Desktop\\annonces_migree.png", fullPage: false });
  console.log("OK");
  await browser.close();
})();
