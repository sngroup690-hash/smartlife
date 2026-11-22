import { readPromoCodes, writePromoCodes } from "@/app/api/admin/promo-codes/route";

export async function applyPromoUsage(
  code: string,
  finalAmount: number,
  opts?: { produit?: string; reference?: string }
): Promise<void> {
  if (!code) return;
  try {
    const all = await readPromoCodes();
    const idx = all.findIndex((c) => c.code === code.toUpperCase().trim());
    if (idx === -1) return;
    const commission = Math.round(finalAmount * all[idx].commissionRate / 100);
    all[idx].uses = (all[idx].uses || 0) + 1;
    all[idx].totalRevenue = (all[idx].totalRevenue || 0) + finalAmount;
    all[idx].totalCommission = (all[idx].totalCommission || 0) + commission;
    all[idx].updatedAt = new Date().toISOString();
    await writePromoCodes(all);

    // Enregistrer la vente individuelle pour le dashboard affilié
    try {
      const { appendAffiliateSale } = await import("@/lib/affiliate-store");
      await appendAffiliateSale({
        code: all[idx].code,
        amount: finalAmount,
        commission,
        produit: opts?.produit || "Produit",
        reference: opts?.reference || "",
        date: new Date().toISOString(),
      });
    } catch { /* non bloquant */ }
  } catch {
    // non-fatal — don't block purchase confirmation
  }
}
