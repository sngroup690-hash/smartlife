import { CheckCircle, Home } from "lucide-react";
import Link from "next/link";

export default async function PayLinkSuccess({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; amount?: string }>;
}) {
  const { name, amount } = await searchParams;

  const formattedAmount = amount
    ? new Intl.NumberFormat("fr-FR").format(Number(amount)) + " FCFA"
    : null;

  return (
    <div className="min-h-screen bg-[#f9f8f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-md text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={40} className="text-[#27A827]" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Paiement confirmé !</h1>
          {name && (
            <p className="text-gray-600 text-sm">
              Votre paiement pour <strong className="text-gray-900">{name}</strong>
              {formattedAmount && <> de <strong className="text-[#27A827]">{formattedAmount}</strong></>}
              {" "}a bien été reçu.
            </p>
          )}
          {!name && (
            <p className="text-gray-600 text-sm">Votre paiement a bien été reçu et enregistré.</p>
          )}
        </div>

        <div className="bg-[#27A827]/8 border border-[#27A827]/20 rounded-2xl p-4 text-left space-y-1.5">
          <p className="text-[#27A827] text-sm font-bold">✓ Transaction enregistrée</p>
          <p className="text-gray-600 text-xs">Un reçu de confirmation vous sera envoyé par email si vous en avez fourni un.</p>
        </div>

        <Link
          href="/"
          className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Home size={15} /> Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
