// Crée avec Agnes AI une photo d'activité pour chaque espace d'accompagnement qui n'en a pas.
// Usage : node scripts/visuels-espaces-agnes.mjs [--essai]   (reprend là où il s'est arrêté)
// Les photos vont dans public/espaces/<id>.webp ; l'API /api/espaces les utilise en priorité.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(racine, "package.json"));
const sharp = require("sharp");
const DOSSIER = path.join(racine, "public", "espaces");
const OUTIL = path.join(process.env.USERPROFILE || process.env.HOME, ".claude", "skills", "generer-image", "generer-image.mjs");
const essai = process.argv.includes("--essai");
const liste = process.argv.find((a) => a.startsWith("--ids="))?.slice(6).split(",");

const nomFichier = (id) => String(id).replace(/[^a-zA-Z0-9_-]/g, "_");
const sujet = (titre) => titre.normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/\s*[:—–]\s*(le |la )?guide.*$/i, "")
  .replace(/[^\p{L}\p{N}\s'&(),-]/gu, " ")
  .replace(/^\s*(le |la |l')?(guide|formation)( complet| pratique)?\s*[;,-]?\s*/i, "")
  .replace(/\s+/g, " ").trim();

// Scènes précises quand le titre seul donne une photo trop vague.
const SCENES = {
  "palmier": "A Black African farmer standing in a lush oil palm plantation, holding a big bunch of bright orange-red palm fruits, tall oil palm trees all around.",
  "topographe": "A Black African land surveyor outdoors on a construction site, looking through a yellow total station theodolite on a tripod, measuring land.",
  "chien": "A Black African dog trainer in a green garden training a healthy German Shepherd dog that sits obediently, giving it a treat, a bowl of dog food nearby.",
  "bœuf": "A Black African cattle farmer standing in a green pasture next to a herd of healthy cattle (zebu cows), touching one cow, farm in the background.",
  "bufs":"A Black African cattle farmer standing in a green pasture next to a herd of healthy cattle (zebu cows), touching one cow, farm in the background.",
  "boeufs": "A Black African cattle farmer standing in a green pasture next to a herd of healthy cattle (zebu cows), touching one cow, farm in the background.",
  "evenementielle": "A Black African event planner decorating an elegant wedding reception hall with flowers, round tables with white tablecloths, golden chairs and soft lights.",
};

const espaces = JSON.parse(fs.readFileSync(path.join(racine, "private", "espaces.json"), "utf8"))
  .filter((e) => e.actif !== false && (!liste || liste.includes(String(e.id))));
fs.mkdirSync(DOSSIER, { recursive: true });
const aFaire = espaces.filter((e) => !fs.existsSync(path.join(DOSSIER, `${nomFichier(e.id)}.webp`)));
console.log(`${aFaire.length} espace(s) à illustrer${essai ? " (essai : 1 seul)" : ""}`);

let ok = 0;
for (const e of essai ? aFaire.slice(0, 1) : aFaire) {
  const cible = path.join(DOSSIER, `${nomFichier(e.id)}.webp`);
  const t = sujet(e.titre).toLowerCase();
  const scene = Object.entries(SCENES).find(([cle]) => t.includes(cle))?.[1];
  const prompt = scene
    ? `Photorealistic wide photo, golden natural light, Cameroon / West Africa. ${scene} Inspiring, warm, professional, success mood. No text, no letters, no logo, no watermark.`
    : `Photorealistic wide photo, golden natural light, Cameroon / West Africa. A confident Black African entrepreneur at work in a real, clean and modern local business, the activity is clearly visible: "${sujet(e.titre)}". Inspiring, warm, professional, success and growth mood, shallow depth of field. No text, no letters, no logo, no watermark.`;
  try {
    const brut = execFileSync("node", [OUTIL, "--prompt", prompt, "--format", "16:9", "--taille", "1K"], { encoding: "utf8", timeout: 300_000 }).trim().split("\n").pop();
    await sharp(brut).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 78 }).toFile(cible);
    fs.rmSync(brut, { force: true });
    ok++;
    console.log(`  ✓ ${sujet(e.titre).slice(0, 60)}`);
  } catch (err) {
    console.log(`  ✗ ${sujet(e.titre).slice(0, 60)} : ${String(err.stderr || err.message).split("\n")[0]}`);
  }
}
console.log(`Terminé : ${ok} photo(s) créée(s). Regardez public/espaces/ avant de mettre en ligne.`);
