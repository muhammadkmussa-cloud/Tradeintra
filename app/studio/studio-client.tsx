"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
import dynamic from "next/dynamic";
import { mockOpsEnabled } from "@/lib/mock-ops";
import { ServerDomains } from "@/components/server-domains";
import { ServerEarnings } from "@/components/server-earnings";
import { ServerMarketplace } from "@/components/server-marketplace";
import { ServerSignals } from "@/components/server-signals";
import { ServerAdmin } from "@/components/server-admin";
import { ServerBots } from "@/components/server-bots";
import { ServerMfa } from "@/components/server-mfa";
import { BrandMark } from "@/components/brand-mark";
import { ModuleEditor } from "@/components/module-editor";
import { LogoUpload } from "@/components/logo-upload";
import { PublishedSite } from "@/components/published-site";
import { WorkspacePreview } from "@/components/workspace-preview";
import { LiveSitePreview } from "@/components/live-site-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import { ServerSupport } from "@/components/server-support";
import { ServerAnnouncements } from "@/components/server-announcements";

const MockOpsPage = dynamic(
  () => import("@/components/mock-ops").then((module) => module.MockOpsPage),
  { ssr: false },
);
import {
  Config,
  Site,
  Studio,
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
  accentOnDark,
} from "@/lib/studio";

type Page =
  | "My Site"
  | "Templates"
  | "Domains"
  | "Publish status"
  | "XML Bots"
  | "AI Signals"
  | "Marketplace"
  | "Earnings"
  | "Announcements"
  | "Support"
  | "Settings"
  | "Admin";
const nav: {
  label: Page;
  icon: LucideIcon;
  soon?: boolean;
  devOnly?: boolean;
}[] = [
  { label: "My Site", icon: LayoutDashboard },
  { label: "Templates", icon: Shapes },
  { label: "Domains", icon: Globe2 },
  { label: "Publish status", icon: Rocket },
  { label: "XML Bots", icon: Bot, soon: true },
  { label: "AI Signals", icon: Radio, soon: true },
  { label: "Marketplace", icon: Store, soon: true },
  { label: "Earnings", icon: Wallet, soon: true },
  { label: "Admin", icon: ShieldCheck, devOnly: true },
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
  return <BrandMark />;
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
          "--site-accent-on-dark": accentOnDark(config.color),
          "--site-ink": accentInk(config.color),
        } as React.CSSProperties
      }
    >
      <div className="mini-nav">
        <span className="mini-brand">
          {config.logo ? (
            <img
              className="tiny-brand tiny-brand-logo"
              src={config.logo}
              alt=""
              aria-hidden="true"
            />
          ) : (
            <span className="tiny-brand">{config.name.charAt(0)}</span>
          )}
          {config.name}
        </span>
        <span className="mini-links">
          Workspace <span>Markets</span> <span>Strategies</span>
        </span>
        <span className="mini-connect">
          Connect <ArrowUpRight size={8} />
        </span>
      </div>
      <div className="mini-content">
        <span className="mini-eyebrow">
          <span /> ANALYTICS · STRATEGIES · DEMO WORKSPACE
        </span>
        <h3>{config.headline}</h3>
        <p>{config.description}</p>
        <span className="mini-cta">
          Explore workspace <ArrowRight size={9} />
        </span>
        <div className="mini-workspace">
          <WorkspacePreview
            name={config.name}
            accent={accentOnDark(config.color)}
            tradeHref="#"
            logo={config.logo}
            compact
            decorative
          />
        </div>
      </div>
      <div className="mini-disclaimer">
        Simulated data · Trading involves risk
      </div>
    </div>
  );
}

export default function Home() {
  const [studio, setStudio] = useState<Studio | null>(null);
  const [page, setPage] = useState<Page>("My Site");
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
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
  const [wizardPane, setWizardPane] = useState<"edit" | "preview">("edit");
  const [previewSection, setPreviewSection] = useState("home");
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
    setMenu(null);
  }
  function openWizard(site?: Site) {
    setWizardPane("edit");
    const target = site ?? studio?.sites[0];
    if (serverUser && !studio?.derivLinked && !target) {
      notify("Link a mock Deriv account before creating your site.");
      setPage("Settings");
      return;
    }
    setErrors({});
    setWizard({
      id: target?.id,
      step: 0,
      config: structuredClone(target?.draft ?? defaultConfig),
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
      if (publish && !studio.derivLinked) {
        setErrors({
          general: "Link a mock Deriv account before publishing.",
        });
        return;
      }
      const result = await server.mutate({
        kind: "save",
        ...(wizard.id ? { id: wizard.id } : {}),
        config: wizard.config,
        publish,
      });
      if (result.ok) {
        setWizard(null);
        setPage("My Site");
        notify(
          publish
            ? "Demo version saved to the server preview path. DNS and SSL are unchanged."
            : "Draft saved to your server account.",
        );
      } else if (result.fields) {
        setErrors(result.fields);
        setWizard({ ...wizard, step: result.fields.slug ? 3 : 1 });
      }
      return;
    }
    const now = new Date().toISOString();
    const existing = studio.sites.find(
      (s) => s.id === (wizard.id ?? studio.sites[0]?.id),
    );
    let site: Site = {
      id: wizard.id ?? existing?.id ?? crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      draft: structuredClone(wizard.config),
      versions: [],
    };
    if (!existing && studio.sites.length > 0) {
      setErrors({ name: "One site per account. Edit your existing site." });
      return;
    }
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
    setPage("My Site");
  }
  async function publish(site: Site) {
    if (!studio) return;
    if (serverUser) {
      const result = await server.mutate({ kind: "publish", id: site.id });
      if (result.ok)
        notify(
          "Demo version saved. No domain or trading integration was enabled.",
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
  const sites = studio.sites.slice(0, 1);
  const devMock = mockOpsEnabled();
  const visibleNav = nav.filter((item) => !item.devOnly || devMock);
  const toolLabels = new Set([
    "XML Bots",
    "AI Signals",
    "Marketplace",
    "Earnings",
    "Admin",
  ]);
  const workspaceNav = visibleNav.filter((item) => !toolLabels.has(item.label));
  const toolsNav = visibleNav.filter((item) => toolLabels.has(item.label));
  const mockPages = [
    "Domains",
    "XML Bots",
    "AI Signals",
    "Marketplace",
    "Earnings",
    "Announcements",
    "Support",
    "Admin",
  ];
  const mockSiteRefs = sites.map((site) => ({
    id: site.id,
    name: site.draft.name,
    slug: site.draft.slug,
  }));
  const published = sites.filter((s) => s.versions.length > 0);
  const events = sites
    .flatMap((s) => s.versions.map((v) => ({ site: s, version: v })))
    .sort((a, b) => b.version.createdAt.localeCompare(a.version.createdAt));
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
  const update = (key: keyof Config, value: unknown) => {
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
                    {serverUser ? "Save demo version" : "Save demo locally"}
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
            <span className="site-address-text">
              {site.draft.slug}.tradeintra.com
            </span>
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
        <button className="wordmark" onClick={() => navigate("My Site")}>
          <Mark />
          <span className="brand-word" aria-label="tradeintra">
            <span className="brand-word-trade">trade</span>
            <span className="brand-word-intra">intra</span>
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
          {workspaceNav.map((n) => (
            <button
              key={n.label}
              aria-label={n.label}
              className={`nav-item ${page === n.label ? "active" : ""}`}
              onClick={() => navigate(n.label)}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {page === n.label && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="nav-section-label tools-label">
          BUILD & GROW <span aria-hidden="true">✦</span>
        </div>
        <nav aria-label="Tools navigation">
          {toolsNav.map((n) => (
            <button
              key={n.label}
              aria-label={n.label}
              className={`nav-item ${page === n.label ? "active" : ""}`}
              onClick={() => navigate(n.label)}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-card">
            <div>
              <span className="plan-star" aria-hidden="true">
                +
              </span>
              <strong>Operator workspace</strong>
            </div>
            <p>
              One considered system for
              <br />
              brand, domains, and publication.
            </p>
            <button onClick={() => openWizard(sites[0])}>
              {sites.length ? "Manage site" : "Create a site"}{" "}
              <ArrowUpRight size={14} />
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
            <ThemeToggle />
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
              <div className="eyebrow">OPERATOR STUDIO / CONTROL PLANE</div>
              <h1>
                {page === "My Site"
                  ? "My site."
                  : page === "Templates"
                    ? "One template. Considered."
                    : page === "Domains"
                      ? "Domain desk."
                      : page === "Publish status"
                        ? "Launch ledger."
                        : page === "Admin"
                          ? "Platform controls."
                          : page}
              </h1>
              <p>
                {page === "My Site"
                  ? "One site. One clear place to shape, preview, and publish it."
                  : page === "Templates"
                    ? "A single, well-built starting point. Your brand does the rest."
                    : page === "Domains"
                      ? "Reserve the address behind the brand and see its provisioning status."
                      : page === "Publish status"
                        ? "The publish history for each site, in one ledger."
                        : page === "Settings"
                          ? "Workspace, connection, and account controls."
                          : page === "Admin"
                            ? "Development-only plans, markup, jobs, hosts, and audit."
                            : page === "XML Bots"
                              ? "Load Deriv presets, validate, and assign DBot XML."
                              : page === "AI Signals"
                                ? "Signal orders, Telegram delivery logs, and trial state."
                                : page === "Marketplace"
                                  ? "Mock listings, purchases, and seller revenue."
                                  : page === "Earnings"
                                    ? "Separate earnings streams and payout requests."
                                    : page === "Announcements"
                                      ? "Draft and publish mock announcements."
                                      : page === "Support"
                                        ? "Mock support tickets, replies, and ticket states."
                                        : "Build your trading business, one step at a time."}
              </p>
            </div>
            {page === "My Site" &&
              (sites.length ? (
                <Button primary onClick={() => openWizard(sites[0])}>
                  <Palette size={17} />
                  Manage site
                </Button>
              ) : (
                <Button primary onClick={() => openWizard(sites[0])}>
                  <Plus size={17} />
                  Create site
                </Button>
              ))}
          </div>
          {page === "My Site" && (
            <>
              <section className="hero-banner">
                <div className="hero-copy">
                  <span className="hero-label">
                    OPERATOR STUDIO / PREVIEW BUILD
                  </span>
                  <h2>
                    Build the brand.
                    <br />
                    Own the platform.
                    <br />
                    <span>Keep the control.</span>
                  </h2>
                  <p>
                    Compose a branded market presence, review every detail, and
                    publish a versioned snapshot. Trading is intended to stay on
                    Deriv, in your clients&rsquo; own accounts; this preview has
                    no live Deriv connection.
                  </p>
                  <div className="hero-buttons">
                    <Button primary onClick={() => openWizard(sites[0])}>
                      {sites.length ? "Manage your site" : "Create a site"}{" "}
                      <ArrowUpRight size={16} />
                    </Button>
                    <button
                      className="hero-secondary"
                      onClick={() => navigate("Templates")}
                    >
                      View the template <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="hero-footnote">
                    <ShieldCheck size={12} />
                    Mock-only environment <span>·</span> No live trading
                    <span>·</span> No DNS changes
                  </div>
                </div>
                <div className="hero-visual" aria-hidden="true">
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
                        color: "#b08d57",
                        headline: "Your markets.\nYour next move.",
                      }}
                    />
                  </div>
                </div>
              </section>
              <section className="stats-grid" aria-label="Workspace overview">
                {[
                  {
                    label: "Site status",
                    value: sites[0]
                      ? sites[0].versions.length
                        ? "Published"
                        : "Draft"
                      : "No site",
                    icon: PanelsTopLeft,
                    detail: sites[0]
                      ? "One active site, managed below"
                      : "Create your single site to begin",
                    tag: "One-site model",
                  },
                  {
                    label: "Snapshots",
                    value: sites[0]?.versions.length ?? 0,
                    icon: Rocket,
                    detail: sites[0]?.versions.length
                      ? "Latest version is ready to preview"
                      : "No snapshot published yet",
                    tag: serverUser ? "Mock only" : "Local only",
                  },
                  {
                    label: "Domain",
                    value: "Not connected",
                    icon: Globe2,
                    detail: "Subdomain is reserved; custom domain comes next",
                    tag: "Pending",
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
              <section className="panel my-site-manager">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">YOUR SINGLE ACTIVE SITE</span>
                    <h2>{sites[0] ? "Your active site" : "No site yet."}</h2>
                    <p>
                      {sites[0]
                        ? "Edit the brand, modules, domain, and publishing state from this one workspace."
                        : "Create your one site from the curated template. There is no multi-site dashboard."}
                    </p>
                  </div>
                  <span className="count-pill">1 site limit</span>
                </div>
                {sites[0] ? (
                  <div className="single-site-grid">{siteCard(sites[0])}</div>
                ) : (
                  <div className="my-site-empty">
                    <PanelsTopLeft size={32} />
                    <div>
                      <strong>Start with one focused site.</strong>
                      <p>
                        Choose the template, brand it, add modules, and publish
                        when it feels right.
                      </p>
                    </div>
                    <Button primary onClick={() => openWizard(sites[0])}>
                      Create your site <ArrowRight size={15} />
                    </Button>
                  </div>
                )}
              </section>
              <div className="bottom-grid">
                <section className="getting-started panel">
                  <div className="section-heading">
                    <div>
                      <h2>The first three moves.</h2>
                      <p>
                        A short, deliberate path from draft to published
                        snapshot.
                      </p>
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
                        action: () => openWizard(sites[0]),
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
                        action: () => navigate("Publish status"),
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
                  <span className="eyebrow">GUIDANCE</span>
                  <h2>
                    A short guide
                    <br />
                    to the studio.
                  </h2>
                  <p>
                    From the first brand color to the first published snapshot,
                    without the guesswork.
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
                    A modern, responsive trading brand site with a product
                    workspace, Deriv preset library, and space for your story.
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
                      Twenty configurable modules
                    </li>
                    <li>
                      <Check size={16} />
                      Required risk disclosure included
                    </li>
                  </ul>
                  <Button primary onClick={() => openWizard(sites[0])}>
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
          {page === "Domains" && serverUser && (
            <ServerDomains sites={mockSiteRefs} notify={notify} />
          )}
          {page === "Earnings" && serverUser && (
            <ServerEarnings notify={notify} />
          )}
          {page === "Marketplace" && serverUser && (
            <ServerMarketplace notify={notify} />
          )}
          {page === "AI Signals" && serverUser && (
            <ServerSignals notify={notify} />
          )}
          {page === "Admin" && serverUser && (
            <ServerAdmin role={serverUser.role} notify={notify} />
          )}
          {page === "XML Bots" && serverUser && (
            <ServerBots sites={mockSiteRefs} notify={notify} />
          )}
          {page === "Support" && serverUser && (
            <ServerSupport notify={notify} />
          )}
          {page === "Announcements" && serverUser && (
            <ServerAnnouncements sites={mockSiteRefs} notify={notify} />
          )}
          {devMock &&
            !(page === "Domains" && serverUser) &&
            !(page === "Earnings" && serverUser) &&
            !(page === "Marketplace" && serverUser) &&
            !(page === "AI Signals" && serverUser) &&
            !(page === "Admin" && serverUser) &&
            !(page === "XML Bots" && serverUser) &&
            !(page === "Support" && serverUser) &&
            !(page === "Announcements" && serverUser) &&
            mockPages.includes(page) && (
              <MockOpsPage page={page} sites={mockSiteRefs} notify={notify} />
            )}
          {!devMock && page === "Domains" && !serverUser && (
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
                  <Button onClick={() => openWizard(sites[0])}>
                    <Palette size={15} />
                    Manage site
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
                  <h2>No snapshots yet.</h2>
                  <p>
                    Publish a local version of a site to start your history.
                    <br />
                    No real DNS or hosting changes will be made.
                  </p>
                  <Button primary onClick={() => navigate("My Site")}>
                    Choose a site <ArrowRight size={16} />
                  </Button>
                </div>
              )}
            </>
          )}
          {page === "Settings" && (
            <>
              {devMock && (
                <MockOpsPage
                  page="Settings"
                  sites={mockSiteRefs}
                  notify={notify}
                />
              )}
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
                        setStudio({
                          ...studio,
                          workspace: workspaceName.trim(),
                        });
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
                      ? `Your drafts and mock snapshots are stored server-side and scoped to your session. Email status: ${serverUser.emailVerified ? "verified" : "unverified"}. Recovery and 2FA are development adapters. Development limits: one active site and fifty snapshots per site. Do not enter sensitive or financial information.`
                      : "Demo data stays in this browser and is not protected by authentication. Create an account for a separate server-backed workspace; demo drafts are not automatically imported."}
                  </p>
                  {serverUser ? (
                    <>
                      <div className="mock-kv">
                        <span>Email verification</span>
                        <strong>
                          {serverUser.emailVerified ? "Verified" : "Unverified"}
                        </strong>
                      </div>
                      {serverUser.referralCode ? (
                        <div className="mock-kv">
                          <span>Referral code</span>
                          <strong>{serverUser.referralCode}</strong>
                          <button
                            className="text-link"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  serverUser.referralCode ?? "",
                                );
                                notify("Referral code copied.");
                              } catch {
                                notify(
                                  `Referral code: ${serverUser.referralCode}`,
                                );
                              }
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      ) : null}
                      {!serverUser.emailVerified ? (
                        <Button
                          onClick={server.resendVerification}
                          disabled={server.busy}
                        >
                          Resend verification
                        </Button>
                      ) : null}
                    </>
                  ) : null}
                  <ServerMfa notify={notify} />
                  <div className="settings-data-actions">
                    <Button onClick={exportData}>
                      <Download size={15} />
                      Export workspace
                    </Button>
                    {serverUser ? (
                      <>
                        <Button
                          onClick={async () => {
                            const response = await fetch(
                              "/api/studio/account",
                              {
                                credentials: "same-origin",
                                cache: "no-store",
                              },
                            );
                            if (!response.ok) {
                              notify("Account export failed.");
                              return;
                            }
                            const blob = new Blob(
                              [JSON.stringify(await response.json(), null, 2)],
                              { type: "application/json" },
                            );
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = "tradeintra-account-export.json";
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            setTimeout(() => URL.revokeObjectURL(url), 0);
                            notify("Account export downloaded.");
                          }}
                        >
                          <Download size={15} />
                          Export account
                        </Button>
                        <Button
                          className="danger"
                          onClick={async () => {
                            const response = await fetch(
                              "/api/studio/account",
                              {
                                method: "POST",
                                credentials: "same-origin",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "request-deletion",
                                }),
                              },
                            );
                            notify(
                              response.ok
                                ? "Account deletion requested with a 30-day grace period."
                                : "Deletion request failed.",
                            );
                          }}
                        >
                          Request account deletion
                        </Button>
                        <Button
                          onClick={async () => {
                            const response = await fetch(
                              "/api/studio/account",
                              {
                                method: "POST",
                                credentials: "same-origin",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "cancel-deletion",
                                }),
                              },
                            );
                            notify(
                              response.ok
                                ? "Deletion request cancelled."
                                : "No pending deletion request.",
                            );
                          }}
                        >
                          Cancel deletion
                        </Button>
                        <Button onClick={server.signOut} disabled={server.busy}>
                          <LogOut size={15} />
                          Sign out
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="danger"
                        onClick={() =>
                          setConfirm({
                            title: "Reset your workspace?",
                            text: "All local site data and publish history will be deleted, and your workspace will return to an empty state. Export your workspace first if you want to keep it.",
                            action: () => {
                              const data = initialStudio();
                              setStorageError("");
                              setStudio(data);
                              setWorkspaceName(data.workspace);
                              setConfirm(null);
                              notify("Workspace reset.");
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
            </>
          )}
          {!devMock && page === "Support" && !serverUser && (
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
                    text: "Set your brand name, headline, description, and accent color. Enable or disable the modules you need.",
                    action: sites.length ? "Manage your site" : "Create a site",
                    go: () => openWizard(sites[0]),
                  },
                  {
                    n: "03",
                    title: "Preview, then publish locally",
                    text: "Save your draft and preview it. Publishing makes an immutable local snapshot. Restore any previous version from Publish status.",
                    action: "View your site",
                    go: () => navigate("My Site"),
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
          {!devMock && page === "Announcements" && !serverUser && (
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
              <Button primary onClick={() => openWizard(sites[0])}>
                Take it for a spin <ArrowUpRight size={16} />
              </Button>
              <p className="fine-print">
                Production hosting and provider integrations have not been
                verified.
              </p>
            </section>
          )}
          {!devMock &&
            !serverUser &&
            ["XML Bots", "AI Signals", "Marketplace", "Earnings"].includes(
              page,
            ) && (
              <section className="deferred-state">
                <div className="deferred-art">
                  <Sparkles size={38} />
                  <span aria-hidden="true">✧</span>
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
                <Button primary onClick={() => navigate("My Site")}>
                  Build your site first <ArrowRight size={16} />
                </Button>
              </section>
            )}
          <footer className="main-footer">
            <span>
              <BrandMark className="footer-mark" /> Tradeintra operator studio.
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
      {wizard && !preview && !confirm && (
        <Modal
          fullscreen
          title={wizard.id ? "Edit the site." : "Configure the site."}
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
          <div
            className="wizard-steps"
            role="group"
            aria-label="Site setup steps"
            tabIndex={0}
          >
            {["Template", "Brand", "Sections", "Address", "Review"].map(
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
          <div className="builder-mobile-tabs">
            <button
              type="button"
              aria-pressed={wizardPane === "edit"}
              className={wizardPane === "edit" ? "chosen" : ""}
              onClick={() => setWizardPane("edit")}
            >
              Edit
            </button>
            <button
              type="button"
              aria-pressed={wizardPane === "preview"}
              className={wizardPane === "preview" ? "chosen" : ""}
              onClick={() => setWizardPane("preview")}
            >
              Live preview
            </button>
          </div>
          <div className={`wizard-body pane-${wizardPane}`}>
            <div className="wizard-fields">
              {wizard.step === 0 && (
                <>
                  <span className="eyebrow">01 / YOUR STARTING POINT</span>
                  <h2>
                    One template.
                    <br />
                    Your direction.
                  </h2>
                  <p className="muted">
                    Begin with the curated Deriv template. Every module, color,
                    and word stays under your control.
                  </p>
                  <button className="selected-template">
                    <span className="template-icon">
                      <PanelTop size={25} />
                    </span>
                    <span>
                      <strong>Deriv Studio</strong>
                      <small>Workspace · Markets · Strategies</small>
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
                  <LogoUpload
                    name={wizard.config.name}
                    value={wizard.config.logo}
                    onChange={(logo) => update("logo", logo)}
                    error={errors.logo}
                  />
                  <div className="brand-name-row">
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
                      Big title <span>*</span>
                      <input
                        maxLength={100}
                        value={wizard.config.headline}
                        onChange={(e) => update("headline", e.target.value)}
                        onFocus={() => setPreviewSection("hero")}
                      />
                      {errors.headline && (
                        <small className="field-error">{errors.headline}</small>
                      )}
                    </label>
                  </div>
                  <div className="brand-details-row">
                    <label className="field">
                      A sentence about your site
                      <textarea
                        maxLength={240}
                        rows={2}
                        value={wizard.config.description}
                        onChange={(e) => update("description", e.target.value)}
                        onFocus={() => setPreviewSection("hero")}
                      />
                    </label>
                    <div className="brand-appearance">
                      <div className="field">
                        Main colour
                        <div className="color-options">
                          {[
                            { hex: "#B08D57", label: "Brass" },
                            { hex: "#2F6B4F", label: "Forest" },
                            { hex: "#8C2F2F", label: "Oxblood" },
                            { hex: "#FEDD00", label: "Bullion" },
                            { hex: "#315A7D", label: "Steel" },
                          ].map(({ hex, label }) => (
                            <button
                              className={`color-swatch ${hex === wizard.config.color ? "chosen" : ""}`}
                              key={hex}
                              aria-label={`Use ${label} colour`}
                              onClick={() => {
                                setPreviewSection("hero");
                                update("color", hex);
                              }}
                              aria-pressed={hex === wizard.config.color}
                              style={{ background: hex, color: accentInk(hex) }}
                            >
                              {hex === wizard.config.color && (
                                <Check size={16} />
                              )}
                            </button>
                          ))}
                          <label className="custom-color">
                            <input
                              aria-label="Custom brand colour"
                              type="color"
                              value={wizard.config.color}
                              onChange={(e) => update("color", e.target.value)}
                            />
                            <Plus size={17} />
                          </label>
                          <span>{wizard.config.color.toUpperCase()}</span>
                        </div>
                        <small>
                          This colour is used for buttons, highlights, and the
                          chart.
                        </small>
                      </div>
                      <div className="field">
                        Theme
                        <div className="theme-options">
                          {(["dark", "light"] as const).map((theme) => (
                            <button
                              key={theme}
                              className={
                                (wizard.config.theme ?? "dark") === theme
                                  ? "chosen"
                                  : ""
                              }
                              aria-pressed={
                                (wizard.config.theme ?? "dark") === theme
                              }
                              onClick={() => {
                                setPreviewSection("hero");
                                update("theme", theme);
                              }}
                            >
                              {theme === "dark" ? "Deep ink" : "Warm paper"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {wizard.step === 2 && (
                <>
                  <span className="eyebrow">03 / YOUR SECTIONS</span>
                  <h2>Choose your sections.</h2>
                  <p className="muted">
                    Choose the sections for your site. You can change these
                    anytime.
                  </p>
                  <ModuleEditor
                    config={wizard.config}
                    update={update}
                    onSectionFocus={setPreviewSection}
                  />
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
                    Web address <span>*</span>
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
                      <span>Web address</span>
                      <strong>{wizard.config.slug}.tradeintra.com</strong>
                    </div>
                    <div>
                      <span>Sections</span>
                      <strong>{wizard.config.modules.length} enabled</strong>
                    </div>
                    <div>
                      <span>Environment</span>
                      <Badge tone="lavender">Demo / local only</Badge>
                    </div>
                  </div>
                  {errors.general ? (
                    <p className="auth-error" role="alert">
                      {errors.general}
                    </p>
                  ) : null}
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
              <LiveSitePreview
                config={wizard.config}
                activeSection={previewSection}
                onOpen={() =>
                  setPreview({ config: wizard.config, published: false })
                }
              />
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
                  {serverUser ? "Save demo version" : "Save demo locally"}
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
                aria-pressed={!smallPreview}
                className={`icon-btn ${!smallPreview ? "selected" : ""}`}
                onClick={() => setSmallPreview(false)}
              >
                <Monitor size={19} />
              </button>
              <button
                aria-label="Mobile preview"
                aria-pressed={smallPreview}
                className={`icon-btn ${smallPreview ? "selected" : ""}`}
                onClick={() => setSmallPreview(true)}
              >
                <Smartphone size={19} />
              </button>
            </div>
          </div>
          <div
            className={`full-site-preview ${smallPreview ? "mobile-preview" : ""}`}
          >
            <PublishedSite config={preview.config} environment="Preview" />
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
              void server.authenticate({
                email: String(form.get("email") ?? ""),
                password: String(form.get("password") ?? ""),
                ...(server.authMode === "register"
                  ? {
                      fullName: String(form.get("fullName") ?? ""),
                      ...(String(form.get("referralCode") ?? "").trim()
                        ? {
                            referralCode: String(
                              form.get("referralCode") ?? "",
                            ).trim(),
                          }
                        : {}),
                    }
                  : {}),
              });
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
            {server.authMode === "register" ? (
              <>
                <label className="field">
                  Full name
                  <input
                    name="fullName"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </label>
                <label className="field">
                  Referral code (optional)
                  <input
                    name="referralCode"
                    placeholder="TRD-XXXXXXXX"
                    maxLength={12}
                  />
                </label>
              </>
            ) : null}
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
                minLength={8}
                maxLength={128}
                required
              />
              <small id="auth-password-help">
                At least 8 characters, one uppercase letter, and one number.
                Never use your Deriv password.
              </small>
            </label>
            {server.authMode === "login" ? (
              <label className="field">
                Authenticator code (if enabled)
                <input
                  name="mfaCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  placeholder="123456"
                />
              </label>
            ) : null}
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
            <p className="auth-switch">
              <Link href="/forgot-password">Forgot password?</Link>
            </p>
            <p className="fine-print">
              Email verification uses a development token in local mode.
              Password recovery and 2FA are adapters pending provider
              configuration. Accounts are not approved for production or
              sensitive data.
            </p>
          </form>
        </Modal>
      )}
      {server.verificationToken && (
        <Modal
          title="Verify your email"
          onClose={() => notify("Verify from Settings when you are ready.")}
        >
          <p className="confirm-text">
            Development verification token. Verify now to unlock site creation.
          </p>
          <code className="mock-code">{server.verificationToken}</code>
          <div className="confirm-actions">
            <Button
              primary
              disabled={server.busy}
              onClick={() => server.verifyEmail(server.verificationToken ?? "")}
            >
              Verify email <Check size={15} />
            </Button>
          </div>
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
  fullscreen = false,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  wide?: boolean;
  fullscreen?: boolean;
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
          'a[href], button:not([disabled]), input:not([disabled]), textarea, select, summary, [tabindex="0"]',
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
      className={`modal-backdrop ${fullscreen ? "fullscreen-backdrop" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? "wide" : ""} ${fullscreen ? "fullscreen" : ""}`}
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
