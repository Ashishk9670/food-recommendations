import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Plus, UtensilsCrossed } from "lucide-react";
import HeaderNav from "@/components/HeaderNav";
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
        <span className="text-[11px] font-medium text-muted">for Triomics, by Triomics</span>
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
            <div className="flex min-w-0 items-center gap-8">
              <Link href="/" aria-label="Food Recs home" className="min-w-0">
                <Logo />
              </Link>
              <HeaderNav />
            </div>
            <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
              <Link
                href="/submit"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-primary transition hover:-translate-y-px hover:bg-primary-hover"
              >
                <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
                <span className="sm:hidden">Submit</span>
                <span className="hidden sm:inline">Submit a Recommendation</span>
              </Link>
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col">{children}</main>

        <footer className="mt-16 border-t border-border-subtle bg-card-muted">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-center gap-3">
              <Logo compact />
            </div>
            <nav aria-label="Footer" className="flex gap-6 text-sm font-medium text-muted">
              <Link href="/" className="hover:text-ink">
                Browse dishes
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
