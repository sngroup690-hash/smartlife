import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  hasPassword: boolean;
  ebooksAchetes: string[];
  formationsAchetees: string[];
  wishlist: string[];
}

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface MotivationAchat {
  id: string;
  ebookIds: string[];
  objectif: string;
  situation: string;
  texte: string;
  interetAccompagnement: string;
  date: string;
}

type UserStore = {
  currentUser: CurrentUser | null;
  users: StoredUser[];
  isLoggedIn: boolean;
  ebooksAchetes: string[];
  formationsAchetees: string[];
  purchaseDates: Record<string, string>;
  showAccompagnementBanner: boolean;
  pendingEbookIds: string[];
  pendingFormationIds: string[];
  motivationsAchat: MotivationAchat[];
  wishlist: string[];
  downloadTokens: Record<string, string>;
  _hasHydrated: boolean;
  _setHasHydrated: (v: boolean) => void;

  login: (email: string, password: string) => boolean;
  loginByEmail: (email: string) => boolean;
  setServerSession: (user: { id: string; firstName: string; lastName: string; email: string; phone: string; ebooksAchetes: string[]; formationsAchetees: string[] }) => void;
  guestRegister: (data: { firstName: string; lastName: string; email: string; phone: string }) => { success: boolean; isExisting?: boolean };
  register: (data: Omit<StoredUser, "id" | "hasPassword" | "ebooksAchetes" | "formationsAchetees">) => { success: boolean; error?: string };
  setPassword: (email: string, password: string) => boolean;
  logout: () => void;
  ajouterEbooksAchetes: (ids: string[]) => void;
  ajouterEbooksPourEmail: (email: string, ids: string[]) => void;
  ajouterFormationsPourEmail: (email: string, ids: string[]) => void;
  ajouterFormationsAchetees: (ids: string[]) => void;
  dismissBanner: () => void;
  aAchetEbook: () => boolean;
  aAchetFormation: (id: string) => boolean;
  setPendingEbookIds: (ids: string[]) => void;
  clearPendingEbookIds: () => void;
  setPendingFormationIds: (ids: string[]) => void;
  clearPendingFormationIds: () => void;
  ajouterMotivation: (data: Omit<MotivationAchat, "id" | "date">) => void;
  getUserByEmail: (email: string) => StoredUser | undefined;
  setDownloadToken: (ebookId: string, token: string) => void;
  toggleWishlist: (id: string, type: "ebook" | "formation") => void;
  isInWishlist: (id: string, type: "ebook" | "formation") => boolean;
  loginFromServer: (user: { id: string; firstName: string; lastName: string; email: string; phone: string; hasPassword: boolean }) => void;
  addGuestUser: (user: { id: string; firstName: string; lastName: string; email: string; phone: string; hasPassword: boolean }) => void;
  hasSeenOnboarding: boolean;
  setOnboardingDone: () => void;
};

function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      isLoggedIn: false,
      ebooksAchetes: [],
      formationsAchetees: [],
      purchaseDates: {},
      showAccompagnementBanner: false,
      pendingEbookIds: [],
      pendingFormationIds: [],
      motivationsAchat: [],
      downloadTokens: {},
      wishlist: [],
      hasSeenOnboarding: false,
      setOnboardingDone: () => set({ hasSeenOnboarding: true }),
      _hasHydrated: false,
      _setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: (email, password) => {
        const user = get().users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!user) return false;
        // Fusionner : conserve les achats déjà dans le state (ex: ajoutés depuis la page succès)
        const mergedEbooks = [...new Set([...get().ebooksAchetes, ...(user.ebooksAchetes ?? [])])];
        const mergedForms  = [...new Set([...get().formationsAchetees, ...(user.formationsAchetees ?? [])])];
        set({
          currentUser: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
          },
          isLoggedIn: true,
          ebooksAchetes: mergedEbooks,
          formationsAchetees: mergedForms,
        });
        return true;
      },

      setServerSession: (user) => {
        set({
          currentUser: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
          },
          isLoggedIn: true,
          ebooksAchetes: user.ebooksAchetes ?? [],
          formationsAchetees: user.formationsAchetees ?? [],
        });
      },

      loginByEmail: (email) => {
        const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return false;
        // Fusionner : conserve les achats déjà dans le state (ex: ajoutés depuis la page succès)
        const mergedEbooks = [...new Set([...get().ebooksAchetes, ...(user.ebooksAchetes ?? [])])];
        const mergedForms  = [...new Set([...get().formationsAchetees, ...(user.formationsAchetees ?? [])])];
        set({
          currentUser: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
          },
          isLoggedIn: true,
          ebooksAchetes: mergedEbooks,
          formationsAchetees: mergedForms,
        });
        return true;
      },

      guestRegister: ({ firstName, lastName, email, phone }) => {
        const existing = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          set({
            currentUser: {
              id: existing.id,
              firstName: existing.firstName,
              lastName: existing.lastName,
              email: existing.email,
              phone: existing.phone,
            },
            isLoggedIn: true,
            ebooksAchetes: existing.ebooksAchetes ?? [],
          });
          return { success: true, isExisting: true };
        }
        const newUser: StoredUser = {
          id: genId(),
          firstName,
          lastName,
          email,
          phone,
          password: "",
          hasPassword: false,
          ebooksAchetes: [],
          formationsAchetees: [],
          wishlist: [],
        };
        set((state) => ({
          users: [...state.users, newUser],
          currentUser: {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            phone: newUser.phone,
          },
          isLoggedIn: true,
        }));
        return { success: true };
      },

      register: (data) => {
        const exists = get().users.some(
          (u) => u.email.toLowerCase() === data.email.toLowerCase()
        );
        if (exists) return { success: false, error: "Un compte avec cet email existe déjà." };
        const newUser: StoredUser = {
          ...data,
          id: genId(),
          hasPassword: !!data.password,
          ebooksAchetes: [],
          formationsAchetees: [],
          wishlist: [],
        };
        set((state) => ({
          users: [...state.users, newUser],
          currentUser: {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            phone: newUser.phone,
          },
          isLoggedIn: true,
        }));
        return { success: true };
      },

      setPassword: (email, password) => {
        const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return false;
        set((state) => ({
          users: state.users.map((u) =>
            u.email.toLowerCase() === email.toLowerCase()
              ? { ...u, password, hasPassword: true }
              : u
          ),
        }));
        return true;
      },

      logout: () =>
        set({
          currentUser: null,
          isLoggedIn: false,
          ebooksAchetes: [],
          formationsAchetees: [],
          showAccompagnementBanner: false,
        }),

      ajouterEbooksAchetes: (ids) => {
        const currentUser = get().currentUser;
        const now = new Date().toISOString();
        const existing = get().purchaseDates;
        const newDates: Record<string, string> = {};
        for (const id of ids) { if (!existing[id]) newDates[id] = now; }
        set((state) => ({
          ebooksAchetes: [...new Set([...state.ebooksAchetes, ...ids])],
          purchaseDates: { ...state.purchaseDates, ...newDates },
          showAccompagnementBanner: false,
          users: currentUser
            ? state.users.map((u) =>
                u.id === currentUser.id
                  ? { ...u, ebooksAchetes: [...new Set([...(u.ebooksAchetes ?? []), ...ids])] }
                  : u
              )
            : state.users,
        }));
      },

      ajouterFormationsAchetees: (ids) => {
        const currentUser = get().currentUser;
        const now = new Date().toISOString();
        const existing = get().purchaseDates;
        const newDates: Record<string, string> = {};
        for (const id of ids) { if (!existing[id]) newDates[id] = now; }
        set((state) => ({
          formationsAchetees: [...new Set([...state.formationsAchetees, ...ids])],
          purchaseDates: { ...state.purchaseDates, ...newDates },
          users: currentUser
            ? state.users.map((u) =>
                u.id === currentUser.id
                  ? { ...u, formationsAchetees: [...new Set([...(u.formationsAchetees ?? []), ...ids])] }
                  : u
              )
            : state.users,
        }));
      },

      ajouterEbooksPourEmail: (email, ids) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.email.toLowerCase() === email.toLowerCase()
              ? { ...u, ebooksAchetes: [...new Set([...(u.ebooksAchetes ?? []), ...ids])] }
              : u
          ),
        }));
      },

      ajouterFormationsPourEmail: (email, ids) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.email.toLowerCase() === email.toLowerCase()
              ? { ...u, formationsAchetees: [...new Set([...(u.formationsAchetees ?? []), ...ids])] }
              : u
          ),
        }));
      },

      dismissBanner: () => set({ showAccompagnementBanner: false }),

      aAchetEbook: () => get().ebooksAchetes.length > 0,

      aAchetFormation: (id) => get().formationsAchetees.includes(id),

      setPendingEbookIds: (ids) => set({ pendingEbookIds: ids }),

      clearPendingEbookIds: () => set({ pendingEbookIds: [] }),

      setPendingFormationIds: (ids) => set({ pendingFormationIds: ids }),

      clearPendingFormationIds: () => set({ pendingFormationIds: [] }),

      ajouterMotivation: (data) =>
        set((state) => ({
          motivationsAchat: [
            ...state.motivationsAchat,
            {
              ...data,
              id: Math.random().toString(36).slice(2),
              date: new Date().toISOString(),
            },
          ],
        })),

      getUserByEmail: (email) =>
        get().users.find((u) => u.email.toLowerCase() === email.toLowerCase()),

      setDownloadToken: (ebookId, token) =>
        set((state) => ({
          downloadTokens: { ...state.downloadTokens, [ebookId]: token },
        })),

      toggleWishlist: (id, type) => {
        const key = `${type}:${id}`;
        set((state) => {
          const next = state.wishlist.includes(key)
            ? state.wishlist.filter((k) => k !== key)
            : [...state.wishlist, key];
          return { wishlist: next };
        });
      },

      isInWishlist: (id, type) => get().wishlist.includes(`${type}:${id}`),

      addGuestUser: (serverUser) => {
        set((state) => {
          const idx = state.users.findIndex(
            (u) => u.email.toLowerCase() === serverUser.email.toLowerCase()
          );
          if (idx !== -1) {
            // Update existing entry without logging in
            return {
              users: state.users.map((u, i) =>
                i === idx
                  ? { ...u, id: serverUser.id, hasPassword: serverUser.hasPassword, firstName: serverUser.firstName || u.firstName, lastName: serverUser.lastName || u.lastName, phone: serverUser.phone || u.phone }
                  : u
              ),
            };
          }
          return {
            users: [...state.users, {
              id: serverUser.id,
              firstName: serverUser.firstName,
              lastName: serverUser.lastName,
              email: serverUser.email,
              phone: serverUser.phone,
              password: "",
              hasPassword: serverUser.hasPassword,
              ebooksAchetes: [],
              formationsAchetees: [],
              wishlist: [],
            }],
          };
        });
      },

      loginFromServer: (serverUser) => {
        set((state) => {
          const existingIdx = state.users.findIndex(
            (u) => u.email.toLowerCase() === serverUser.email.toLowerCase()
          );
          let users: StoredUser[];
          if (existingIdx !== -1) {
            users = state.users.map((u, i) =>
              i === existingIdx
                ? { ...u, id: serverUser.id, hasPassword: serverUser.hasPassword, firstName: serverUser.firstName, lastName: serverUser.lastName, phone: serverUser.phone || u.phone }
                : u
            );
          } else {
            users = [...state.users, {
              id: serverUser.id,
              firstName: serverUser.firstName,
              lastName: serverUser.lastName,
              email: serverUser.email,
              phone: serverUser.phone,
              password: "",
              hasPassword: serverUser.hasPassword,
              ebooksAchetes: [],
              formationsAchetees: [],
              wishlist: [],
            }];
          }
          return {
            users,
            currentUser: {
              id: serverUser.id,
              firstName: serverUser.firstName,
              lastName: serverUser.lastName,
              email: serverUser.email,
              phone: serverUser.phone,
            },
            isLoggedIn: true,
          };
        });
      },
    }),
    {
      name: "mediastore-user-v1",
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _hasHydrated, _setHasHydrated, ...persisted } = state;
        return {
          ...persisted,
          // Ne jamais persister les mots de passe en clair dans localStorage
          users: persisted.users.map(({ password: _, ...u }) => ({ ...u, password: "" })),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    }
  )
);
