import type { Metadata } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import { trip } from "@/content/trip";
import "./globals.css";

/**
 * Classical's pairing: Cormorant Garamond for headings over Lora for body.
 * Bold is avoided throughout — semibold is the ceiling for interface headings,
 * and display sizes take the normal cut, so only 400/600 are loaded.
 *
 * Cormorant's italic is loaded as well: the public pages never set it, but the
 * dev-only admin still uses `font-display italic` on its headings, and without
 * the real cut the browser synthesizes a slanted roman.
 */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
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
    <html lang="en" className={`${cormorant.variable} ${lora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
