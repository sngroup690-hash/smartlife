const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(30000);

  // Homepage
  await page.goto("https://smartlifecm.com", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "C:\\Users\\Administrator\\Desktop\\theme_home.png", fullPage: false });
  console.log("✓ Homepage");

  // Section plus bas
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(500);
  await page.screenshot({ path: "C:\\Users\\Administrator\\Desktop\\theme_home_mid.png" });
  console.log("✓ Homepage middle");

  // Ebook detail
  await page.goto("https://smartlifecm.com/ebooks/gerer-son-temps", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "C:\\Users\\Administrator\\Desktop\\theme_ebook.png", fullPage: false });
  console.log("✓ Ebook detail");

  // Formation detail
  await page.goto("https://smartlifecm.com/formation/f-001", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "C:\\Users\\Administrator\\Desktop\\theme_formation.png", fullPage: false });
  console.log("✓ Formation detail");

  // Footer
  await page.goto("https://smartlifecm.com", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "C:\\Users\\Administrator\\Desktop\\theme_footer.png" });
  console.log("✓ Footer");

  await browser.close();
  console.log("Terminé.");
})();
