import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Providers } from "@/providers/providers";
import { SITE } from "@/lib/utils";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE.url },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LiquorStore",
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    priceRange: "$$$",
    servesCuisine: "Spirits & Wine",
  };

  return (
    <html lang="en" className="dark">
      <body className={`${display.variable} ${body.variable} ambient-bg antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
