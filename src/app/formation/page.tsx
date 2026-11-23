import { redirect } from "next/navigation";
import { formationsActives } from "@/lib/reglages-site";
import CatalogueFormations from "./CatalogueFormations";

export const dynamic = "force-dynamic";

// Formations masquées depuis l'administration : le catalogue renvoie vers les guides.
export default async function FormationPage() {
  if (!(await formationsActives())) redirect("/ebooks");
  return <CatalogueFormations />;
}
