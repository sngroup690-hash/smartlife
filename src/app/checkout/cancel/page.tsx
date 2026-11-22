"use client";

import { XCircle, ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-24 h-24 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-8">
        <XCircle size={48} className="text-red-500" />
      </div>
      <h1 className="text-gray-900 text-3xl font-bold mb-3">Paiement annulé</h1>
      <p className="text-gray-600 font-bold max-w-md mb-8">
        Votre paiement a été annulé. Aucun montant n&apos;a été débité.
        Vos articles sont toujours dans votre panier.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/checkout"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all"
        >
          <ShoppingCart size={18} /> Réessayer le paiement
        </Link>
        <Link
          href="/ebooks"
          className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-900 font-bold rounded-xl transition-colors"
        >
          <ArrowLeft size={18} /> Retour aux ebooks
        </Link>
      </div>
    </div>
  );
}
