import fs from "fs";
import path from "path";
import { type AdminRole } from "@/lib/admin-roles";

export type { AdminRole } from "@/lib/admin-roles";
export { ROLE_CONFIG } from "@/lib/admin-roles";

const MASTER_PASSWORD = process.env.ADMIN_PASSWORD ?? (() => { throw new Error("Variable d'environnement ADMIN_PASSWORD manquante"); })() as string;
const ADMINS_FILE = path.join(process.cwd(), "private", "admins.json");

export type AdminAccount = {
  id: string;
  username: string;
  password: string;
  role: AdminRole;
  nom: string;
  actif: boolean;
  createdAt: string;
};

export function readAdmins(): AdminAccount[] {
  try {
    return JSON.parse(fs.readFileSync(ADMINS_FILE, "utf-8")) as AdminAccount[];
  } catch {
    return [];
  }
}

export function writeAdmins(admins: AdminAccount[]): void {
  fs.mkdirSync(path.dirname(ADMINS_FILE), { recursive: true });
  fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2), "utf-8");
}

export function isValidAdminPassword(password: string | null | undefined): boolean {
  if (!password) return false;
  if (password === MASTER_PASSWORD) return true;
  const admins = readAdmins();
  return admins.some((a) => a.password === password && a.actif !== false);
}

export function getAdminByPassword(password: string | null | undefined): AdminAccount | null {
  if (!password) return null;
  if (password === MASTER_PASSWORD) {
    return {
      id: "master",
      username: "admin",
      password: MASTER_PASSWORD,
      role: "super_admin",
      nom: "Super Administrateur",
      actif: true,
      createdAt: "2024-01-01T00:00:00.000Z",
    };
  }
  const admins = readAdmins();
  return admins.find((a) => a.password === password && a.actif !== false) ?? null;
}

export function getAdminByCredentials(
  username: string,
  password: string
): AdminAccount | null {
  if (!password) return null;
  if (
    (username === "" || username === "admin") &&
    password === MASTER_PASSWORD
  ) {
    return {
      id: "master",
      username: "admin",
      password: MASTER_PASSWORD,
      role: "super_admin",
      nom: "Super Administrateur",
      actif: true,
      createdAt: "2024-01-01T00:00:00.000Z",
    };
  }
  const admins = readAdmins();
  return (
    admins.find(
      (a) =>
        a.username === username &&
        a.password === password &&
        a.actif !== false
    ) ?? null
  );
}
