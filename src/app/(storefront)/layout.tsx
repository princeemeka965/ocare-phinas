import { StorefrontHeader } from "@/components/storefront/header";
import { CategoryNav } from "@/components/storefront/category-nav";
import { StorefrontFooter } from "@/components/storefront/footer";
import { HideOnMinimal } from "@/components/storefront/hide-on-minimal";
import { FooterGate } from "@/components/storefront/footer-gate";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <StorefrontHeader />
      <HideOnMinimal>
        <CategoryNav />
      </HideOnMinimal>
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <FooterGate>
        <StorefrontFooter />
      </FooterGate>
    </div>
  );
}
