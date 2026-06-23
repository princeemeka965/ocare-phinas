"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Edit, Trash2, AlertTriangle, Loader2, ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/store/toastStore";
import { api, ApiError } from "@/lib/api";
import { uploadToCloudinary, type UploadFolder } from "@/lib/cloudinary-upload";

interface Row {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  iconSvg?: string | null;
  logo?: string | null;
  _count: { products: number };
}
type Kind = "categories" | "brands";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Image cell for a category or brand row. Uploads the source photo to
 * Cloudinary, then the server removes the background. Categories additionally
 * get a generated header icon (silhouette SVG); brands are image-only.
 */
function ImageUploadCell({ kind, row, onChange }: { kind: Kind; row: Row; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCategory = kind === "categories";
  const folder: UploadFolder = isCategory ? "categories" : "brands";
  const field = isCategory ? "image" : "logo"; // PATCH body key
  const image = isCategory ? row.image : row.logo;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Use a JPG, PNG, WebP or AVIF image.", "Unsupported file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5 MB or smaller.", "Too large");
      return;
    }
    setBusy(true);
    try {
      const url = await uploadToCloudinary(file, folder);
      const res = await api.patch<{ backgroundRemovalFailed: boolean }>(
        `/api/admin/${kind}/${row.id}`,
        { [field]: url },
      );
      onChange();
      if (res.backgroundRemovalFailed) {
        toast.info(
          "Image saved, but the background couldn't be removed automatically — enable Cloudinary AI Background Removal, or upload a transparent PNG.",
          "Heads up",
        );
      } else {
        toast.success(`${isCategory ? "Category image" : "Brand logo"} updated.`, "Saved");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.", "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Generated header icon (silhouette) — categories only */}
      {isCategory && (
        <span
          className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground [&>svg]:size-5"
          title="Header icon"
          aria-hidden
          {...(row.iconSvg
            ? { dangerouslySetInnerHTML: { __html: row.iconSvg } }
            : { children: <span className="text-micro text-muted-foreground">—</span> })}
        />
      )}
      {/* Transparent image thumbnail */}
      <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-[conic-gradient(#0000_90deg,#00000010_0)] bg-[length:8px_8px] overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-contain" />
        ) : (
          <span className="text-micro text-muted-foreground">—</span>
        )}
      </span>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-caption hover:bg-muted transition-colors disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
        {busy ? "Working…" : image ? "Replace" : "Upload"}
      </button>
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} onChange={handleFile} className="hidden" />
    </div>
  );
}

function Section({
  title,
  kind,
  rows,
  onChange,
}: {
  title: string;
  kind: Kind;
  rows: Row[];
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const singular = kind === "categories" ? "category" : "brand";
  const imageHeading = kind === "categories" ? "Image & icon" : "Logo";
  const colSpan = 5; // Name, Slug, Image, Products, Actions

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.post(`/api/admin/${kind}`, { name: name.trim() });
      setName("");
      onChange();
      toast.success(`${singular[0].toUpperCase() + singular.slice(1)} added.`, "Saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add.", "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function rename(row: Row) {
    const next = window.prompt(`Rename ${singular}`, row.name);
    if (!next || next.trim() === row.name) return;
    try {
      await api.patch(`/api/admin/${kind}/${row.id}`, { name: next.trim() });
      onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not rename.", "Failed");
    }
  }

  async function remove(row: Row) {
    if (row._count.products > 0 || !confirm(`Delete "${row.name}"?`)) return;
    try {
      await api.del(`/api/admin/${kind}/${row.id}`);
      onChange();
      toast.success("Deleted.", "Removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete.", "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-h2 font-bold">{title}</h2>
        <form onSubmit={add} className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`New ${singular} name`}
            className="h-9 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <Button type="submit" size="sm" className="gap-1.5" disabled={busy}><Plus className="size-3.5" /> Add</Button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden sm:table-cell">Slug</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{imageHeading}</th>
              <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Products</th>
              <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr><td colSpan={colSpan} className="py-10 text-center text-body-sm text-muted-foreground">No {title.toLowerCase()} yet.</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{row.name}</td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-caption hidden sm:table-cell">{row.slug}</td>
                  <td className="py-3 px-4">
                    <ImageUploadCell kind={kind} row={row} onChange={onChange} />
                  </td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{row._count.products}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => rename(row)} className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors" aria-label="Rename"><Edit className="size-4" /></button>
                      <button onClick={() => remove(row)} disabled={row._count.products > 0} title={row._count.products > 0 ? "Has products — cannot delete" : "Delete"}
                        className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-30">
                        {row._count.products > 0 ? <AlertTriangle className="size-4 text-muted-foreground" /> : <Trash2 className="size-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CatalogManager() {
  const [categories, setCategories] = useState<Row[]>([]);
  const [brands, setBrands] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  function loadCategories() {
    api.get<{ categories: Row[] }>("/api/admin/categories").then((d) => setCategories(d.categories)).catch(() => {});
  }
  function loadBrands() {
    api.get<{ brands: Row[] }>("/api/admin/brands").then((d) => setBrands(d.brands)).catch(() => {});
  }

  useEffect(() => {
    Promise.all([
      api.get<{ categories: Row[] }>("/api/admin/categories"),
      api.get<{ brands: Row[] }>("/api/admin/brands"),
    ])
      .then(([c, b]) => { setCategories(c.categories); setBrands(b.brands); })
      .catch(() => toast.error("Could not load catalog.", "Failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center gap-2 text-muted-foreground py-12"><Loader2 className="size-5 animate-spin" /> Loading…</div>;
  }

  return (
    <div className="space-y-10">
      <Section title="Categories" kind="categories" rows={categories} onChange={loadCategories} />
      <Section title="Brands" kind="brands" rows={brands} onChange={loadBrands} />
    </div>
  );
}
