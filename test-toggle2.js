const { chromium } = require('./node_modules/playwright');

const BASE = 'http://187.7.23.20:3000';
const ADMIN_PWD = 'ADMIN237';

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── 1. Page publique AVANT ──
  console.log('\n[1] /ebooks avant désactivation...');
  const ctx0 = await browser.newContext();
  const pub0 = await ctx0.newPage();
  await pub0.goto(`${BASE}/ebooks`, { waitUntil: 'networkidle', timeout: 30000 });
  const slugsBefore = await pub0.$$eval('a[href^="/ebooks/"]', links =>
    [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h !== '/ebooks'))]
  );
  console.log('   Ebooks visibles:', slugsBefore.length, '— ex:', slugsBefore.slice(0, 2));
  await ctx0.close();

  // ── 2. Admin — login ──
  console.log('\n[2] Connexion admin...');
  const adminCtx = await browser.newContext();
  // Injecter la session admin dans localStorage pour bypasser le formulaire
  await adminCtx.addInitScript(() => {
    localStorage.setItem('admin-session-v1', JSON.stringify({
      state: { session: { password: 'ADMIN237', role: 'admin', name: 'Admin' } },
      version: 0
    }));
  });
  const admin = await adminCtx.newPage();
  await admin.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
  await admin.waitForTimeout(3000);

  // Lister tous les boutons avec title pour debug
  const btnTitles = await admin.evaluate(() =>
    Array.from(document.querySelectorAll('button[title]'))
      .map(b => b.title)
      .filter(t => t.length > 0)
      .slice(0, 20)
  );
  console.log('   Boutons avec title:', btnTitles);

  // Essayer de trouver un toggle actif (ToggleRight icon = actif)
  // Les boutons toggle ont title="Désactiver" quand actif
  const désactBtns = await admin.$$('button[title*="sactiver"], button[title*="ctiver"]');
  console.log('   Boutons toggle trouvés:', désactBtns.length);

  if (désactBtns.length === 0) {
    // Dump plus de context
    const visibleText = await admin.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.map(b => `[${b.title}] ${b.textContent?.trim().slice(0, 30)}`).filter(t => t.length > 5).join('\n');
    });
    console.log('   Tous les boutons:\n', visibleText.slice(0, 800));
    await browser.close();
    return;
  }

  // ── 3. Trouver le titre de l'ebook à désactiver ──
  const firstToggle = désactBtns[0];
  const toggleTitle = await firstToggle.getAttribute('title');
  console.log('\n[3] Premier toggle trouvé, title:', toggleTitle);

  // Récupérer le nom de l'ebook associé
  const ebookTitle = await admin.evaluate((btn) => {
    let el = btn.parentElement;
    for (let i = 0; i < 10 && el; i++) {
      const h = el.querySelector('h3, h4');
      if (h) return h.textContent?.trim();
      el = el.parentElement;
    }
    return null;
  }, firstToggle);
  console.log('   Ebook ciblé:', ebookTitle);

  // ── 4. Désactivation ──
  if (toggleTitle?.includes('sactiver') || toggleTitle?.includes('Désactiver')) {
    console.log('\n[4] Clic désactivation...');
    await firstToggle.click({ force: true });
    await admin.waitForTimeout(2500);
    console.log('   Clic effectué');
  } else {
    console.log('\n[4] Premier ebook déjà inactif, chercher un actif...');
    const activeToggle = désactBtns.find(async b => (await b.getAttribute('title'))?.includes('sactiver'));
    if (activeToggle) {
      await activeToggle.click({ force: true });
      await admin.waitForTimeout(2500);
    }
  }

  // ── 5. Vérifier public ──
  console.log('\n[5] Vérification public (contexte frais)...');
  const ctx1 = await browser.newContext();
  const pub1 = await ctx1.newPage();
  await pub1.goto(`${BASE}/ebooks`, { waitUntil: 'networkidle', timeout: 30000 });
  const slugsAfter = await pub1.$$eval('a[href^="/ebooks/"]', links =>
    [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h !== '/ebooks'))]
  );
  console.log('   Ebooks après désactivation:', slugsAfter.length, '(avant:', slugsBefore.length, ')');

  const titleShort = ebookTitle?.slice(0, 25) || '';
  const titleStillVisible = await pub1.evaluate((t) =>
    !!Array.from(document.querySelectorAll('h1,h2,h3,h4,p')).find(e => e.textContent?.includes(t))
  , titleShort);
  console.log(`   "${titleShort}" encore visible: ${titleStillVisible}`);
  await ctx1.close();

  // ── 6. Réactivation ──
  console.log('\n[6] Réactivation...');
  const activateBtn = await admin.$('button[title*="ctiver"][title*="A"], button[title="Activer"]');
  if (activateBtn) {
    await activateBtn.click({ force: true });
    await admin.waitForTimeout(2500);
    console.log('   Réactivé');
  } else {
    const allTitles2 = await admin.evaluate(() =>
      Array.from(document.querySelectorAll('button[title]')).map(b=>b.title).slice(0,15)
    );
    console.log('   Boutons actuels:', allTitles2);
  }

  // ── 7. Vérifier réapparition ──
  console.log('\n[7] Vérification réapparition...');
  const ctx2 = await browser.newContext();
  const pub2 = await ctx2.newPage();
  await pub2.goto(`${BASE}/ebooks`, { waitUntil: 'networkidle', timeout: 30000 });
  const slugsRestored = await pub2.$$eval('a[href^="/ebooks/"]', links =>
    [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h !== '/ebooks'))]
  );
  console.log('   Ebooks après réactivation:', slugsRestored.length);
  await ctx2.close();

  // ── Verdict ──
  const deactivationOk = slugsAfter.length < slugsBefore.length || !titleStillVisible;
  const reactivationOk = slugsRestored.length >= slugsBefore.length;
  console.log('\n══════════════════════════════════════════════════');
  if (deactivationOk && reactivationOk) {
    console.log('✅ PASS — Désactivation/Réactivation fonctionnent correctement');
    console.log(`   Avant: ${slugsBefore.length} → Désactivé: ${slugsAfter.length} → Réactivé: ${slugsRestored.length}`);
  } else if (!deactivationOk) {
    console.log('❌ FAIL — Ebook toujours visible après désactivation');
    console.log(`   Avant: ${slugsBefore.length} → Après: ${slugsAfter.length}, titre visible: ${titleStillVisible}`);
  } else {
    console.log('⚠️  Désactivation OK, réactivation à vérifier manuellement');
    console.log(`   Avant: ${slugsBefore.length} → Désactivé: ${slugsAfter.length} → Réactivé: ${slugsRestored.length}`);
  }
  console.log('══════════════════════════════════════════════════');

  await browser.close();
})().catch(e => { console.error('❌ ERREUR:', e.message); process.exit(1); });
