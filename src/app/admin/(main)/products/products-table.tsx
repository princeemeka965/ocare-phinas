"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Edit, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import { api, ApiError } from "@/lib/api";

const PAGE_SIZE = 20;

interface AdminProduct {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  condition: "new" | "used";
  active: boolean;
  images: string[];
  category: { name: string } | null;
  brand: { name: string } | null;
}
interface Option { id: string; name: string }

export function ProductsTable() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [condition, setCondition] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (categoryId) params.set("categoryId", categoryId);
    if (condition) params.set("condition", condition);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    try {
      const d = await api.get<{ products: AdminProduct[]; total: number; pages: number }>(
        `/api/admin/products?${params.toString()}`,
      );
      setProducts(d.products);
      setTotal(d.total);
      setPages(d.pages);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load products.", "Failed");
    } finally {
      setLoading(false);
    }
  }

  // Reload on filter or page changes (debounced for the search box).
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryId, condition, page]);

  useEffect(() => {
    api.get<{ categories: Option[] }>("/api/categories").then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  async function toggleActive(p: AdminProduct) {
    setBusy(p.id);
    try {
      await api.patch(`/api/admin/products/${p.id}`, { active: !p.active });
      setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update.", "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(p: AdminProduct) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    setBusy(p.id);
    try {
      await api.del(`/api/admin/products/${p.id}`);
      toast.success("Product deleted.", "Deleted");
      /* If we just removed the last row on a non-first page, step back; otherwise
         reload so totals and pagination stay accurate. */
      if (products.length === 1 && page > 1) setPage((n) => n - 1);
      else load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete.", "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} type="search" placeholder="Search products…" className="w-full h-9 pl-10 pr-4 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
        </div>
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="h-9 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none cursor-pointer">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={condition} onChange={(e) => { setCondition(e.target.value); setPage(1); }} className="h-9 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none cursor-pointer">
          <option value="">All conditions</option>
          <option value="new">New</option>
          <option value="used">Pre-owned</option>
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden sm:table-cell">Condition</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Price</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground hidden sm:table-cell">Stock</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Active</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground"><Loader2 className="size-5 animate-spin inline" /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-body-sm text-muted-foreground">No products found.</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg overflow-hidden border border-border flex-shrink-0 hidden sm:block bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.images[0] && <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />}
                        </div>
                        <span className="font-medium line-clamp-2 max-w-[200px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{p.category?.name ?? "—"}</td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <Badge variant={p.condition === "new" ? "success" : "warning"} className="text-micro">{p.condition === "new" ? "New" : "Pre-owned"}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">₦{p.price.toLocaleString("en-NG")}</td>
                    <td className="py-3 px-4 text-right hidden sm:table-cell"><span className={cn("font-medium", p.stockQuantity <= 3 && "text-destructive")}>{p.stockQuantity}</span></td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => toggleActive(p)} disabled={busy === p.id} aria-label={p.active ? "Deactivate" : "Activate"}>
                        {p.active ? <ToggleRight className="size-5 text-primary" /> : <ToggleLeft className="size-5 text-muted-foreground" />}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${p.id}`} className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors" aria-label="Edit"><Edit className="size-4" /></Link>
                        <button onClick={() => remove(p)} disabled={busy === p.id} className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50" aria-label="Delete"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-caption text-muted-foreground">
            {total} {total === 1 ? "product" : "products"}
            {pages > 1 ? ` · page ${page} of ${pages}` : ""}
          </p>
          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
