import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Menu, Plus, UtensilsCrossed } from "lucide-react";
import { Suspense } from "react";
import AccountMenu from "@/components/AccountMenu";
import HeaderNav, { HeaderNavFallback, MobileMenu } from "@/components/HeaderNav";
import NotificationBell from "@/components/NotificationBell";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_TITLE = "Food Recommendations";
const SITE_DESCRIPTION = "Share and discover the best dishes, rated by everyone.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span
        className={`flex flex-shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-primary ${
          compact ? "h-9 w-9" : "h-10 w-10"
        }`}
      >
        <UtensilsCrossed aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-base font-bold tracking-tight text-ink">Food Recs</span>
        {/* Dropped on the narrowest phones so the header actions still fit. */}
        <span className="hidden text-[11px] font-medium text-muted min-[400px]:inline lg:hidden xl:inline">
          for Triomics, by Triomics
        </span>
      </span>
    </span>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <header className="sticky top-0 z-40 border-b border-border-subtle bg-card/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-7">
              <Link href="/" className="min-w-0 flex-shrink-0">
                <Logo />
              </Link>
              <Suspense fallback={<HeaderNavFallback />}>
                <HeaderNav />
              </Suspense>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-3">
              <Link
                href="/submit"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-primary transition hover:-translate-y-px hover:bg-primary-hover"
              >
                <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
                <span className="xl:hidden">Submit</span>
                <span className="hidden xl:inline">Submit a Recommendation</span>
              </Link>
              <NotificationBell />
              <AccountMenu />
              <Suspense
                fallback={
                  <span className="flex h-9 w-9 items-center justify-center text-ink lg:hidden">
                    <Menu aria-hidden="true" className="h-5 w-5" />
                  </span>
                }
              >
                <MobileMenu />
              </Suspense>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col">{children}</main>

        <footer className="mt-16 border-t border-border-subtle bg-card-muted">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <Logo compact />
              <p className="text-sm text-muted">Curated by the Triomics food collective.</p>
            </div>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted">
              <Link href="/" className="hover:text-ink">
                Browse Recs
              </Link>
              <Link href="/?sort=liked" className="hover:text-ink">
                Office Picks
              </Link>
              <Link href="/restaurants" className="hover:text-ink">
                Curated Spots
              </Link>
              <Link href="/guidelines" className="hover:text-ink">
                Tasting Guidelines
              </Link>
              <Link href="/submit" className="hover:text-ink">
                Submit a dish
              </Link>
            </nav>
            <p className="text-sm text-faint">
              © {new Date().getFullYear()} Triomics · Crafted for team gastronomy.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
