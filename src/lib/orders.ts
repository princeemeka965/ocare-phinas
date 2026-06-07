/* ------------------------------------------------------------------ *
 * Orders — shared mock data + status model                            *
 * ------------------------------------------------------------------ *
 * Single source of truth for admin order screens (list, dashboard,    *
 * detail) so references, ids and statuses stay coherent.              *
 * Phase 3: replace MOCK_ORDERS / getOrder with a real DB fetch.       *
 * ------------------------------------------------------------------ */

import { ShoppingCart, User, Users, type LucideIcon } from "lucide-react";

import type { PaymentOption, SoloFrequency } from "./pay-small-small";

export type OrderStatus =
  | "pending_payment"
  | "payment_submitted"
  | "in_plan"
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
  in_plan: { label: "In plan", variant: "default" },
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

/**
 * The payment schedule for a Solo / Group order. Payment is manual, so an
 * admin confirms each period in the order's payment record (§ payment-flow
 * §14). Solo uses the customer's chosen amount + frequency; Group uses the
 * strict slot daily. Missed periods feed the arrears section; the order only
 * moves to Processing at the fulfilment threshold (solo 50%, group 100%).
 */
export interface OrderPlan {
  /** Plan target — the product price the schedule pays toward. */
  productPrice: number;
  /** Amount expected each period (solo: chosen; group: slot daily). */
  perPayment: number;
  /** Cadence — solo: the customer's choice; group: always daily. */
  frequency: SoloFrequency;
  /** ISO date the payment schedule began. */
  startDate: string;
  /** Payment numbers the admin has already confirmed as paid. */
  paidIndices: number[];
}

/** Fraction of the price that moves a Solo order into fulfilment. */
export const SOLO_PROCESSING_THRESHOLD = 0.5;

/** The paid fraction at which a plan order moves to Processing. */
export function planProcessingThreshold(plan: PaymentOption): number {
  return plan === "solo" ? SOLO_PROCESSING_THRESHOLD : 1;
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
  /** Present for Solo / Group orders — drives the manual payment record. */
  plan?: OrderPlan;
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
    date: "2026-04-05",
    // Solo: past 50% so delivered, now finishing the balance — and one week behind.
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
    // ₦7,000/week chosen by the customer; 7 of 12 weeks confirmed (~63%).
    plan: { productPrice: 77490, perPayment: 7000, frequency: "weekly", startDate: "2026-04-05", paidIndices: [1, 2, 3, 4, 5, 6, 7] },
  },
  {
    id: "5",
    reference: "OCP-2026-00047",
    date: "2026-05-20",
    // Group: still collecting (below 100%), behind on a few daily payments.
    status: "in_plan",
    paymentPlan: "group",
    customer: { name: "Ngozi Eze", email: "ngozi@email.com", phone: "08055678901" },
    items: [
      { id: "i1", name: "Haier Thermocool Chest Freezer 200L", brand: "Haier Thermocool", condition: "new", price: 60000, qty: 1, image: IMG.freezer },
    ],
    subtotal: 60000,
    deliveryFee: DELIVERY_FEE,
    total: 62500,
    shipping: { address: "18 Nnamdi Azikiwe Street", city: "Enugu", state: "Enugu State" },
    // Strict slot daily of ₦2,000 (2 slots); 12 of 30 days confirmed (40%).
    plan: { productPrice: 60000, perPayment: 2000, frequency: "daily", startDate: "2026-05-20", paidIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  },
];

export function getOrder(id: string): Order | undefined {
  return MOCK_ORDERS.find((o) => o.id === id);
}

/* ------------------------------------------------------------------ *
 * API → UI mapping                                                    *
 * ------------------------------------------------------------------ *
 * Shapes the Prisma order returned by /api/admin/orders[/:id] into the *
 * `Order` view model the admin screens render, so the kept helpers     *
 * (planPeriods / paymentHealth) and components stay unchanged.         *
 * ------------------------------------------------------------------ */

interface ApiOrderItem {
  id: string;
  name: string;
  brand?: string | null;
  condition: "new" | "used";
  price: number;
  qty: number;
  image?: string | null;
}

interface ApiOrderPlan {
  productPrice: number;
  perPayment: number;
  frequency: SoloFrequency;
  startDate: string;
  payments?: { periodIndex: number }[];
}

export interface ApiOrder {
  id: string;
  reference: string;
  createdAt: string;
  status: OrderStatus;
  paymentPlan: PaymentOption;
  customer: { name: string; email: string; phone: string };
  items: ApiOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  shipAddress: string;
  shipCity: string;
  shipState: string;
  shipLandmark?: string | null;
  plan?: ApiOrderPlan | null;
}

export function mapApiOrder(o: ApiOrder): Order {
  return {
    id: o.id,
    reference: o.reference,
    date: o.createdAt,
    status: o.status,
    paymentPlan: o.paymentPlan,
    customer: o.customer,
    items: o.items.map((i) => ({
      id: i.id,
      name: i.name,
      brand: i.brand ?? "",
      condition: i.condition,
      price: i.price,
      qty: i.qty,
      image: i.image ?? "",
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    shipping: {
      address: o.shipAddress,
      city: o.shipCity,
      state: o.shipState,
      landmark: o.shipLandmark ?? undefined,
    },
    plan: o.plan
      ? {
          productPrice: o.plan.productPrice,
          perPayment: o.plan.perPayment,
          frequency: o.plan.frequency,
          startDate: o.plan.startDate,
          paidIndices: (o.plan.payments ?? []).map((p) => p.periodIndex).sort((a, b) => a - b),
        }
      : undefined,
  };
}
