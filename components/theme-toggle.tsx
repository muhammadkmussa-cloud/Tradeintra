"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  if (persist) {
    try {
      localStorage.setItem("tradeintra-theme", theme);
    } catch {
      /* Privacy modes can block storage; the visual theme still applies. */
    }
  }
  const favicon = document.getElementById("theme-favicon");
  if (favicon)
    favicon.setAttribute(
      "href",
      theme === "dark" ? "/favicon-dark.svg" : "/favicon.svg",
    );
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta)
    meta.setAttribute("content", theme === "dark" ? "#0B090C" : "#F3F2F2");
  window.dispatchEvent(new CustomEvent("tradeintra-theme", { detail: theme }));
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(currentTheme());
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<Theme>).detail;
      if (next === "light" || next === "dark") setTheme(next);
    };
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem("tradeintra-theme");
      } catch {
        stored = null;
      }
      if (stored === "light" || stored === "dark") return;
      const next: Theme = media.matches ? "dark" : "light";
      applyTheme(next, false);
      setTheme(next);
    };
    window.addEventListener("tradeintra-theme", onChange);
    media.addEventListener("change", onSystem);
    return () => {
      window.removeEventListener("tradeintra-theme", onChange);
      media.removeEventListener("change", onSystem);
    };
  }, []);

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const run = () => {
      applyTheme(next);
      setTheme(next);
    };
    if (reduced || !document.startViewTransition) {
      run();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    document.documentElement.style.setProperty("--theme-x", `${x}px`);
    document.documentElement.style.setProperty("--theme-y", `${y}px`);
    document.documentElement.style.setProperty("--theme-radius", `${radius}px`);
    document.startViewTransition(run);
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggle}
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb">
          <Sun className="theme-sun" size={13} />
          <Moon className="theme-moon" size={13} />
        </span>
      </span>
    </button>
  );
}
