import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(__dirname, "..");
const packsFile = path.join(racine, "private", "packs-data.json");
const sortie = path.join(racine, "public", "packs");

// Lire la clé Agnes
const cleAgnes = fs.readFileSync(
  path.join(process.env.USERPROFILE || process.env.HOME, ".agnes-ai", "api_key"),
  "utf-8"
).trim();

// Charger les packs
const data = JSON.parse(fs.readFileSync(packsFile, "utf-8"));
const packs = data.packs;

fs.mkdirSync(sortie, { recursive: true });

async function genererImage(prompt) {
  const res = await fetch("https://apihub.agnes-ai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cleAgnes}`,
    },
    body: JSON.stringify({
      model: "agnes-image-2.5-flash",
      prompt,
      n: 1,
      size: "1024x1024",
      extra_body: { response_format: "url" },
    }),
  });
  if (!res.ok) throw new Error(`Agnes ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.data[0].url;
}

async function telechargerEtConvertir(url, dest) {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  // Convertir en webp avec sharp
  const sharp = (await import("sharp")).default;
  await sharp(buffer).resize(800, 800, { fit: "cover" }).webp({ quality: 82 }).toFile(dest);
}

let crees = 0;
let erreurs = 0;

for (const pack of packs) {
  const fichier = path.join(sortie, `${pack.slug}.webp`);

  // Sauter si déjà fait
  if (fs.existsSync(fichier)) {
    console.log(`  ⏭ ${pack.nom} — déjà fait`);
    continue;
  }

  // Construire un prompt basé sur le nom du pack
  const sujet = pack.nom.replace(/^Pack\s+/i, "");
  const prompt = `Professional product bundle cover for African market: "${sujet}". Clean modern design with warm colors, showing 3-4 digital guides/ebooks stacked together with a golden ribbon or badge saying "PACK". African context, vibrant, professional, no text overlay except the ribbon. Studio lighting, white/light background.`;

  console.log(`🎨 ${pack.nom}...`);

  try {
    const url = await genererImage(prompt);
    await telechargerEtConvertir(url, fichier);

    // Mettre à jour le pack avec le chemin de la couverture
    pack.image = `/packs/${pack.slug}.webp`;
    crees++;
    console.log(`  ✓ ${pack.nom}`);
  } catch (e) {
    erreurs++;
    console.log(`  ✗ ${pack.nom} : ${e.message}`);
  }

  // Petite pause pour ne pas surcharger Agnes
  await new Promise((r) => setTimeout(r, 2000));
}

// Sauvegarder les packs mis à jour
fs.writeFileSync(packsFile, JSON.stringify(data, null, 2));
console.log(`\nTerminé : ${crees} visuels créés, ${erreurs} erreurs.`);
