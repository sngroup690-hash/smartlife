// Crée 2 photos par guide (avec Agnes AI) pour les descriptions qui en ont moins de 2, puis les insère dans le texte.
// Usage : node scripts/photos-guides-agnes.mjs [--essai]   (--essai : un seul guide, pour vérifier)
// La clé Agnes est lue dans ~/.agnes-ai/api_key (ou la variable AGNES_API_KEY). Les photos vont dans public/guides/.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(racine, "package.json"));
const sharp = require("sharp");
const FICHIER = path.join(racine, "private", "ebooks-data.json");
const DOSSIER = path.join(racine, "public", "guides");
const OUTIL = path.join(process.env.USERPROFILE || process.env.HOME, ".claude", "skills", "generer-image", "generer-image.mjs");
const essai = process.argv.includes("--essai");

const SCENES = [
  "at work, hands-on, in a real local workshop or farm, showing the activity clearly",
  "proudly showing the finished products to a happy customer at a local market stall",
];

const sujet = (titre) => titre
  .replace(/^(le |la |l')?(guide|formation)( complet| pratique| complète)?\s*[:;—,-]?\s*/i, "")
  .replace(/—.*$/, "").replace(/\s+/g, " ").trim();

const d = JSON.parse(fs.readFileSync(FICHIER, "utf8"));
const aTraiter = d.ebooks.filter((e) => e.actif !== false && !e.deletedAt && (String(e.description || "").match(/<img\s/gi) || []).length < 2);
fs.mkdirSync(DOSSIER, { recursive: true });
console.log(`${aTraiter.length} guide(s) à illustrer${essai ? " (essai : 1 seul)" : ""}`);

for (const e of essai ? aTraiter.slice(0, 1) : aTraiter) {
  const photos = [];
  for (let i = 0; i < SCENES.length; i++) {
    const cible = path.join(DOSSIER, `${e.id}-${i + 1}.webp`);
    if (!fs.existsSync(cible)) {
      const prompt = `Photorealistic photo, natural light, Cameroon / West Africa. A Black African entrepreneur ${SCENES[i]}. Subject of the activity: "${sujet(e.title)}". Authentic, warm, professional, no text, no logo, no watermark.`;
      try {
        const brut = execFileSync("node", [OUTIL, "--prompt", prompt, "--format", "4:3", "--taille", "1K"], { encoding: "utf8", timeout: 300_000 }).trim().split("\n").pop();
        await sharp(brut).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 78 }).toFile(cible);
        fs.rmSync(brut, { force: true });
      } catch (err) {
        console.log(`  ✗ ${e.title.slice(0, 50)} — photo ${i + 1} : ${String(err.stderr || err.message).split("\n")[0]}`);
        continue;
      }
    }
    photos.push(`/guides/${e.id}-${i + 1}.webp`);
  }
  if (photos.length === 0) continue;
  // Une photo après le 2e titre, une avant « Ce que tu reçois » (ou en fin de texte).
  let html = e.description;
  const titres = [...html.matchAll(/<\/h2>/gi)].map((m) => m.index + 5);
  const insere = (h, pos, src) => h.slice(0, pos) + `<p><img src="${src}" alt="${e.title.replace(/"/g, "")}" /></p>` + h.slice(pos);
  if (photos[1]) {
    const pos2 = titres[3] ?? html.length;
    html = insere(html, pos2, photos[1]);
  }
  html = insere(html, titres[1] ?? titres[0] ?? 0, photos[0]);
  e.description = html;
  fs.writeFileSync(FICHIER, JSON.stringify(d, null, 2));
  console.log(`  ✓ ${e.title.slice(0, 60)} (${photos.length} photo(s))`);
}
console.log("Terminé. Regardez les photos dans public/guides/ avant de mettre en ligne.");
