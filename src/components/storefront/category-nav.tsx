import Link from "next/link";

import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";
import { listCategories } from "@/lib/server/catalog";
import { categoryPresentation, sortCategoriesForDisplay } from "@/lib/category-presentation";

interface CategoryNavProps {
  activeCategorySlug?: string;
}

export async function CategoryNav({ activeCategorySlug }: CategoryNavProps) {
  const categories = sortCategoriesForDisplay(await listCategories());

  return (
    <nav
      className="border-b border-border bg-card/60 backdrop-blur-sm"
      aria-label="Shop by category"
    >
      <Container>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5 -mx-1 px-1">
          {categories.map((cat) => {
            const { icon: Icon, navLabel } = categoryPresentation(cat.slug);
            const active = activeCategorySlug === cat.slug;
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={cn(
                  "flex flex-shrink-0 flex-col items-center gap-1 rounded-lg px-3.5 py-2 transition-colors group",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className="size-[18px] transition-transform duration-200 group-hover:scale-110"
                  aria-hidden
                />
                <span className="text-micro font-medium whitespace-nowrap">
                  {navLabel ?? cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </nav>
  );
}
