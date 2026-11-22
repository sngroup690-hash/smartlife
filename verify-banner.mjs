import { chromium } from "playwright";

const BASE = "http://187.7.23.20:3000";
const BANNER_FILE = "C:/Users/Administrator/AppData/Local/Temp/test-banner.webp";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("PAGE ERR:", e.message.slice(0, 120)));

  try {
    console.log("1. Login...");
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    const pwInput = page.locator('input[type="password"]');
    if (await pwInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pwInput.fill("ADMIN237");
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }

    console.log("2. Ebooks tab...");
    await page.getByRole("button", { name: "Ebooks" }).first().click();
    await page.waitForTimeout(2000);

    const bannerLabel = page.locator("p").filter({ hasText: "Bannière page de détail" }).first();
    const bannerSection = bannerLabel.locator("..");
    const uploadCoverRoot = bannerSection.locator("div.flex.flex-col").first();
    const fileInput = uploadCoverRoot.locator("input[type=file]").first();

    // State BEFORE
    const srcBefore = await uploadCoverRoot.locator("img").first().getAttribute("src").catch(() => "");
    const nwBefore = await uploadCoverRoot.locator("img").first().evaluate(el => el.naturalWidth).catch(() => 0);
    console.log(`BEFORE: src="${(srcBefore||"").slice(0,60)}", naturalW=${nwBefore}`);

    // Setup mutation observer to detect blob URL
    await uploadCoverRoot.evaluate((container) => {
      window._blobSeen = false;
      const obs = new MutationObserver(() => {
        container.querySelectorAll("img").forEach(img => {
          if (img.src && img.src.startsWith("blob:")) {
            window._blobSeen = true;
          }
        });
      });
      obs.observe(container, { subtree: true, attributes: true, childList: true, attributeFilter: ["src"] });
      window._obs = obs;
    });

    // Upload
    console.log("3. Uploading...");
    await fileInput.setInputFiles(BANNER_FILE);
    await page.waitForTimeout(50);

    const srcAt50 = await uploadCoverRoot.locator("img").first().getAttribute("src").catch(() => "");
    const isBlobAt50 = (srcAt50||"").startsWith("blob:");
    console.log(`   At 50ms: isBlob=${isBlobAt50}, src="${(srcAt50||"").slice(0,50)}"`);

    // Wait for success
    console.log("4. Waiting for success...");
    try {
      await page.waitForSelector("text=Image uploadée", { timeout: 30000 });
      console.log("   OK");
    } catch {
      console.log("   TIMEOUT");
      return;
    }
    await page.waitForTimeout(500);

    const blobWasSeen = await page.evaluate(() => window._blobSeen || false);
    console.log(`   Blob seen by MutationObserver: ${blobWasSeen}`);

    // State AFTER
    const imgAfter = uploadCoverRoot.locator("img").first();
    const srcAfter = await imgAfter.getAttribute("src").catch(() => "");
    const nwAfter = await imgAfter.evaluate(el => el.naturalWidth).catch(() => 0);
    const dispAfter = await imgAfter.evaluate(el => el.style.display).catch(() => "");
    const visAfter = await imgAfter.isVisible().catch(() => false);
    const oldTs = (srcBefore||"").split("?v=")[1] || "";
    const newTs = (srcAfter||"").split("?v=")[1] || "";
    const tsChanged = oldTs !== newTs;
    console.log(`AFTER: visible=${visAfter}, naturalW=${nwAfter}, display="${dispAfter}"`);
    console.log(`   src: "${(srcAfter||"").slice(0,80)}"`);
    console.log(`   Timestamp changed: ${tsChanged} (${oldTs} -> ${newTs})`);

    const hasReplace = await uploadCoverRoot.locator("button").filter({ hasText: "Remplacer" }).isVisible({ timeout: 1000 }).catch(() => false);
    const hasDelete = await uploadCoverRoot.locator("button").filter({ hasText: "Supprimer" }).isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`   Remplacer=${hasReplace}, Supprimer=${hasDelete}`);

    await page.screenshot({ path: "C:/Users/Administrator/AppData/Local/Temp/b-final.png" });

    let uploadBack = false;
    if (hasDelete) {
      page.once("dialog", d => d.accept());
      await uploadCoverRoot.locator("button").filter({ hasText: "Supprimer" }).click();
      await page.waitForTimeout(1500);
      uploadBack = await uploadCoverRoot.locator("button").filter({ hasText: "Uploader la bannière" }).isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`   Upload btn back: ${uploadBack}`);
    }

    console.log("\n=== VERDICT ===");
    const blobOK = isBlobAt50 || blobWasSeen;
    const allOK = blobOK && visAfter && nwAfter > 0 && dispAfter === "" && hasReplace && hasDelete && uploadBack;
    if (allOK) {
      console.log("PASS");
    } else {
      console.log(`PARTIAL/FAIL: blob=${blobOK} visible=${visAfter} nw=${nwAfter} display="${dispAfter}" replace=${hasReplace} delete=${hasDelete} back=${uploadBack}`);
    }
  } catch(e) {
    console.log("ERR:", e.message);
  } finally {
    await browser.close();
  }
}
run();
