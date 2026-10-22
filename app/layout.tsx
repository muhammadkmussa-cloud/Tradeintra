import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";
import "./premium.css";
import "./marketing.css";
import "./brand.css";
import "./theme.css";
import { ThemeScript } from "@/components/theme-script";
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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta name="theme-color" content="#F3F2F2" />
        <link id="theme-favicon" rel="icon" href="/favicon.svg" />
        <ThemeScript />
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
      <body>
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
