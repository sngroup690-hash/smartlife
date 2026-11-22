import { NextRequest, NextResponse } from "next/server";
import {
  getAdminByPassword,
  readAdmins,
  writeAdmins,
  type AdminAccount,
} from "@/lib/admin-auth";

function genId() {
  return `adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  const admin = getAdminByPassword(pwd);
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const admins = readAdmins().map((a) => ({ ...a, password: "••••••••" }));
  return NextResponse.json({ admins });
}

export async function POST(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  const admin = getAdminByPassword(pwd);
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.username || !body?.password || !body?.role || !body?.nom) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const admins = readAdmins();
  if (admins.some((a) => a.username === body.username)) {
    return NextResponse.json(
      { error: "Ce nom d'utilisateur existe déjà" },
      { status: 409 }
    );
  }

  const newAdmin: AdminAccount = {
    id: genId(),
    username: body.username,
    password: body.password,
    role: body.role,
    nom: body.nom,
    actif: true,
    createdAt: new Date().toISOString(),
  };

  admins.push(newAdmin);
  writeAdmins(admins);

  return NextResponse.json({
    success: true,
    admin: { ...newAdmin, password: "••••••••" },
  });
}

export async function PATCH(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  const admin = getAdminByPassword(pwd);
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const admins = readAdmins();
  const idx = admins.findIndex((a) => a.id === body.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Admin introuvable" }, { status: 404 });
  }

  admins[idx] = { ...admins[idx], ...body };
  writeAdmins(admins);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const pwd = req.headers.get("x-admin-password");
  const admin = getAdminByPassword(pwd);
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const admins = readAdmins().filter((a) => a.id !== id);
  writeAdmins(admins);

  return NextResponse.json({ success: true });
}
