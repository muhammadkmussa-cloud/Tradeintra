"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  LayoutDashboard,
  PanelsTopLeft,
  Shapes,
  Globe2,
  Rocket,
  Bot,
  WandSparkles,
  Radio,
  Store,
  Wallet,
  Megaphone,
  CircleHelp,
  Settings,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Search,
  Bell,
  MoreHorizontal,
  ExternalLink,
  Monitor,
  Smartphone,
  Palette,
  CheckCircle2,
  Link2,
  ShieldCheck,
  Menu,
  Sparkles,
  BookOpen,
  PanelTop,
  Activity,
  Download,
  RotateCcw,
  AlertCircle,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useServerWorkspace } from "@/lib/use-server-workspace";
import {
  Config,
  Site,
  Studio,
  ModuleKey,
  defaultConfig,
  initialStudio,
  validateConfig,
  publishSite,
  rollbackSite,
  STORAGE_KEY,
  RISK,
  readStudio,
  slugify,
  relativeTime,
  accentInk,
} from "@/lib/studio";

type Page =
  | "Overview"
  | "Sites"
  | "Templates"
  | "Domains"
  | "Publish status"
  | "XML Bots"
  | "AI Bot Generator"
  | "AI Signals"
  | "Marketplace"
  | "Earnings"
  | "Announcements"
  | "Support"
  | "Settings";
const nav: { label: Page; icon: LucideIcon; soon?: boolean }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Sites", icon: PanelsTopLeft },
  { label: "Templates", icon: Shapes },
  { label: "Domains", icon: Globe2 },
  { label: "Publish status", icon: Rocket },
  { label: "XML Bots", icon: Bot, soon: true },
  { label: "AI Bot Generator", icon: WandSparkles, soon: true },
  { label: "AI Signals", icon: Radio, soon: true },
  { label: "Marketplace", icon: Store, soon: true },
  { label: "Earnings", icon: Wallet, soon: true },
];
const moduleInfo: {
  key: ModuleKey;
  name: string;
  text: string;
  icon: LucideIcon;
}[] = [
  {
    key: "markets",
    name: "Market watchlist",
    text: "A focused overview of simulated market prices.",
    icon: Activity,
  },
  {
    key: "terminal",
    name: "Demo terminal",
    text: "An interactive layout preview. No orders or live trading.",
    icon: PanelTop,
  },
  {
    key: "about",
    name: "About & contact",
    text: "Introduce your brand and tell visitors what you do.",
    icon: BookOpen,
  },
];
function Button({
  children,
  onClick,
  primary = false,
  className = "",
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn ${primary ? "primary" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge ${tone}`}>
      <span className="status-dot" />
      {children}
    </span>
  );
}
function Mark() {
  return (
    <span className="brand-mark">
      <img src="/favicon.svg" alt="" />
    </span>
  );
}
function Chart({
  color = "#b8a1e6",
  compact = false,
}: {
  color?: string;
  compact?: boolean;
}) {
  return (
    <svg
      className={`chart ${compact ? "compact" : ""}`}
      viewBox="0 0 440 150"
      fill="none"
      aria-label="Illustrative market chart. Simulated data."
      role="img"
    >
      <defs>
        <linearGradient
          id={`fill-${color.slice(1)}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop stopColor={color} stopOpacity=".24" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[30, 65, 100, 135].map((y) => (
        <path
          key={y}
          d={`M0 ${y}H440`}
          stroke="currentColor"
          strokeOpacity=".07"
          strokeDasharray="3 4"
        />
      ))}
      <path
        d="M0 128L14 116L28 121L41 95L54 108L68 89L82 97L97 76L110 88L125 83L138 104L153 90L167 96L182 69L196 75L210 48L224 57L239 43L252 64L267 52L280 67L295 39L308 46L324 34L338 51L352 29L365 36L379 16L394 29L408 9L423 20L440 7V150H0Z"
        fill={`url(#fill-${color.slice(1)})`}
      />
      <path
        d="M0 128L14 116L28 121L41 95L54 108L68 89L82 97L97 76L110 88L125 83L138 104L153 90L167 96L182 69L196 75L210 48L224 57L239 43L252 64L267 52L280 67L295 39L308 46L324 34L338 51L352 29L365 36L379 16L394 29L408 9L423 20L440 7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function MiniSite({
  config,
  hero = false,
}: {
  config: Config;
  hero?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`mini-site ${hero ? "hero-mini" : ""}`}
      style={
        {
          "--site-accent": config.color,
          "--site-ink": accentInk(config.color),
        } as React.CSSProperties
      }
    >
      <div className="mini-nav">
        <span className="mini-brand">
          <span className="tiny-brand">{config.name.charAt(0)}</span>
          {config.name}
        </span>
        <span className="mini-links">
          Markets <span>About</span>
        </span>
        <span className="mini-connect">
          Connect <ArrowUpRight size={8} />
        </span>
      </div>
      <div className="mini-content">
        <span className="mini-eyebrow">
          <span /> A DIFFERENT PERSPECTIVE
        </span>
        <h3>{config.headline}</h3>
        <p>{config.description}</p>
        <span className="mini-cta">
          Explore markets <ArrowRight size={9} />
        </span>
        {config.modules.includes("terminal") && (
          <div className="mini-terminal">
            <div className="mini-terminal-top">
              <span>
                <i />
                Volatility 100 Index
              </span>
              <span className="mock-label">DEMO</span>
            </div>
            <Chart color={config.color} compact />
            <div className="mini-axis">
              <span>09:00</span>
              <span>12:00</span>
              <span>15:00</span>
              <span>18:00</span>
            </div>
          </div>
        )}
      </div>
      <div className="mini-disclaimer">
        Simulated data · Trading involves risk
      </div>
    </div>
  );
}

export default function Home() {
  const [studio, setStudio] = useState<Studio | null>(null);
  const [page, setPage] = useState<Page>("Overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All sites");
  const [menu, setMenu] = useState<string | null>(null);
  const [wizard, setWizard] = useState<{
    id?: string;
    step: number;
    config: Config;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{
    config: Config;
    published: boolean;
  } | null>(null);
  const [smallPreview, setSmallPreview] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string;
    text: string;
    action: () => void;
  } | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [storageError, setStorageError] = useState("");
  const [ready, setReady] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const server = useServerWorkspace((next) => {
    setStudio(next);
    setWorkspaceName(next.workspace);
    setStorageError("");
  }, notify);
  const serverUser = server.user;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const data = saved ? readStudio(saved) : initialStudio();
      setStudio(data);
      setWorkspaceName(data.workspace);
    } catch {
      setStudio(initialStudio());
      setStorageError(
        "Saved workspace could not be read. This session will not overwrite it. Reset it in Settings to start fresh.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || !studio || storageError || serverUser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(studio));
    } catch {
      setStorageError(
        "Browser storage is unavailable or full. Changes are only kept for this session. Export your workspace in Settings.",
      );
    }
  }, [studio, ready, storageError, serverUser]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifications(false);
        setMenu(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("site-search")?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    document.body.style.overflow =
      wizard || preview || confirm || server.authMode ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [wizard, preview, confirm, server.authMode]);
  useEffect(() => {
    if (!wizard) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [wizard]);
  function notify(text: string) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }
  function navigate(to: Page) {
    setPage(to);
    setMobileNav(false);
    setQuery("");
    setMenu(null);
  }
  function openWizard(site?: Site) {
    setErrors({});
    setWizard({
      id: site?.id,
      step: 0,
      config: structuredClone(site?.draft ?? defaultConfig),
    });
  }
  async function saveSite(publish = false) {
    if (!wizard || !studio) return;
    const err = validateConfig(wizard.config, studio.sites, wizard.id);
    if (Object.keys(err).length) {
      setErrors(err);
      setWizard({ ...wizard, step: err.slug ? 3 : 1 });
      return;
    }
    if (serverUser) {
      const result = await server.mutate({
        kind: "save",
        ...(wizard.id ? { id: wizard.id } : {}),
        config: wizard.config,
        publish,
      });
      if (result.ok) {
        setWizard(null);
        setPage("Sites");
        notify(
          publish
            ? "Mock snapshot published to the local preview URL. DNS and SSL are unchanged."
            : "Draft saved to your server account.",
        );
      } else if (result.fields) {
        setErrors(result.fields);
        setWizard({ ...wizard, step: result.fields.slug ? 3 : 1 });
      }
      return;
    }
    const now = new Date().toISOString();
    let site: Site = {
      id: wizard.id ?? crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      draft: structuredClone(wizard.config),
      versions: [],
    };
    const existing = studio.sites.find((s) => s.id === wizard.id);
    if (existing)
      site = {
        ...existing,
        draft: structuredClone(wizard.config),
        updatedAt: now,
        sample: false,
      };
    if (publish) site = publishSite(site, studio.sites);
    const index = studio.sites.findIndex((s) => s.id === site.id);
    const sites = [...studio.sites];
    if (index < 0) sites.unshift(site);
    else sites[index] = site;
    setStudio({ ...studio, sites });
    setWizard(null);
    notify(
      publish
        ? "Local version published. No DNS or live site was created."
        : "Site saved to your browser workspace.",
    );
    setPage("Sites");
  }
  async function publish(site: Site) {
    if (!studio) return;
    if (serverUser) {
      const result = await server.mutate({ kind: "publish", id: site.id });
      if (result.ok)
        notify(
          "Mock snapshot published. No domain or trading integration was enabled.",
        );
      setMenu(null);
      return;
    }
    try {
      const updated = publishSite(site, studio.sites);
      setStudio({
        ...studio,
        sites: studio.sites.map((s) => (s.id === site.id ? updated : s)),
      });
      notify(
        "Local version published. Production DNS and SSL remain unverified.",
      );
    } catch (e) {
      notify((e as Error).message);
    }
    setMenu(null);
  }
  function removeSite(site: Site) {
    setConfirm({
      title: `Delete ${site.draft.name}?`,
      text: serverUser
        ? "This archives the site and removes its public mock preview. Immutable history is retained in the development database; permanent account erasure is not implemented."
        : "This removes the site and its local publish history from this browser. This cannot be undone.",
      action: async () => {
        if (serverUser) {
          const result = await server.mutate({ kind: "archive", id: site.id });
          if (result.ok) {
            setConfirm(null);
            notify("Site archived. Public mock preview removed.");
          }
          return;
        }
        setStudio((s) =>
          s ? { ...s, sites: s.sites.filter((x) => x.id !== site.id) } : s,
        );
        setConfirm(null);
        notify("Site deleted.");
      },
    });
    setMenu(null);
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(studio, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tradeintra-workspace.json";
    a.click();
    URL.revokeObjectURL(url);
    notify("Workspace exported.");
  }
  if (!studio || !server.sessionReady)
    return (
      <div className="loading">
        <Mark />
        <span>Opening your studio…</span>
      </div>
    );
  const sites = studio.sites;
  const published = sites.filter((s) => s.versions.length > 0);
  const events = sites
    .flatMap((s) => s.versions.map((v) => ({ site: s, version: v })))
    .sort((a, b) => b.version.createdAt.localeCompare(a.version.createdAt));
  const visibleSites = sites.filter(
    (s) =>
      (filter === "All sites" ||
        (filter === "Published"
          ? s.versions.length > 0
          : !s.versions.length)) &&
      (s.draft.name + " " + s.draft.slug)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const goNext = () => {
    if (!wizard) return;
    const err = validateConfig(wizard.config, sites, wizard.id);
    const keys =
      wizard.step === 1
        ? ["name", "color", "headline", "description"]
        : wizard.step === 3
          ? ["slug"]
          : [];
    const relevant = Object.fromEntries(
      Object.entries(err).filter(([k]) => keys.includes(k)),
    );
    setErrors(relevant);
    if (!Object.keys(relevant).length)
      setWizard({ ...wizard, step: wizard.step + 1 });
  };
  const update = (key: keyof Config, value: string | ModuleKey[]) => {
    if (!wizard) return;
    let config = { ...wizard.config, [key]: value };
    if (
      key === "name" &&
      !wizard.id &&
      (!wizard.config.slug ||
        wizard.config.slug === slugify(wizard.config.name))
    )
      config.slug = slugify(value as string);
    setWizard({ ...wizard, config });
    setErrors({ ...errors, [key]: "" });
  };
  function siteCard(site: Site) {
    return (
      <article className="site-card" key={site.id}>
        <button
          className="site-art"
          aria-label={`Preview ${site.draft.name}`}
          onClick={() => setPreview({ config: site.draft, published: false })}
          style={{ "--site-accent": site.draft.color } as React.CSSProperties}
        >
          <div className="preview-window">
            <div className="window-bar" aria-hidden="true">
              <span />
              <span />
              <span />
              <small>{site.draft.slug}.tradeintra.com</small>
            </div>
            <MiniSite config={site.draft} />
          </div>
          <span className="preview-hover">
            <ExternalLink size={15} /> Preview site
          </span>
        </button>
        <div className="site-card-body">
          <div className="site-title-row">
            <h3>{site.draft.name}</h3>
            <div className="site-menu">
              <button
                className="icon-btn"
                aria-label={`Actions for ${site.draft.name}`}
                onClick={() => setMenu(menu === site.id ? null : site.id)}
              >
                <MoreHorizontal size={19} />
              </button>
              {menu === site.id && (
                <div className="dropdown">
                  <button
                    onClick={() => {
                      openWizard(site);
                      setMenu(null);
                    }}
                  >
                    <Palette size={15} />
                    Edit site
                  </button>
                  {serverUser && site.versions.length > 0 && (
                    <a
                      className="published-site-link"
                      href={`/sites/${site.versions[site.versions.length - 1].config.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={15} />
                      Open mock site
                    </a>
                  )}
                  <button onClick={() => publish(site)}>
                    <Rocket size={15} />
                    {serverUser ? "Publish mock snapshot" : "Publish locally"}
                  </button>
                  <button onClick={() => removeSite(site)} className="danger">
                    Delete site
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="site-address">
            <Globe2 size={12} />
            {site.draft.slug}.tradeintra.com
          </div>
          <div className="site-bottom">
            <Badge tone={site.versions.length ? "green" : "neutral"}>
              {site.versions.length
                ? serverUser
                  ? "Mock published"
                  : "Local published"
                : "Draft"}
            </Badge>
            <span>
              {site.sample ? "Sample site" : relativeTime(site.updatedAt)}
            </span>
            <button className="text-link" onClick={() => openWizard(site)}>
              Manage <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </article>
    );
  }
  return (
    <div className="app-shell">
      {mobileNav && (
        <div className="sidebar-scrim" onClick={() => setMobileNav(false)} />
      )}
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <button className="wordmark" onClick={() => navigate("Overview")}>
          <Mark />
          <span>
            tradeintra<span className="wordmark-period">.</span>
          </span>
        </button>
        <button
          className="workspace-switch"
          onClick={() => navigate("Settings")}
        >
          <span className="workspace-avatar">M</span>
          <span>
            <strong>{studio.workspace}</strong>
            <small>Personal workspace</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="nav-section-label">WORKSPACE</div>
        <nav aria-label="Workspace navigation">
          {nav.slice(0, 5).map((n) => (
            <button
              key={n.label}
              aria-label={n.label}
              className={`nav-item ${page === n.label ? "active" : ""}`}
              onClick={() => navigate(n.label)}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.label === "Sites" && (
                <span className="nav-count">{sites.length}</span>
              )}
              {page === n.label && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="nav-section-label tools-label">
          BUILD & GROW <span>✦</span>
        </div>
        <nav aria-label="Tools navigation">
          {nav.slice(5).map((n) => (
            <button
              key={n.label}
              aria-label={n.label}
              className={`nav-item ${page === n.label ? "active" : ""}`}
              onClick={() => navigate(n.label)}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.label === "AI Bot Generator" && (
                <span className="soon-pill">SOON</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-card">
            <div>
              <span className="plan-star">✧</span>
              <strong>A little idea. A big launch.</strong>
            </div>
            <p>
              Your first site starts here.
              <br />
              Make it your own.
            </p>
            <button onClick={() => openWizard()}>
              Start building <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className={`nav-item ${page === "Announcements" ? "active" : ""}`}
            onClick={() => navigate("Announcements")}
          >
            <Megaphone size={18} />
            <span>What’s new</span>
            <span className="new-dot" />
          </button>
          <button
            className={`nav-item ${page === "Support" ? "active" : ""}`}
            onClick={() => navigate("Support")}
          >
            <CircleHelp size={18} />
            <span>Help & resources</span>
            <ArrowUpRight size={14} />
          </button>
          <button
            className={`nav-item ${page === "Settings" ? "active" : ""}`}
            onClick={() => navigate("Settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="user-profile" onClick={() => navigate("Settings")}>
            <span className="user-avatar">M</span>
            <span>
              <strong>My account</strong>
              <small>
                {serverUser
                  ? "Server-backed mock account"
                  : "Local demo workspace"}
              </small>
            </span>
            <ChevronDown size={14} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{page}</strong>
          </div>
          <div className="top-actions">
            {!serverUser && server.enabled && (
              <button
                className="account-access-button"
                onClick={() => {
                  server.setAuthError("");
                  server.setAuthMode("register");
                }}
              >
                Create account <ArrowUpRight size={12} />
              </button>
            )}
            <span className="demo-indicator">
              <span />
              {serverUser ? "Server workspace · mock" : "Mock environment"}
            </span>
            <button
              className="icon-btn notification-button"
              aria-label="Notifications"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={18} />
              <span />
            </button>
            <button
              className="top-avatar"
              onClick={() => navigate("Settings")}
              aria-label="Account settings"
            >
              M
            </button>
          </div>
          {notifications && (
            <div className="notification-popover">
              <div>
                <strong>You’re up to date</strong>
                <button
                  className="icon-btn"
                  aria-label="Close notifications"
                  onClick={() => setNotifications(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <p>
                {serverUser
                  ? "Your drafts and snapshots are stored in your account database. All Deriv data remains simulated."
                  : "This is your local demo. Changes stay in this browser. Create a development account to use server persistence."}
              </p>
            </div>
          )}
        </header>
        <main>
          {server.serviceError && (
            <div className="warning-banner" role="status">
              <AlertCircle size={17} />
              {server.serviceError}
            </div>
          )}
          {storageError && (
            <div className="warning-banner">
              <AlertCircle size={17} />
              {storageError}
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR OPERATOR STUDIO</div>
              <h1>
                {page === "Overview"
                  ? "Let’s build something great."
                  : page === "Sites"
                    ? "Your sites"
                    : page === "Templates"
                      ? "A head start for your next idea."
                      : page === "Domains"
                        ? "Your home on the web."
                        : page === "Publish status"
                          ? "Every launch, in one place."
                          : page}
              </h1>
              <p>
                {page === "Overview"
                  ? "A little vision. The right tools. Your next chapter starts here."
                  : page === "Sites"
                    ? "Create, customize, and manage your branded trading experiences."
                    : page === "Templates"
                      ? "One thoughtfully built template. Endless ways to make it yours."
                      : page === "Domains"
                        ? "Manage the address behind your brand."
                        : page === "Publish status"
                          ? "Track local published versions and restore an earlier configuration."
                          : page === "Settings"
                            ? "A workspace that works for you."
                            : "Build your trading business, one step at a time."}
              </p>
            </div>
            {["Overview", "Sites", "Templates"].includes(page) && (
              <Button primary onClick={() => openWizard()}>
                <Plus size={17} />
                Create site
              </Button>
            )}
          </div>
          {page === "Overview" && (
            <>
              <section className="hero-banner">
                <div className="hero-copy">
                  <span className="hero-label">
                    <span className="tiny-spark">✦</span> BUILT FOR YOUR
                    AMBITION
                  </span>
                  <h2>
                    Your brand.
                    <br />
                    Your platform.
                    <br />
                    <span>Your next big move.</span>
                  </h2>
                  <p>
                    Turn your vision into a branded Deriv site.
                    <br />
                    No code. No complicated setup. Just you, building.
                  </p>
                  <div className="hero-buttons">
                    <Button primary onClick={() => openWizard()}>
                      Build your first site <ArrowUpRight size={16} />
                    </Button>
                    <button
                      className="hero-secondary"
                      onClick={() => navigate("Templates")}
                    >
                      Explore template <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="hero-footnote">
                    <CheckCircle2 size={13} />
                    Template-first <span>·</span>
                    <CheckCircle2 size={13} />
                    Made to be yours
                  </div>
                </div>
                <div className="hero-visual" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <span className="floating-spark spark-one">✦</span>
                  <span className="floating-spark spark-two">✧</span>
                  <div className="hero-browser">
                    <div className="browser-top">
                      <div className="browser-dots">
                        <i />
                        <i />
                        <i />
                      </div>
                      <div className="browser-address">
                        <ShieldCheck size={9} />
                        your-brand.tradeintra.com
                      </div>
                      <MoreHorizontal size={12} />
                    </div>
                    <MiniSite
                      hero
                      config={{
                        ...defaultConfig,
                        name: "Your brand",
                        color: "#c3a7ef",
                        headline: "Your markets.\nYour next move.",
                      }}
                    />
                  </div>
                  <div className="floating-label brand-label">
                    <span>
                      <Palette size={16} />
                    </span>
                    <div>
                      100% your brand<small>Make every detail yours</small>
                    </div>
                  </div>
                  <div className="floating-label launch-label">
                    <span>
                      <Check size={15} />
                    </span>
                    Ready when you are
                    <ArrowUpRight size={12} />
                  </div>
                </div>
              </section>
              <section className="stats-grid" aria-label="Workspace overview">
                {[
                  {
                    label: "Total sites",
                    value: sites.length,
                    icon: PanelsTopLeft,
                    detail: `${sites.filter((s) => !s.versions.length).length} drafts ready for your touch`,
                    tag: "Your workspace",
                  },
                  {
                    label: "Published sites",
                    value: published.length,
                    icon: Rocket,
                    detail: published.length
                      ? serverUser
                        ? "Published mock preview paths"
                        : "Local versions · not publicly hosted"
                      : "Your next launch is waiting",
                    tag: serverUser ? "Mock only" : "Local only",
                  },
                  {
                    label: "Connected domains",
                    value: 0,
                    icon: Globe2,
                    detail: "Production DNS not configured",
                    tag: "Not connected",
                  },
                  {
                    label: "Deriv connection",
                    value: studio.derivLinked ? "Mock linked" : "Not linked",
                    icon: Link2,
                    detail: "Safe to explore. No live trading.",
                    tag: "Mock mode",
                  },
                ].map((s, i) => (
                  <div className="stat-card" key={s.label}>
                    <div className="stat-top">
                      <span>{s.label}</span>
                      <s.icon size={17} />
                    </div>
                    <div
                      className={`stat-value ${i === 3 ? "text-value" : ""}`}
                    >
                      {i === 3 && (
                        <span
                          className={`connection-dot ${studio.derivLinked ? "linked" : ""}`}
                        />
                      )}{" "}
                      {s.value}
                      <span className="stat-tag">{s.tag}</span>
                    </div>
                    <div className="stat-detail">
                      {s.detail}
                      {i === 3 && (
                        <button
                          aria-label="Manage Deriv connection"
                          onClick={() => navigate("Settings")}
                        >
                          <ArrowUpRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </section>
              <section className="sites-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      Your sites{" "}
                      <span className="count-pill">{sites.length}</span>
                    </h2>
                    <p>Big ideas start with a place to call home.</p>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => navigate("Sites")}
                  >
                    View all sites <ArrowRight size={15} />
                  </button>
                </div>
                <div className="sites-grid">
                  {sites.slice(0, 2).map(siteCard)}
                  <button
                    className="new-site-card"
                    onClick={() => openWizard()}
                  >
                    <span className="new-site-icon">
                      <Plus size={24} />
                    </span>
                    <strong>A new idea starts here</strong>
                    <span>
                      Pick a template. Make it yours.
                      <br />
                      Bring your next site to life.
                    </span>
                    <span className="text-link">
                      Create a site <ArrowUpRight size={14} />
                    </span>
                  </button>
                </div>
              </section>
              <div className="bottom-grid">
                <section className="getting-started panel">
                  <div className="section-heading">
                    <div>
                      <h2>A great start, step by step.</h2>
                      <p>A few small steps from idea to your first launch.</p>
                    </div>
                    <span className="progress-label">
                      {(sites.some((s) => !s.sample) ? 1 : 0) +
                        (studio.derivLinked ? 1 : 0) +
                        (published.length ? 1 : 0)}{" "}
                      of 3
                    </span>
                  </div>
                  <div className="checklist">
                    {[
                      {
                        done: sites.some((s) => !s.sample),
                        icon: Palette,
                        title: "Make a site your own",
                        text: "Choose your template and add your brand.",
                        action: () => openWizard(),
                      },
                      {
                        done: studio.derivLinked,
                        icon: Link2,
                        title: "Explore a mock Deriv connection",
                        text: "Try the connection flow in a safe environment.",
                        action: () => navigate("Settings"),
                      },
                      {
                        done: published.length > 0,
                        icon: Rocket,
                        title: "Publish your first local version",
                        text: "Preview your site and save a launch snapshot.",
                        action: () => navigate("Sites"),
                      },
                    ].map((item, i) => (
                      <button
                        key={item.title}
                        className="checklist-row"
                        onClick={item.action}
                      >
                        <span
                          className={`step-circle ${item.done ? "completed" : ""}`}
                        >
                          {item.done ? <Check size={14} /> : i + 1}
                        </span>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.text}</small>
                        </span>
                        <ArrowUpRight size={15} />
                      </button>
                    ))}
                  </div>
                </section>
                <section className="resource-card">
                  <span className="resource-icon">
                    <BookOpen size={21} />
                  </span>
                  <span className="eyebrow">A LITTLE GUIDANCE</span>
                  <h2>
                    You bring the vision.
                    <br />
                    We’ll bring the how-to.
                  </h2>
                  <p>
                    Get to know your studio, from your first brand color to your
                    first launch.
                  </p>
                  <button
                    className="text-link"
                    onClick={() => navigate("Support")}
                  >
                    Explore the getting-started guide <ArrowUpRight size={15} />
                  </button>
                </section>
              </div>
            </>
          )}
          {page === "Sites" && (
            <>
              <div className="list-toolbar">
                <div className="filter-tabs">
                  {["All sites", "Published", "Drafts"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={filter === f ? "selected" : ""}
                    >
                      {f} {f === "All sites" && <span>{sites.length}</span>}
                    </button>
                  ))}
                </div>
                <label className="search-input">
                  <Search size={16} />
                  <input
                    id="site-search"
                    placeholder="Search sites…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <kbd>⌘ K</kbd>
                </label>
              </div>
              {visibleSites.length ? (
                <div className="sites-grid full-grid">
                  {visibleSites.map(siteCard)}
                  <button
                    className="new-site-card"
                    onClick={() => openWizard()}
                  >
                    <span className="new-site-icon">
                      <Plus size={24} />
                    </span>
                    <strong>Create a new site</strong>
                    <span>Make your next idea happen.</span>
                  </button>
                </div>
              ) : (
                <div className="empty-state">
                  <PanelsTopLeft size={35} />
                  <h2>
                    {query
                      ? "No matching sites"
                      : "A blank canvas. A fresh start."}
                  </h2>
                  <p>
                    {query
                      ? "Try another site name or clear your filters."
                      : "Create a site from our ready-made Deriv template."}
                  </p>
                  <Button
                    primary
                    onClick={() => (query ? setQuery("") : openWizard())}
                  >
                    {query ? "Clear search" : "Create your first site"}
                    <ArrowRight size={16} />
                  </Button>
                </div>
              )}
              <div className="info-note">
                <ShieldCheck size={15} />
                {serverUser
                  ? "Account drafts stay private. Published mock snapshots are visible at /sites/your-slug. Open one from the site’s Actions menu. No DNS is changed."
                  : "Sample sites are editable drafts. Published versions are local snapshots, not live websites."}
              </div>
            </>
          )}
          {page === "Templates" && (
            <>
              <div className="template-intro">
                <span className="badge lavender">CURATED, NOT COMPLICATED</span>
                <h2>
                  Skip the blank page.
                  <br />
                  Start with something good.
                </h2>
                <p>
                  A purpose-built starting point for your Deriv brand.
                  <br />
                  Configure your colors, your copy, and your modules. We handle
                  the layout.
                </p>
              </div>
              <div className="template-gallery">
                <div className="template-showcase">
                  <MiniSite config={{ ...defaultConfig, name: "Your brand" }} />
                </div>
                <div className="template-description">
                  <Badge tone="green">Available in mock mode</Badge>
                  <h2>Deriv Studio</h2>
                  <p>
                    A modern, responsive trading site with a market watchlist,
                    mock terminal, and space for your story.
                  </p>
                  <ul>
                    <li>
                      <Check size={16} />
                      Desktop and mobile layouts
                    </li>
                    <li>
                      <Check size={16} />
                      Custom brand colors and copy
                    </li>
                    <li>
                      <Check size={16} />
                      Three configurable modules
                    </li>
                    <li>
                      <Check size={16} />
                      Required risk disclosure included
                    </li>
                  </ul>
                  <Button primary onClick={() => openWizard()}>
                    Use this template <ArrowUpRight size={16} />
                  </Button>
                  <button
                    className="text-link"
                    onClick={() =>
                      setPreview({
                        config: { ...defaultConfig, name: "Your brand" },
                        published: false,
                      })
                    }
                  >
                    Preview template <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
          {page === "Domains" && (
            <>
              <div className="notice-panel">
                <Globe2 size={24} />
                <div>
                  <h3>Your address. Connected with care.</h3>
                  <p>
                    {serverUser
                      ? "Names are reserved across accounts in this local server database. Mock sites use a /sites/slug preview path. Real DNS, SSL, and Namecheap integration remain unavailable."
                      : "Subdomain names can be reserved within this browser workspace. Real DNS, SSL, custom-domain registration, and Namecheap integration await the hosting proof-of-concept."}
                  </p>
                </div>
                <Badge>Local POC</Badge>
              </div>
              <section className="panel domain-table">
                <div className="section-heading">
                  <h2>Workspace subdomains</h2>
                  <Button onClick={() => openWizard()}>
                    <Plus size={15} />
                    Add a site
                  </Button>
                </div>
                {sites.length ? (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>DOMAIN</th>
                          <th>SITE</th>
                          <th>TYPE</th>
                          <th>DNS / SSL</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {sites.map((s) => (
                          <tr key={s.id}>
                            <td>
                              <Globe2 size={15} />
                              {s.draft.slug}.tradeintra.com
                            </td>
                            <td>{s.draft.name}</td>
                            <td>Free subdomain</td>
                            <td>
                              <Badge>Unverified</Badge>
                            </td>
                            <td>
                              <button
                                className="text-link"
                                onClick={() => openWizard(s)}
                              >
                                Manage <ArrowUpRight size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="muted">
                    Create a site to reserve a workspace subdomain.
                  </p>
                )}
              </section>
            </>
          )}
          {page === "Publish status" && (
            <>
              {events.length ? (
                <section className="panel">
                  <div className="section-heading">
                    <h2>
                      {serverUser
                        ? "Mock publish history"
                        : "Local publish history"}
                    </h2>
                    <Badge>{events.length} versions</Badge>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>SITE / VERSION</th>
                          <th>PUBLISHED</th>
                          <th>ENVIRONMENT</th>
                          <th>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map(({ site, version }) => (
                          <tr key={version.id}>
                            <td>
                              <span className="table-site">
                                {site.draft.name}
                                <small>
                                  Version {version.number}
                                  {version.restoredFrom
                                    ? ` · Restored from v${version.restoredFrom}`
                                    : ""}
                                </small>
                              </span>
                            </td>
                            <td>
                              {new Date(version.createdAt).toLocaleString()}
                            </td>
                            <td>
                              <Badge tone="green">
                                {serverUser
                                  ? "Server mock snapshot"
                                  : "Local snapshot"}
                              </Badge>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button
                                  className="text-link"
                                  onClick={() =>
                                    setPreview({
                                      config: version.config,
                                      published: true,
                                    })
                                  }
                                >
                                  View <ExternalLink size={13} />
                                </button>
                                {version.number !== site.versions.length && (
                                  <button
                                    className="text-link"
                                    onClick={() =>
                                      setConfirm({
                                        title: `Restore version ${version.number}?`,
                                        text: "This creates a new published snapshot and replaces the current draft. Existing publish history is preserved.",
                                        action: async () => {
                                          if (serverUser) {
                                            const result = await server.mutate({
                                              kind: "restore",
                                              id: site.id,
                                              number: version.number,
                                            });
                                            if (result.ok) {
                                              setConfirm(null);
                                              notify(
                                                "Previous configuration restored as a new mock snapshot.",
                                              );
                                            }
                                            return;
                                          }
                                          try {
                                            const restored = rollbackSite(
                                              site,
                                              version.number,
                                            );
                                            setStudio({
                                              ...studio,
                                              sites: sites.map((s) =>
                                                s.id === site.id ? restored : s,
                                              ),
                                            });
                                            notify(
                                              "Previous configuration restored as a new local version.",
                                            );
                                          } catch (e) {
                                            notify((e as Error).message);
                                          }
                                          setConfirm(null);
                                        },
                                      })
                                    }
                                  >
                                    Restore <RotateCcw size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : (
                <div className="empty-state">
                  <Rocket size={38} />
                  <h2>Your first launch is ahead.</h2>
                  <p>
                    Publish a local version of a site to start your history.
                    <br />
                    No real DNS or hosting changes will be made.
                  </p>
                  <Button primary onClick={() => navigate("Sites")}>
                    Choose a site <ArrowRight size={16} />
                  </Button>
                </div>
              )}
            </>
          )}
          {page === "Settings" && (
            <div className="settings-grid">
              <section className="panel">
                {server.serviceError && (
                  <p className="field-error" role="status">
                    {server.serviceError}
                  </p>
                )}
                <div className="section-heading">
                  <div>
                    <h2>Workspace details</h2>
                    <p>Keep your studio feeling like home.</p>
                  </div>
                  <Settings size={19} />
                </div>
                <label className="field">
                  Workspace name
                  <input
                    maxLength={40}
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                  />
                </label>
                <div className="settings-footer">
                  <span>
                    {serverUser
                      ? "Stored in your account database"
                      : "Stored in this browser only"}
                  </span>
                  <Button
                    primary
                    disabled={!workspaceName.trim()}
                    onClick={async () => {
                      if (serverUser) {
                        const result = await server.mutate({
                          kind: "settings",
                          workspace: workspaceName.trim(),
                          derivLinked: studio.derivLinked,
                        });
                        if (result.ok) notify("Workspace updated.");
                        return;
                      }
                      setStudio({ ...studio, workspace: workspaceName.trim() });
                      notify("Workspace updated.");
                    }}
                  >
                    Save changes <Check size={15} />
                  </Button>
                </div>
              </section>
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <h2>Deriv connection</h2>
                    <p>A safe space to explore.</p>
                  </div>
                  <Link2 size={20} />
                </div>
                <div className="connection-box">
                  <Badge tone={studio.derivLinked ? "green" : "neutral"}>
                    {studio.derivLinked ? "Mock linked" : "Not linked"}
                  </Badge>
                  <p>
                    This simulates account linking. No Deriv account,
                    credentials, balance, or trade access is requested. Live
                    OAuth is not enabled.
                  </p>
                  <Button
                    onClick={async () => {
                      if (serverUser) {
                        const result = await server.mutate({
                          kind: "settings",
                          workspace: studio.workspace,
                          derivLinked: !studio.derivLinked,
                        });
                        if (result.ok)
                          notify(
                            "Mock link status updated. No real Deriv connection was made.",
                          );
                        return;
                      }
                      setStudio({
                        ...studio,
                        derivLinked: !studio.derivLinked,
                      });
                      notify(
                        studio.derivLinked
                          ? "Mock account disconnected."
                          : "Mock account linked. No real Deriv connection was made.",
                      );
                    }}
                  >
                    {studio.derivLinked ? (
                      <LogOut size={15} />
                    ) : (
                      <Link2 size={15} />
                    )}{" "}
                    {studio.derivLinked
                      ? "Disconnect mock account"
                      : "Link mock account"}
                  </Button>
                </div>
              </section>
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <h2>
                      {serverUser ? "Your server account" : "Your local data"}
                    </h2>
                    <p>
                      {serverUser
                        ? serverUser.email
                        : "You’re exploring the browser-only demo."}
                    </p>
                  </div>
                  <ShieldCheck size={20} />
                </div>
                <p className="muted">
                  {serverUser
                    ? "Your drafts and mock snapshots are stored server-side and scoped to your session. Email is unverified; recovery, 2FA, and live services are not enabled. Development limits: five active sites, twenty total sites, and fifty snapshots per site. Do not enter sensitive or financial information."
                    : "Demo data stays in this browser and is not protected by authentication. Create an account for a separate server-backed workspace; demo drafts are not automatically imported."}
                </p>
                <div className="settings-data-actions">
                  <Button onClick={exportData}>
                    <Download size={15} />
                    Export workspace
                  </Button>
                  {serverUser ? (
                    <Button onClick={server.signOut} disabled={server.busy}>
                      <LogOut size={15} />
                      Sign out
                    </Button>
                  ) : (
                    <Button
                      className="danger"
                      onClick={() =>
                        setConfirm({
                          title: "Reset your workspace?",
                          text: "All your local sites and publish history will be deleted and replaced with the two sample drafts. Export your workspace first if you want to keep it.",
                          action: () => {
                            const data = initialStudio();
                            setStorageError("");
                            setStudio(data);
                            setWorkspaceName(data.workspace);
                            setConfirm(null);
                            notify("Workspace reset to sample drafts.");
                          },
                        })
                      }
                    >
                      <RotateCcw size={15} />
                      Reset demo
                    </Button>
                  )}
                  {!serverUser && server.enabled && (
                    <>
                      <Button
                        onClick={() => {
                          server.setAuthError("");
                          server.setAuthMode("register");
                        }}
                      >
                        Create account
                      </Button>
                      <Button
                        onClick={() => {
                          server.setAuthError("");
                          server.setAuthMode("login");
                        }}
                      >
                        Sign in
                      </Button>
                    </>
                  )}
                </div>
              </section>
            </div>
          )}
          {page === "Support" && (
            <>
              <div className="support-banner">
                <BookOpen size={36} />
                <h2>From first idea to first launch.</h2>
                <p>Your quick guide to the Tradeintra studio.</p>
              </div>
              <div className="guide-grid">
                {[
                  {
                    n: "01",
                    title: "Choose your starting point",
                    text: "Open Create site and choose Deriv Studio, our first curated template. There is no free-form page builder.",
                    action: "Explore template",
                    go: () => navigate("Templates"),
                  },
                  {
                    n: "02",
                    title: "Make it unmistakably yours",
                    text: "Set your brand name, headline, description, and accent color. Enable or disable the three mock modules.",
                    action: "Create a site",
                    go: () => openWizard(),
                  },
                  {
                    n: "03",
                    title: "Preview, then publish locally",
                    text: "Save your draft and preview it. Publishing makes an immutable local snapshot. Restore any previous version from Publish status.",
                    action: "View your sites",
                    go: () => navigate("Sites"),
                  },
                ].map((g) => (
                  <section className="panel guide" key={g.n}>
                    <span className="guide-number">{g.n}</span>
                    <h3>{g.title}</h3>
                    <p>{g.text}</p>
                    <button className="text-link" onClick={g.go}>
                      {g.action}
                      <ArrowUpRight size={15} />
                    </button>
                  </section>
                ))}
              </div>
              <section className="panel faq">
                <h2>A few things worth knowing</h2>
                {[
                  {
                    q: "Is my site live on the internet?",
                    a: serverUser
                      ? "Your published mock snapshot is accessible on this server at /sites/your-slug. Drafts are private. No production subdomain, DNS, or SSL has been provisioned; all data is simulated."
                      : "Demo versions exist only in this browser. Create a development account to publish an actual mock preview path on this server. Production Namecheap/DNS/SSL remain unverified.",
                  },
                  {
                    q: "Can I trade or link a real Deriv account?",
                    a: "No. All market data is illustrative. The account-linking flow is simulated. Tradeintra never executes trades, holds funds, or offers investment advice.",
                  },
                  {
                    q: "Where is my data saved?",
                    a: serverUser
                      ? "In the server database, scoped to your account. Local development uses private on-disk PostgreSQL-in-WASM. Staging targets PostgreSQL after explicit setup. Settings → Export workspace downloads your configuration, not credentials."
                      : "Demo state is kept in localStorage in this browser. Account workspaces are separate and never saved to localStorage. Use Settings → Export workspace for a configuration copy.",
                  },
                  {
                    q: "Are bots, signals, payments, and custom domains available?",
                    a: "Not in this POC. Those modules require separate security, provider, legal, and hosting approvals. There are no payments or purchases in this application.",
                  },
                ].map((f) => (
                  <details key={f.q}>
                    <summary>
                      {f.q}
                      <Plus size={17} />
                    </summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </section>
            </>
          )}
          {page === "Announcements" && (
            <section className="panel announcement">
              <span className="announcement-icon">
                <Sparkles size={25} />
              </span>
              <div className="eyebrow">
                PRODUCT UPDATE · LOCAL PROOF-OF-CONCEPT
              </div>
              <h2>Your studio starts here.</h2>
              <p>
                The first Tradeintra experience is ready to explore. Create a
                branded site, choose your modules, and save local published
                versions — all in a safe mock environment.
              </p>
              <div className="announcement-features">
                <span>
                  <CheckCircle2 size={17} />
                  Template-based creation
                </span>
                <span>
                  <CheckCircle2 size={17} />
                  Live brand preview
                </span>
                <span>
                  <CheckCircle2 size={17} />
                  Version history & restore
                </span>
              </div>
              <Button primary onClick={() => openWizard()}>
                Take it for a spin <ArrowUpRight size={16} />
              </Button>
              <p className="fine-print">
                Production hosting and provider integrations have not been
                verified.
              </p>
            </section>
          )}
          {[
            "XML Bots",
            "AI Bot Generator",
            "AI Signals",
            "Marketplace",
            "Earnings",
          ].includes(page) && (
            <section className="deferred-state">
              <div className="deferred-art">
                <Sparkles size={38} />
                <span>✧</span>
              </div>
              <Badge tone="lavender">ON THE ROADMAP</Badge>
              <h2>Good things take a solid foundation.</h2>
              <p>
                {page === "Earnings"
                  ? "No earnings or commissions are tracked in this prototype. Partner approvals, billing, and a verified ledger are required first."
                  : `${page} is not available in this proof-of-concept. We’re starting with the essentials: your brand, your site, and a reliable publishing flow.`}
              </p>
              <div className="deferred-note">
                <ShieldCheck size={17} />
                No live integrations, transactions, or generated content.
              </div>
              <Button primary onClick={() => navigate("Sites")}>
                Build your site first <ArrowRight size={16} />
              </Button>
            </section>
          )}
          <footer className="main-footer">
            <span>
              <span className="footer-mark">t</span> Built for your next
              chapter.
            </span>
            <span>
              Build. Deploy. Trade. <span className="footer-dot">·</span>
              <button onClick={() => navigate("Support")}>
                Help & resources <ArrowUpRight size={11} />
              </button>
            </span>
          </footer>
        </main>
      </div>
      {wizard && (
        <Modal
          title={
            wizard.id ? "Make it yours." : "Let’s bring your idea to life."
          }
          onClose={() =>
            setConfirm({
              title: "Leave the editor?",
              text: "Your unsaved changes will be discarded. Choose Stay to return and save your draft.",
              action: () => {
                setWizard(null);
                setConfirm(null);
              },
            })
          }
          wide
        >
          <div className="wizard-steps">
            {["Template", "Brand", "Modules", "Domain", "Review"].map(
              (label, i) => (
                <div
                  className={`wizard-step ${wizard.step === i ? "current" : ""} ${wizard.step > i ? "done" : ""}`}
                  key={label}
                >
                  <span>{wizard.step > i ? <Check size={12} /> : i + 1}</span>
                  {label}
                </div>
              ),
            )}
          </div>
          <div className="wizard-body">
            <div className="wizard-fields">
              {wizard.step === 0 && (
                <>
                  <span className="eyebrow">01 / YOUR STARTING POINT</span>
                  <h2>
                    A strong foundation.
                    <br />
                    Your personal touch.
                  </h2>
                  <p className="muted">
                    Start with our curated Deriv trading template. No code, no
                    blank canvas.
                  </p>
                  <button className="selected-template">
                    <span className="template-icon">
                      <PanelTop size={25} />
                    </span>
                    <span>
                      <strong>Deriv Studio</strong>
                      <small>Markets · Demo terminal · About</small>
                    </span>
                    <span className="selected-check">
                      <Check size={14} />
                    </span>
                  </button>
                  <div className="field-note">
                    <ShieldCheck size={15} />
                    Mock-only. No trades, account credentials, or live market
                    connections.
                  </div>
                </>
              )}
              {wizard.step === 1 && (
                <>
                  <span className="eyebrow">02 / MAKE IT YOURS</span>
                  <h2>Your brand, front and center.</h2>
                  <label className="field">
                    Site name <span>*</span>
                    <input
                      autoFocus
                      maxLength={60}
                      value={wizard.config.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g. Aurora Markets"
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                      <small className="field-error">{errors.name}</small>
                    )}
                  </label>
                  <label className="field">
                    Hero headline <span>*</span>
                    <input
                      maxLength={100}
                      value={wizard.config.headline}
                      onChange={(e) => update("headline", e.target.value)}
                    />
                    {errors.headline && (
                      <small className="field-error">{errors.headline}</small>
                    )}
                  </label>
                  <label className="field">
                    Short description
                    <textarea
                      maxLength={240}
                      rows={3}
                      value={wizard.config.description}
                      onChange={(e) => update("description", e.target.value)}
                    />
                  </label>
                  <div className="field">
                    Brand accent
                    <div className="color-options">
                      {[
                        "#B5A0EA",
                        "#A5C6B8",
                        "#E7B28E",
                        "#FEDD00",
                        "#96BDE1",
                      ].map((c) => (
                        <button
                          className={`color-swatch ${c === wizard.config.color ? "chosen" : ""}`}
                          key={c}
                          aria-label={`Use ${c} accent`}
                          onClick={() => update("color", c)}
                          style={{ background: c }}
                        >
                          {c === wizard.config.color && <Check size={16} />}
                        </button>
                      ))}
                      <label className="custom-color">
                        <input
                          aria-label="Custom accent color"
                          type="color"
                          value={wizard.config.color}
                          onChange={(e) => update("color", e.target.value)}
                        />
                        <Plus size={17} />
                      </label>
                      <span>{wizard.config.color.toUpperCase()}</span>
                    </div>
                    <small>
                      Accent is used decoratively. Text remains high-contrast.
                    </small>
                  </div>
                </>
              )}
              {wizard.step === 2 && (
                <>
                  <span className="eyebrow">03 / THE RIGHT TOOLS</span>
                  <h2>Only what you need.</h2>
                  <p className="muted">
                    Choose the sections for your site. You can change these
                    anytime.
                  </p>
                  <div className="module-options">
                    {moduleInfo.map((m) => (
                      <label
                        className={`module-option ${wizard.config.modules.includes(m.key) ? "enabled" : ""}`}
                        key={m.key}
                      >
                        <m.icon size={21} />
                        <span>
                          <strong>{m.name}</strong>
                          <small>{m.text}</small>
                        </span>
                        <input
                          type="checkbox"
                          checked={wizard.config.modules.includes(m.key)}
                          onChange={(e) =>
                            update(
                              "modules",
                              e.target.checked
                                ? [...wizard.config.modules, m.key]
                                : wizard.config.modules.filter(
                                    (x) => x !== m.key,
                                  ),
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <div className="required-module">
                    <ShieldCheck size={18} />
                    <span>
                      <strong>Risk disclosure</strong>
                      <small>
                        Always included. Your visitors deserve clarity.
                      </small>
                    </span>
                    <Badge>Required</Badge>
                  </div>
                </>
              )}
              {wizard.step === 3 && (
                <>
                  <span className="eyebrow">04 / YOUR ADDRESS</span>
                  <h2>A name to call home.</h2>
                  <p className="muted">
                    {serverUser
                      ? "Choose a name for your mock preview path and future subdomain configuration."
                      : "Choose a free subdomain for your local configuration."}
                  </p>
                  <label className="field">
                    Subdomain <span>*</span>
                    <div className="domain-input">
                      <input
                        autoFocus
                        value={wizard.config.slug}
                        maxLength={40}
                        placeholder="your-brand"
                        onChange={(e) =>
                          update("slug", e.target.value.toLowerCase())
                        }
                      />
                      <span>.tradeintra.com</span>
                    </div>
                    {errors.slug && (
                      <small className="field-error">{errors.slug}</small>
                    )}
                  </label>
                  {wizard.config.slug &&
                    !validateConfig(wizard.config, sites, wizard.id).slug && (
                      <div className="availability">
                        <CheckCircle2 size={16} />
                        {serverUser
                          ? "No workspace conflict; server checks on save"
                          : "Available in this local workspace"}
                      </div>
                    )}
                  <div className="domain-disclaimer">
                    <Globe2 size={21} />
                    <div>
                      <strong>Reservation, not a live domain</strong>
                      <p>
                        No DNS changes are made. The hostname will only become
                        live after production hosting, DNS, and SSL are
                        verified.
                      </p>
                    </div>
                  </div>
                  <div className="disabled-feature">
                    <Link2 size={18} />
                    <span>Custom domains</span>
                    <Badge>Coming later</Badge>
                  </div>
                </>
              )}
              {wizard.step === 4 && (
                <>
                  <span className="eyebrow">05 / ONE LAST LOOK</span>
                  <h2>Looking good. Ready for a snapshot?</h2>
                  <p className="muted">
                    {serverUser
                      ? "Save a private draft or publish an immutable mock snapshot on this server."
                      : "Save your draft or publish an immutable local version."}
                  </p>
                  <div className="review-list">
                    <div>
                      <span>Site name</span>
                      <strong>{wizard.config.name}</strong>
                    </div>
                    <div>
                      <span>Template</span>
                      <strong>Deriv Studio</strong>
                    </div>
                    <div>
                      <span>Subdomain</span>
                      <strong>{wizard.config.slug}.tradeintra.com</strong>
                    </div>
                    <div>
                      <span>Modules</span>
                      <strong>{wizard.config.modules.length} enabled</strong>
                    </div>
                    <div>
                      <span>Environment</span>
                      <Badge tone="lavender">Mock / local only</Badge>
                    </div>
                  </div>
                  <div className="risk-box">
                    <ShieldCheck size={18} />
                    <p>{RISK}</p>
                  </div>
                  <p className="fine-print">
                    {serverUser
                      ? "Publishing makes this mock snapshot accessible to anyone with its /sites/slug URL. Never include personal or sensitive data. No production domain or live service is enabled."
                      : "Publishing creates a browser-local snapshot. It does not make a website publicly accessible."}
                  </p>
                </>
              )}
            </div>
            <div className="wizard-preview">
              <div className="preview-label">
                <Monitor size={14} />
                LIVE BRAND PREVIEW <span>MOCK</span>
              </div>
              <div className="wizard-site-frame">
                <MiniSite
                  config={{
                    ...wizard.config,
                    name: wizard.config.name || "Your brand",
                  }}
                />
              </div>
              <p>Your site, your style. Changes appear as you go.</p>
              <div className="preview-feature-list">
                <span>
                  <Check size={13} />
                  Responsive by default
                </span>
                <span>
                  <Check size={13} />
                  Risk disclosure included
                </span>
              </div>
            </div>
          </div>
          <div className="wizard-footer">
            <div>
              <Button
                onClick={() =>
                  wizard.step
                    ? setWizard({ ...wizard, step: wizard.step - 1 })
                    : setWizard(null)
                }
              >
                <ArrowLeft size={15} />
                {wizard.step ? "Back" : "Cancel"}
              </Button>
            </div>
            <div>
              {wizard.step > 0 && (
                <Button disabled={server.busy} onClick={() => saveSite(false)}>
                  Save draft
                </Button>
              )}
              {wizard.step < 4 ? (
                <Button primary onClick={goNext}>
                  Continue <ArrowRight size={15} />
                </Button>
              ) : (
                <Button
                  primary
                  disabled={server.busy}
                  onClick={() => saveSite(true)}
                >
                  <Rocket size={15} />
                  {serverUser ? "Publish mock snapshot" : "Publish locally"}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
      {preview && (
        <Modal
          title={
            preview.published ? "Published local snapshot" : "Site preview"
          }
          onClose={() => {
            setPreview(null);
            setSmallPreview(false);
          }}
          wide
        >
          <div className="preview-toolbar">
            <span>
              <span className="status-dot" />
              {preview.published
                ? "Immutable local version"
                : "Draft preview"}{" "}
              · Simulated data
            </span>
            <div>
              <button
                aria-label="Desktop preview"
                className={`icon-btn ${!smallPreview ? "selected" : ""}`}
                onClick={() => setSmallPreview(false)}
              >
                <Monitor size={19} />
              </button>
              <button
                aria-label="Mobile preview"
                className={`icon-btn ${smallPreview ? "selected" : ""}`}
                onClick={() => setSmallPreview(true)}
              >
                <Smartphone size={19} />
              </button>
            </div>
          </div>
          <div
            className={`full-site-preview ${smallPreview ? "mobile-preview" : ""}`}
            style={
              {
                "--site-accent": preview.config.color,
                "--site-ink": accentInk(preview.config.color),
              } as React.CSSProperties
            }
          >
            <div className="tenant-nav">
              <span>
                <span className="tenant-logo">
                  {preview.config.name.charAt(0)}
                </span>
                {preview.config.name}
              </span>
              <Badge tone="lavender">Mock demo</Badge>
            </div>
            <div className="tenant-hero">
              <span className="eyebrow">YOUR MARKETS. YOUR PERSPECTIVE.</span>
              <h2>{preview.config.headline}</h2>
              <p>{preview.config.description}</p>
              {preview.config.modules.includes("markets") && (
                <Button
                  primary
                  onClick={() =>
                    document
                      .getElementById("tenant-markets")
                      ?.scrollIntoView({ behavior: "smooth", block: "nearest" })
                  }
                >
                  Explore markets <ArrowDownIcon />
                </Button>
              )}
            </div>
            {preview.config.modules.includes("markets") && (
              <div id="tenant-markets" className="tenant-markets">
                <div className="section-heading">
                  <h3>Market watchlist</h3>
                  <Badge>Simulated prices</Badge>
                </div>
                <div className="market-items">
                  {[
                    "Volatility 100 Index",
                    "Volatility 75 Index",
                    "Volatility 50 Index",
                  ].map((n, i) => (
                    <div key={n}>
                      <span>{n}</span>
                      <strong>
                        {[1452.38, 875.21, 2341.65][i].toLocaleString()}
                        <small>Illustrative only</small>
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {preview.config.modules.includes("terminal") && (
              <div className="tenant-terminal">
                <div className="section-heading">
                  <h3>Volatility 100 Index</h3>
                  <span className="mock-label">
                    SIMULATED CHART · NO TRADING
                  </span>
                </div>
                <Chart color={preview.config.color} />
              </div>
            )}
            {preview.config.modules.includes("about") && (
              <div className="tenant-about">
                <h3>About {preview.config.name}</h3>
                <p>{preview.config.description}</p>
                <p>
                  Independent operator site. All features shown in this preview
                  use mock data.
                </p>
              </div>
            )}
            <div className="tenant-risk">
              <ShieldCheck size={18} />
              <p>{RISK}</p>
            </div>
            <div className="tenant-footer">
              Built with tradeintra · Local proof-of-concept
            </div>
          </div>
        </Modal>
      )}
      {server.busy && (
        <div className="server-saving" role="status">
          <span />
          Working with your server account…
        </div>
      )}
      {server.authMode && (
        <Modal
          title={
            server.authMode === "register"
              ? "Create your development account"
              : "Welcome back."
          }
          onClose={() => {
            if (!server.busy) server.setAuthMode(null);
          }}
        >
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void server.authenticate(
                String(form.get("email") ?? ""),
                String(form.get("password") ?? ""),
              );
            }}
          >
            <span className="eyebrow">
              {server.mode === "postgres" ? "STAGING" : "LOCAL DEVELOPMENT"} ·
              MOCK ONLY
            </span>
            <p className="muted">
              A separate server-backed workspace for your sites. No real
              trading, payments, or DNS changes. Use a test email and a unique
              password.
            </p>
            <label className="field">
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                defaultValue={serverUser?.email ?? ""}
                readOnly={!!serverUser}
              />
            </label>
            <label className="field">
              Password
              <input
                name="password"
                aria-label="Password"
                aria-describedby="auth-password-help"
                type="password"
                autoComplete={
                  server.authMode === "register"
                    ? "new-password"
                    : "current-password"
                }
                minLength={12}
                maxLength={128}
                required
              />
              <small id="auth-password-help">
                At least 12 characters. Never use your Deriv password.
              </small>
            </label>
            {server.authError && (
              <p className="auth-error" role="alert">
                {server.authError}
              </p>
            )}
            <Button primary type="submit" disabled={server.busy}>
              {server.busy
                ? "Please wait…"
                : server.authMode === "register"
                  ? "Create account"
                  : "Sign in"}
              <ArrowRight size={15} />
            </Button>
            <button
              type="button"
              className="text-link"
              disabled={server.busy}
              onClick={() => {
                server.setAuthError("");
                server.setAuthMode(
                  server.authMode === "register" ? "login" : "register",
                );
              }}
            >
              {server.authMode === "register"
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
            <p className="fine-print">
              Email verification, password recovery, and 2FA are not available
              in this development MVP. Accounts are not approved for production
              or sensitive data.
            </p>
          </form>
        </Modal>
      )}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="confirm-text">{confirm.text}</p>
          <div className="confirm-actions">
            <Button onClick={() => setConfirm(null)}>Stay</Button>
            <Button primary onClick={confirm.action}>
              Confirm <ArrowRight size={15} />
            </Button>
          </div>
        </Modal>
      )}
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={19} />
          <span>{toast}</span>
          <button
            className="icon-btn"
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
function ArrowDownIcon() {
  return <ArrowRight size={15} style={{ transform: "rotate(90deg)" }} />;
}
function Modal({
  children,
  title,
  onClose,
  wide = false,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = "modal-" + title.replace(/[^a-z]/gi, "");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>(
      'button, input, textarea, [tabindex="0"]',
    );
    first?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !el) return;
      const controls = Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea, select, [tabindex="0"]',
        ),
      ).filter((x) => x.offsetParent !== null);
      const start = controls[0],
        end = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === start) {
        e.preventDefault();
        end?.focus();
      } else if (!e.shiftKey && document.activeElement === end) {
        e.preventDefault();
        start?.focus();
      }
    };
    el?.addEventListener("keydown", trap);
    return () => {
      el?.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? "wide" : ""}`}
        ref={ref}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-header">
          <div>
            <span className="modal-logo">
              <Mark />
            </span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            className="icon-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
