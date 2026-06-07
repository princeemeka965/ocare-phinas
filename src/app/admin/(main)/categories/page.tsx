import type { Metadata } from "next";

import { CatalogManager } from "./catalog-manager";

export const metadata: Metadata = { title: "Categories & Brands — OCare Phinas Admin" };

export default function CategoriesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-h1 font-bold">Categories &amp; Brands</h1>
      <CatalogManager />
    </div>
  );
}
