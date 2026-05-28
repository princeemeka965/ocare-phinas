import { Inter } from "next/font/google";
import type { Metadata } from "next";

import { Providers } from "@/app/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const BASE_URL = "https://ocarephinas.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "OCare Phinas — Electronics Store Nigeria",
    template: "%s | OCare Phinas",
  },
  description:
    "Shop genuine electronics in Nigeria — phones, laptops, audio, appliances and more. Secure bank transfer, manual payment confirmation, and fast delivery.",
  keywords: [
    "electronics Nigeria",
    "online gadget store Nigeria",
    "buy phone Nigeria",
    "laptop Nigeria",
    "audio equipment Nigeria",
    "home appliances Nigeria",
    "OCare Phinas",
  ],
  authors: [{ name: "OCare Phinas" }],
  creator: "OCare Phinas",
  publisher: "OCare Phinas",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: BASE_URL,
    siteName: "OCare Phinas",
    title: "OCare Phinas — Electronics Store Nigeria",
    description:
      "Shop genuine electronics in Nigeria. Phones, laptops, audio, appliances and more.",
    images: [
      {
        url: "/ocare_phinas_logo.png",
        width: 1200,
        height: 630,
        alt: "OCare Phinas — Electronics Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OCare Phinas — Electronics Store Nigeria",
    description:
      "Shop genuine electronics in Nigeria. Phones, laptops, audio, appliances and more.",
    images: ["/ocare_phinas_logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/ocare_phinas_logo.png", type: "image/png" },
    ],
    apple: [{ url: "/ocare_phinas_logo.png" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "OCare Phinas",
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/ocare_phinas_logo.png` },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["English", "Yoruba", "Hausa", "Igbo"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "OCare Phinas",
      publisher: { "@id": `${BASE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Store",
      "@id": `${BASE_URL}/#store`,
      name: "OCare Phinas",
      description:
        "Online electronics store in Nigeria offering genuine phones, laptops, audio, and appliances.",
      url: BASE_URL,
      currenciesAccepted: "NGN",
      paymentAccepted: "Bank Transfer",
      areaServed: { "@type": "Country", name: "Nigeria" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-NG" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
