const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(20000);

  await page.goto("https://smartlifecm.com/admin", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "C:\\Users\\Administrator\\Desktop\\admin_login.png", fullPage: false });
  console.log("Login screen done");

  // Login
  await page.fill('input[type="text"]', "admin");
  await page.fill('input[type="password"]', "ADMIN237");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "C:\\Users\\Administrator\\Desktop\\admin_panel.png", fullPage: false });
  console.log("Panel done");

  // Scroll pour voir le contenu
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: "C:\\Users\\Administrator\\Desktop\\admin_panel_mid.png", fullPage: false });
  console.log("Panel mid done");

  await browser.close();
  console.log("Terminé.");
})().catch(e => { console.error(e.message); process.exit(1); });
