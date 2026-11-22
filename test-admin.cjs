const { chromium } = require("playwright");

const ADMIN_URL = "https://smartlifecm.com/admin";
const PASSWORD = "ADMIN237";
const SHOTS_DIR = "C:\\Users\\Administrator\\Desktop\\";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(25000);

  async function shot(name) {
    const path = `${SHOTS_DIR}admin_${name}.png`;
    await page.screenshot({ path, fullPage: false });
    console.log("Screenshot:", path);
  }

  // 1. Page admin — écran de login
  await page.goto(ADMIN_URL, { waitUntil: "networkidle" });
  await shot("01_login");
  console.log("Titre:", await page.title());

  // 2. Connexion
  const pwdInput = page.locator('input[type="password"]').first();
  if (await pwdInput.isVisible()) {
    await pwdInput.fill(PASSWORD);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(3000);
    await shot("02_dashboard");
  } else {
    console.log("Pas d'input password visible — peut-être déjà connecté");
    await shot("02_dashboard");
  }

  // 3. Cherche les onglets principaux
  const allButtons = await page.locator("button").allTextContents();
  console.log("Boutons trouvés:", allButtons.filter(t => t.trim()).slice(0, 20));

  // 4. Onglet EBOOKS
  const ebookTab = page.locator("button").filter({ hasText: /ebook/i }).first();
  if (await ebookTab.isVisible()) {
    await ebookTab.click();
    await page.waitForTimeout(1500);
    await shot("03_ebooks");
    // Cherche bouton pour ajouter/modifier un ebook
    const addBtn = page.locator("button").filter({ hasText: /ajouter|nouvel/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1500);
      await shot("04_ebook_form");
      // Scroll pour voir les nouveaux contrôles (animation, card size, sections)
      await page.keyboard.press("End");
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SHOTS_DIR}admin_05_ebook_form_bottom.png`, fullPage: false });
      console.log("Screenshot: admin_05_ebook_form_bottom.png");
    }
  }

  // 5. Onglet ANNONCES
  await page.goto(ADMIN_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const annoncesTab = page.locator("button").filter({ hasText: /annonce/i }).first();
  if (await annoncesTab.isVisible()) {
    await annoncesTab.click();
    await page.waitForTimeout(1500);
    await shot("06_annonces");
  }

  await browser.close();
  console.log("Tests terminés.");
})();
