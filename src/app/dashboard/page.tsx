"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, Package, Download,
  Star, ArrowRight, LogOut, Loader2, Play, Monitor,
  Crown, CheckCircle, AlertCircle, X, Zap, Users, Gift,
} from "lucide-react";
import { useUserStore } from "@/lib/user-store";
import { useCatalogueStore, type FormationAdmin } from "@/lib/catalogue-store";
import { ebooks as staticEbooks } from "@/lib/data";
import { FORMATIONS } from "@/lib/formations-data";
import { useFormationProgressStore } from "@/lib/formation-progress-store";

type Tab = "overview" | "downloads" | "formations" | "referral" | "vip";

function CertDownloadButton({ formationId }: { formationId: string }) {
  const { currentUser } = useUserStore();
  const [url, setUrl] = useState<string | null>(null);
  const [certId, setCertId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/formation/${formationId}/certificate?checkUid=${encodeURIComponent(currentUser.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.certId) { setCertId(d.certId); setUrl(d.downloadUrl); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [formationId, currentUser]);

  if (loading) return null;
  if (!url) return null;

  return (
    <a
      href={url}
      download
      title={`Certificat ${certId}`}
      className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all flex-shrink-0"
    >
      🎓 Certificat
    </a>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn, ebooksAchetes, formationsAchetees, logout, ajouterFormationsAchetees, ajouterEbooksAchetes } = useUserStore();
  const catalogue = useCatalogueStore();
  const progressStore = useFormationProgressStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [serverFormations, setServerFormations] = useState<FormationAdmin[]>([]);

  useEffect(() => {
    if (!isLoggedIn) router.push("/login?redirect=/dashboard");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    Promise.all([
      fetch(`/api/user/purchases?userId=${encodeURIComponent(currentUser.id)}`).then(r => r.json()).catch(() => null),
      fetch("/api/formations").then(r => r.json()).catch(() => null),
    ]).then(([purchases, formationsData]) => {
      if (cancelled) return;
      if (purchases?.formationsAchetees?.length) ajouterFormationsAchetees(purchases.formationsAchetees);
      if (purchases?.ebooksAchetes?.length) ajouterEbooksAchetes(purchases.ebooksAchetes);
      const formations: FormationAdmin[] = (formationsData?.formations ?? []).filter(
        (f: FormationAdmin) => f.actif !== false && !f.deletedAt
      );
      if (formations.length) setServerFormations(formations);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          Chargement...
        </div>
      </div>
    );
  }

  // Ebooks achetés
  const allEbooks = [...staticEbooks, ...catalogue.ebooks];
  const ebooksAchetesList = ebooksAchetes
    .map((id) => allEbooks.find((e) => e.id === id) ?? null)
    .filter(Boolean) as typeof allEbooks;

  // Formations achetées — priorité aux données serveur, fallback sur le store local
  const dynamicFormations = serverFormations.length > 0
    ? serverFormations
    : catalogue.formations.filter((f) => f.actif && !f.deletedAt);
  const allFormations = [
    ...FORMATIONS,
    ...dynamicFormations.map(({ actif: _, createdAt: __, ...f }) => f),
  ];
  const formationsAcheteesList = formationsAchetees
    .map((id) => allFormations.find((f) => f.id === id) ?? null)
    .filter(Boolean) as typeof allFormations;

  async function handleDownload(ebookId: string) {
    if (!currentUser || downloading) return;
    setDownloading(ebookId);
    try {
      const res = await fetch("/api/download-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ebookId, userId: currentUser.id }),
      });
      if (!res.ok) throw new Error();
      const { token } = await res.json();
      window.open(
        `/api/download/${ebookId}?uid=${encodeURIComponent(currentUser.id)}&token=${token}`,
        "_blank"
      );
    } catch {
      alert("Impossible de générer le lien. Vérifiez votre connexion et réessayez.");
    } finally {
      setDownloading(null);
    }
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  const initials = `${currentUser.firstName[0] ?? ""}${currentUser.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bonjour, {currentUser.firstName} 👋
            </h1>
            <p className="text-gray-600 text-sm">{currentUser.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-red-300 hover:text-red-500 text-gray-600 text-sm rounded-xl transition-all"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Ebooks achetés", value: ebooksAchetesList.length, icon: <BookOpen size={20} />, color: "text-green-400" },
          { label: "Formations achetées", value: formationsAcheteesList.length, icon: <Play size={20} />, color: "text-[#E8B800]" },
          { label: "Téléchargeables", value: ebooksAchetesList.length, icon: <Download size={20} />, color: "text-emerald-400" },
        ].map((stat) => (
          <div key={stat.label} className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className={`flex items-center gap-3 mb-3 ${stat.color}`}>
              {stat.icon}
              <span className="text-sm text-gray-600">{stat.label}</span>
            </div>
            <p className="text-gray-900 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1 bg-gray-100 border border-gray-200 rounded-xl w-fit flex-wrap">
        {([
          { id: "overview", label: "Aperçu" },
          { id: "downloads", label: `Mes ebooks (${ebooksAchetesList.length})` },
          { id: "formations", label: `Mes formations (${formationsAcheteesList.length})` },
          { id: "referral", label: "⭐ Parrainage & Points" },
          { id: "vip", label: "👑 SmartLife Pass" },
        ] as { id: Tab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── APERÇU ── */}
      {activeTab === "overview" && (
        <div className="grid md:grid-cols-2 gap-6">

          {/* Ebooks récents */}
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <h3 className="text-gray-900 font-bold mb-5 flex items-center gap-2">
              <BookOpen size={16} className="text-green-400" />
              Mes ebooks récents
            </h3>
            {ebooksAchetesList.length === 0 ? (
              <p className="text-gray-600 text-sm">Aucun ebook acheté pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {ebooksAchetesList.slice(0, 4).map((ebook) => (
                  <div key={ebook.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium truncate">{ebook.title}</p>
                      <p className="text-gray-600 text-xs">{ebook.pages} pages</p>
                    </div>
                    <button
                      onClick={() => handleDownload(ebook.id)}
                      disabled={downloading === ebook.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-600 hover:text-white text-green-700 text-xs font-medium rounded-lg transition-all disabled:opacity-60"
                    >
                      {downloading === ebook.id
                        ? <Loader2 size={11} className="animate-spin" />
                        : <Download size={11} />}
                      DL
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setActiveTab("downloads")}
              className="mt-4 flex items-center gap-2 text-green-600 hover:text-green-700 text-sm transition-colors"
            >
              Voir tous mes ebooks <ArrowRight size={14} />
            </button>
          </div>

          {/* Formations récentes */}
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <h3 className="text-gray-900 font-bold mb-5 flex items-center gap-2">
              <Monitor size={16} className="text-[#E8B800]" />
              Mes formations récentes
            </h3>
            {formationsAcheteesList.length === 0 ? (
              <div>
                <p className="text-gray-600 text-sm mb-3">Aucune formation achetée pour le moment.</p>
                <Link href="/formation" className="flex items-center gap-2 text-[#E8B800] hover:text-[#27A827] text-sm transition-colors">
                  Découvrir les formations <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {formationsAcheteesList.slice(0, 3).map((formation) => {
                  const progress = progressStore.getTotalProgress(formation.id, 0);
                  return (
                    <div key={formation.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm font-medium truncate">{formation.titre}</p>
                        <p className="text-gray-600 text-xs">{formation.duree} · {formation.modules} modules</p>
                      </div>
                      <Link
                        href={`/formation/${formation.id}/watch`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#E8B800]/20 hover:bg-[#E8B800]/40 text-[#E8B800] text-xs font-medium rounded-lg transition-all"
                      >
                        <Play size={11} /> Regarder
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
            {formationsAcheteesList.length > 0 && (
              <button
                onClick={() => setActiveTab("formations")}
                className="mt-4 flex items-center gap-2 text-[#E8B800] hover:text-[#27A827] text-sm transition-colors"
              >
                Voir toutes mes formations <ArrowRight size={14} />
              </button>
            )}
          </div>

          {/* Actions rapides */}
          <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl md:col-span-2">
            <h3 className="text-gray-900 font-bold mb-5">Actions rapides</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { href: "/ebooks", label: "Parcourir les ebooks", icon: <BookOpen size={16} /> },
                { href: "/formation", label: "Voir les formations", icon: <Package size={16} /> },
                { href: "/accompagnement", label: "Programme d'accompagnement", icon: <Star size={16} /> },
                { href: "/contact", label: "Contacter le support", icon: <ArrowRight size={16} /> },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all group"
                >
                  <div className="text-green-400">{action.icon}</div>
                  <span className="text-sm">{action.label}</span>
                  <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MES EBOOKS ── */}
      {activeTab === "downloads" && (
        <div className="space-y-4">
          {ebooksAchetesList.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucun ebook acheté pour le moment</p>
              <Link
                href="/ebooks"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Découvrir les ebooks
              </Link>
            </div>
          ) : (
            ebooksAchetesList.map((ebook) => (
              <div
                key={ebook.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  {ebook.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ebook.cover}
                      alt={ebook.title}
                      className="w-14 h-[72px] object-cover rounded-xl border border-white/10 flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={22} className="text-green-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-gray-900 font-semibold">{ebook.title}</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {ebook.pages} pages · {ebook.rating}/5
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5 truncate max-w-xs">
                      {ebook.category}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(ebook.id)}
                  disabled={downloading === ebook.id}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black text-sm font-bold rounded-xl transition-all shadow-lg shadow-green-900/30 disabled:opacity-60 flex-shrink-0"
                >
                  {downloading === ebook.id ? (
                    <><Loader2 size={15} className="animate-spin" /> Génération...</>
                  ) : (
                    <><Download size={15} /> Télécharger</>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── MES FORMATIONS ── */}
      {activeTab === "formations" && (
        <div className="space-y-4">
          {formationsAcheteesList.length === 0 ? (
            <div className="text-center py-16">
              <Monitor size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucune formation achetée pour le moment</p>
              <Link
                href="/formation"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8B800] hover:bg-[#27A827] text-black rounded-xl text-sm font-bold transition-colors"
              >
                Découvrir les formations
              </Link>
            </div>
          ) : (
            formationsAcheteesList.map((formation) => {
              const totalProgress = progressStore.getTotalProgress(formation.id, 0);
              const completedCount = progressStore.getCompletedCount(formation.id);
              const fp = progressStore.getFormationProgress(formation.id);
              const hasStarted = !!fp;

              return (
                <div
                  key={formation.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-gray-200 rounded-2xl hover:border-[#E8B800]/40 shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-[#E8B800]/10 flex items-center justify-center flex-shrink-0">
                      <Play size={22} className="text-[#E8B800] ml-0.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-900 font-semibold truncate">{formation.titre}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {formation.duree} · {formation.modules} modules · {formation.niveau}
                      </p>
                      {hasStarted ? (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#E8B800] to-[#27A827] rounded-full transition-all"
                              style={{ width: `${totalProgress}%` }}
                            />
                          </div>
                          <span className="text-gray-500 text-xs">{totalProgress}% terminé</span>
                        </div>
                      ) : (
                        <p className="text-gray-600 text-xs mt-1">Non commencée</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap flex-shrink-0">
                    {totalProgress === 100 && (
                      <CertDownloadButton formationId={formation.id} />
                    )}
                    <Link
                      href={`/formation/${formation.id}/watch`}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black text-sm font-bold rounded-xl transition-all flex-shrink-0"
                    >
                      {totalProgress === 100 ? (
                        <><Play size={15} /> Revoir</>
                      ) : hasStarted ? (
                        <><Play size={15} /> Continuer</>
                      ) : (
                        <><Play size={15} /> Commencer</>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── PARRAINAGE & POINTS ── */}
      {activeTab === "referral" && currentUser && (
        <ReferralTab userId={currentUser.id} firstName={currentUser.firstName} />
      )}

      {/* ── VIP ── */}
      {activeTab === "vip" && currentUser && (
        <VipTab
          userId={currentUser.id}
          userName={`${currentUser.firstName} ${currentUser.lastName}`.trim()}
          userEmail={currentUser.email}
          userPhone={currentUser.phone}
          allFormations={allFormations}
          formationsAchetees={formationsAchetees}
        />
      )}
    </div>
  );
}

// ─── Composant Parrainage & Points ───────────────────────────────────────────

function ReferralTab({ userId, firstName }: { userId: string; firstName: string }) {
  const [data, setData] = useState<{
    points: number; referralCode: string; discountPercent: number;
    canRedeem: boolean; referralUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/loyalty?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  function copyLink() {
    if (!data) return;
    const url = data.referralUrl;
    // Essayer clipboard API moderne
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(text: string) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* silencieux */ }
    document.body.removeChild(ta);
  }

  const referralUrl = data?.referralUrl ?? "";
  const shareMsg = `Rejoins Smart Life et beneficie de 10% de reduction sur ton premier achat ! Utilise mon lien : ${referralUrl}`;
  const shareText = encodeURIComponent(shareMsg);

  if (loading) {
    return <div className="py-16 text-center text-gray-400">Chargement…</div>;
  }

  const pointsNeededForNext = data ? (Math.floor(data.points / 100) + 1) * 100 : 100;
  const progressPct = data ? Math.min(100, (data.points % 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Accroche */}
      <div
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
          borderRadius: 20,
          padding: "28px 24px",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎁</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
          Partagez votre lien & Gagnez des points !
        </h2>
        <p style={{ fontSize: 14, opacity: 0.85, margin: 0 }}>
          Vos proches bénéficient de <strong>10% de réduction</strong> sur leur achat,
          et vous gagnez <strong>50 points</strong> à chaque achat réalisé via votre lien.
        </p>
      </div>

      {/* Lien de parrainage */}
      <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <h3 className="text-gray-900 font-bold mb-1">Votre lien de parrainage</h3>
        <p className="text-gray-500 text-xs mb-4">
          Code : <span className="font-mono font-bold text-purple-600">{data?.referralCode ?? "…"}</span>
          {" · "}Toute personne passant par ce lien obtient <strong>10% de réduction</strong>.
        </p>

        {/* Affichage du lien */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 14,
          }}
        >
          <span
            style={{
              flex: 1,
              fontFamily: "monospace",
              fontSize: 13,
              color: "#166534",
              wordBreak: "break-all",
              lineHeight: 1.4,
            }}
          >
            {referralUrl || "Chargement…"}
          </span>
          <button
            onClick={copyLink}
            style={{
              flexShrink: 0,
              padding: "8px 16px",
              background: copied ? "#27A827" : "#22c55e",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "background 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? "✓ Copié !" : "📋 Copier"}
          </button>
        </div>

        {/* Boutons de partage */}
        <div className="flex gap-3 flex-wrap">
          <a
            href={`https://api.whatsapp.com/send?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 20px",
              background: "#25D366",
              color: "#fff",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(37,211,102,0.35)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 20px",
              background: "#1877F2",
              color: "#fff",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(24,119,242,0.35)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>
        </div>
      </div>

      {/* Points fidélité */}
      <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <h3 className="text-gray-900 font-bold mb-1">Vos points fidélité</h3>
        <p className="text-gray-500 text-xs mb-5">1 point gagné pour chaque 100 XAF dépensé. 100 points = 10% de réduction (jusqu'à 50% max).</p>

        <div className="flex items-end gap-4 mb-6">
          <div>
            <p style={{ fontSize: 48, fontWeight: 900, color: "#7c3aed", lineHeight: 1, margin: 0 }}>
              {data?.points ?? 0}
            </p>
            <p className="text-gray-500 text-sm">points</p>
          </div>
          {(data?.points ?? 0) >= 100 && (
            <div
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.25)",
                borderRadius: 12,
                padding: "8px 16px",
                marginBottom: 20,
              }}
            >
              <p style={{ color: "#7c3aed", fontWeight: 700, fontSize: 14, margin: 0 }}>
                = {data?.discountPercent ?? 0}% de réduction disponible
              </p>
            </div>
          )}
        </div>

        {/* Barre de progression vers prochain palier */}
        {(data?.points ?? 0) < 500 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progression vers {pointsNeededForNext} pts</span>
              <span>{data?.points ?? 0} / {pointsNeededForNext}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Paliers */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
          {[100, 200, 300, 400, 500].map((threshold) => {
            const pts = data?.points ?? 0;
            const active = pts >= threshold;
            return (
              <div
                key={threshold}
                style={{
                  background: active ? "rgba(124,58,237,0.1)" : "#f9fafb",
                  border: `1px solid ${active ? "rgba(124,58,237,0.3)" : "#e5e7eb"}`,
                  borderRadius: 10,
                  padding: "10px 4px",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 800, color: active ? "#7c3aed" : "#9ca3af" }}>
                  {threshold / 10}%
                </p>
                <p style={{ fontSize: 10, color: active ? "#7c3aed" : "#9ca3af" }}>
                  {threshold} pts
                </p>
              </div>
            );
          })}
        </div>

        {(data?.points ?? 0) >= 100 ? (
          <div
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              borderRadius: 12,
              padding: "16px 20px",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ fontWeight: 800, margin: "0 0 2px" }}>
                Utilisez vos points lors du prochain achat !
              </p>
              <p style={{ fontSize: 12, opacity: 0.8, margin: 0 }}>
                Cliquez "Utiliser mes points" à l&apos;étape de paiement.
              </p>
            </div>
            <Link
              href="/checkout"
              style={{
                background: "#E8B800",
                color: "#000",
                fontWeight: 800,
                padding: "10px 20px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              Acheter →
            </Link>
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-2">
            Effectuez des achats pour accumuler vos points et débloquer des réductions.
          </p>
        )}
      </div>

      {/* Comment ça marche */}
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
        <h3 className="text-gray-900 font-bold mb-4">Comment ça marche ?</h3>
        <div className="space-y-3">
          {[
            { icon: "🔗", title: "Partagez votre lien", desc: "Envoyez votre lien unique à vos amis, famille ou réseau." },
            { icon: "🛒", title: "Ils achètent avec 10% off", desc: "Chaque personne qui passe par votre lien bénéficie automatiquement de 10% de réduction." },
            { icon: "⭐", title: "Vous gagnez 50 points", desc: "À chaque achat effectué via votre lien, 50 points sont ajoutés à votre solde." },
            { icon: "🎁", title: "Échangez vos points", desc: "100 points = 10% de réduction sur votre prochain achat (jusqu'à 50% max). Non applicable sur les Packs." },
          ].map((step) => (
            <div key={step.title} className="flex gap-3">
              <div className="text-xl flex-shrink-0 pt-0.5">{step.icon}</div>
              <div>
                <p className="text-gray-900 font-semibold text-sm">{step.title}</p>
                <p className="text-gray-500 text-xs">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Composant SmartLife Pass VIP ────────────────────────────────────────────

type VipTabData = {
  enabled: boolean; active: boolean; plan: string | null;
  expiresAt: string | null; formationCredits: number;
  redeemedFormationIds: string[]; communityLink: string | null;
  communityType: "whatsapp" | "telegram";
  monthlyPrice: number; annualPrice: number; currency: string;
};

function fmt(n: number): string { return new Intl.NumberFormat("fr-FR").format(n); }

const OPERATORS_CM = [
  { value: "mtn_cm", label: "MTN Mobile Money" },
  { value: "orange_cm", label: "Orange Money" },
];

function VipTab({
  userId, userName, userEmail, userPhone, allFormations, formationsAchetees,
}: {
  userId: string; userName: string; userEmail: string; userPhone?: string;
  allFormations: { id: string; titre: string; categorie?: string; cover?: string }[];
  formationsAchetees: string[];
}) {
  const { ajouterFormationsAchetees } = useUserStore();
  const [data, setData] = useState<VipTabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");
  const [phone, setPhone] = useState(userPhone || "");
  const [operator, setOperator] = useState("mtn_cm");
  const [paying, setPaying] = useState(false);
  const [payRef, setPayRef] = useState<string | null>(null);
  const [pollMsg, setPollMsg] = useState("");
  const [showFormationPicker, setShowFormationPicker] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const fetchStatus = () => {
    fetch(`/api/vip?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
    // Si retour depuis CinetPay
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "vip" && params.get("vip") === "activated") {
      setLoading(true);
      setTimeout(() => fetchStatus(), 2000);
      window.history.replaceState({}, "", "/dashboard?tab=vip");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Polling SebPay après paiement Mobile Money
  useEffect(() => {
    if (!payRef) return;
    let attempts = 0;
    const maxAttempts = 40;
    const interval = setInterval(async () => {
      attempts++;
      setPollMsg(`Vérification du paiement… (${attempts}/${maxAttempts})`);
      try {
        const res = await fetch(`/api/payment/sebpay?ref=${encodeURIComponent(payRef)}`);
        const d = await res.json();
        if (d.confirmed) {
          clearInterval(interval);
          setPayRef(null);
          setShowModal(false);
          setPollMsg("");
          setLoading(true);
          setTimeout(() => fetchStatus(), 1500);
        }
      } catch { /* continuer */ }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPollMsg("Délai dépassé. Si vous avez validé sur votre téléphone, actualisez la page.");
      }
    }, 4000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payRef]);

  async function handleSubscribe() {
    if (!phone.trim()) { alert("Veuillez entrer votre numéro de téléphone"); return; }
    setPaying(true);
    try {
      const res = await fetch("/api/vip/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, gateway: "sebpay", phone, operator, userId, userName, userEmail, userPhone: phone }),
      });
      const d = await res.json();
      if (!res.ok) { alert(d.error || "Erreur lors de l'initiation du paiement"); return; }
      setPayRef(d.reference);
      setPollMsg("Validez la demande sur votre téléphone…");
    } catch {
      alert("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setPaying(false);
    }
  }

  async function handleCinetPay() {
    setPaying(true);
    try {
      const res = await fetch("/api/vip/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, gateway: "cinetpay", userId, userName, userEmail, userPhone }),
      });
      const d = await res.json();
      if (!res.ok) { alert(d.error || "Erreur CinetPay"); return; }
      if (d.url) window.location.href = d.url;
    } catch {
      alert("Impossible de contacter le serveur.");
    } finally {
      setPaying(false);
    }
  }

  async function handleRedeemFormation(formationId: string) {
    setRedeemingId(formationId);
    try {
      const res = await fetch("/api/vip/redeem-formation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, formationId }),
      });
      const d = await res.json();
      if (!res.ok) { alert(d.error || "Erreur"); return; }
      ajouterFormationsAchetees([formationId]);
      setShowFormationPicker(false);
      setLoading(true);
      fetchStatus();
    } catch {
      alert("Erreur réseau.");
    } finally {
      setRedeemingId(null);
    }
  }

  if (loading) return <div className="py-16 text-center text-gray-400 flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Chargement…</div>;
  if (!data) return null;

  const price = selectedPlan === "annual" ? data.annualPrice : data.monthlyPrice;
  const savings = data.monthlyPrice * 12 - data.annualPrice;

  // Formations non encore possédées ni débloquées via VIP
  const redeemableFormations = allFormations.filter(f =>
    !formationsAchetees.includes(f.id) && !(data.redeemedFormationIds || []).includes(f.id)
  );

  // ── Abonné actif ────────────────────────────────────────────────────────────
  if (data.active) {
    const expiryDate = data.expiresAt ? new Date(data.expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

    return (
      <div className="space-y-6">
        {/* Badge VIP */}
        <div className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #1d4ed8 50%, #0f766e 100%)" }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown size={22} className="text-yellow-300" />
                <span className="text-yellow-300 font-bold text-sm uppercase tracking-wider">Membre VIP Actif</span>
              </div>
              <h2 className="text-2xl font-bold mb-1">SmartLife Pass</h2>
              <p className="text-white/70 text-sm">
                Formule {data.plan === "annual" ? "Annuelle" : "Mensuelle"} · Renouvellement le <span className="text-white font-semibold">{expiryDate}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="bg-green-400 text-black text-xs font-bold px-3 py-1 rounded-full">✓ Actif</span>
            </div>
          </div>
        </div>

        {/* Avantages */}
        <div className="grid sm:grid-cols-3 gap-4">

          {/* Ebooks illimités */}
          <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-[#E8B800]"><BookOpen size={18} /><span className="font-bold text-sm text-gray-900">Ebooks illimités</span></div>
            <p className="text-gray-500 text-xs mb-4">Tous les ebooks du catalogue sont accessibles gratuitement avec votre Pass.</p>
            <button
              onClick={() => {
                const tabs = document.querySelectorAll<HTMLButtonElement>("[data-tab]");
                tabs.forEach(t => { if (t.dataset.tab === "downloads") t.click(); });
              }}
              className="w-full py-2 bg-[#E8B800] hover:bg-[#d4a700] text-black text-xs font-bold rounded-xl transition-all"
            >
              <Download size={12} className="inline mr-1" /> Accéder aux Ebooks
            </button>
          </div>

          {/* Formation mensuelle */}
          <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-[#27A827]"><Gift size={18} /><span className="font-bold text-sm text-gray-900">Formation offerte</span></div>
            <p className="text-gray-500 text-xs mb-3">
              {data.formationCredits > 0
                ? <span className="text-green-600 font-semibold">{data.formationCredits} crédit{data.formationCredits > 1 ? "s" : ""} disponible{data.formationCredits > 1 ? "s" : ""}</span>
                : "Prochain crédit au renouvellement"}
            </p>
            <button
              onClick={() => setShowFormationPicker(true)}
              disabled={!data.formationCredits}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all"
            >
              <Zap size={12} className="inline mr-1" /> Débloquer une formation
            </button>
          </div>

          {/* Groupe VIP */}
          <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-purple-600"><Users size={18} /><span className="font-bold text-sm text-gray-900">Groupe VIP Privé</span></div>
            <p className="text-gray-500 text-xs mb-4">Accédez à la communauté exclusive réservée aux membres SmartLife Pass.</p>
            {data.communityLink ? (
              <a href={data.communityLink} target="_blank" rel="noopener noreferrer"
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1">
                <Users size={12} /> Rejoindre le groupe {data.communityType === "telegram" ? "Telegram" : "WhatsApp"}
              </a>
            ) : (
              <p className="text-gray-400 text-xs text-center">Lien bientôt disponible</p>
            )}
          </div>
        </div>

        {/* Formations débloquées via crédit */}
        {(data.redeemedFormationIds || []).length > 0 && (
          <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2"><Gift size={14} className="text-green-500" /> Formations débloquées avec votre Pass</h3>
            <div className="space-y-2">
              {(data.redeemedFormationIds || []).map(fid => {
                const f = allFormations.find(x => x.id === fid);
                return f ? (
                  <div key={fid} className="flex items-center justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700 truncate">{f.titre}</span>
                    <Link href={`/formation/${fid}/watch`} className="text-xs text-[#E8B800] font-bold hover:underline flex-shrink-0">
                      <Play size={11} className="inline mr-0.5" /> Visionner
                    </Link>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Modal formation picker */}
        {showFormationPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowFormationPicker(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Choisir une formation gratuite</h3>
                <button onClick={() => setShowFormationPicker(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {redeemableFormations.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Toutes les formations disponibles ont été débloquées.</p>
                ) : redeemableFormations.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-[#E8B800]/40 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-[#E8B800]/10 flex items-center justify-center flex-shrink-0">
                      <Play size={16} className="text-[#E8B800]" />
                    </div>
                    <p className="flex-1 text-sm font-medium text-gray-900 truncate">{f.titre}</p>
                    <button
                      onClick={() => handleRedeemFormation(f.id)}
                      disabled={redeemingId === f.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg disabled:opacity-60"
                    >
                      {redeemingId === f.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                      Débloquer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Non-abonné ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Bannière accroche */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white text-center"
        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #1d4ed8 50%, #0f766e 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative">
          <Crown size={40} className="text-yellow-300 mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">Passez au niveau supérieur</h2>
          <p className="text-white/80 text-sm max-w-md mx-auto">
            Débloquez tous les Ebooks, obtenez une formation offerte chaque mois et rejoignez la communauté VIP SmartLife.
          </p>
        </div>
      </div>

      {/* Avantages */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: <BookOpen size={20} />, title: "Ebooks illimités", desc: "Accès immédiat à tout le catalogue d'ebooks sans frais supplémentaires", color: "text-[#E8B800]" },
          { icon: <Gift size={20} />, title: "1 Formation/mois", desc: "Un crédit formation offert chaque mois pour débloquer la formation de votre choix", color: "text-green-500" },
          { icon: <Users size={20} />, title: "Groupe VIP Privé", desc: "Accès exclusif à la communauté WhatsApp/Telegram pour networker et progresser", color: "text-purple-500" },
        ].map(b => (
          <div key={b.title} className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col gap-2">
            <div className={`${b.color}`}>{b.icon}</div>
            <p className="font-bold text-gray-900 text-sm">{b.title}</p>
            <p className="text-gray-500 text-xs leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Choix de formule */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Mensuel */}
        <div
          onClick={() => setSelectedPlan("monthly")}
          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan === "monthly" ? "border-[#E8B800] bg-[#E8B800]/5" : "border-gray-200 bg-white hover:border-gray-300"}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-gray-900">Mensuel</span>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlan === "monthly" ? "border-[#E8B800] bg-[#E8B800]" : "border-gray-300"}`}>
              {selectedPlan === "monthly" && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(data.monthlyPrice)} <span className="text-sm font-normal text-gray-500">{data.currency}/mois</span></p>
          <p className="text-gray-400 text-xs mt-1">Sans engagement</p>
        </div>

        {/* Annuel */}
        <div
          onClick={() => setSelectedPlan("annual")}
          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all relative ${selectedPlan === "annual" ? "border-purple-600 bg-purple-600/5" : "border-gray-200 bg-white hover:border-gray-300"}`}
        >
          {savings > 0 && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">
              Économisez {fmt(savings)} {data.currency}
            </span>
          )}
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-gray-900">Annuel</span>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlan === "annual" ? "border-purple-600 bg-purple-600" : "border-gray-300"}`}>
              {selectedPlan === "annual" && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(data.annualPrice)} <span className="text-sm font-normal text-gray-500">{data.currency}/an</span></p>
          <p className="text-gray-400 text-xs mt-1">≈ {fmt(Math.round(data.annualPrice / 12))} {data.currency}/mois</p>
        </div>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99]"
      >
        <Crown size={18} /> S&apos;abonner au SmartLife Pass
      </button>

      {/* Modal paiement */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4" onClick={() => { if (!payRef) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">S&apos;abonner — {selectedPlan === "annual" ? "Annuel" : "Mensuel"}</h3>
                <p className="text-sm text-[#E8B800] font-bold">{fmt(price)} {data.currency}</p>
              </div>
              {!payRef && <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>}
            </div>

            <div className="p-5 space-y-4">
              {payRef ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#E8B800]/10 flex items-center justify-center mb-3">
                    <Loader2 size={24} className="animate-spin text-[#E8B800]" />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">En attente de confirmation</p>
                  <p className="text-gray-500 text-sm">{pollMsg}</p>
                </div>
              ) : (
                <>
                  {/* Mobile Money */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">1</span>
                      Payer par Mobile Money
                    </p>
                    <select value={operator} onChange={e => setOperator(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E8B800]">
                      {OPERATORS_CM.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                    </select>
                    <input
                      type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="Ex : 6XX XXX XXX"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E8B800]"
                    />
                    <button onClick={handleSubscribe} disabled={paying}
                      className="w-full py-3.5 bg-gradient-to-r from-[#E8B800] to-[#27A827] hover:from-[#27A827] hover:to-[#E8B800] text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                      {paying ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                      Payer {fmt(price)} {data.currency} par Mobile Money
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-gray-400 text-xs">ou</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* Carte bancaire */}
                  <button onClick={handleCinetPay} disabled={paying}
                    className="w-full py-3 border-2 border-gray-200 hover:border-[#E8B800] text-gray-700 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                    {paying ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} className="text-gray-400" />}
                    Payer par Carte bancaire (CinetPay)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
