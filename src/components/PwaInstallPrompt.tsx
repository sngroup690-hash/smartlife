"use client";

import { useEffect, useState } from "react";
import { X, Smartphone } from "lucide-react";

const DISMISSED_KEY = "sl-pwa-prompt-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    /* Détecter iOS Safari (pas Chrome/Firefox sur iOS) */
    const ua = navigator.userAgent;
    const isIosSafari =
      /iphone|ipad|ipod/i.test(ua) &&
      !/(crios|fxios|opios|mercury)/i.test(ua);

    /* Détecter si déjà installée (standalone) */
    const isStandalone =
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (isStandalone) return;

    if (isIosSafari) {
      setIsIos(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  }

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
      <div className="w-9 h-9 rounded-lg bg-[#E8B800] flex items-center justify-center flex-shrink-0">
        <Smartphone size={18} className="text-black" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-900 text-sm font-bold mb-0.5">
          Accès hors-ligne disponible
        </p>
        {isIos ? (
          <p className="text-gray-600 text-xs leading-relaxed">
            Installez l&apos;app : appuyez sur{" "}
            <span className="font-semibold">Partager</span>{" "}
            <span className="inline-block">⎋</span>{" "}
            puis <span className="font-semibold">Sur l&apos;écran d&apos;accueil</span> dans Safari.
          </p>
        ) : (
          <p className="text-gray-600 text-xs leading-relaxed">
            Installez l&apos;appli pour accéder à vos achats même sans connexion.
          </p>
        )}
        {!isIos && deferredPrompt && (
          <button
            onClick={install}
            className="mt-2 px-3 py-1.5 bg-[#E8B800] hover:bg-amber-500 text-black text-xs font-bold rounded-lg transition-colors">
            Installer
          </button>
        )}
      </div>
      <button
        onClick={dismiss}
        className="text-gray-400 hover:text-gray-700 flex-shrink-0 transition-colors"
        aria-label="Fermer">
        <X size={16} />
      </button>
    </div>
  );
}
