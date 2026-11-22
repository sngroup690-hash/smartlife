import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  type: "ebook" | "service" | "formation";
  quantity: number;
  packageName?: string;
  cover?: string;
  category?: string;
};

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  cartToken: string;
  cartSavedAt: string | null;
  cartReminderDismissedAt: string | null;
  addItem: (item: Omit<CartItem, "quantity">, silent?: boolean) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  removeFormations: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  setCartSavedAt: (t: string | null) => void;
  dismissCartReminder: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      cartToken:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
      cartSavedAt: null,
      cartReminderDismissedAt: null,

      addItem: (newItem, silent = false) => {
        const existing = get().items.find((i) => i.id === newItem.id);
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
            isOpen: silent ? state.isOpen : true,
          }));
        } else {
          set((state) => ({
            items: [...state.items, { ...newItem, quantity: 1 }],
            isOpen: silent ? state.isOpen : true,
          }));
        }
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () => set({ items: [], cartSavedAt: null }),
      removeFormations: () =>
        set((state) => ({ items: state.items.filter((i) => i.type !== "formation") })),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () =>
        get().items.filter((i) => i.type !== "formation").reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.filter((i) => i.type !== "formation").reduce((sum, i) => sum + i.price * i.quantity, 0),

      setCartSavedAt: (t) => set({ cartSavedAt: t }),
      dismissCartReminder: () => set({ cartReminderDismissedAt: new Date().toISOString() }),
    }),
    { name: "smart-life-cart" }
  )
);
