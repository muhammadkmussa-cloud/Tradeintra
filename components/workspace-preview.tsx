"use client";

import { useId, useState } from "react";

const markets = [
  ["Volatility 100", "1,452.38", "+0.42%"],
  ["Volatility 75", "875.21", "-0.18%"],
  ["Volatility 50", "2,341.65", "+0.11%"],
  ["Step Index", "9,032.40", "+0.03%"],
];

const views = ["Overview", "Markets", "Strategies"] as const;

export function WorkspacePreview({
  name,
  accent,
  tradeHref,
  logo,
  compact = false,
  decorative = false,
}: {
  name: string;
  accent: string;
  tradeHref: string;
  logo?: string;
  compact?: boolean;
  decorative?: boolean;
}) {
  const [view, setView] = useState<(typeof views)[number]>("Overview");
  const id = useId().replace(/:/g, "");
  const active = compact ? "Overview" : view;
  const panelId = `workspace-panel-${id}`;
  const tabId = (item: (typeof views)[number]) => `workspace-tab-${id}-${item}`;

  return (
    <div
      className={`workspace-preview ${compact ? "compact" : ""}`}
      style={{ "--preview-accent": accent } as React.CSSProperties}
    >
      <div className="workspace-preview-chrome" aria-hidden="true">
        <span />
        <span />
        <span />
        <strong>
          {name.toLowerCase().replace(/\s+/g, "-")}.tradeintra.com
        </strong>
      </div>
      <div className="workspace-preview-shell">
        <aside className="workspace-preview-rail" aria-hidden="true">
          {logo ? (
            <img
              className="workspace-preview-logo"
              src={logo}
              alt=""
              aria-hidden="true"
            />
          ) : (
            <span className="workspace-preview-logo">{name.charAt(0)}</span>
          )}
          {["Overview", "Markets", "Trade", "Strategies", "Reports"].map(
            (item) => (
              <span className={item === "Overview" ? "active" : ""} key={item}>
                {item}
              </span>
            ),
          )}
        </aside>
        <div className="workspace-preview-main">
          <div className="workspace-preview-top">
            <span>DEMO WORKSPACE</span>
            <span>$10,000.00</span>
          </div>
          {!compact ? (
            <div
              className="workspace-preview-tabs"
              role="tablist"
              aria-label={`${name} workspace preview`}
            >
              {views.map((item) => (
                <button
                  id={tabId(item)}
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={active === item}
                  aria-controls={panelId}
                  tabIndex={active === item ? 0 : -1}
                  className={active === item ? "active" : ""}
                  onClick={() => setView(item)}
                  onKeyDown={(event) => {
                    const index = views.indexOf(item);
                    const next =
                      event.key === "ArrowRight"
                        ? views[(index + 1) % views.length]
                        : event.key === "ArrowLeft"
                          ? views[(index - 1 + views.length) % views.length]
                          : event.key === "Home"
                            ? views[0]
                            : event.key === "End"
                              ? views[views.length - 1]
                              : null;
                    if (!next) return;
                    event.preventDefault();
                    setView(next);
                    document.getElementById(tabId(next))?.focus();
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
          <div
            id={panelId}
            role={compact || decorative ? undefined : "tabpanel"}
            aria-labelledby={
              compact || decorative
                ? undefined
                : tabId(active as (typeof views)[number])
            }
            tabIndex={compact || decorative ? undefined : 0}
          >
            {active === "Overview" ? (
              <>
                <div className="workspace-preview-hero">
                  <div>
                    <span>VOLATILITY 100</span>
                    <strong>1,452.38</strong>
                    <small>Simulated · +0.42%</small>
                  </div>
                  <svg
                    viewBox="0 0 300 90"
                    role="img"
                    aria-label="Illustrative simulated price chart"
                  >
                    <path
                      d="M0 70L18 62L36 67L54 48L72 55L90 38L108 46L126 30L144 42L162 22L180 35L198 18L216 28L234 14L252 24L270 9L288 20L300 14"
                      fill="none"
                      stroke="var(--preview-accent)"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
                <div className="workspace-preview-cards">
                  {markets.slice(0, 3).map(([market, price, change]) => (
                    <div key={market}>
                      <span>{market}</span>
                      <strong>{price}</strong>
                      <small>{change}</small>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            {active === "Markets" ? (
              <div className="workspace-preview-markets">
                {markets.map(([market, price, change]) => (
                  <div key={market}>
                    <span>{market}</span>
                    <strong>{price}</strong>
                    <small>{change}</small>
                    <a href={tradeHref}>Trade</a>
                  </div>
                ))}
              </div>
            ) : null}
            {active === "Strategies" ? (
              <div className="workspace-preview-strategies">
                {["1-3-2-6", "D'Alembert", "Martingale", "Oscar's Grind"].map(
                  (strategy) => (
                    <div key={strategy}>
                      <span>{strategy}</span>
                      <small>DBot preset · review risk</small>
                    </div>
                  ),
                )}
              </div>
            ) : null}
          </div>
          <div className="workspace-preview-footer">
            <span>Simulated data only</span>
            {decorative ? null : <a href={tradeHref}>Open full demo</a>}
          </div>
        </div>
      </div>
    </div>
  );
}
