import { StorefrontHeader } from "@/components/storefront/header";
import { CategoryNav } from "@/components/storefront/category-nav";
import { StorefrontFooter } from "@/components/storefront/footer";
import { HideOnMinimal } from "@/components/storefront/hide-on-minimal";
import { FooterGate } from "@/components/storefront/footer-gate";
import { ArrearsBanner } from "@/components/storefront/arrears-banner";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full">
      {/* Banner + header pinned together so the arrears banner stays fixed at
          the very top while scrolling, with the header sticking right below it. */}
      <div className="sticky top-0 z-50">
        <ArrearsBanner />
        <StorefrontHeader />
      </div>
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
