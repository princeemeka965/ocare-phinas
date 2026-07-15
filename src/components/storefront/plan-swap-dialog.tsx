"use client";

import { useEffect, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";
import { naira } from "@/lib/pay-small-small";

interface ProductOption {
  id: string;
  name: string;
  price: number;
  images: string[];
  condition: string;
}

/**
 * Customer self-service "switch item" — lets a plan still in its pre-delivery
 * savings phase (status "active") redirect payments to a different product.
 * Searches the public catalog (GET /api/products), same one the storefront
 * uses for browsing — unlike the admin swap tool (PlanActions), this is
 * customer-facing so it can't reach the admin-only products endpoint.
 */
export function PlanSwapDialog({
  open,
  onOpenChange,
  planId,
  currentProductId,
  onSwapped,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  currentProductId: string | null;
  onSwapped: () => void;
}) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductOption[] | null>(null);
  const [swappingId, setSwappingId] = useState<string | null>(null);

  // The parent only mounts this dialog while a plan is being switched
  // (`{swapPlan && <PlanSwapDialog .../>}`), so every mount starts fresh —
  // no reset-on-close effect needed.
  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams({ pageSize: "20" });
      if (query.trim()) params.set("q", query.trim());
      api
        .get<{ products: ProductOption[] }>(`/api/products?${params.toString()}`)
        .then((d) => setProducts(d.products))
        .catch(() => setProducts([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  async function swap(productId: string) {
    setSwappingId(productId);
    try {
      await api.post(`/api/me/plans/${planId}/swap`, { productId });
      toast.success("Your plan now pays toward this item instead.", "Switched");
      onOpenChange(false);
      onSwapped();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't switch item.");
    } finally {
      setSwappingId(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Switch item"
      description="Redirect this plan's payments to a different product — what you've already paid carries over."
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {products === null ? (
            <p className="py-8 text-center text-body-sm text-muted-foreground">Loading…</p>
          ) : products.length === 0 ? (
            <p className="py-8 text-center text-body-sm text-muted-foreground">No products found.</p>
          ) : (
            products
              .filter((p) => p.id !== currentProductId)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={swappingId !== null}
                  onClick={() => swap(p.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/40 disabled:opacity-60"
                >
                  <div className="size-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingCart className="size-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-body-sm font-medium">{p.name}</p>
                    <p className="text-caption text-muted-foreground">{naira(p.price)}</p>
                  </div>
                  {swappingId === p.id && <span className="text-caption text-muted-foreground">Switching…</span>}
                </button>
              ))
          )}
        </div>
      </div>
    </Dialog>
  );
}
