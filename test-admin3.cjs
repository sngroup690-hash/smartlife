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

  // Ebooks → Ajouter
  await page.locator("button").filter({ hasText: /ebook/i }).first().click();
  await page.waitForTimeout(800);
  await page.locator("button").filter({ hasText: /ajouter/i }).first().click();
  await page.waitForTimeout(2000);

  // Cherche et capture chaque section importante
  async function captureElement(labelText, filename) {
    const el = page.locator("label").filter({ hasText: labelText }).first();
    if (await el.isVisible()) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      // Capture viewport centré sur l'élément
      const box = await el.boundingBox();
      if (box) {
        await page.screenshot({
          path: `${SHOTS}${filename}.png`,
          clip: { x: 0, y: Math.max(0, box.y - 20), width: 1280, height: 380 }
        });
        console.log(`✓ ${filename}.png`);
      }
    } else {
      console.log(`✗ label "${labelText}" non trouvé`);
    }
  }

  await captureElement("Animation du bouton CTA", "s1_animation_cta");
  await captureElement("Taille des cartes", "s2_card_size");
  await captureElement("Onglets de description", "s3_sections_editor");
  await captureElement("Aperçu PDF", "s4_pdf_upload");

  // Annonces — capture de la section
  await page.locator("button").filter({ hasText: /annonce/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}annonces_panel.png`, clip: { x: 0, y: 130, width: 1280, height: 700 } });
  console.log("✓ annonces_panel.png");

  // Formation form — contrôles animation + sections
  await page.locator("button").filter({ hasText: /^formations?/i }).first().click();
  await page.waitForTimeout(800);
  const addF = page.locator("button").filter({ hasText: /ajouter/i }).first();
  if (await addF.isVisible()) {
    await addF.click();
    await page.waitForTimeout(2000);
    await captureElement("Animation du bouton CTA", "f1_formation_animation");
    await captureElement("Taille des cartes", "f2_formation_cardsize");
    await captureElement("Onglets de description", "f3_formation_sections");
  }

  await browser.close();
  console.log("Terminé.");
})();
