"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { mapApiOrder, type ApiOrder, type Order } from "@/lib/orders";
import { OrdersTable } from "./orders-table";

export function OrdersBoard() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api
      .get<{ orders: ApiOrder[] }>("/api/admin/orders")
      .then((d) => setOrders(d.orders.map(mapApiOrder)))
      .catch(() => setOrders([]));
  }, []);

  if (orders === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  return <OrdersTable orders={orders} />;
}
