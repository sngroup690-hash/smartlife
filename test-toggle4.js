const { chromium } = require('./node_modules/playwright');

const BASE = 'http://187.7.23.20:3000';
const ADMIN_PWD = 'ADMIN237';

async function fetchJSON(url, opts = {}) {
  const r = await fetch(url, opts);
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { _raw: t.slice(0, 200) }; }
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── 1. État actuel des ebooks côté serveur ──
  console.log('[1] Lecture état serveur...');
  const ebooksData = await fetchJSON(`${BASE}/api/ebooks`);
  const actifMap = ebooksData.actif || {};
  const allSlugs = [];

  // Slugs des ebooks statiques (actifs)
  const ctx0 = await browser.newContext();
  const pub0 = await ctx0.newPage();
  await pub0.goto(`${BASE}/ebooks`, { waitUntil: 'networkidle', timeout: 30000 });
  const slugsBefore = await pub0.$$eval('a[href^="/ebooks/"]', links =>
    [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h !== '/ebooks'))]
  );
  console.log(`   Ebooks publics visibles: ${slugsBefore.length} — ex: ${slugsBefore.slice(0,2)}`);
  await ctx0.close();

  // Trouver un ebook statique actif à désactiver
  // Les ebooks statiques ont leurs IDs dans actifMap
  // Un ebook actif = absent de actifMap OU actifMap[id]=true
  // Lire les ebooks du catalogue statique
  const staticEbookIds = Object.keys(actifMap); // ceux qu'on connaît
  console.log(`   État actif connu pour ${staticEbookIds.length} ebooks:`, actifMap);

  // Chercher un ebook actif sur le site public, prendre le premier slug
  const targetSlug = slugsBefore[0]?.replace('/ebooks/', '');
  if (!targetSlug) { console.log('   Aucun ebook trouvé'); await browser.close(); return; }

  // Récupérer les overrides pour trouver l'ID correspondant
  // Pour les ebooks statiques, l'ID vient du fichier data.ts (pas dans ebooks-data.json forcément)
  // On va plutôt chercher dans les ebooks admin-créés
  const adminEbooks = ebooksData.ebooks || [];
  console.log(`   Ebooks admin-créés: ${adminEbooks.length}`);

  let targetId = null;
  let targetIsStatic = false;
  let targetTitle = targetSlug;

  if (adminEbooks.length > 0) {
    // Utiliser le premier ebook admin actif
    const activeAdminEbook = adminEbooks.find(e => e.actif !== false && !e.deletedAt);
    if (activeAdminEbook) {
      targetId = activeAdminEbook.id;
      targetTitle = activeAdminEbook.title;
      targetIsStatic = false;
      console.log(`   Cible: ebook admin "${targetTitle}" (${targetId})`);
    }
  }

  if (!targetId) {
    // Utiliser un ebook statique — l'ID est dans le slug ou dans les overrides
    // Chercher dans les overrides
    const overrideKeys = Object.keys(ebooksData.overrides || {});
    if (overrideKeys.length > 0) {
      targetId = overrideKeys[0];
      targetIsStatic = true;
      targetTitle = overrideKeys[0];
      console.log(`   Cible: ebook statique depuis overrides "${targetId}"`);
    } else {
      // Prendre le premier slug et supposer que c'est l'ID
      targetId = targetSlug;
      targetIsStatic = true;
      console.log(`   Cible: ebook statique par slug "${targetId}"`);
    }
  }

  // ── 2. Désactiver l'ebook via API ──
  console.log(`\n[2] Désactivation de "${targetTitle}" via API...`);

  let body;
  if (targetIsStatic) {
    body = {
      ebooks: adminEbooks,
      overrides: ebooksData.overrides || {},
      actif: { ...(ebooksData.actif || {}), [targetId]: false },
    };
  } else {
    const updatedEbooks = adminEbooks.map(e =>
      e.id === targetId ? { ...e, actif: false } : e
    );
    body = {
      ebooks: updatedEbooks,
      overrides: ebooksData.overrides || {},
      actif: ebooksData.actif || {},
    };
  }

  const syncRes = await fetchJSON(`${BASE}/api/admin/sync-ebooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PWD },
    body: JSON.stringify(body),
  });
  console.log('   Sync résultat:', syncRes);

  // ── 3. Vérifier site public (contexte frais) ──
  console.log('\n[3] Vérification site public après désactivation...');
  const ctx1 = await browser.newContext();
  const pub1 = await ctx1.newPage();
  await pub1.goto(`${BASE}/ebooks`, { waitUntil: 'networkidle', timeout: 30000 });

  const slugsAfter = await pub1.$$eval('a[href^="/ebooks/"]', links =>
    [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h !== '/ebooks'))]
  );

  // Chercher le titre de l'ebook dans la page
  const titleVisible = await pub1.evaluate((t) =>
    !!Array.from(document.querySelectorAll('a, h2, h3, h4, p')).find(e =>
      e.textContent?.toLowerCase().includes(t.toLowerCase().slice(0, 20))
    )
  , targetTitle);

  console.log(`   Ebooks après désactivation: ${slugsAfter.length} (avant: ${slugsBefore.length})`);
  console.log(`   "${targetTitle.slice(0,30)}" encore visible: ${titleVisible}`);

  // Pour les ebooks admin, vérifier si la slug disparaît
  if (!targetIsStatic) {
    const adminEbook = adminEbooks.find(e => e.id === targetId);
    if (adminEbook?.slug) {
      const adminSlugPresent = slugsAfter.includes(`/ebooks/${adminEbook.slug}`);
      console.log(`   Slug /ebooks/${adminEbook.slug} encore présent: ${adminSlugPresent}`);
    }
  }

  await ctx1.close();

  // ── 4. Restaurer ──
  console.log('\n[4] Restauration...');
  await fetchJSON(`${BASE}/api/admin/sync-ebooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PWD },
    body: JSON.stringify(ebooksData), // État original
  });
  console.log('   État original restauré');

  // ── 5. Vérifier restauration ──
  console.log('\n[5] Vérification restauration...');
  const ctx2 = await browser.newContext();
  const pub2 = await ctx2.newPage();
  await pub2.goto(`${BASE}/ebooks`, { waitUntil: 'networkidle', timeout: 30000 });
  const slugsRestored = await pub2.$$eval('a[href^="/ebooks/"]', links =>
    [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h !== '/ebooks'))]
  );
  console.log(`   Ebooks après restauration: ${slugsRestored.length}`);
  await ctx2.close();

  // ── Verdict ──
  const deactivationOk = slugsAfter.length < slugsBefore.length || !titleVisible;
  const restorationOk = slugsRestored.length >= slugsBefore.length;
  console.log('\n══════════════════════════════════════════════════');
  if (deactivationOk && restorationOk) {
    console.log('✅ PASS — Le système de désactivation fonctionne correctement');
    console.log(`   ${slugsBefore.length} ebooks → ${slugsAfter.length} après désactivation → ${slugsRestored.length} après restauration`);
    if (!titleVisible) console.log(`   ✓ "${targetTitle.slice(0,30)}" masqué côté public`);
  } else {
    console.log('❌ FAIL — Problème détecté');
    console.log(`   Counts: ${slugsBefore.length} → ${slugsAfter.length} → ${slugsRestored.length}`);
    console.log(`   Titre visible: ${titleVisible}`);
  }
  console.log('══════════════════════════════════════════════════');

  await browser.close();
})().catch(e => { console.error('❌ ERREUR:', e.message, e.stack); process.exit(1); });
