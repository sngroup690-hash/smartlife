// Crée avec Agnes AI une photo « consultant qui accompagne un entrepreneur » par grand domaine,
// et écrit public/consultants-terrain/liste.json (fichier + domaine) pour la page d'accueil.
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

// [fichier, domaine affiché, scène]
const SCENES = [
  ["ferme", "Agriculture", "A Black African woman agronomy consultant in her 40s showing a young male farmer how to check healthy plant leaves in a green vegetable field, pointing and explaining, both smiling."],
  ["boutique", "Commerce de quartier", "A Black African male business consultant in his 50s with grey beard, explaining figures in a notebook to a young woman shop owner behind the counter of her small grocery store."],
  ["atelier", "Fabrication artisanale", "A young Black African woman consultant showing a male artisan how to package soap bars in a clean small workshop, she holds a finished product and explains."],
  ["elevage", "Élevage de volailles", "A Black African male livestock consultant in a poultry farm showing a woman farmer how to check the health of a chicken, holding the bird gently, both attentive."],
  ["bureau", "Création d'entreprise", "A Black African woman consultant in a bright office explaining a business plan on a laptop screen to a young male entrepreneur sitting next to her, both engaged and smiling."],
  ["marche", "Vente et marketing", "A Black African male consultant in his 30s at a colorful local market showing a woman trader how to display her fruits and vegetables to attract customers, gesturing toward the stall."],
  ["microfinance", "Microfinance", "A confident Black African male finance consultant in his 40s wearing an elegant dark navy suit and tie, in a modern microfinance office, explaining a loan document to a woman entrepreneur across a desk."],
  ["btp", "Construction et BTP", "A Black African male civil engineering consultant wearing a white helmet and reflective vest, showing building plans to a young builder on a construction site with concrete blocks."],
  ["couture", "Couture et mode", "A stylish Black African woman fashion consultant in her 30s showing a young tailor how to cut colorful African wax fabric on a table in a sewing workshop with sewing machines."],
  ["pisciculture", "Pisciculture", "A Black African male fish farming consultant standing beside an outdoor fish pond, showing a young farmer a healthy tilapia fish in a net, explaining."],
  ["informatique", "Numérique et vente en ligne", "A young Black African male digital consultant showing a woman entrepreneur how to sell on WhatsApp with a smartphone, both sitting in a modern café, smiling."],
  ["restauration", "Restauration", "A Black African woman chef consultant in a white chef jacket teaching a young cook how to plate a dish in a clean professional restaurant kitchen."],
  ["sante", "Santé et parapharmacie", "A Black African woman pharmacist consultant in a white coat showing a young man how to organize products on the shelves of a bright pharmacy."],
  ["coiffure", "Coiffure et beauté", "A Black African woman beauty consultant showing a young hairdresser a braiding technique on a client in a modern hair salon."],
  ["boulangerie", "Boulangerie et pâtisserie", "An older Black African male baker consultant with white hair showing a young apprentice how to shape bread dough in a small bakery with an oven."],
  ["immobilier", "Immobilier", "A Black African male real estate consultant in a smart light-grey suit showing a couple a newly built modern house, holding keys and a folder."],
  ["transport", "Transport et logistique", "A Black African male logistics consultant with a tablet explaining delivery routes to a young motorbike delivery driver next to boxes, in front of a small warehouse."],
  ["education", "Éducation et école", "A Black African woman education consultant in a classroom showing a young school founder how to organize the timetable on a board, children's drawings on the walls."],
  ["cosmetique", "Cosmétique", "A young Black African woman cosmetics consultant showing another woman how to fill and label small jars of natural shea butter cream at a clean worktable."],
  ["porcs", "Élevage de porcs", "A Black African male livestock consultant in boots inside a clean pig farm explaining feeding to a young farmer, healthy pigs in the pen."],
];

fs.mkdirSync(DOSSIER, { recursive: true });
let ok = 0;
for (const [nom, , scene] of SCENES) {
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
const liste = SCENES.filter(([nom]) => fs.existsSync(path.join(DOSSIER, `${nom}.webp`))).map(([nom, domaine]) => ({ src: `/consultants-terrain/${nom}.webp`, domaine }));
fs.writeFileSync(path.join(DOSSIER, "liste.json"), JSON.stringify(liste, null, 2));
console.log(`Terminé : ${ok} photo(s) créée(s), ${liste.length} au total.`);
