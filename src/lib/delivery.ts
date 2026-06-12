/* ------------------------------------------------------------------ *
 * Delivery method — door delivery vs. store pickup                      *
 * ------------------------------------------------------------------ *
 * A customer pays the delivery fee only for door delivery; pickup is    *
 * free. The fee is set per product (it varies by size/weight); a cart   *
 * charges the sum of its items' fees. For plans the fee is folded into  *
 * what the schedule collects (productPrice + deliveryFee). Shared by    *
 * the order/plan APIs and the storefront delivery picker so both agree  *
 * on the fee and address.                                               *
 * ------------------------------------------------------------------ */

export type DeliveryMethod = "delivery" | "pickup";

export interface ShippingInput {
  address: string;
  city: string;
  state: string;
  landmark?: string;
}

/** Store pickup location — recorded as the shipping address when a customer collects. */
export const PICKUP_SHIPPING: ShippingInput = {
  address: "Pickup — OCare Phinas Store, 1 Otigba Street",
  city: "Ikeja",
  state: "Lagos",
};

/**
 * Resolve the delivery fee + shipping record for a chosen method. Pickup is
 * always free and uses the store address; delivery charges the product fee
 * (or the summed cart fee) and keeps the customer's address.
 */
export function resolveDelivery(
  method: DeliveryMethod,
  productFee: number,
  shipping?: ShippingInput,
): { deliveryFee: number; shipping: ShippingInput } {
  if (method === "pickup") {
    return { deliveryFee: 0, shipping: { ...PICKUP_SHIPPING } };
  }
  return {
    deliveryFee: productFee,
    shipping: {
      address: shipping?.address ?? "",
      city: shipping?.city ?? "",
      state: shipping?.state ?? "",
      landmark: shipping?.landmark,
    },
  };
}
