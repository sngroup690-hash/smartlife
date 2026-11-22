"use client";

import { useEffect } from "react";
import { X, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { PaymentBadges } from "@/components/PaymentBadges";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/data";
import { PriceTag } from "@/components/PriceTag";

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, removeFormations } = useCartStore();

  useEffect(() => {
    removeFormations();
  }, [removeFormations]);

  const visibleItems = items.filter((i) => i.type !== "formation");
  const total = visibleItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={closeCart}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-gray-200 z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">Mon Panier</h2>
            {visibleItems.length > 0 && (
              <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold">
                {visibleItems.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <ShoppingCart size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium">Votre panier est vide</p>
              <p className="text-gray-500 text-sm mt-1">Ajoutez des ebooks pour commencer</p>
              <button
                onClick={closeCart}
                className="mt-6 px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              >
                Découvrir nos produits
              </button>
            </div>
          ) : (
            visibleItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-xs text-center px-1">
                  📖
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium line-clamp-2">{item.title}</p>
                  {item.packageName && (
                    <p className="text-gray-500 text-xs mt-0.5">{item.packageName}</p>
                  )}
                  <p className="text-[#E8B800] font-bold text-sm mt-1">
                    <PriceTag amount={item.price} />
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    >
                      <Minus size={12} className="text-gray-700" />
                    </button>
                    <span className="text-gray-900 text-sm w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    >
                      <Plus size={12} className="text-gray-700" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {visibleItems.length > 0 && (
          <div className="p-6 border-t border-gray-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="text-gray-900 text-xl font-bold"><PriceTag amount={total} /></span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full text-center py-3 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all"
            >
              Passer la commande →
            </Link>
            <PaymentBadges />
            <button
              onClick={closeCart}
              className="block w-full text-center py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm rounded-xl transition-colors"
            >
              Continuer les achats
            </button>
          </div>
        )}
      </div>
    </>
  );
}
