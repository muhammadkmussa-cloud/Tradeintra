"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandWordmark } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";

const primary = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Developers", href: "/developers" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Contact", href: "/contact" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    const main = document.querySelector<HTMLElement>("main");
    const footer = document.querySelector<HTMLElement>(".marketing-footer");
    main?.setAttribute("inert", "");
    footer?.setAttribute("inert", "");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1001px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (wasOpen.current && !open) menuButton.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="marketing-nav" data-scrolled={scrolled}>
      <BrandWordmark className="marketing-wordmark" />
      <nav className="marketing-primary" aria-label="Public navigation">
        {primary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="marketing-actions">
        <ThemeToggle />
        <Link className="btn marketing-login" href="/login">
          Log in
        </Link>
        <Link className="btn primary marketing-signup" href="/signup">
          Sign up
        </Link>
        <button
          ref={menuButton}
          type="button"
          className="marketing-menu"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="marketing-mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && (
        <div id="marketing-mobile-menu" className="marketing-mobile-menu">
          <nav aria-label="Mobile navigation">
            {primary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="marketing-mobile-actions">
            <ThemeToggle />
            <Link className="btn" href="/login">
              Log in
            </Link>
            <Link className="btn primary" href="/signup">
              Sign up
            </Link>
          </div>
          <div className="marketing-mobile-secondary">
            <a href="/#system" onClick={() => setOpen(false)}>
              Product
            </a>
            <a href="/#pricing" onClick={() => setOpen(false)}>
              Pricing
            </a>
            <Link href="/mcp">MCP</Link>
            <Link href="/status">Status</Link>
          </div>
        </div>
      )}
    </header>
  );
}
