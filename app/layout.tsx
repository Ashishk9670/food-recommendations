import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Food Recommendations",
  description: "Share and discover the best dishes, rated by everyone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-orange-50">
        <header className="bg-gradient-to-r from-orange-600 to-rose-600 shadow-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4">
            <Link href="/" className="whitespace-nowrap text-base font-bold text-white sm:text-lg">
              <span className="sm:hidden">🍽️ Food Recs</span>
              <span className="hidden sm:inline">🍽️ Food Recommendations</span>
            </Link>
            <Link
              href="/submit"
              className="flex-shrink-0 whitespace-nowrap rounded-lg bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm hover:bg-orange-50"
            >
              <span className="sm:hidden">+ Submit</span>
              <span className="hidden sm:inline">+ Submit a Recommendation</span>
            </Link>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
