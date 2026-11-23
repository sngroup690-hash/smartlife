"use client";

import { XCircle, ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-24 h-24 rounded-full bg-[var(--g-doux)] flex items-center justify-center mb-8">
        <XCircle size={48} className="text-[var(--g-gris)]" />
      </div>
      <h1 className="text-[var(--g-encre)] text-3xl font-semibold tracking-[-0.02em] mb-3">Paiement annulé</h1>
      <p className="text-[var(--g-gris)] max-w-md mb-8">
        Votre paiement a été annulé. Aucun montant n&apos;a été débité.
        Vos articles sont toujours dans votre panier.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/checkout"
          className="g-btn"
        >
          <ShoppingCart size={18} /> Réessayer le paiement
        </Link>
        <Link
          href="/ebooks"
          className="g-btn-ghost"
        >
          <ArrowLeft size={18} /> Retour aux ebooks
        </Link>
      </div>
    </div>
  );
}
