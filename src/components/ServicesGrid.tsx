"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Mic, Video, ShoppingBag, ArrowRight, Clock, CheckCircle, Search, X } from "lucide-react";
import { formatPrice, type Service } from "@/lib/data";
import type { DynamicService } from "@/lib/services-data";
import { fuzzyScore, normalize } from "@/lib/search-utils";

const STATIC_ICONS: Record<string, React.ReactNode> = {
  Mic: <Mic size={32} />,
  Video: <Video size={32} />,
  ShoppingBag: <ShoppingBag size={32} />,
};

function DynamicIcon({ icon }: { icon: string }) {
  return (
    <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl mb-6">
      {icon}
    </div>
  );
}

function scoreService(query: string, title: string, description: string, longDescription: string, features: string[]): number {
  return fuzzyScore(query, title, [
    { text: longDescription || description, weight: 3 },
    { text: features.join(" "), weight: 4 },
  ]);
}

interface Props {
  staticServices: Service[];
  dynamicServices: DynamicService[];
}

type AnyService = { kind: "static"; data: Service } | { kind: "dynamic"; data: DynamicService };

export default function ServicesGrid({ staticServices, dynamicServices }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = useCallback((val: string) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(val), 180);
  }, []);

  const allServices: AnyService[] = [
    ...staticServices.map((s) => ({ kind: "static" as const, data: s })),
    ...dynamicServices.map((s) => ({ kind: "dynamic" as const, data: s })),
  ];

  const filtered: AnyService[] = query.trim()
    ? allServices
        .map((item) => {
          const s = item.data;
          const score = scoreService(query, s.title, s.description, s.longDescription, s.features ?? []);
          return { item, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item)
    : allServices;

  const totalCount = allServices.length;
  const isSearching = query.trim().length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* En-tête */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Nos <span className="gradient-text">Services</span> Professionnels
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Des prestations sur mesure pour les particuliers, commerçants et entreprises. Qualité garantie, délais respectés.
        </p>
        <p className="text-gray-400 text-sm mt-3">
          {totalCount} service{totalCount > 1 ? "s" : ""} disponible{totalCount > 1 ? "s" : ""}
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="max-w-xl mx-auto mb-14 relative">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-4 text-gray-400 pointer-events-none z-10" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInput(e.target.value)}
            placeholder='Rechercher un service… ex : "voix off", "vidéo", "sourcing"'
            className="w-full pl-11 pr-11 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:outline-none bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 shadow-sm transition-colors"
          />
          {inputValue && (
            <button
              onClick={() => handleInput("")}
              className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {isSearching && (
          <p className="text-sm text-center mt-3">
            {filtered.length === 0 ? (
              <span className="text-orange-600 font-medium">
                Aucun résultat pour &laquo;&nbsp;{query}&nbsp;&raquo;
              </span>
            ) : (
              <>
                <span className="font-bold text-green-700">{filtered.length}</span>
                {" "}service{filtered.length > 1 ? "s" : ""} pour &laquo;&nbsp;
                <span className="font-bold">{query}</span>&nbsp;&raquo;
              </>
            )}
          </p>
        )}
      </div>

      {/* Liste des services */}
      {filtered.length === 0 && isSearching ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-gray-800 font-bold text-xl mb-2">Aucun service trouvé</h3>
          <p className="text-gray-500 mb-4">Essayez d&apos;autres mots-clés</p>
          <button
            onClick={() => handleInput("")}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors"
          >
            Voir tous les services
          </button>
        </div>
      ) : (
        <div className="space-y-16">
          {filtered.map((item, idx) => {
            if (item.kind === "static") {
              const service = item.data;
              return (
                <div
                  key={service.id}
                  id={service.id}
                  className={`grid lg:grid-cols-2 gap-12 items-center`}
                >
                  <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-6">
                      {STATIC_ICONS[service.icon]}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">{service.title}</h2>
                    <p className="text-gray-600 leading-relaxed mb-8">{service.longDescription}</p>
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {service.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-gray-600 text-sm">
                          <CheckCircle size={14} className="text-green-400 shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-6 mb-8">
                      <div>
                        <p className="text-gray-600 text-xs mb-1">À partir de</p>
                        <p className="text-2xl font-bold text-[#E8B800]">{formatPrice(service.startingPrice)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Délai de livraison</p>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <Clock size={16} className="text-green-400" />
                          {service.deliveryTime}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/services/${service.slug}`}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all"
                    >
                      Commander ce service <ArrowRight size={18} />
                    </Link>
                  </div>
                  <div className={`space-y-4 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                    {service.packages.map((pkg) => (
                      <div
                        key={pkg.name}
                        className={`p-6 rounded-2xl border transition-all ${pkg.popular ? "bg-green-50 border-green-400/50" : "bg-white border-gray-200 shadow-sm"}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-gray-900 font-bold text-lg">{pkg.name}</h3>
                            {pkg.popular && (
                              <span className="px-2 py-0.5 bg-[#E8B800] text-black text-xs font-bold rounded-full">Populaire</span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-gray-900 font-bold text-xl">{formatPrice(pkg.price)}</p>
                            <p className="text-gray-600 text-xs">{pkg.deliveryTime}</p>
                          </div>
                        </div>
                        <ul className="space-y-2">
                          {pkg.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-gray-600 text-sm">
                              <CheckCircle size={13} className="text-green-400 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // Service dynamique
            const service = item.data;
            const minPrice = service.packages.length > 0
              ? Math.min(...service.packages.map((p) => p.price))
              : service.startingPrice;

            return (
              <div key={service.id} id={service.id} className="grid lg:grid-cols-2 gap-12 items-center">
                <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                  {service.imageUrl ? (
                    <img src={service.imageUrl} alt={service.title} className="w-16 h-16 object-cover rounded-2xl mb-6 border border-gray-200" />
                  ) : (
                    <DynamicIcon icon={service.icon} />
                  )}
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{service.title}</h2>
                  <p className="text-gray-600 leading-relaxed mb-8">{service.longDescription || service.description}</p>
                  {service.features.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {service.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-gray-600 text-sm">
                          <CheckCircle size={14} className="text-green-400 shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-6 mb-8">
                    <div>
                      <p className="text-gray-600 text-xs mb-1">À partir de</p>
                      <p className="text-2xl font-bold text-[#E8B800]">{formatPrice(minPrice)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs mb-1">Délai de livraison</p>
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Clock size={16} className="text-green-400" />
                        {service.deliveryTime}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/services/${service.slug}`}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all"
                  >
                    Commander ce service <ArrowRight size={18} />
                  </Link>
                </div>
                <div className={`space-y-4 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                  {service.packages.length > 0 ? service.packages.map((pkg) => (
                    <div
                      key={pkg.name}
                      className={`p-6 rounded-2xl border transition-all ${pkg.popular ? "bg-green-50 border-green-400/50" : "bg-white border-gray-200 shadow-sm"}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-gray-900 font-bold text-lg">{pkg.name}</h3>
                          {pkg.popular && (
                            <span className="px-2 py-0.5 bg-[#E8B800] text-black text-xs font-bold rounded-full">Populaire</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900 font-bold text-xl">{formatPrice(pkg.price)}</p>
                          <p className="text-gray-600 text-xs">{pkg.deliveryTime}</p>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {pkg.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-gray-600 text-sm">
                            <CheckCircle size={13} className="text-green-400 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )) : (
                    <div className="p-8 rounded-2xl border border-gray-200 bg-white text-center">
                      <p className="text-gray-400 text-sm">Contactez-nous pour un devis personnalisé.</p>
                      <Link href="/contact" className="mt-3 inline-block text-green-600 font-medium text-sm hover:underline">
                        Demander un devis →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA bas de page */}
      <div className="mt-24 text-center p-12 rounded-3xl bg-gray-50 border border-gray-200">
        <div className="text-4xl mb-4">💬</div>
        <h3 className="text-gray-900 text-3xl font-bold mb-4">Besoin d&apos;une offre personnalisée ?</h3>
        <p className="text-gray-600 max-w-xl mx-auto mb-8">
          Vous avez des besoins spécifiques ? Contactez-nous pour un devis gratuit et une solution 100% adaptée à votre projet.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl transition-all"
        >
          Demander un devis gratuit <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
