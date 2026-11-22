import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import path from "path";
import type { PaymentLink } from "@/app/api/admin/payment-links/route";
import PayLinkClient from "./PayLinkClient";

async function getLink(id: string): Promise<PaymentLink | null> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "private", "payment-links.json"),
      "utf-8"
    );
    const links: PaymentLink[] = JSON.parse(raw);
    return links.find((l) => l.id === id && l.active) ?? null;
  } catch {
    return null;
  }
}

export default async function PayLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const link = await getLink(id);
  if (!link) notFound();
  return <PayLinkClient link={link} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const link = await getLink(id);
  if (!link) return { title: "Lien expiré" };
  return {
    title: `Payer — ${link.name}`,
    description: link.description || `Paiement sécurisé pour : ${link.name}`,
  };
}
