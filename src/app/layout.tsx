import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/data/getSettings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// getSettings() is cached (tag: 'settings'), so building metadata from it keeps
// pages static/ISR; the save action revalidates the tag when settings change.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    // Plain default (no template) so existing per-page titles keep fully
    // overriding it, as they did before — avoids double-suffixing.
    title: `${settings.siteTitle} — Find Airline Offices & Contact Info Worldwide`,
    description: settings.metaDescription,
    verification: {
      google: settings.googleSiteVerification || undefined,
      other: settings.bingSiteVerification
        ? { "msvalidate.01": settings.bingSiteVerification }
        : undefined,
    },
  };
}

// Intentionally minimal and free of any dynamic API (headers()/cookies()) —
// the public Navbar/Footer chrome lives in src/app/(site)/layout.tsx instead,
// scoped to that route group only, so /admin/* never inherits it and the
// public site's static/ISR rendering here is never forced dynamic.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
