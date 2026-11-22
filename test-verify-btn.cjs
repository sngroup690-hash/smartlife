const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(30000);

  // --- TEST FORMATION ---
  console.log("Test formation...");
  await page.goto("https://smartlifecm.com/formation", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const formLinks = await page.locator("a[href^='/formation/']").all();
  let formHref = null;
  for (const link of formLinks) {
    const h = await link.getAttribute("href");
    if (h && h !== "/formation/" && h.length > 12) { formHref = h; break; }
  }
  console.log("Formation href:", formHref);

  if (formHref) {
    await page.goto(`https://smartlifecm.com${formHref}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "C:\\Users\\Administrator\\Desktop\\verify_formation_full.png", fullPage: false });

    // Cherche le bouton comment acheter
    const btns = await page.locator("button").all();
    const btnTexts = [];
    for (const b of btns) {
      const t = await b.textContent();
      if (t) btnTexts.push(t.trim().slice(0, 60));
    }
    console.log("Buttons on formation page:", btnTexts.slice(0, 20));

    const commentBtn = page.locator("button").filter({ hasText: /comment acheter/i }).first();
    if (await commentBtn.isVisible()) {
      await commentBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const box = await commentBtn.boundingBox();
      await page.screenshot({
        path: "C:\\Users\\Administrator\\Desktop\\verify_formation_btn.png",
        clip: { x: 0, y: Math.max(0, (box?.y ?? 400) - 60), width: 1280, height: 300 }
      });
      console.log("✓ Bouton 'Comment acheter' visible sur formation");
    } else {
      console.log("✗ Bouton 'Comment acheter' NON trouvé sur formation");
    }
  }

  // --- TEST EBOOK ---
  console.log("\nTest ebook...");
  await page.goto("https://smartlifecm.com/ebooks", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const ebookLinks = await page.locator("a[href^='/ebooks/']").all();
  let ebookHref = null;
  for (const link of ebookLinks) {
    const h = await link.getAttribute("href");
    if (h && h !== "/ebooks/" && h.length > 8) { ebookHref = h; break; }
  }
  console.log("Ebook href:", ebookHref);

  if (ebookHref) {
    await page.goto(`https://smartlifecm.com${ebookHref}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "C:\\Users\\Administrator\\Desktop\\verify_ebook_full.png", fullPage: false });

    const btns2 = await page.locator("button").all();
    const btnTexts2 = [];
    for (const b of btns2) {
      const t = await b.textContent();
      if (t) btnTexts2.push(t.trim().slice(0, 60));
    }
    console.log("Buttons on ebook page:", btnTexts2.slice(0, 20));

    const commentBtn2 = page.locator("button").filter({ hasText: /comment acheter/i }).first();
    if (await commentBtn2.isVisible()) {
      await commentBtn2.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const box2 = await commentBtn2.boundingBox();
      await page.screenshot({
        path: "C:\\Users\\Administrator\\Desktop\\verify_ebook_btn.png",
        clip: { x: 0, y: Math.max(0, (box2?.y ?? 400) - 60), width: 1280, height: 300 }
      });
      console.log("✓ Bouton 'Comment acheter' visible sur ebook");
    } else {
      console.log("✗ Bouton 'Comment acheter' NON trouvé sur ebook");
    }
  }

  await browser.close();
  console.log("\nTerminé.");
})();
