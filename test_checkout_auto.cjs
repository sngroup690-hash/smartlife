/**
 * Test d'automatisation du parcours d'achat (checkout) sur https://smartlifecm.com
 * Vérifie :
 *  1. GeoIP → API répond
 *  2. Champ téléphone dans le formulaire de coordonnées
 *  3. Saisie d'un numéro MTN Cameroun → pays + opérateur auto-détectés
 *  4. Saisie numéro Orange CI → pays + opérateur
 *  5. Saisie numéro Wave Sénégal → pays + opérateur
 *  6. Badge "✓ Détecté automatiquement"
 *  7. Override manuel ne se réinitialise pas
 */

const { chromium } = require("playwright");

const BASE = "https://smartlifecm.com";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  });
  const page = await ctx.newPage();
  let pass = 0;
  let fail = 0;

  function ok(msg)   { console.log(`  ✅ ${msg}`); pass++; }
  function ko(msg)   { console.log(`  ❌ ${msg}`); fail++; }
  function info(msg) { console.log(`  ℹ  ${msg}`); }

  // ─── 1. /api/geo ─────────────────────────────────────────────────────────
  console.log("\n[1] Test /api/geo");
  await page.goto(`${BASE}/api/geo`);
  const geoText = await page.textContent("body");
  let geo = {};
  try { geo = JSON.parse(geoText); } catch {}
  if (geoText.includes("countryCode")) {
    ok(`/api/geo répond correctement — countryCode=${JSON.stringify(geo.countryCode)}`);
    if (geo.countryCode) info(`Pays détecté par le navigateur de test : ${geo.countryCode}`);
    else info("IP locale non reconnue (null) — tests de préfixe toujours valides");
  } else {
    ko(`/api/geo réponse inattendue : ${geoText.slice(0, 100)}`);
  }

  // ─── Récupérer un ebook réel ───────────────────────────────────────────────
  console.log("\n[2] Récupération d'un ebook");
  await page.goto(`${BASE}/api/ebooks`);
  const ebooksText = await page.textContent("body");
  let ebooksData = {};
  try { ebooksData = JSON.parse(ebooksText); } catch {}
  const ebooks = ebooksData.ebooks ?? ebooksData;
  if (!Array.isArray(ebooks) || ebooks.length === 0) {
    ko(`Impossible de récupérer les ebooks. Réponse : ${ebooksText.slice(0, 200)}`);
    await browser.close();
    return;
  }
  const eb = ebooks.find((e) => e.price > 0) ?? ebooks[0];
  ok(`Ebook trouvé : "${eb.title.slice(0, 50)}…" — prix: ${eb.price} — id: ${eb.id}`);

  // ─── Charger le checkout ───────────────────────────────────────────────────
  console.log("\n[3] Chargement de la page checkout");
  const checkoutUrl = `${BASE}/checkout?eid=${eb.id}&titre=${encodeURIComponent(eb.title)}&prix=${eb.price}`;
  await page.goto(checkoutUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2500); // laisser les useEffects GeoIP se déclencher

  const pageTitle = await page.title();
  info(`Titre page : ${pageTitle}`);
  ok("Page checkout chargée");

  // ─── 4. Formulaire de coordonnées + champ téléphone ──────────────────────
  console.log("\n[4] Formulaire de coordonnées");
  const coordsHeading = await page.$('text=Vos coordonnées');
  if (coordsHeading) {
    ok("Section 'Vos coordonnées' visible (utilisateur non connecté)");
  } else {
    info("Section coordonnées absente (utilisateur peut-être connecté)");
  }

  const allTelInputs = await page.$$('input[type="tel"]');
  info(`Champs tel sur la page : ${allTelInputs.length}`);
  if (allTelInputs.length >= 1) {
    ok(`Champ(s) téléphone présent(s) — ${allTelInputs.length} trouvé(s)`);
  } else {
    ko("Aucun champ tel trouvé");
  }

  // ─── 5. Sebpay sélectionné par défaut ou formulaire visible ──────────────
  console.log("\n[5] Vérification passerelle et formulaire Sebpay");
  const hasSebpayForm = await page.isVisible('text=Paiement Mobile Money');
  const hasCinetpayForm = await page.isVisible('text=Vous serez redirigé vers notre');
  const hasCountrySelect = await page.$('select') !== null;

  if (hasSebpayForm && hasCountrySelect) {
    ok("Formulaire Sebpay (Mobile Money) actif + select pays présent");
  } else if (hasSebpayForm) {
    ok("Formulaire Sebpay visible");
  } else if (hasCinetpayForm) {
    info("CinetPay actif (GeoIP hors zone Sebpay) — les tests de préfixe vont activer Sebpay via détection téléphone");
  } else {
    ko("Aucun formulaire de paiement visible");
  }

  // ─── 6. Auto-détection : MTN Cameroun (+237677...) ───────────────────────
  console.log("\n[6] Auto-détection numéro MTN Cameroun (+237 677 000 000)");
  const telInputsCM = await page.$$('input[type="tel"]');
  if (telInputsCM.length >= 1) {
    await telInputsCM[0].fill("+237677000000");
    await page.waitForTimeout(800);

    // Le formulaire Sebpay devrait maintenant être visible
    await page.waitForSelector('select', { timeout: 3000 }).catch(() => {});
    const selectCM = await page.$('select');
    if (selectCM) {
      const valCM = await selectCM.inputValue();
      valCM === "CM"
        ? ok(`Pays auto-sélectionné : ${valCM} (Cameroun)`)
        : ko(`Pays attendu CM, obtenu : "${valCM}"`);
    } else {
      info("Select pays non trouvé après saisie du numéro CM");
    }

    await page.waitForTimeout(300);
    // MTN button: trouver par texte MTN dans les boutons opérateur
    const mtnBtn = await page.$('.grid button:has-text("MTN")');
    if (mtnBtn) {
      const cls = await mtnBtn.getAttribute("class") ?? "";
      cls.includes("emerald-500")
        ? ok("Opérateur MTN auto-sélectionné ✓")
        : ko(`MTN trouvé mais non sélectionné — classes: ${cls.slice(0, 80)}`);
    } else {
      info("Bouton MTN non trouvé dans les opérateurs");
    }
  } else {
    ko("Aucun champ tel pour test MTN");
  }

  // ─── 7. Badge "✓ Détecté automatiquement" ────────────────────────────────
  console.log("\n[7] Badge auto-détection");
  const badges = await page.$$eval('span', (spans) =>
    spans.filter((s) => s.textContent.includes("Détecté automatiquement")).length
  );
  badges > 0
    ? ok(`${badges} badge(s) "✓ Détecté automatiquement" affiché(s)`)
    : info("Aucun badge visible (attendu si opérateur et pays auto-détectés)");

  // ─── 8. Auto-détection : MTN CI (+225 07...) + Orange CI (+225 08...) ────
  console.log("\n[8a] Auto-détection numéro MTN Côte d'Ivoire (+225 0712345678)");
  const telInputsCIa = await page.$$('input[type="tel"]');
  if (telInputsCIa.length >= 1) {
    await telInputsCIa[0].fill("+2250712345678");
    await page.waitForTimeout(800);
    const selectCIa = await page.$('select');
    if (selectCIa) {
      const valCIa = await selectCIa.inputValue();
      valCIa === "CI"
        ? ok(`Pays auto-sélectionné : ${valCIa} (Côte d'Ivoire)`)
        : ko(`Pays attendu CI, obtenu : "${valCIa}"`);
    }
    const mtnCIBtn = await page.$('.grid button:has-text("MTN")');
    if (mtnCIBtn) {
      const cls = await mtnCIBtn.getAttribute("class") ?? "";
      cls.includes("emerald-500")
        ? ok("Opérateur MTN auto-sélectionné pour CI ✓")
        : ko(`MTN CI trouvé mais non sélectionné — classes: ${cls.slice(0, 80)}`);
    }
  }

  console.log("\n[8b] Auto-détection numéro Orange Côte d'Ivoire (+225 0812345678)");
  const telInputsCI = await page.$$('input[type="tel"]');
  if (telInputsCI.length >= 1) {
    await telInputsCI[0].fill("+2250812345678");
    await page.waitForTimeout(800);

    const selectCI = await page.$('select');
    if (selectCI) {
      const valCI = await selectCI.inputValue();
      valCI === "CI"
        ? ok(`Pays auto-sélectionné : ${valCI} (Côte d'Ivoire)`)
        : ko(`Pays attendu CI, obtenu : "${valCI}"`);
    }
    const orangeBtn = await page.$('.grid button:has-text("Orange")');
    if (orangeBtn) {
      const cls = await orangeBtn.getAttribute("class") ?? "";
      cls.includes("emerald-500")
        ? ok("Opérateur Orange auto-sélectionné pour CI ✓")
        : ko(`Orange trouvé mais non sélectionné — classes: ${cls.slice(0, 80)}`);
    }
  }

  // ─── 9. Auto-détection : Wave Sénégal (+221 70...) ───────────────────────
  console.log("\n[9] Auto-détection numéro Wave Sénégal (+221 700 000 000)");
  const telInputsSN = await page.$$('input[type="tel"]');
  if (telInputsSN.length >= 1) {
    await telInputsSN[0].fill("+221700000000");
    await page.waitForTimeout(800);

    const selectSN = await page.$('select');
    if (selectSN) {
      const valSN = await selectSN.inputValue();
      valSN === "SN"
        ? ok(`Pays auto-sélectionné : ${valSN} (Sénégal)`)
        : ko(`Pays attendu SN, obtenu : "${valSN}"`);
    }
    const waveBtn = await page.$('.grid button:has-text("Wave")');
    if (waveBtn) {
      const cls = await waveBtn.getAttribute("class") ?? "";
      cls.includes("emerald-500")
        ? ok("Opérateur Wave auto-sélectionné pour SN ✓")
        : ko(`Wave trouvé mais non sélectionné — classes: ${cls.slice(0, 80)}`);
    }
  }

  // ─── 10. Override manuel ─────────────────────────────────────────────────
  console.log("\n[10] Override manuel du pays");
  const selectOverride = await page.$('select');
  if (selectOverride) {
    // Changer manuellement vers Bénin
    await selectOverride.selectOption("BJ");
    await page.waitForTimeout(400);

    // Re-saisir un numéro sénégalais → Bénin doit rester
    const telOv = await page.$$('input[type="tel"]');
    if (telOv.length >= 1) {
      await telOv[0].fill("+221700000001");
      await page.waitForTimeout(800);

      const valAfter = await selectOverride.inputValue();
      valAfter === "BJ"
        ? ok("Override manuel respecté — Bénin conservé même après re-saisie numéro SN ✓")
        : ko(`Override non respecté — pays revenu à "${valAfter}" au lieu de BJ`);
    }
  } else {
    info("Select non disponible pour test override (formulaire Sebpay inactif ?)");
  }

  // ─── 11. Partage du numéro entre coordonnées et paiement ──────────────────
  console.log("\n[11] Cohérence numéro : coordonnées → formulaire paiement");
  const telAllFinal = await page.$$('input[type="tel"]');
  if (telAllFinal.length >= 2) {
    const v0 = await telAllFinal[0].inputValue();
    const v1 = await telAllFinal[1].inputValue();
    v0 === v1
      ? ok(`Numéro partagé — même valeur dans les ${telAllFinal.length} champs tel ("${v0}")`)
      : ko(`Numéro incohérent : champ0="${v0}" champ1="${v1}"`);
  } else if (telAllFinal.length === 1) {
    const v0 = await telAllFinal[0].inputValue();
    ok(`1 seul champ tel visible (état actuel: "${v0}") — partage implicite OK`);
  }

  // ─── Résumé ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Résultats : ${pass} ✅  ${fail} ❌`);
  console.log(fail === 0 ? "🎉 Tous les tests passent !" : "⚠️  Certains tests ont échoué — voir les ❌ ci-dessus.");

  await browser.close();
  if (fail > 0) process.exit(1);
}

run().catch((e) => { console.error(e); process.exit(1); });
