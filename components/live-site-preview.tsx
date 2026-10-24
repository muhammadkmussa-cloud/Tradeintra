"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import type { Config } from "@/lib/studio";
import { PublishedSite } from "@/components/published-site";

export function LiveSitePreview({
  config,
  onOpen,
  activeSection,
}: {
  config: Config;
  onOpen: () => void;
  activeSection?: string;
}) {
  const [device, setDevice] = useState<"page" | "phone">("page");
  const viewport = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const initialised = useRef(false);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = () => {
      setAvailable(element.clientWidth);
      if (!initialised.current && element.clientWidth > 0) {
        initialised.current = true;
        if (element.clientWidth < 720) setDevice("phone");
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const width = device === "page" ? 1280 : 390;
  const scale = available ? Math.min(1, available / width) : 1;

  useEffect(() => {
    if (!activeSection) return;
    const root = viewport.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(
      `.poc-section-${activeSection}`,
    );
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const top = target
      ? target.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        8
      : 0;
    root.scrollTo({
      top: Math.max(0, top),
      behavior: reduced ? "auto" : "smooth",
    });
  }, [activeSection, device, scale]);

  return (
    <div className="live-preview">
      <div className="live-preview-toolbar">
        <span className="live-preview-status">
          <i />
          Live preview
        </span>
        <div className="live-preview-actions">
          <button
            type="button"
            className={device === "page" ? "selected" : ""}
            aria-pressed={device === "page"}
            aria-label="Page preview"
            onClick={() => setDevice("page")}
          >
            <Monitor size={14} />
          </button>
          <button
            type="button"
            className={device === "phone" ? "selected" : ""}
            aria-pressed={device === "phone"}
            aria-label="Phone preview"
            onClick={() => setDevice("phone")}
          >
            <Smartphone size={14} />
          </button>
          <button type="button" className="live-preview-open" onClick={onOpen}>
            <ExternalLink size={13} />
            Open full preview
          </button>
        </div>
      </div>
      <div className={`live-preview-frame ${device}`}>
        <div className="live-preview-chrome" aria-hidden="true">
          <span />
          <span />
          <span />
          <strong>{config.slug || "your-brand"}.tradeintra.com</strong>
        </div>
        <div
          className="live-preview-scroll"
          ref={viewport}
          role="region"
          tabIndex={0}
          aria-label="Live draft site preview"
        >
          <div
            className="live-preview-canvas"
            style={{ width, zoom: scale } as React.CSSProperties}
            inert
            aria-hidden="true"
          >
            <PublishedSite
              config={{
                ...config,
                name: config.name || "Your brand",
              }}
              environment="Live draft"
            />
          </div>
        </div>
      </div>
      <p className="live-preview-note">
        Changes appear here as you type. This preview is not published.
      </p>
    </div>
  );
}
