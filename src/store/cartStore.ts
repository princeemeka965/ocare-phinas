import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  /** Flat door-delivery fee for this product (set by the admin; not × quantity). */
  deliveryFee: number;
  quantity: number;
  image?: string;
  slug: string;
  stockQuantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: Math.min(i.quantity + 1, i.stockQuantity) }
                  : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: 1 }] };
        }),
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.id !== id)
              : s.items.map((i) =>
                  i.id === id
                    ? { ...i, quantity: Math.min(qty, i.stockQuantity) }
                    : i,
                ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: "ocare-cart" },
  ),
);

/* "Items in the cart" = distinct products, not summed quantities — 10 units
   of one product is still 1 item (header badge, cart/checkout counts). */
export const cartItemCount = (items: CartItem[]) => items.length;

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0);

/* Door-delivery fee for the whole cart — each product's flat fee charged once,
   regardless of quantity. Carts persisted before fees moved onto products may
   lack the field. */
export const cartDeliveryFee = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + (i.deliveryFee ?? 0), 0);
