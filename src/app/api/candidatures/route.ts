import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { enregistrerCandidature } from "@/lib/smart-crm";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FILE = path.join(process.cwd(), "private", "candidatures_consultant.json");
const CONSULTANTS_FILE = path.join(process.cwd(), "private", "consultants.json");

async function readConsultants(): Promise<Record<string, unknown>[]> {
  try {
    const raw = await readFile(CONSULTANTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeConsultants(data: unknown[]) {
  await mkdir(path.dirname(CONSULTANTS_FILE), { recursive: true });
  await writeFile(CONSULTANTS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function readAll(): Promise<Record<string, unknown>[]> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeAll(data: unknown[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function notifierAdmin(entry: Record<string, unknown>) {
  const cle = process.env.RESEND_API_KEY;
  const dest = process.env.ADMIN_EMAIL || "sngroup690@gmail.com";
  const from = process.env.EMAIL_FROM || "noreply@smartlifecm.com";
  if (!cle) { console.log("ℹ️  RESEND_API_KEY absent — notification candidature non envoyée"); return; }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: dest,
        subject: `🆕 Nouveau consultant : ${entry.prenom} ${entry.nom}`,
        html: `<h2>Nouvelle candidature consultant</h2>
<p><strong>Nom :</strong> ${entry.prenom} ${entry.nom}</p>
<p><strong>Email :</strong> ${entry.email}</p>
<p><strong>Téléphone :</strong> ${entry.telephone}</p>
<p><strong>Ville :</strong> ${entry.ville}</p>
<p><strong>Date de naissance :</strong> ${entry.dateNaissance || "—"}</p>
${entry.photoUrl ? `<p><img src="${entry.photoUrl}" width="120" style="border-radius:50%" /></p>` : ""}
<p style="margin-top:16px"><a href="https://smartlifecm.com/admin/consultants">Voir dans l'admin →</a></p>`,
      }),
    });
    console.log(`✅ Notification candidature envoyée à ${dest}`);
  } catch (err) {
    console.error("Erreur notification candidature:", err);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prenom, nom, email, telephone, ville, dateNaissance, photoUrl, convention } = body;

  if (!prenom || !nom || !email || !telephone || !ville) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }
  if (!photoUrl) {
    return NextResponse.json({ error: "La photo de profil est obligatoire." }, { status: 400 });
  }

  const all = await readAll();
  const now = new Date().toISOString();
  const entry = {
    id: crypto.randomUUID(),
    prenom: prenom.trim(),
    nom: nom.trim(),
    email: email.trim().toLowerCase(),
    telephone: telephone.trim(),
    ville: ville.trim(),
    dateNaissance: dateNaissance || undefined,
    photoUrl: photoUrl?.trim() || undefined,
    convention: convention ?? false,
    lu: false,
    statut: "en_attente",
    noteAdmin: "",
    createdAt: now,
    updatedAt: now,
  };

  all.push(entry);
  await writeAll(all);

  enregistrerCandidature({
    email: email.trim().toLowerCase(),
    nom: `${prenom.trim()} ${nom.trim()}`,
    telephone: telephone.trim(),
  }).catch(() => {});

  notifierAdmin(entry).catch(() => {});

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("password");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const all = await readAll();
  return NextResponse.json({ candidatures: all });
}

export async function PATCH(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("password");
  const id = req.nextUrl.searchParams.get("id");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!id) {
    return NextResponse.json({ error: "ID requis." }, { status: 400 });
  }

  const body = await req.json();
  const { statut, noteAdmin, lu } = body;
  const all = await readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
  }

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (statut !== undefined) patch.statut = statut;
  if (noteAdmin !== undefined) patch.noteAdmin = noteAdmin;
  if (lu !== undefined) patch.lu = lu;
  all[idx] = { ...all[idx], ...patch };
  await writeAll(all);

  // Quand une candidature est validée, créer automatiquement le consultant côté serveur
  if (statut === "validee") {
    const candidature = all[idx] as Record<string, unknown>;
    const consultants = await readConsultants();
    const alreadyExists = consultants.some((c) => (c as Record<string, unknown>).candidatureId === id);
    if (!alreadyExists) {
      consultants.push({
        id: crypto.randomUUID(),
        candidatureId: id,
        prenom: candidature.prenom,
        nom: candidature.nom,
        ville: candidature.ville,
        anneesExperience: candidature.anneesExperience,
        motivation: candidature.motivation,
        portfolioUrl: candidature.portfolioUrl,
        photoUrl: candidature.photoUrl,
        domainesIds: candidature.domainesIds ?? [],
        clientsAccompa: 0,
        entreprisesAccompa: 0,
        actif: true,
        createdAt: new Date().toISOString(),
      });
      await writeConsultants(consultants);
    }
  }

  return NextResponse.json({ success: true, candidature: all[idx] });
}
