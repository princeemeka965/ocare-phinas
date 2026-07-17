/* ------------------------------------------------------------------ *
 * Orders — shared status model + API → UI mapping                     *
 * ------------------------------------------------------------------ *
 * Single source of truth for admin order screens (list, dashboard,    *
 * detail) so references, ids and statuses stay coherent.              *
 * ------------------------------------------------------------------ */

import { ShoppingCart, User, Users, type LucideIcon } from "lucide-react";

import type { PaymentOption, SoloFrequency } from "./pay-small-small";
import type { DeliveryMethod } from "./delivery";

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
  /** The underlying Plan row's id — needed for admin plan actions (edit/delete). */
  id: string;
  /** Plan target — the product price the schedule pays toward. */
  productPrice: number;
  /** Door-delivery fee folded into the schedule (0 for pickup). */
  deliveryFee: number;
  /** Amount expected each period (solo: chosen; group: slot daily). */
  perPayment: number;
  /** Cadence — solo: the customer's choice; group: always daily. */
  frequency: SoloFrequency;
  /** ISO date the payment schedule began. */
  startDate: string;
  /** Payment numbers the admin has already confirmed as paid. */
  paidIndices: number[];
  /** Raw Plan fields admin actions need (edit/delete) that the customer view doesn't. */
  type: "solo" | "group";
  status: string;
  slots: number;
  productId: string | null;
  amountAllocated: number;
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
  /** Door delivery or store pickup (pickup is free). */
  deliveryMethod: DeliveryMethod;
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
  id: string;
  productPrice: number;
  deliveryFee: number;
  perPayment: number;
  frequency: SoloFrequency;
  startDate: string;
  payments?: { periodIndex: number }[];
  type: "solo" | "group";
  status: string;
  slots: number;
  productId: string | null;
  amountAllocated: number;
}

export interface ApiOrder {
  id: string;
  reference: string;
  createdAt: string;
  status: OrderStatus;
  paymentPlan: PaymentOption;
  deliveryMethod: DeliveryMethod;
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
    deliveryMethod: o.deliveryMethod,
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
          id: o.plan.id,
          productPrice: o.plan.productPrice,
          deliveryFee: o.plan.deliveryFee,
          perPayment: o.plan.perPayment,
          frequency: o.plan.frequency,
          startDate: o.plan.startDate,
          paidIndices: (o.plan.payments ?? []).map((p) => p.periodIndex).sort((a, b) => a - b),
          type: o.plan.type,
          status: o.plan.status,
          slots: o.plan.slots,
          productId: o.plan.productId,
          amountAllocated: o.plan.amountAllocated,
        }
      : undefined,
  };
}
