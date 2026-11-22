const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(20000);

  // Test sur un ebook
  await page.goto("https://smartlifecm.com/ebooks", { waitUntil: "networkidle" });
  // Clique sur le premier ebook
  const firstEbook = page.locator("a[href*='/ebooks/']").first();
  if (await firstEbook.isVisible()) {
    const href = await firstEbook.getAttribute("href");
    await page.goto(`https://smartlifecm.com${href}`, { waitUntil: "networkidle" });
  } else {
    await page.goto("https://smartlifecm.com/ebooks/agriculture-cultures-rentables", { waitUntil: "networkidle" });
  }
  await page.waitForTimeout(1500);
  // Capture du bouton CTA + bouton Comment acheter
  const ctaZone = page.locator("button").filter({ hasText: /acheter|rejoindre|obtenir/i }).first();
  if (await ctaZone.isVisible()) {
    await ctaZone.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const box = await ctaZone.boundingBox();
    await page.screenshot({
      path: "C:\\Users\\Administrator\\Desktop\\cta_comment_acheter_ebook.png",
      clip: { x: 0, y: Math.max(0, (box?.y ?? 400) - 20), width: 1280, height: 280 }
    });
    console.log("✓ ebook CTA zone");
  }

  // Clique sur "Comment acheter" pour voir le contenu
  const btn = page.locator("button").filter({ hasText: /comment acheter/i }).first();
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(800);
    await btn.scrollIntoViewIfNeeded();
    const box = await btn.boundingBox();
    await page.screenshot({
      path: "C:\\Users\\Administrator\\Desktop\\cta_comment_acheter_ebook_open.png",
      clip: { x: 0, y: Math.max(0, (box?.y ?? 400) - 20), width: 1280, height: 380 }
    });
    console.log("✓ ebook bouton ouvert");
  } else {
    console.log("✗ Bouton 'Comment acheter' non trouvé sur ebook");
  }

  // Test sur une formation
  await page.goto("https://smartlifecm.com/formation", { waitUntil: "networkidle" });
  const firstFormation = page.locator("a[href*='/formation/']").first();
  if (await firstFormation.isVisible()) {
    const href = await firstFormation.getAttribute("href");
    if (href && !href.endsWith("/formation/")) {
      await page.goto(`https://smartlifecm.com${href}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      const btnF = page.locator("button").filter({ hasText: /comment acheter/i }).first();
      if (await btnF.isVisible()) {
        await btnF.scrollIntoViewIfNeeded();
        const box = await btnF.boundingBox();
        await page.screenshot({
          path: "C:\\Users\\Administrator\\Desktop\\cta_comment_acheter_formation.png",
          clip: { x: 0, y: Math.max(0, (box?.y ?? 400) - 80), width: 1280, height: 300 }
        });
        console.log("✓ formation bouton visible");
      } else {
        console.log("✗ Bouton non trouvé sur formation");
      }
    }
  }

  await browser.close();
})();
