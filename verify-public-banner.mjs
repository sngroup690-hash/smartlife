import { chromium } from "playwright";

const BASE = "http://187.7.23.20:3000";
const SLUG = "-l10u";
const BANNER_URL = "/banners/eb-admin-1789601596014-5p86.webp";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on("response", r => {
    if (r.url().includes("187.7.23.20") && !r.ok()) {
      console.log(`HTTP ${r.status()}: ${r.url().replace(BASE, "")}`);
    }
  });

  try {
    // 1. Verify banner file is accessible
    console.log("1. Check banner file accessibility...");
    const r = await page.goto(`${BASE}${BANNER_URL}`, { waitUntil: "networkidle" });
    console.log(`   /banners/eb-admin-1789601596014-5p86.webp: HTTP ${r?.status()}`);

    // 2. Check ebook public page
    console.log("2. Check public ebook page...");
    const pageRes = await page.goto(`${BASE}/ebooks/${SLUG}`, { waitUntil: "networkidle" });
    console.log(`   /ebooks/${SLUG}: HTTP ${pageRes?.status()}`);

    // 3. Look for banner img on the page
    const bannerImgs = page.locator(`img[src*="/banners/"]`);
    const bannerCount = await bannerImgs.count();
    console.log(`   Banner imgs on page: ${bannerCount}`);

    for (let i = 0; i < bannerCount; i++) {
      const img = bannerImgs.nth(i);
      const src = await img.getAttribute("src");
      const nw = await img.evaluate(el => el.naturalWidth).catch(() => 0);
      const nh = await img.evaluate(el => el.naturalHeight).catch(() => 0);
      const vis = await img.isVisible().catch(() => false);
      const disp = await img.evaluate(el => el.style.display).catch(() => "");
      console.log(`   Banner[${i}]: src="${(src||"").slice(0,60)}", naturalW=${nw}, naturalH=${nh}, visible=${vis}, display="${disp}"`);
    }

    await page.screenshot({ path: "C:/Users/Administrator/AppData/Local/Temp/public-ebook.png" });
    console.log("   Screenshot: C:/Users/Administrator/AppData/Local/Temp/public-ebook.png");

    // 4. Check page title/content
    const title = await page.title();
    const h1 = await page.locator("h1").first().textContent().catch(() => "");
    console.log(`   Page title: ${title.slice(0, 60)}`);
    console.log(`   H1: ${(h1||"").slice(0, 60)}`);

    // Summary
    const bannerVisible = bannerCount > 0 && await bannerImgs.first().isVisible().catch(() => false);
    const bannerNW = bannerCount > 0 ? await bannerImgs.first().evaluate(el => el.naturalWidth).catch(() => 0) : 0;
    console.log("\n=== PUBLIC PAGE RESULT ===");
    if (bannerVisible && bannerNW > 0) {
      console.log("PASS — Banner visible on public page (naturalW=" + bannerNW + ")");
    } else if (bannerCount > 0) {
      console.log("PARTIAL — Banner img found but not visible or naturalW=0");
    } else {
      console.log("FAIL — No banner img found on public page");
    }

  } catch(e) {
    console.log("ERR:", e.message);
  } finally {
    await browser.close();
  }
}
run();
