// Crée avec Agnes AI des photos « consultant qui accompagne un entrepreneur » pour la page d'accueil.
// Usage : node scripts/photos-consultants-agnes.mjs   (reprend là où il s'est arrêté)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(racine, "package.json"));
const sharp = require("sharp");
const DOSSIER = path.join(racine, "public", "consultants-terrain");
const OUTIL = path.join(process.env.USERPROFILE || process.env.HOME, ".claude", "skills", "generer-image", "generer-image.mjs");

const SCENES = [
  ["ferme", "A Black African woman agronomy consultant in her 40s showing a young male farmer how to check healthy plant leaves in a green vegetable field, pointing and explaining, both smiling."],
  ["boutique", "A Black African male business consultant in his 50s with grey beard, explaining figures in a notebook to a young woman shop owner behind the counter of her small grocery store."],
  ["atelier", "A young Black African woman consultant showing a male artisan how to package soap bars in a clean small workshop, she holds a finished product and explains."],
  ["elevage", "A Black African male livestock consultant in a poultry farm showing a woman farmer how to check the health of a chicken, holding the bird gently, both attentive."],
  ["bureau", "A Black African woman consultant in a bright office explaining a business plan on a laptop screen to a young male entrepreneur sitting next to her, both engaged and smiling."],
  ["marche", "A Black African male consultant in his 30s at a colorful local market showing a woman trader how to display her fruits and vegetables to attract customers, gesturing toward the stall."],
];

fs.mkdirSync(DOSSIER, { recursive: true });
let ok = 0;
for (const [nom, scene] of SCENES) {
  const cible = path.join(DOSSIER, `${nom}.webp`);
  if (fs.existsSync(cible)) continue;
  const prompt = `Photorealistic wide photo, golden natural light, Cameroon / West Africa. ${scene} Warm, trustworthy, mentoring and teaching mood, professional, shallow depth of field. No text, no letters, no logo, no watermark.`;
  try {
    const brut = execFileSync("node", [OUTIL, "--prompt", prompt, "--format", "4:3", "--taille", "1K"], { encoding: "utf8", timeout: 300_000 }).trim().split("\n").pop();
    await sharp(brut).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 78 }).toFile(cible);
    fs.rmSync(brut, { force: true });
    ok++;
    console.log(`  ✓ ${nom}`);
  } catch (err) {
    console.log(`  ✗ ${nom} : ${String(err.stderr || err.message).split("\n")[0]}`);
  }
}
console.log(`Terminé : ${ok} photo(s) créée(s).`);
