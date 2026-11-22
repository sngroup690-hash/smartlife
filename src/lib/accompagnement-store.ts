import { create } from "zustand";
import { persist } from "zustand/middleware";
import { espaces as STATIC_ESPACES } from "./accompagnement-data";

// Domaines pré-chargés visibles sur tous les appareils
const ESPACES_PAR_DEFAUT: EspacePersonnalise[] = STATIC_ESPACES.map((e) => ({
  id: e.id,
  titre: e.titre,
  domaine: e.categorie,
  descriptionCourte: e.description,
  descriptionLongue: e.descriptionLongue,
  avantages: e.avantages,
  inclus: e.etapes,
  clientsSatisfaits: 0,
  placesDisponibles: e.places,
  espacesSimilaires: [],
  actif: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  image: e.image,
}));

export type StatutDemande = "en_attente" | "validee" | "rejetee";

export type CandidatureConsultant = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  anneesExperience: string;
  domainesIds: string[];
  motivation: string;
  portfolioUrl?: string;
  photoUrl?: string;
  lu?: boolean;
  statut: StatutDemande;
  noteAdmin: string;
  createdAt: string;
  updatedAt: string;
};

export type EspacePersonnalise = {
  id: string;
  titre: string;
  domaine: string;
  descriptionCourte: string;
  descriptionLongue: string;
  avantages: string[];
  inclus: string[];
  clientsSatisfaits: number;
  placesDisponibles: number;
  espacesSimilaires: string[];
  actif: boolean;
  createdAt: string;
  image?: string;
  visuel?: string;
};

export type Consultant = {
  id: string;
  prenom: string;
  clientsAccompa: number;
  entreprisesAccompa: number;
  domainesIds: string[];
  actif: boolean;
  createdAt: string;
};

export type ClientInscrit = {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  profession: string;
  capital: string;
  motivation: string;
  createdAt: string;
};

export type DemandeAccompagnement = {
  id: string;
  clientId: string;
  espaceId: string;
  espaceSlug: string;
  espaceTitre: string;
  message: string;
  statut: StatutDemande;
  noteAdmin: string;
  createdAt: string;
  updatedAt: string;
  // Avis client sur le consultant / programme
  avisClient?: string;
  noteConsultant?: number; // 1–5
  avisDate?: string;
};

type AccompagnementStore = {
  espaces: EspacePersonnalise[];
  consultants: Consultant[];
  clients: ClientInscrit[];
  demandes: DemandeAccompagnement[];
  candidaturesConsultant: CandidatureConsultant[];
  clientConnecte: string | null;

  // Espaces admin
  setEspaces: (espaces: EspacePersonnalise[]) => void;
  ajouterEspace: (data: Omit<EspacePersonnalise, "id" | "createdAt" | "actif">) => EspacePersonnalise;
  modifierEspace: (id: string, data: Partial<Omit<EspacePersonnalise, "id" | "createdAt">>) => void;
  supprimerEspace: (id: string) => void;
  toggleEspaceActif: (id: string) => void;
  getEspaceById: (id: string) => EspacePersonnalise | undefined;

  // Consultants admin
  ajouterConsultant: (data: Omit<Consultant, "id" | "createdAt" | "actif">) => Consultant;
  modifierConsultant: (id: string, data: Partial<Omit<Consultant, "id" | "createdAt">>) => void;
  supprimerConsultant: (id: string) => void;
  toggleConsultantActif: (id: string) => void;

  // Client actions
  inscrireClient: (data: Omit<ClientInscrit, "id" | "createdAt">) => ClientInscrit;
  connecterClient: (email: string) => ClientInscrit | null;
  deconnecterClient: () => void;
  getClientById: (id: string) => ClientInscrit | undefined;

  // Demande actions
  soumettreDemandeAvecInscription: (
    clientData: Omit<ClientInscrit, "id" | "createdAt">,
    espaceId: string,
    espaceSlug: string,
    espaceTitre: string,
    message: string
  ) => { client: ClientInscrit; demande: DemandeAccompagnement };

  soumettreDemandeClient: (
    clientId: string,
    espaceId: string,
    espaceSlug: string,
    espaceTitre: string,
    message: string
  ) => DemandeAccompagnement;

  getDemandesClient: (clientId: string) => DemandeAccompagnement[];
  getDemandeParEspace: (clientId: string, espaceId: string) => DemandeAccompagnement | undefined;

  // Admin actions
  validerDemande: (demandeId: string, note: string) => void;
  rejeterDemande: (demandeId: string, note: string) => void;
  getAllDemandes: () => DemandeAccompagnement[];

  // Avis client
  donnerAvis: (demandeId: string, note: number, avis: string) => void;

  // Candidatures consultant
  soumettreCandiatureConsultant: (
    data: Omit<CandidatureConsultant, "id" | "createdAt" | "updatedAt" | "statut" | "noteAdmin">
  ) => CandidatureConsultant;
  validerCandidatureConsultant: (id: string, note: string) => void;
  rejeterCandidatureConsultant: (id: string, note: string) => void;
  getCandidaturesConsultantByEmail: (email: string) => CandidatureConsultant[];
  getAllCandidaturesConsultant: () => CandidatureConsultant[];
};

function genId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export const useAccompagnementStore = create<AccompagnementStore>()(
  persist(
    (set, get) => ({
      espaces: ESPACES_PAR_DEFAUT,
      consultants: [],
      clients: [],
      demandes: [],
      candidaturesConsultant: [],
      clientConnecte: null,

      setEspaces: (espaces) => set({ espaces }),

      ajouterEspace: (data) => {
        const espace: EspacePersonnalise = {
          ...data,
          id: genId(),
          actif: true,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ espaces: [...s.espaces, espace] }));
        return espace;
      },

      modifierEspace: (id, data) =>
        set((s) => ({
          espaces: s.espaces.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),

      supprimerEspace: (id) =>
        set((s) => ({ espaces: s.espaces.filter((e) => e.id !== id) })),

      toggleEspaceActif: (id) =>
        set((s) => ({
          espaces: s.espaces.map((e) => (e.id === id ? { ...e, actif: !e.actif } : e)),
        })),

      getEspaceById: (id) => get().espaces.find((e) => e.id === id),

      ajouterConsultant: (data) => {
        const consultant: Consultant = { ...data, id: genId(), actif: true, createdAt: new Date().toISOString() };
        set((s) => ({ consultants: [...s.consultants, consultant] }));
        return consultant;
      },

      modifierConsultant: (id, data) =>
        set((s) => ({ consultants: s.consultants.map((c) => (c.id === id ? { ...c, ...data } : c)) })),

      supprimerConsultant: (id) =>
        set((s) => ({ consultants: s.consultants.filter((c) => c.id !== id) })),

      toggleConsultantActif: (id) =>
        set((s) => ({ consultants: s.consultants.map((c) => (c.id === id ? { ...c, actif: !c.actif } : c)) })),

      inscrireClient: (data) => {
        const existing = get().clients.find((c) => c.email.toLowerCase() === data.email.toLowerCase());
        if (existing) return existing;
        const client: ClientInscrit = { ...data, id: genId(), createdAt: new Date().toISOString() };
        set((s) => ({ clients: [...s.clients, client] }));
        return client;
      },

      connecterClient: (email) => {
        const client = get().clients.find((c) => c.email.toLowerCase() === email.toLowerCase());
        if (client) set({ clientConnecte: client.id });
        return client ?? null;
      },

      deconnecterClient: () => set({ clientConnecte: null }),

      getClientById: (id) => get().clients.find((c) => c.id === id),

      soumettreDemandeAvecInscription: (clientData, espaceId, espaceSlug, espaceTitre, message) => {
        const client = get().inscrireClient(clientData);
        const demande = get().soumettreDemandeClient(client.id, espaceId, espaceSlug, espaceTitre, message);
        set({ clientConnecte: client.id });
        return { client, demande };
      },

      soumettreDemandeClient: (clientId, espaceId, espaceSlug, espaceTitre, message) => {
        const existing = get().demandes.find(
          (d) => d.clientId === clientId && d.espaceId === espaceId && d.statut !== "rejetee"
        );
        if (existing) return existing;
        const demande: DemandeAccompagnement = {
          id: genId(),
          clientId,
          espaceId,
          espaceSlug,
          espaceTitre,
          message,
          statut: "en_attente",
          noteAdmin: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ demandes: [...s.demandes, demande] }));
        return demande;
      },

      getDemandesClient: (clientId) =>
        get().demandes.filter((d) => d.clientId === clientId).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),

      getDemandeParEspace: (clientId, espaceId) =>
        get().demandes.find((d) => d.clientId === clientId && d.espaceId === espaceId),

      validerDemande: (demandeId, note) =>
        set((s) => ({
          demandes: s.demandes.map((d) =>
            d.id === demandeId
              ? { ...d, statut: "validee", noteAdmin: note, updatedAt: new Date().toISOString() }
              : d
          ),
        })),

      rejeterDemande: (demandeId, note) =>
        set((s) => ({
          demandes: s.demandes.map((d) =>
            d.id === demandeId
              ? { ...d, statut: "rejetee", noteAdmin: note, updatedAt: new Date().toISOString() }
              : d
          ),
        })),

      getAllDemandes: () =>
        get().demandes.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),

      donnerAvis: (demandeId, note, avis) =>
        set((s) => ({
          demandes: s.demandes.map((d) =>
            d.id === demandeId
              ? { ...d, noteConsultant: note, avisClient: avis, avisDate: new Date().toISOString() }
              : d
          ),
        })),

      soumettreCandiatureConsultant: (data) => {
        const candidature: CandidatureConsultant = {
          ...data,
          id: genId(),
          statut: "en_attente",
          noteAdmin: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ candidaturesConsultant: [...s.candidaturesConsultant, candidature] }));
        return candidature;
      },

      validerCandidatureConsultant: (id, note) => {
        const candidature = get().candidaturesConsultant.find((c) => c.id === id);
        if (!candidature) return;
        set((s) => ({
          candidaturesConsultant: s.candidaturesConsultant.map((c) =>
            c.id === id
              ? { ...c, statut: "validee", noteAdmin: note, updatedAt: new Date().toISOString() }
              : c
          ),
          consultants: [
            ...s.consultants,
            {
              id: genId(),
              prenom: candidature.prenom,
              clientsAccompa: 0,
              entreprisesAccompa: 0,
              domainesIds: candidature.domainesIds,
              actif: true,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      rejeterCandidatureConsultant: (id, note) =>
        set((s) => ({
          candidaturesConsultant: s.candidaturesConsultant.map((c) =>
            c.id === id
              ? { ...c, statut: "rejetee", noteAdmin: note, updatedAt: new Date().toISOString() }
              : c
          ),
        })),

      getCandidaturesConsultantByEmail: (email) =>
        get().candidaturesConsultant
          .filter((c) => c.email.toLowerCase() === email.toLowerCase())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      getAllCandidaturesConsultant: () =>
        get().candidaturesConsultant.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    }),
    {
      name: "sn-accompagnement-v3",
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<AccompagnementStore>;
        const defaultsMap = new Map(ESPACES_PAR_DEFAUT.map((e) => [e.id, e]));
        const persistedIds = new Set((p.espaces ?? []).map((e) => e.id));
        const manquants = ESPACES_PAR_DEFAUT.filter((e) => !persistedIds.has(e.id));
        const enriched = (p.espaces ?? []).map((e) => {
          const def = defaultsMap.get(e.id);
          if (def && !e.image && def.image) return { ...e, image: def.image };
          return e;
        });
        return {
          ...current,
          ...p,
          espaces: [...manquants, ...enriched],
        };
      },
    }
  )
);
