"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Mic, Video, ShoppingBag, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { services } from "@/lib/data";
import type { DynamicService } from "@/lib/services-data";
import { useCartStore } from "@/lib/store";
import { useCurrencyStore } from "@/lib/currency-store";
import ServiceOrderForm from "@/components/ServiceOrderForm";
import VideoPlayer from "@/components/VideoPlayer";

const STATIC_ICONS: Record<string, React.ReactNode> = {
  Mic: <Mic size={24} />,
  Video: <Video size={24} />,
  ShoppingBag: <ShoppingBag size={24} />,
};

// ─── Adapte un DynamicService vers la shape attendue par ServiceOrderForm ─────

function adaptDynamic(s: DynamicService) {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.description,
    longDescription: s.longDescription || s.description,
    icon: s.icon,
    startingPrice: s.startingPrice,
    deliveryTime: s.deliveryTime,
    features: s.features,
    packages: s.packages,
    briefLabel: s.briefLabel,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem, openCart } = useCartStore();
  const convert = useCurrencyStore((s) => s.convert);

  const staticService = services.find((s) => s.slug === slug);
  const [dynService, setDynService] = useState<DynamicService | null>(null);
  const [loading, setLoading] = useState(!staticService);

  useEffect(() => {
    if (staticService) return;
    fetch("/api/services")
      .then((r) => r.json())
      .then((data: DynamicService[]) => {
        const found = data.find((s) => s.slug === slug);
        setDynService(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, staticService]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not found
  if (!staticService && !dynService) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-white text-2xl font-bold mb-2">Service introuvable</h1>
        <p className="text-gray-500 mb-6">Ce service n&apos;existe pas ou a été supprimé.</p>
        <a href="/services" className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium">
          Voir tous les services
        </a>
      </div>
    );
  }

  // ─── Rendu service statique ─────────────────────────────────────────────────

  if (staticService) {
    function handleAddToCart(pkgIndex: number) {
      if (!staticService) return;
      const pkg = staticService.packages[pkgIndex];
      addItem({ id: `${staticService.id}-${pkgIndex}`, title: staticService.title, price: pkg.price, type: "service", packageName: pkg.name });
      openCart();
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-900 to-green-800 flex items-center justify-center text-green-300 mb-6">
              {STATIC_ICONS[staticService.icon]}
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">{staticService.title}</h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">{staticService.longDescription}</p>
            <div className="flex items-center gap-8 mb-8 p-6 bg-white/[0.03] border border-white/10 rounded-2xl">
              <div>
                <p className="text-gray-600 text-xs mb-1">À partir de</p>
                <p className="text-3xl font-bold text-[#E8B800]">{convert(staticService.startingPrice)}</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <p className="text-gray-600 text-xs mb-1">Livraison en</p>
                <div className="flex items-center gap-2 text-white font-bold text-xl">
                  <Clock size={20} className="text-green-400" />
                  {staticService.deliveryTime}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {staticService.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-gray-400 text-sm">
                  <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div className="sticky top-20">
            <ServiceOrderForm service={staticService} />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-3 text-center">Comparer les <span className="gradient-text">Forfaits</span></h2>
          <p className="text-gray-500 text-center text-sm mb-10">Vous pouvez aussi ajouter directement un forfait au panier.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {staticService.packages.map((pkg, i) => (
              <div key={pkg.name} className={`p-8 rounded-2xl border transition-all ${pkg.popular ? "bg-gradient-to-b from-green-900/30 to-green-900/20 border-green-600/60" : "bg-white/[0.03] border-white/10 hover:border-white/20"}`}>
                {pkg.popular && (
                  <div className="text-center mb-4"><span className="px-3 py-1 bg-[#E8B800] text-black text-xs font-bold rounded-full">⭐ Plus Populaire</span></div>
                )}
                <h3 className="text-white text-xl font-bold mb-2">{pkg.name}</h3>
                <div className="flex items-end gap-2 mb-6"><span className="text-3xl font-bold text-white">{convert(pkg.price)}</span></div>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-6"><Clock size={14} />Livraison : {pkg.deliveryTime}</div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-gray-400 text-sm">
                      <CheckCircle size={14} className="text-green-400 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleAddToCart(i)} className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${pkg.popular ? "bg-[#E8B800] hover:bg-[#27A827] text-black" : "border border-white/20 hover:bg-white/5 text-white"}`}>
                  Ajouter au panier <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Rendu service dynamique ────────────────────────────────────────────────

  const svc = dynService!;
  const adapted = adaptDynamic(svc);
  const minPrice = svc.packages.length > 0 ? Math.min(...svc.packages.map((p) => p.price)) : svc.startingPrice;

  function handleAddToCartDyn(pkgIndex: number) {
    const pkg = svc.packages[pkgIndex];
    addItem({ id: `${svc.id}-${pkgIndex}`, title: svc.title, price: pkg.price, type: "service", packageName: pkg.name });
    openCart();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
        <div>
          {svc.imageUrl ? (
            <img src={svc.imageUrl} alt={svc.title} loading="lazy" decoding="async" className="w-16 h-16 object-cover rounded-2xl mb-6 border border-white/10" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-900 to-green-800 flex items-center justify-center text-3xl mb-6">
              {svc.icon}
            </div>
          )}
          <h1 className="text-4xl font-bold text-white mb-4">{svc.title}</h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">{svc.longDescription || svc.description}</p>

          <div className="flex items-center gap-8 mb-8 p-6 bg-white/[0.03] border border-white/10 rounded-2xl">
            <div>
              <p className="text-gray-600 text-xs mb-1">À partir de</p>
              <p className="text-3xl font-bold text-[#E8B800]">{convert(minPrice)}</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <p className="text-gray-600 text-xs mb-1">Livraison en</p>
              <div className="flex items-center gap-2 text-white font-bold text-xl">
                <Clock size={20} className="text-green-400" />
                {svc.deliveryTime}
              </div>
            </div>
          </div>

          {svc.features.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {svc.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-gray-400 text-sm">
                  <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky top-20">
          <ServiceOrderForm service={adapted as Parameters<typeof ServiceOrderForm>[0]["service"]} />
        </div>
      </div>

      {svc.videoUrl && (
        <div className="mb-12">
          <VideoPlayer url={svc.videoUrl} title="Vidéo de présentation" />
        </div>
      )}

      {svc.packages.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold text-white mb-3 text-center">Comparer les <span className="gradient-text">Forfaits</span></h2>
          <p className="text-gray-500 text-center text-sm mb-10">Vous pouvez aussi ajouter directement un forfait au panier.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {svc.packages.map((pkg, i) => (
              <div key={pkg.name} className={`p-8 rounded-2xl border transition-all ${pkg.popular ? "bg-gradient-to-b from-green-900/30 to-green-900/20 border-green-600/60" : "bg-white/[0.03] border-white/10 hover:border-white/20"}`}>
                {pkg.popular && (
                  <div className="text-center mb-4"><span className="px-3 py-1 bg-[#E8B800] text-black text-xs font-bold rounded-full">⭐ Plus Populaire</span></div>
                )}
                <h3 className="text-white text-xl font-bold mb-2">{pkg.name}</h3>
                <div className="flex items-end gap-2 mb-6"><span className="text-3xl font-bold text-white">{convert(pkg.price)}</span></div>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-6"><Clock size={14} />Livraison : {pkg.deliveryTime}</div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-gray-400 text-sm">
                      <CheckCircle size={14} className="text-green-400 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleAddToCartDyn(i)} className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${pkg.popular ? "bg-[#E8B800] hover:bg-[#27A827] text-black" : "border border-white/20 hover:bg-white/5 text-white"}`}>
                  Ajouter au panier <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
