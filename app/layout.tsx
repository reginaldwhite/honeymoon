import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { trip } from "@/content/trip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

/**
 * This site is shared by link with specific people and is never meant to be
 * discovered. The password gate in proxy.ts is the real control; these
 * directives (plus the X-Robots-Tag header in next.config.ts) keep it out of
 * search indexes and caches even if a page is ever served without it.
 */
export const metadata: Metadata = {
  title: {
    default: `${trip.title} | A Honeymoon Itinerary`,
    template: `%s | ${trip.title}`,
  },
  description: "A day-by-day timeline of our Hawaiian honeymoon, and the planning behind it.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
