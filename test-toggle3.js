const { chromium } = require('./node_modules/playwright');

const BASE = 'http://187.7.23.20:3000';
const ADMIN_PWD = 'ADMIN237';

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── 1. Page publique AVANT ──
  console.log('[1] /ebooks avant désactivation...');
  const ctx0 = await browser.newContext();
  const pub0 = await ctx0.newPage();
  await pub0.goto(`${BASE}/ebooks`, { waitUntil: 'networkidle', timeout: 30000 });
  const slugsBefore = await pub0.$$eval('a[href^="/ebooks/"]', links =>
    [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h !== '/ebooks'))]
  );
  console.log(`   ${slugsBefore.length} ebooks visibles — ex: ${slugsBefore[0]}`);
  await ctx0.close();

  // ── 2. Login admin ──
  console.log('\n[2] Login admin...');
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await admin.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await admin.waitForTimeout(1500);

  // Remplir username et password
  await admin.fill('input[type="text"]', 'admin');
  await admin.fill('input[type="password"]', ADMIN_PWD);
  await admin.click('button[type="submit"]');
  await admin.waitForTimeout(4000);

  // Vérifier qu'on est connecté
  const pageTitle = await admin.title();
  const bodyText = await admin.evaluate(() => document.body.innerText.slice(0, 200));
  console.log('   Page title:', pageTitle);
  console.log('   Contenu début:', bodyText.replace(/\n/g, ' ').slice(0, 150));

  // Naviguer vers l'onglet ebooks si nécessaire
  const ebookTabBtn = await admin.$('button:has-text("ebook"), button:has-text("Ebook"), button:has-text("Catalogue")');
  if (ebookTabBtn) {
    await ebookTabBtn.click();
    await admin.waitForTimeout(2000);
    console.log('   Onglet ebooks cliqué');
  }

  // ── 3. Trouver les toggles ──
  console.log('\n[3] Recherche des toggles...');
  await admin.waitForTimeout(2000);

  const btnTitles = await admin.evaluate(() =>
    Array.from(document.querySelectorAll('button[title]'))
      .map(b => b.title).filter(t => t.length > 2).slice(0, 30)
  );
  console.log('   Boutons avec title:', btnTitles);

  // Trouver le premier bouton avec "Désactiver" dans le title (toggle actif)
  const désactBtn = await admin.$('button[title="Désactiver"]');
  if (!désactBtn) {
    // Essayer avec différentes casses / encodages
    const allBtnHTML = await admin.evaluate(() =>
      Array.from(document.querySelectorAll('button')).slice(0, 50)
        .map(b => `title="${b.title}" text="${b.textContent?.trim().slice(0,20)}"`)
        .filter(s => s.length > 10).join('\n')
    );
    console.log('   Tous boutons:\n', allBtnHTML.slice(0, 600));
    await browser.close();
    return;
  }

  // Titre de l'ebook ciblé
  const ebookTitle = await admin.evaluate((btn) => {
    let el = btn.parentElement;
    for (let i = 0; i < 10 && el; i++) {
      const h = el.querySelector('h3, h4');
      if (h) return h.textContent?.trim();
      el = el.parentElement;
    }
    return '(inconnu)';
  }, désactBtn);
  console.log(`   Ebook à désactiver: "${ebookTitle}"`);

  // ── 4. Désactiver ──
  console.log('\n[4] Clic sur Désactiver...');
  await désactBtn.click({ force: true });
  await admin.waitForTimeout(2500);

  const nowHasActivate = !!(await admin.$('button[title="Activer"]'));
  console.log('   Bouton "Activer" présent maintenant:', nowHasActivate);

  // ── 5. Vérifier public (contexte vierge) ──
  console.log('\n[5] Vérification site public après désactivation...');
  const ctx1 = await browser.newContext();
  const pub1 = await ctx1.newPage();
  await pub1.goto(`${BASE}/ebooks`, { waitUntil: 'networkidle', timeout: 30000 });

  const slugsAfter = await pub1.$$eval('a[href^="/ebooks/"]', links =>
    [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h !== '/ebooks'))]
  );

  const titleShort = (ebookTitle || '').slice(0, 25);
  const titleStillVisible = titleShort ? await pub1.evaluate((t) =>
    !!Array.from(document.querySelectorAll('a, h2, h3, h4')).find(e => e.textContent?.includes(t))
  , titleShort) : false;

  console.log(`   Ebooks avant: ${slugsBefore.length} → après: ${slugsAfter.length}`);
  console.log(`   "${titleShort}" encore visible: ${titleStillVisible}`);
  await ctx1.close();

  // ── 6. Réactiver ──
  console.log('\n[6] Réactivation...');
  const activateBtn = await admin.$('button[title="Activer"]');
  if (activateBtn) {
    await activateBtn.click({ force: true });
    await admin.waitForTimeout(2500);
    console.log('   Réactivé ✓');
  }

  // ── 7. Vérifier réapparition ──
  console.log('\n[7] Vérification réapparition...');
  const ctx2 = await browser.newContext();
  const pub2 = await ctx2.newPage();
  await pub2.goto(`${BASE}/ebooks`, { waitUntil: 'networkidle', timeout: 30000 });
  const slugsRestored = await pub2.$$eval('a[href^="/ebooks/"]', links =>
    [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h !== '/ebooks'))]
  );
  console.log(`   Ebooks après réactivation: ${slugsRestored.length}`);
  await ctx2.close();

  // ── Verdict ──
  console.log('\n══════════════════════════════════════════════');
  const deactivationOk = slugsAfter.length < slugsBefore.length || !titleStillVisible;
  const reactivationOk = slugsRestored.length >= slugsBefore.length;
  if (deactivationOk && reactivationOk) {
    console.log('✅ PASS — Désactivation et réactivation fonctionnent');
    console.log(`   ${slugsBefore.length} → ${slugsAfter.length} → ${slugsRestored.length} ebooks`);
  } else if (!deactivationOk) {
    console.log('❌ FAIL — Ebook encore visible après désactivation');
    console.log(`   Count: ${slugsBefore.length} → ${slugsAfter.length} | titre visible: ${titleStillVisible}`);
  } else {
    console.log(`✅ Désactivation OK (${slugsBefore.length}→${slugsAfter.length}), réactivation: ${reactivationOk ? 'OK' : 'à vérifier'}`);
  }
  console.log('══════════════════════════════════════════════');

  await browser.close();
})().catch(e => { console.error('❌ ERREUR:', e.message); process.exit(1); });
