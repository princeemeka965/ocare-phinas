"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  User,
  Package,
  LogOut,
  ChevronDown,
  Wallet,
  ShoppingBag,
  Tag,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { useCartStore, cartItemCount } from "@/store/cartStore";
import { useUserStore } from "@/store/userStore";
import { Logo } from "@/components/storefront/logo";
import { isMinimalChrome } from "@/lib/chrome-routes";

const PRIMARY_NAV = [
  { label: "Shop All", href: "/products", icon: ShoppingBag },
  { label: "Shop by Brand", href: "/brands", icon: Tag },
  { label: "Pay Small Small", href: "/pay-small-small", icon: Wallet, highlight: true },
  { label: "Pre-owned", href: "/category/pre-owned", icon: RefreshCw },
];

export function StorefrontHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((s) => s.items);
  const user = useUserStore((s) => s.user);
  const clearUser = useUserStore((s) => s.clearUser);
  const accountRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const minimal = isMinimalChrome(pathname);

  useEffect(() => setMounted(true), []);
  const count = mounted ? cartItemCount(items) : 0;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
  }

  return (
    <>
      <header
        className={cn(
          // Stickiness is owned by the layout wrapper (so the arrears banner can
          // sit above it and stay pinned too); this just styles the bar.
          "w-full transition-all duration-300",
          scrolled
            ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
            : "bg-background/80 backdrop-blur-sm",
        )}
      >
        <Container>
          {/* Main row */}
          <div className="relative flex h-16 items-center">
            {/* Left — logo */}
            <Link
              href="/"
              className="flex-shrink-0"
              aria-label="OCare Phinas — home"
            >
              <Logo className="h-9 sm:h-10" />
            </Link>

            {/* Centre — search (laptop+) */}
            <form
              onSubmit={handleSearch}
              className="absolute left-1/2 -translate-x-1/2 hidden lg:block w-full max-w-md xl:max-w-lg"
            >
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search phones, laptops, audio..."
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-muted/50 text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
                  aria-label="Search products"
                />
              </div>
            </form>

            {/* Right — cart, account, hamburger */}
            <div className="flex items-center gap-0.5 ml-auto">
              {/* Cart */}
              <Link
                href="/cart"
                aria-label={`Shopping cart — ${count} ${count === 1 ? "item" : "items"}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "relative",
                )}
              >
                <ShoppingCart className="size-5" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-[18px] items-center justify-center rounded-full bg-primary text-primary-foreground text-micro font-bold animate-[scale-in_0.2s_ease-out]">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>

              {/* Account — desktop */}
              {user ? (
                <div ref={accountRef} className="relative hidden lg:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAccountOpen((v) => !v)}
                    className="gap-1.5"
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                  >
                    <User className="size-4" />
                    <span className="max-w-[6rem] truncate">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-200",
                        accountOpen && "rotate-180",
                      )}
                    />
                  </Button>
                  {accountOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-border bg-card shadow-lg py-1.5 animate-[fade-in-down_0.15s_ease-out]"
                    >
                      <Link
                        href="/orders"
                        role="menuitem"
                        className="flex items-center gap-2 px-3 py-2 text-body-sm hover:bg-muted rounded-lg mx-1 transition-colors"
                        onClick={() => setAccountOpen(false)}
                      >
                        <Package className="size-4" /> My Orders
                      </Link>
                      <Link
                        href="/pay-small-small/my-plan"
                        role="menuitem"
                        className="flex items-center gap-2 px-3 py-2 text-body-sm hover:bg-muted rounded-lg mx-1 transition-colors"
                        onClick={() => setAccountOpen(false)}
                      >
                        <Wallet className="size-4" /> My Plan
                      </Link>
                      <Link
                        href="/profile"
                        role="menuitem"
                        className="flex items-center gap-2 px-3 py-2 text-body-sm hover:bg-muted rounded-lg mx-1 transition-colors"
                        onClick={() => setAccountOpen(false)}
                      >
                        <User className="size-4" /> Profile
                      </Link>
                      <hr className="my-1 border-border" />
                      <button
                        role="menuitem"
                        onClick={() => {
                          clearUser();
                          setAccountOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-destructive hover:bg-destructive/10 rounded-lg mx-1 transition-colors"
                      >
                        <LogOut className="size-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-1 ml-1">
                  <Link
                    href="/login"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className={buttonVariants({ size: "sm" })}
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Hamburger — below laptop */}
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden ml-1"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </div>
          </div>

          {/* Primary nav strip — desktop only (hidden on auth / focused flows) */}
          {!minimal && (
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-1 border-t border-border/40 py-1 -mx-1 px-1"
          >
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors",
                    item.highlight
                      ? "bg-accent text-accent-foreground font-semibold shadow-sm hover:bg-accent/90"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {item.label}
                  {item.highlight && (
                    <Sparkles className="size-3 text-accent-foreground" aria-hidden />
                  )}
                </Link>
              );
            })}
          </nav>
          )}

          {/* Search — mobile (below main row) */}
          <div className="lg:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search electronics..."
                className="w-full h-9 pl-10 pr-4 rounded-lg border border-input bg-muted/50 text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
                aria-label="Search products"
              />
            </form>
          </div>
        </Container>
      </header>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden animate-[fade-in_0.2s_ease-out]"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-72 bg-card border-l border-border shadow-2xl lg:hidden transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Navigation menu"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <span className="text-h3 font-semibold">Menu</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {/* Primary nav links — hidden on auth / focused flows */}
          {!minimal && (
          <div className="pb-2 mb-2 border-b border-border space-y-0.5">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-body-sm font-medium transition-colors",
                    item.highlight
                      ? "bg-accent text-accent-foreground font-semibold hover:bg-accent/90"
                      : "hover:bg-muted",
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="size-4 flex-shrink-0" aria-hidden />
                  {item.label}
                  {item.highlight && (
                    <Sparkles className="size-3 text-accent-foreground ml-auto" aria-hidden />
                  )}
                </Link>
              );
            })}
          </div>
          )}

          {/* Account section */}
          {user ? (
            <>
              <div className="px-3 py-3 mb-2 rounded-xl bg-muted/50">
                <p className="text-body-sm font-semibold">{user.name}</p>
                <p className="text-caption text-muted-foreground">{user.email}</p>
              </div>
              <Link
                href="/orders"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-body-sm hover:bg-muted transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Package className="size-4 text-muted-foreground" /> My Orders
              </Link>
              <Link
                href="/pay-small-small/my-plan"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-body-sm hover:bg-muted transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Wallet className="size-4 text-muted-foreground" /> My Plan
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-body-sm hover:bg-muted transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <User className="size-4 text-muted-foreground" /> Profile
              </Link>
              <hr className="my-2 border-border" />
              <button
                onClick={() => {
                  clearUser();
                  setMobileOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-lg text-body-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="size-4" /> Logout
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                href="/register"
                className={cn(buttonVariants(), "w-full justify-center")}
                onClick={() => setMobileOpen(false)}
              >
                Create account
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full justify-center",
                )}
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
