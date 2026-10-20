import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";
import "./premium.css";
import "./marketing.css";
export const metadata: Metadata = {
  title: "Tradeintra — Your operator studio",
  description:
    "Build your brand. Launch your Deriv site. A template-first operator studio.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" />
        <link
          rel="preload"
          href="/fonts/hanken-grotesk-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/source-serif-4-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
