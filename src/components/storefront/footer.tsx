import Link from "next/link";
import { Phone, MessageCircle, ExternalLink } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/storefront/logo";

const quickLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Pre-owned Items", href: "/category/pre-owned" },
  { label: "Shop by Brand", href: "/brands" },
];

const accountLinks = [
  { label: "Register", href: "/register" },
  { label: "Log In", href: "/login" },
  { label: "My Orders", href: "/orders" },
  { label: "My Profile", href: "/profile" },
];

const pssLinks = [
  { label: "How It Works", href: "/pay-small-small" },
  { label: "Start a Solo Plan", href: "/pay-small-small/solo" },
  { label: "Join a Group", href: "/pay-small-small/join" },
  { label: "My Plan", href: "/pay-small-small/my-plan" },
];


export function StorefrontFooter() {
  return (
    <footer className="border-t border-border bg-card mt-auto" aria-label="Site footer">
      <Container>
        <div className="py-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <Link href="/" aria-label="OCare Phinas home">
              <Logo className="h-9" />
            </Link>
            <p className="text-body-sm text-muted-foreground max-w-[22ch]">
              Your trusted electronics store in Nigeria. Genuine products, honest prices.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="tel:+2340000000000"
                className="inline-flex items-center gap-2 text-caption text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="size-3.5 shrink-0" />
                <span>+234 000 000 0000</span>
              </a>
              {/* Payment WhatsApp — from Settings in Phase 3 */}
              <a
                href="https://wa.me/2340000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#25D366] px-3 py-1.5 text-caption font-medium text-white hover:bg-[#1eb85a] transition-colors"
              >
                <MessageCircle className="size-3.5" />
                Send Payment Screenshot
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h2 className="text-body-sm font-semibold mb-3">Quick Links</h2>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pay Small Small */}
          <div>
            <h2 className="text-body-sm font-semibold mb-3">Pay Small Small</h2>
            <p className="text-caption text-muted-foreground mb-3">
              Own any gadget by paying at your own pace — daily, weekly or monthly. No interest, no stress.
            </p>
            <ul className="space-y-2">
              {pssLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h2 className="text-body-sm font-semibold mb-3">My Account</h2>
            <ul className="space-y-2">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment note */}
          <div>
            <h2 className="text-body-sm font-semibold mb-3">How We Accept Payment</h2>
            <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
              <p className="text-caption font-semibold text-primary">
                Bank Transfer Only
              </p>
              <p className="text-caption text-muted-foreground">
                Transfer to our account, then send your screenshot on WhatsApp. We confirm manually, usually within 2 hours on business days.
              </p>
              <p className="text-caption text-muted-foreground">
                Always include your <strong>order reference</strong> in the transfer narration so we can match your payment instantly.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-caption text-muted-foreground">
            © {new Date().getFullYear()} OCare Phinas. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-caption text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-caption text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
