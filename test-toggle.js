const { chromium } = require('./node_modules/playwright');

const BASE = 'http://187.7.23.20:3000';
const ADMIN_PWD = 'ADMIN237';

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── 1. Page publique AVANT désactivation ──
  console.log('\n[1] /ebooks avant désactivation...');
  const ctx0 = await browser.newContext();
  const pub0 = await ctx0.newPage();
  await pub0.goto(`${BASE}/ebooks`, { waitUntil: 'networkidle', timeout: 30000 });

  // Récupérer les slugs des ebooks visibles via les liens href=/ebooks/XXX
  const slugsBefore = await pub0.$$eval('a[href^="/ebooks/"]', links =>
    [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h !== '/ebooks'))]
  );
  console.log('   Ebooks visibles (slugs):', slugsBefore.length, slugsBefore.slice(0, 3));
  await ctx0.close();

  // ── 2. Admin — connexion ──
  console.log('\n[2] Connexion admin...');
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await admin.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await admin.waitForTimeout(800);

  const pwdInput = await admin.$('input[type="password"]');
  if (pwdInput) {
    await pwdInput.fill(ADMIN_PWD);
    await admin.keyboard.press('Enter');
    await admin.waitForTimeout(3000);
    console.log('   Mot de passe envoyé, attente chargement...');
  }

  // ── 3. Trouver un ebook actif ──
  console.log('\n[3] Recherche d\'un ebook actif à désactiver...');
  await admin.waitForTimeout(2000);

  // Récupérer le titre du premier ebook avec bouton "Désactiver"
  const ebookInfo = await admin.evaluate(() => {
    // Chercher dans les ebooks admin-créés ET statiques
    const toggleBtns = Array.from(document.querySelectorAll('button'));
    const désactBtn = toggleBtns.find(b => b.title === 'Désactiver' || b.getAttribute('title') === 'Désactiver');
    if (!désactBtn) return null;
    // Chercher le titre dans le parent proche
    let parent = désactBtn.parentElement;
    for (let i = 0; i < 8 && parent; i++) {
      const h3 = parent.querySelector('h3, h4');
      if (h3) return { title: h3.textContent?.trim(), found: true };
      parent = parent.parentElement;
    }
    return { found: true, title: '(titre non trouvé)' };
  });
  console.log('   Ebook trouvé pour test:', ebookInfo);

  if (!ebookInfo) {
    // Essayer avec ToggleRight (SVG) — chercher l'ebook actif via son badge vert
    console.log('   Aucun bouton "Désactiver" titre trouvé, vérification de la page...');
    const pageText = await admin.evaluate(() => document.body.innerText.slice(0, 500));
    console.log('   Texte de la page (début):', pageText.replace(/\n/g, ' ').slice(0, 300));
    await browser.close();
    return;
  }

  // ── 4. Désactiver l'ebook ──
  console.log('\n[4] Désactivation...');
  await admin.click('button[title="Désactiver"]', { force: true });
  console.log('   Clic sur "Désactiver" effectué');
  await admin.waitForTimeout(2000); // Attendre sync serveur (~100ms + réseau)

  // Vérifier que le toggle a changé
  const hasActivate = await admin.$('button[title="Activer"]');
  console.log('   Bouton "Activer" apparu:', !!hasActivate);

  // ── 5. Vérifier sur le site public (contexte frais) ──
  console.log('\n[5] Vérification site public après désactivation (contexte frais)...');
  const ctx1 = await browser.newContext();
  const pub1 = await ctx1.newPage();
  await pub1.goto(`${BASE}/ebooks`, { waitUntil: 'networkidle', timeout: 30000 });

  const slugsAfter = await pub1.$$eval('a[href^="/ebooks/"]', links =>
    [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h !== '/ebooks'))]
  );
  console.log('   Ebooks visibles après désactivation:', slugsAfter.length);

  const removedCount = slugsBefore.length - slugsAfter.length;
  const allStillThere = slugsBefore.every(s => slugsAfter.includes(s));
  console.log('   Différence de count:', removedCount, '(positif = ebook disparu ✓)');
  console.log('   Tous les ebooks before sont encore là:', allStillThere);

  // Chercher spécifiquement le titre de l'ebook désactivé
  const titleShort = ebookInfo.title?.slice(0, 20);
  const titleVisible = await pub1.evaluate((t) => {
    return !!Array.from(document.querySelectorAll('h2,h3,h4,p')).find(e => e.textContent?.includes(t));
  }, titleShort || '');
  console.log(`   Titre "${titleShort}" encore visible:`, titleVisible);

  await ctx1.close();

  // ── 6. Réactiver ──
  console.log('\n[6] Réactivation...');
  const activateBtn = await admin.$('button[title="Activer"]');
  if (activateBtn) {
    await activateBtn.click({ force: true });
    await admin.waitForTimeout(2000);
    console.log('   Réactivé');
  } else {
    console.log('   ⚠️ Bouton Activer non trouvé');
  }

  // ── 7. Vérifier que l'ebook réapparaît ──
  console.log('\n[7] Vérification réapparition après réactivation...');
  const ctx2 = await browser.newContext();
  const pub2 = await ctx2.newPage();
  await pub2.goto(`${BASE}/ebooks`, { waitUntil: 'networkidle', timeout: 30000 });
  const slugsRestored = await pub2.$$eval('a[href^="/ebooks/"]', links =>
    [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h !== '/ebooks'))]
  );
  console.log('   Ebooks visibles après réactivation:', slugsRestored.length);
  const restoredCount = slugsRestored.length - slugsAfter.length;
  console.log('   Ebooks rajoutés vs phase désactivée:', restoredCount);
  await ctx2.close();

  // ── Verdict ──
  console.log('\n══════════════════════════════════════════════');
  const deactivationOk = removedCount > 0 || !titleVisible;
  const reactivationOk = restoredCount > 0;
  if (deactivationOk && reactivationOk) {
    console.log('✅ PASS — Désactivation et réactivation fonctionnent correctement');
    console.log(`   - Désactivation: ${removedCount} ebook(s) masqué(s), titre visible: ${titleVisible}`);
    console.log(`   - Réactivation: ${restoredCount} ebook(s) réapparu(s)`);
  } else if (!deactivationOk) {
    console.log('❌ FAIL — L\'ebook est toujours visible après désactivation');
    console.log(`   - Count avant: ${slugsBefore.length}, après: ${slugsAfter.length}`);
    console.log(`   - Titre "${titleShort}" visible: ${titleVisible}`);
  } else {
    console.log('⚠️  PARTIEL — Désactivation OK mais réactivation non confirmée');
  }
  console.log('══════════════════════════════════════════════');

  await browser.close();
})().catch(e => {
  console.error('\n❌ ERREUR SCRIPT:', e.message);
  process.exit(1);
});
