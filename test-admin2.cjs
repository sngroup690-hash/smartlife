const { chromium } = require("playwright");

const ADMIN_URL = "https://smartlifecm.com/admin";
const PASSWORD = "ADMIN237";
const SHOTS = "C:\\Users\\Administrator\\Desktop\\";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);

  // Login
  await page.goto(ADMIN_URL, { waitUntil: "networkidle" });
  const pwd = page.locator('input[type="password"]').first();
  if (await pwd.isVisible()) {
    await pwd.fill(PASSWORD);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(3000);
  }

  // Ebooks tab → Ajouter
  await page.locator("button").filter({ hasText: /ebook/i }).first().click();
  await page.waitForTimeout(1000);
  await page.locator("button").filter({ hasText: /ajouter/i }).first().click();
  await page.waitForTimeout(2000);

  // Capture pleine page du formulaire ebook
  await page.screenshot({ path: `${SHOTS}form_ebook_full.png`, fullPage: true });
  console.log("✓ form_ebook_full.png");

  // Annonces tab
  await page.locator("button").filter({ hasText: /annonce/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}annonces_full.png`, fullPage: true });
  console.log("✓ annonces_full.png");

  // Formations tab → Ajouter
  await page.locator("button").filter({ hasText: /^formations?/i }).first().click();
  await page.waitForTimeout(1000);
  const addFormation = page.locator("button").filter({ hasText: /ajouter/i }).first();
  if (await addFormation.isVisible()) {
    await addFormation.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SHOTS}form_formation_full.png`, fullPage: true });
    console.log("✓ form_formation_full.png");
  }

  await browser.close();
})();
