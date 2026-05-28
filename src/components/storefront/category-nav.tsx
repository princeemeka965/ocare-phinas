import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Headphones,
  Tv,
  Cable,
  Camera,
  Gamepad2,
  TabletSmartphone,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";

const categories = [
  { name: "Phones", slug: "phones", icon: Smartphone },
  { name: "Laptops", slug: "laptops", icon: Laptop },
  { name: "Tablets", slug: "tablets", icon: TabletSmartphone },
  { name: "Audio", slug: "audio", icon: Headphones },
  { name: "Appliances", slug: "appliances", icon: Tv },
  { name: "Accessories", slug: "accessories", icon: Cable },
  { name: "Gaming", slug: "gaming", icon: Gamepad2 },
  { name: "Cameras", slug: "cameras", icon: Camera },
];

interface CategoryNavProps {
  activeCategorySlug?: string;
}

export function CategoryNav({ activeCategorySlug }: CategoryNavProps) {
  return (
    <nav
      className="border-b border-border bg-card/60 backdrop-blur-sm"
      aria-label="Shop by category"
    >
      <Container>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5 -mx-1 px-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
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
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </nav>
  );
}
