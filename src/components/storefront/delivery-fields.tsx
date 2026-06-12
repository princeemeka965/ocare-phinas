"use client";

import { Truck, Store } from "lucide-react";

import { FormField, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PICKUP_SHIPPING, type DeliveryMethod, type ShippingInput } from "@/lib/delivery";

/* Nigerian states (the delivery fee is set per product; pickup is free). */
export const NG_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export interface DeliveryForm {
  method: DeliveryMethod;
  state: string;
  city: string;
  address: string;
  landmark: string;
}

export function emptyDeliveryForm(): DeliveryForm {
  return { method: "delivery", state: "", city: "", address: "", landmark: "" };
}

/** Delivery needs a full address; pickup needs nothing. */
export function deliveryFormValid(d: DeliveryForm): boolean {
  return d.method === "pickup" || (!!d.state && !!d.city.trim() && !!d.address.trim());
}

/** The shipping payload to send to the API for a chosen method. */
export function deliveryShipping(d: DeliveryForm): ShippingInput {
  return d.method === "pickup"
    ? { ...PICKUP_SHIPPING }
    : {
        address: d.address.trim(),
        city: d.city.trim(),
        state: d.state,
        landmark: d.landmark.trim() || undefined,
      };
}

export interface DeliveryErrors {
  state?: string;
  city?: string;
  address?: string;
}

/** Door-delivery vs. store-pickup chooser plus the address fields for delivery. */
export function DeliveryFields({
  value,
  onChange,
  errors,
}: {
  value: DeliveryForm;
  onChange: (next: DeliveryForm) => void;
  errors?: DeliveryErrors;
}) {
  const set = (patch: Partial<DeliveryForm>) => onChange({ ...value, ...patch });
  const isDelivery = value.method === "delivery";

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Tile
          active={isDelivery}
          icon={<Truck className="size-5" />}
          title="Door delivery"
          desc="Delivered to your address — a delivery fee applies."
          onClick={() => set({ method: "delivery" })}
        />
        <Tile
          active={!isDelivery}
          icon={<Store className="size-5" />}
          title="Pickup at store"
          desc="Collect from our Lagos store — free."
          onClick={() => set({ method: "pickup" })}
        />
      </div>

      {isDelivery ? (
        <div className="space-y-4 pt-1">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="State" htmlFor="del-state" required error={errors?.state}>
              <Select
                id="del-state"
                value={value.state}
                onChange={(e) => set({ state: e.target.value })}
                aria-invalid={!!errors?.state}
              >
                <option value="" disabled>Select state</option>
                {NG_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="City / Town" htmlFor="del-city" required error={errors?.city}>
              <Input
                id="del-city"
                autoComplete="address-level2"
                placeholder="e.g. Ikeja"
                value={value.city}
                onChange={(e) => set({ city: e.target.value })}
                aria-invalid={!!errors?.city}
              />
            </FormField>
          </div>

          <FormField label="Street address" htmlFor="del-address" required error={errors?.address}>
            <Input
              id="del-address"
              autoComplete="street-address"
              placeholder="House number, street name, area"
              value={value.address}
              onChange={(e) => set({ address: e.target.value })}
              aria-invalid={!!errors?.address}
            />
          </FormField>

          <FormField
            label="Landmark / delivery notes"
            htmlFor="del-landmark"
            hint="Optional — anything that helps the rider find you."
          >
            <Input
              id="del-landmark"
              placeholder="Near the blue gate, opposite…"
              value={value.landmark}
              onChange={(e) => set({ landmark: e.target.value })}
            />
          </FormField>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/50 p-4 text-body-sm">
          <p className="font-medium">OCare Phinas Store, Computer Village</p>
          <p className="text-muted-foreground mt-0.5">
            1 Otigba Street, Ikeja, Lagos. Open Mon–Sat, 9am–6pm. We&apos;ll text you when your item
            is ready to collect — no delivery fee.
          </p>
        </div>
      )}
    </div>
  );
}

function Tile({
  active,
  icon,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
        active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      <div className={cn("flex size-10 items-center justify-center rounded-lg flex-shrink-0", active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
        {icon}
      </div>
      <div>
        <p className="text-body-sm font-semibold">{title}</p>
        <p className="text-caption text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </button>
  );
}
