"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function EbookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Ebook page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-red-500 font-bold text-base">Erreur : {error.message}</p>
      {error.digest && (
        <p className="text-gray-400 text-xs font-mono">digest: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#E8B800] text-black font-bold rounded-xl text-sm"
        >
          Réessayer
        </button>
        <Link href="/ebooks" className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl text-sm">
          Retour aux ebooks
        </Link>
      </div>
    </div>
  );
}
