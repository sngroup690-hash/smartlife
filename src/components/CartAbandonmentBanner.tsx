"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingCart, X, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useUserStore } from "@/lib/user-store";

const REMINDER_DELAY_MS = 15 * 60 * 1000; // 15 minutes
const DEBOUNCE_MS = 4000;

export default function CartAbandonmentBanner() {
  const items = useCartStore((s) => s.items);
  const cartToken = useCartStore((s) => s.cartToken);
  const cartSavedAt = useCartStore((s) => s.cartSavedAt);
  const cartReminderDismissedAt = useCartStore((s) => s.cartReminderDismissedAt);
  const setCartSavedAt = useCartStore((s) => s.setCartSavedAt);
  const dismissCartReminder = useCartStore((s) => s.dismissCartReminder);
  const openCart = useCartStore((s) => s.openCart);
  const email = useUserStore((s) => s.currentUser?.email);

  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync cart to server on changes (debounced)
  useEffect(() => {
    if (!mounted) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cartToken, items, email: email ?? undefined }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.savedAt !== undefined) setCartSavedAt(d.savedAt);
        })
        .catch(() => {});
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, mounted]);

  // Determine whether to show the banner
  useEffect(() => {
    if (!mounted) return;
    const nonFormation = items.filter((i) => i.type !== "formation");
    if (nonFormation.length === 0 || !cartSavedAt) {
      setShow(false);
      return;
    }
    const savedMs = new Date(cartSavedAt).getTime();
    if (Date.now() - savedMs < REMINDER_DELAY_MS) {
      setShow(false);
      return;
    }
    if (
      cartReminderDismissedAt &&
      new Date(cartReminderDismissedAt) >= new Date(cartSavedAt)
    ) {
      setShow(false);
      return;
    }
    setShow(true);
  }, [mounted, items, cartSavedAt, cartReminderDismissedAt]);

  if (!show) return null;

  const nonFormationItems = items.filter((i) => i.type !== "formation");
  const count = nonFormationItems.reduce((s, i) => s + i.quantity, 0);
  const total = nonFormationItems.reduce((s, i) => s + i.price * i.quantity, 0);

  function handleViewCart() {
    dismissCartReminder();
    setShow(false);
    openCart();
  }

  function handleDismiss() {
    dismissCartReminder();
    setShow(false);
  }

  return (
    <div className="fixed bottom-24 left-0 right-0 lg:bottom-6 z-[60] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-[#1a1a1a] border border-[#E8B800]/40 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#E8B800]/15 flex items-center justify-center mt-0.5">
          <ShoppingCart size={16} className="text-[#E8B800]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">
            Votre panier vous attend !
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            {count} article{count > 1 ? "s" : ""} — {total.toLocaleString("fr-FR")} FCFA
          </p>
          <button
            onClick={handleViewCart}
            className="mt-2 flex items-center gap-1 text-[#E8B800] text-xs font-semibold hover:text-[#27A827] transition-colors"
          >
            Voir mon panier <ArrowRight size={12} />
          </button>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-gray-600 hover:text-gray-300 rounded-lg transition-colors"
          aria-label="Fermer"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
