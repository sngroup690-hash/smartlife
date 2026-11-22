import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Ebook, Section, AvisClient, FaqItem } from "./data";

// ── Types ──────────────────────────────────────────────────────────────────────

export type EbookAdmin = Ebook & {
  actif: boolean;
  createdAt: string;
  downloadUrl?: string;
  deletedAt?: string;
  whatsappUrl?: string;
  promoEndDate?: string;
  promoCyclique?: boolean;
  promoDureeHeures?: number;
  vendusAffiche?: number;
  placesRestantesBloquees?: number;
};

export type FormationAdmin = {
  id: string;
  actif: boolean;
  titre: string;
  categorie: string;
  description: string;
  instructeur: string;
  duree: string;
  modules: number;
  prix: number;
  prixOriginal?: number;
  niveau: "Débutant" | "Intermédiaire" | "Avancé";
  note: number;
  apprenants: number;
  badge?: string;
  mode?: "online" | "presentiel" | "both";
  cover?: string;
  videoPreview?: string;
  sections?: Section[];
  faq?: FaqItem[];
  avisClients?: AvisClient[];
  commentAcheterUrl?: string;
  ctaAnimation?: "clignote" | "respire" | "pulse" | "bounce" | "shimmer" | "glow" | "wiggle" | "none";
  reviewCardSize?: "small" | "medium" | "large";
  createdAt: string;
  deletedAt?: string;
  whatsappUrl?: string;
  promoEndDate?: string;
  promoCyclique?: boolean;
  promoDureeHeures?: number;
  vendusAffiche?: number;
  placesRestantesBloquees?: number;
  cardBgColor?: string;
  cardTextColor?: string;
  priceColor?: string;
  ctaBgColor?: string;
  ctaTextColor?: string;
  bandeauColor?: string;
};

// Surcharges pour les ebooks statiques (modifiés par l'admin)
export type EbookOverride = Partial<Omit<Ebook, "id" | "slug">> & { downloadUrl?: string };

// Surcharges pour les formations statiques
export type FormationOverride = Partial<Omit<FormationAdmin, "id" | "actif" | "createdAt">>;

type CatalogueStore = {
  ebooks: EbookAdmin[];
  formations: FormationAdmin[];
  // Surcharges des ebooks statiques (id → champs modifiés)
  ebookOverrides: Record<string, EbookOverride>;
  // Ebooks statiques désactivés par l'admin (id → false)
  staticEbookActif: Record<string, boolean>;
  // Surcharges des formations statiques (id → champs modifiés)
  formationOverrides: Record<string, FormationOverride>;
  // Formations statiques désactivées par l'admin
  staticFormationActif: Record<string, boolean>;

  setEbooks: (ebooks: EbookAdmin[]) => void;
  setFormations: (formations: FormationAdmin[]) => void;
  ajouterEbook: (data: Omit<EbookAdmin, "id" | "slug" | "actif" | "createdAt">) => void;
  modifierEbook: (id: string, data: Partial<Omit<EbookAdmin, "id" | "createdAt">>) => void;
  supprimerEbook: (id: string) => void;
  restaurerEbook: (id: string) => void;
  supprimerEbookDefinitif: (id: string) => void;
  toggleEbookActif: (id: string) => void;

  // Pour les ebooks statiques
  setEbookOverride: (id: string, data: EbookOverride) => void;
  toggleStaticEbookActif: (id: string) => void;
  isStaticEbookActif: (id: string) => boolean;

  // Pour les formations statiques
  setFormationOverride: (id: string, data: FormationOverride) => void;
  toggleStaticFormationActif: (id: string) => void;
  isStaticFormationActif: (id: string) => boolean;

  dupliquerEbook: (id: string) => void;

  ajouterFormation: (data: Omit<FormationAdmin, "id" | "actif" | "createdAt">) => void;
  modifierFormation: (id: string, data: Partial<Omit<FormationAdmin, "id" | "createdAt">>) => void;
  supprimerFormation: (id: string) => void;
  restaurerFormation: (id: string) => void;
  supprimerFormationDefinitif: (id: string) => void;
  toggleFormationActif: (id: string) => void;
};

// ── Utilitaires ────────────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useCatalogueStore = create<CatalogueStore>()(
  persist(
    (set, get) => ({
      ebooks: [],
      formations: [],
      ebookOverrides: {},
      staticEbookActif: {},
      formationOverrides: {},
      staticFormationActif: {},

      setEbooks: (ebooks) => set({ ebooks }),
      setFormations: (formations) => set({ formations }),

      ajouterEbook: (data) =>
        set((s) => {
          const id = genId("eb-admin");
          const slug = toSlug(data.title) + "-" + Date.now().toString(36).slice(-4);
          return {
            ebooks: [
              ...s.ebooks,
              { ...data, id, slug, actif: true, createdAt: new Date().toISOString() },
            ],
          };
        }),

      modifierEbook: (id, data) =>
        set((s) => ({
          ebooks: s.ebooks.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),

      supprimerEbook: (id) =>
        set((s) => ({
          ebooks: s.ebooks.map((e) => e.id === id ? { ...e, deletedAt: new Date().toISOString() } : e),
        })),

      restaurerEbook: (id) =>
        set((s) => ({
          ebooks: s.ebooks.map((e) => { if (e.id === id) { const n = { ...e }; delete n.deletedAt; return n; } return e; }),
        })),

      supprimerEbookDefinitif: (id) =>
        set((s) => ({ ebooks: s.ebooks.filter((e) => e.id !== id) })),

      toggleEbookActif: (id) =>
        set((s) => ({
          ebooks: s.ebooks.map((e) => (e.id === id ? { ...e, actif: !e.actif } : e)),
        })),

      dupliquerEbook: (id) =>
        set((s) => {
          const source = s.ebooks.find((e) => e.id === id);
          if (!source) return s;
          const newId = genId("eb-admin");
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { deletedAt: _d, id: _id, slug: _sl, ...rest } = source;
          const slug = toSlug(source.title) + "-copie-" + Date.now().toString(36).slice(-4);
          return {
            ebooks: [
              ...s.ebooks,
              { ...rest, id: newId, slug, actif: false, createdAt: new Date().toISOString() },
            ],
          };
        }),

      setEbookOverride: (id, data) =>
        set((s) => ({
          ebookOverrides: {
            ...s.ebookOverrides,
            [id]: { ...(s.ebookOverrides[id] || {}), ...data },
          },
        })),

      toggleStaticEbookActif: (id) =>
        set((s) => ({
          staticEbookActif: {
            ...s.staticEbookActif,
            [id]: s.staticEbookActif[id] === false ? true : false,
          },
        })),

      isStaticEbookActif: (id) => get().staticEbookActif[id] !== false,

      setFormationOverride: (id, data) =>
        set((s) => ({
          formationOverrides: {
            ...s.formationOverrides,
            [id]: { ...(s.formationOverrides[id] || {}), ...data },
          },
        })),

      toggleStaticFormationActif: (id) =>
        set((s) => ({
          staticFormationActif: {
            ...s.staticFormationActif,
            [id]: s.staticFormationActif[id] === false ? true : false,
          },
        })),

      isStaticFormationActif: (id) => get().staticFormationActif[id] !== false,

      ajouterFormation: (data) =>
        set((s) => ({
          formations: [
            ...s.formations,
            { ...data, id: genId("f-admin"), actif: true, createdAt: new Date().toISOString() },
          ],
        })),

      modifierFormation: (id, data) =>
        set((s) => ({
          formations: s.formations.map((f) => (f.id === id ? { ...f, ...data } : f)),
        })),

      supprimerFormation: (id) =>
        set((s) => ({
          formations: s.formations.map((f) => f.id === id ? { ...f, deletedAt: new Date().toISOString() } : f),
        })),

      restaurerFormation: (id) =>
        set((s) => ({
          formations: s.formations.map((f) => { if (f.id === id) { const n = { ...f }; delete n.deletedAt; return n; } return f; }),
        })),

      supprimerFormationDefinitif: (id) =>
        set((s) => ({ formations: s.formations.filter((f) => f.id !== id) })),

      toggleFormationActif: (id) =>
        set((s) => ({
          formations: s.formations.map((f) =>
            f.id === id ? { ...f, actif: !f.actif } : f
          ),
        })),
    }),
    { name: "sn-catalogue-v1" }
  )
);
