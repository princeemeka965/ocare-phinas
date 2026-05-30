"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, RefreshCw } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore, cartItemCount } from "@/store/cartStore";
import type { Metadata } from "next";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const count = cartItemCount(items);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (count === 0) {
    return (
      <div className="py-20">
        <Container>
          <div className="flex flex-col items-center justify-center text-center py-16 max-w-sm mx-auto">
            <div className="flex size-20 items-center justify-center rounded-full bg-muted mb-5">
              <ShoppingBag className="size-9 text-muted-foreground" aria-hidden />
            </div>
            <h1 className="text-h2 font-bold mb-2">Your cart is empty</h1>
            <p className="text-body-sm text-muted-foreground mb-8">
              Looks like you haven&apos;t added anything yet. Browse our catalog to find something you love.
            </p>
            <Link href="/products" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              <ShoppingBag className="size-5" /> Start shopping
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <Container>
        <h1 className="text-h1 font-bold mb-8">
          Shopping Cart{" "}
          <span className="text-muted-foreground font-normal text-h2">
            ({count} {count === 1 ? "item" : "items"})
          </span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Line items */}
          <div className="flex-1 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4"
              >
                {/* Thumbnail */}
                <Link
                  href={`/products/${item.slug}`}
                  className="flex-shrink-0 size-20 sm:size-24 rounded-xl overflow-hidden border border-border bg-muted"
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ShoppingBag className="size-6 text-muted-foreground" />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.slug}`}
                    className="text-body-sm font-semibold hover:text-primary transition-colors line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-body font-bold text-primary mt-1">
                    ₦{item.price.toLocaleString("en-NG")}
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5">
                    Line total: ₦{(item.price * item.quantity).toLocaleString("en-NG")}
                  </p>
                </div>

                {/* Quantity + remove */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() =>
                        item.quantity > 1
                          ? updateQuantity(item.id, item.quantity - 1)
                          : removeItem(item.id)
                      }
                      className="flex size-8 items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-body-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        item.quantity < item.stockQuantity
                          ? updateQuantity(item.id, item.quantity + 1)
                          : undefined
                      }
                      className="flex size-8 items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                      disabled={item.quantity >= item.stockQuantity}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3 pt-2">
              <RefreshCw className="size-4 text-muted-foreground" />
              <p className="text-caption text-muted-foreground">
                Stock is not reserved until checkout. Prices and availability are verified at checkout.
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:w-72 xl:w-80 flex-shrink-0">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4 sticky top-24">
              <h2 className="text-h3 font-bold">Order Summary</h2>

              <div className="space-y-2 text-body-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({count} items)</span>
                  <span className="font-medium">₦{subtotal.toLocaleString("en-NG")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span className="text-muted-foreground">Calculated at checkout</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between text-body font-bold">
                  <span>Total</span>
                  <span className="text-primary">₦{subtotal.toLocaleString("en-NG")}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}
              >
                Proceed to checkout <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/products"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "w-full justify-center text-muted-foreground",
                )}
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
