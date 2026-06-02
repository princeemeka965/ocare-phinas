/* ------------------------------------------------------------------ *
 * Orders — shared mock data + status model                            *
 * ------------------------------------------------------------------ *
 * Single source of truth for admin order screens (list, dashboard,    *
 * detail) so references, ids and statuses stay coherent.              *
 * Phase 3: replace MOCK_ORDERS / getOrder with a real DB fetch.       *
 * ------------------------------------------------------------------ */

import { ShoppingCart, User, Users, type LucideIcon } from "lucide-react";

import type { PaymentOption } from "./pay-small-small";

export type OrderStatus =
  | "pending_payment"
  | "payment_submitted"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type BadgeVariant = "default" | "success" | "warning" | "destructive" | "secondary";

/** How the order was paid for: a one-off purchase or a Pay Small Small plan. */
export const PLAN_META: Record<PaymentOption, { label: string; variant: BadgeVariant; icon: LucideIcon }> = {
  outright: { label: "Outright", variant: "secondary", icon: ShoppingCart },
  solo: { label: "Solo plan", variant: "default", icon: User },
  group: { label: "Group plan", variant: "default", icon: Users },
};

export const STATUS_META: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  pending_payment: { label: "Pending payment", variant: "warning" },
  payment_submitted: { label: "Awaiting confirmation", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  processing: { label: "Processing", variant: "default" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

/** The forward progression an order moves through (excludes cancelled). */
export const STATUS_FLOW: { key: OrderStatus; label: string }[] = [
  { key: "pending_payment", label: "Pending payment" },
  { key: "payment_submitted", label: "Awaiting confirmation" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export interface OrderItem {
  id: string;
  name: string;
  brand: string;
  condition: "new" | "used";
  price: number;
  qty: number;
  image: string;
}

export interface Order {
  id: string;
  reference: string;
  date: string;
  status: OrderStatus;
  /** Outright purchase, or fulfilled via a Solo / Group Pay Small Small plan. */
  paymentPlan: PaymentOption;
  customer: { name: string; email: string; phone: string };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  /* Payment is a manual bank transfer; the customer sends a screenshot on
   * WhatsApp. The system never sees the bank, sender name or transaction
   * reference — admins verify against the WhatsApp screenshot + statement. */
  shipping: { address: string; city: string; state: string; landmark?: string };
}

const DELIVERY_FEE = 2500;

const IMG = {
  freezer: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&h=200&fit=crop&q=80",
  phone: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200&h=200&fit=crop&q=80",
  tv: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=200&h=200&fit=crop&q=80",
  console: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=200&h=200&fit=crop&q=80",
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop&q=80",
};

export const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    reference: "OCP-2026-00051",
    date: "2026-05-29",
    status: "payment_submitted",
    paymentPlan: "outright",
    customer: { name: "Adaeze Okonkwo", email: "adaeze@email.com", phone: "08011234567" },
    items: [
      { id: "i1", name: "Samsung Galaxy S24 Ultra 256GB", brand: "Samsung", condition: "new", price: 63490, qty: 1, image: IMG.phone },
    ],
    subtotal: 63490,
    deliveryFee: DELIVERY_FEE,
    total: 65990,
    shipping: { address: "14 Marina Close, Victoria Island", city: "Lagos", state: "Lagos State", landmark: "Near First Bank" },
  },
  {
    id: "2",
    reference: "OCP-2026-00050",
    date: "2026-05-28",
    status: "processing",
    paymentPlan: "outright",
    customer: { name: "Emeka Nwosu", email: "emeka@email.com", phone: "08022345678" },
    items: [
      { id: "i1", name: "Sony PlayStation 5 Slim", brand: "Sony", condition: "new", price: 20490, qty: 1, image: IMG.console },
    ],
    subtotal: 20490,
    deliveryFee: DELIVERY_FEE,
    total: 22990,
    shipping: { address: "7 Aba Road", city: "Port Harcourt", state: "Rivers State" },
  },
  {
    id: "3",
    reference: "OCP-2026-00049",
    date: "2026-05-28",
    status: "shipped",
    paymentPlan: "outright",
    customer: { name: "Bola Adesanya", email: "bola@email.com", phone: "08033456789" },
    items: [
      { id: "i1", name: "Hisense 43\" Smart TV", brand: "Hisense", condition: "new", price: 16400, qty: 1, image: IMG.tv },
    ],
    subtotal: 16400,
    deliveryFee: DELIVERY_FEE,
    total: 18900,
    shipping: { address: "22 Ring Road", city: "Ibadan", state: "Oyo State", landmark: "Opposite Cocoa House" },
  },
  {
    id: "4",
    reference: "OCP-2026-00048",
    date: "2026-05-25",
    status: "delivered",
    paymentPlan: "solo",
    customer: { name: "Chukwuemeka Anyanwu", email: "anyanwue4@gmail.com", phone: "08044567890" },
    items: [
      { id: "i1", name: "HP Pavilion 15 Laptop", brand: "HP", condition: "new", price: 77490, qty: 1, image: IMG.laptop },
    ],
    subtotal: 77490,
    deliveryFee: DELIVERY_FEE,
    total: 79990,
    shipping: { address: "3 Awolowo Avenue, Bodija", city: "Ibadan", state: "Oyo State" },
  },
  {
    id: "5",
    reference: "OCP-2026-00047",
    date: "2026-05-20",
    status: "cancelled",
    paymentPlan: "group",
    customer: { name: "Ngozi Eze", email: "ngozi@email.com", phone: "08055678901" },
    items: [
      { id: "i1", name: "Haier Thermocool Chest Freezer 200L", brand: "Haier Thermocool", condition: "new", price: 10000, qty: 1, image: IMG.freezer },
    ],
    subtotal: 10000,
    deliveryFee: DELIVERY_FEE,
    total: 12500,
    shipping: { address: "18 Nnamdi Azikiwe Street", city: "Enugu", state: "Enugu State" },
  },
];

export function getOrder(id: string): Order | undefined {
  return MOCK_ORDERS.find((o) => o.id === id);
}
