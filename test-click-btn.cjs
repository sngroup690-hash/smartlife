const { chromium } = require("playwright");

async function testPage(page, url, label) {
  console.log(`\nTest ${label} - ${url}`);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  const btn = page.locator("button").filter({ hasText: /comment acheter/i }).first();
  const visible = await btn.isVisible();
  console.log("Bouton 'comment acheter' visible:", visible);

  if (!visible) {
    await page.screenshot({ path: `C:\\Users\\Administrator\\Desktop\\dbg_${label}.png`, fullPage: false });
    console.log(`Débogage: dbg_${label}.png`);
    return;
  }

  await btn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Mémorise la position AVANT le clic
  const box = await btn.boundingBox();
  const savedY = box?.y ?? 400;

  await page.screenshot({
    path: `C:\\Users\\Administrator\\Desktop\\click_${label}_avant.png`,
    clip: { x: 0, y: Math.max(0, savedY - 100), width: 1280, height: 400 }
  });
  console.log(`✓ Screenshot avant clic`);

  // Clic et attente de l'animation d'ouverture
  await btn.click();
  await page.waitForTimeout(2000);

  // Screenshot depuis la position mémorisée (pas besoin de retrouver le bouton)
  await page.screenshot({
    path: `C:\\Users\\Administrator\\Desktop\\click_${label}_apres.png`,
    clip: { x: 0, y: Math.max(0, savedY - 40), width: 1280, height: 700 }
  });
  console.log(`✓ Screenshot après clic (contenu révélé)`);

  // Aussi une capture full page pour voir tout le contenu
  await page.screenshot({
    path: `C:\\Users\\Administrator\\Desktop\\click_${label}_fullpage.png`,
    fullPage: true
  });
  console.log(`✓ Screenshot full page`);
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(30000);

  // Récupère les URLs réelles
  await page.goto("https://smartlifecm.com/formation", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  let formHref = null;
  for (const link of await page.locator("a[href^='/formation/']").all()) {
    const h = await link.getAttribute("href");
    if (h && h.replace("/formation/", "").length > 0) { formHref = h; break; }
  }

  await page.goto("https://smartlifecm.com/ebooks", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  let ebookHref = null;
  for (const link of await page.locator("a[href^='/ebooks/']").all()) {
    const h = await link.getAttribute("href");
    if (h && h.replace("/ebooks/", "").length > 0) { ebookHref = h; break; }
  }

  console.log("URLs:", formHref, ebookHref);

  if (formHref) await testPage(page, `https://smartlifecm.com${formHref}`, "formation");
  if (ebookHref) await testPage(page, `https://smartlifecm.com${ebookHref}`, "ebook");

  await browser.close();
  console.log("\nTerminé.");
})();
