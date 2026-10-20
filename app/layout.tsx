import type { Metadata } from "next";
import "./globals.css";
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
      </head>
      <body>{children}</body>
    </html>
  );
}
