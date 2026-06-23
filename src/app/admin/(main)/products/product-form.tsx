"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Save, ImagePlus, X, Loader2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import { api, ApiError } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";

interface Option { id: string; name: string }
interface Spec { key: string; value: string }

export interface ProductFormValues {
  id?: string;
  name: string;
  description: string;
  price: number;
  deliveryFee: number;
  stockQuantity: number;
  condition: "new" | "used";
  categoryId: string | null;
  brandId: string | null;
  images: string[];
  specs: Record<string, string> | null;
  active: boolean;
}

const inputClass = "w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors";
const labelClass = "text-body-sm font-medium block mb-1.5";

const MAX_IMAGES = 3;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function ProductForm({ product }: { product?: ProductFormValues }) {
  const router = useRouter();
  const editing = !!product?.id;

  const [categories, setCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [brandId, setBrandId] = useState(product?.brandId ?? "");
  const [condition, setCondition] = useState<"new" | "used">(product?.condition ?? "new");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [deliveryFee, setDeliveryFee] = useState(product ? String(product.deliveryFee) : "");
  const [stock, setStock] = useState(product ? String(product.stockQuantity) : "");
  const [active, setActive] = useState(product?.active ?? true);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [specs, setSpecs] = useState<Spec[]>(
    product?.specs && Object.keys(product.specs).length
      ? Object.entries(product.specs).map(([key, value]) => ({ key, value }))
      : [{ key: "", value: "" }],
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ categories: Option[] }>("/api/categories").then((d) => setCategories(d.categories)).catch(() => {});
    api.get<{ brands: Option[] }>("/api/brands").then((d) => setBrands(d.brands)).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) {
      toast.error("Name and price are required.", "Missing details");
      return;
    }
    const specObj = Object.fromEntries(specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value.trim()]));
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      deliveryFee: Number(deliveryFee) || 0,
      stockQuantity: Number(stock) || 0,
      condition,
      categoryId: categoryId || null,
      brandId: brandId || null,
      images,
      specs: Object.keys(specObj).length ? specObj : null,
      active,
    };

    setSaving(true);
    try {
      if (editing) await api.patch(`/api/admin/products/${product!.id}`, payload);
      else await api.post("/api/admin/products", payload);
      toast.success(editing ? "Product updated." : "Product created.", "Saved");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the product.", "Failed");
      setSaving(false);
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const incoming = Array.from(fileList);
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`You can upload at most ${MAX_IMAGES} images.`, "Limit reached");
      return;
    }
    if (incoming.length > room) {
      toast.error(`Only ${room} more image${room === 1 ? "" : "s"} allowed — extras were skipped.`, "Limit reached");
    }

    const valid = incoming.slice(0, room).filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: unsupported format.`, "Skipped");
        return false;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name}: larger than 5 MB.`, "Skipped");
        return false;
      }
      return true;
    });
    if (!valid.length) return;

    setUploading(true);
    try {
      const urls = await Promise.all(valid.map((f) => uploadToCloudinary(f, "products")));
      setImages((prev) => [...prev, ...urls].slice(0, MAX_IMAGES));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.", "Failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  async function handleDelete() {
    if (!editing || !confirm("Delete this product? This can't be undone.")) return;
    try {
      await api.del(`/api/admin/products/${product!.id}`);
      toast.success("Product deleted.", "Deleted");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete.", "Failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-body font-semibold">Basic information</h2>
        <div><label className={labelClass}>Product name *</label><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Samsung Galaxy S24 Ultra 256GB" className={inputClass} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={cn(inputClass, "cursor-pointer")}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Brand</label>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={cn(inputClass, "cursor-pointer")}>
              <option value="">No brand</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Condition *</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value as "new" | "used")} className={cn(inputClass, "cursor-pointer")}>
              <option value="new">New</option>
              <option value="used">Pre-owned (Tokunbo / UK Used)</option>
            </select>
          </div>
        </div>
        <div><label className={labelClass}>Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the product…" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none" /></div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-body font-semibold">Pricing & stock</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={labelClass}>Price (₦) *</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min={0} placeholder="65990" className={inputClass} /></div>
          <div><label className={labelClass}>Stock quantity *</label><input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required min={0} placeholder="10" className={inputClass} /></div>
          <div><label className={labelClass}>Delivery fee (₦)</label><input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} min={0} placeholder="2500" className={inputClass} /></div>
        </div>
        <p className="text-caption text-muted-foreground -mt-1">Flat fee for door delivery of this product, charged once per order regardless of quantity — set it to match its size and weight. Store pickup is always free.</p>
        <label className="flex items-center gap-2.5 cursor-pointer"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-input text-primary" /><span className="text-body-sm font-medium">Active (visible to customers)</span></label>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-body font-semibold">Specifications</h2>
          <button type="button" onClick={() => setSpecs((s) => [...s, { key: "", value: "" }])} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}><Plus className="size-3.5" /> Add row</button>
        </div>
        {specs.map((spec, i) => (
          <div key={i} className="flex gap-2">
            <input value={spec.key} onChange={(e) => setSpecs((s) => s.map((sp, idx) => idx === i ? { ...sp, key: e.target.value } : sp))} placeholder="Key (e.g. RAM)" className={cn(inputClass, "flex-1")} />
            <input value={spec.value} onChange={(e) => setSpecs((s) => s.map((sp, idx) => idx === i ? { ...sp, value: e.target.value } : sp))} placeholder="Value (e.g. 12GB)" className={cn(inputClass, "flex-1")} />
            <button type="button" onClick={() => setSpecs((s) => s.filter((_, idx) => idx !== i))} disabled={specs.length === 1} className="flex size-10 items-center justify-center rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-30 flex-shrink-0"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-body font-semibold">Images</h2>
          <span className="text-caption text-muted-foreground">{images.length}/{MAX_IMAGES}</span>
        </div>
        <p className="text-caption text-muted-foreground -mt-1">Upload up to {MAX_IMAGES} images (JPG, PNG, WebP or AVIF, max 5&nbsp;MB each). The first image is the primary one.</p>

        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative size-24 rounded-lg border border-border overflow-hidden bg-muted group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Product image ${i + 1}`} className="size-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-white text-[10px] font-medium text-center py-0.5">Primary</span>
              )}
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-destructive hover:text-white transition-colors"
                aria-label="Remove image"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
            >
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
              <span className="text-caption">{uploading ? "Uploading…" : "Upload"}</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" className="gap-2" disabled={saving}><Save className="size-4" />{saving ? "Saving…" : editing ? "Save changes" : "Save product"}</Button>
        <Link href="/admin/products" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
        {editing && (
          <button type="button" onClick={handleDelete} className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-destructive/30 text-destructive text-body-sm font-medium hover:bg-destructive/10 transition-colors">
            <Trash2 className="size-4" /> Delete
          </button>
        )}
      </div>
    </form>
  );
}
