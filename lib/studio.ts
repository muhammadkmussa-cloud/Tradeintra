import {
  DEFAULT_MODULES,
  defaultModuleContent,
  isModuleKey,
  normalizeModuleContent,
  normalizeModules,
  validateModuleContent,
  type ModuleContent,
  type ModuleKey,
} from "./studio-modules";

export type { ModuleKey, ModuleContent } from "./studio-modules";

export const STORAGE_KEY = "tradeintra-studio-v1";
export const SLUG_PATTERN = /^(?!.*--)[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
export const LEGACY_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
export const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "support",
  "billing",
  "status",
  "docs",
  "mail",
  "smtp",
  "ftp",
  "cdn",
  "assets",
  "static",
  "preview",
  "staging",
  "dev",
  "test",
  "tradeintra",
  "by-host",
]);
export const MAX_LOGO_LENGTH = 180_000;
export const LOGO_PATTERN =
  /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
export const RISK =
  "Trading involves significant risk and may result in the loss of your capital. This is a mock demonstration, not investment advice. Tradeintra is independent of Deriv and does not execute trades or hold funds.";
export type Config = {
  name: string;
  slug: string;
  color: string;
  headline: string;
  description: string;
  modules: ModuleKey[];
  theme?: "light" | "dark";
  logo?: string;
  moduleContent?: ModuleContent;
};
export type Version = {
  id: string;
  number: number;
  createdAt: string;
  config: Config;
  restoredFrom?: number;
};
export type Site = {
  id: string;
  createdAt: string;
  updatedAt: string;
  draft: Config;
  versions: Version[];
  sample?: boolean;
};
export type Studio = { sites: Site[]; derivLinked: boolean; workspace: string };
export const defaultConfig: Config = {
  name: "",
  slug: "",
  color: "#B08D57",
  theme: "dark",
  headline: "Your markets. Your next move.",
  description:
    "A clear, focused space to explore the markets. Built around you.",
  modules: [...DEFAULT_MODULES],
  moduleContent: structuredClone(defaultModuleContent),
};
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
export function validateConfig(
  config: Config,
  sites: Site[],
  ownId?: string,
  options: { allowReserved?: boolean; allowLegacySlug?: boolean } = {},
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!config.name.trim() || config.name.length > 60)
    errors.name = "Enter a site name between 1 and 60 characters.";
  const slugPattern = options.allowLegacySlug
    ? LEGACY_SLUG_PATTERN
    : SLUG_PATTERN;
  if (!slugPattern.test(config.slug))
    errors.slug =
      "Use 3–40 lowercase letters, numbers, or single hyphens. Start and end with a letter or number.";
  if (!options.allowReserved && RESERVED_SLUGS.has(config.slug))
    errors.slug = "This subdomain is reserved. Try another name.";
  if (
    sites.some(
      (s) =>
        s.id !== ownId &&
        (s.draft.slug === config.slug ||
          s.versions.some((v) => v.config.slug === config.slug)),
    )
  )
    errors.slug = "This subdomain is already used in this workspace.";
  if (!/^#[0-9a-fA-F]{6}$/.test(config.color))
    errors.color = "Select a valid six-digit hex color.";
  if (!config.headline.trim() || config.headline.length > 100)
    errors.headline = "Enter a headline between 1 and 100 characters.";
  if (
    config.logo &&
    (config.logo.length > MAX_LOGO_LENGTH || !LOGO_PATTERN.test(config.logo))
  )
    errors.logo = "Upload a smaller PNG, JPG, or WebP logo.";
  if (config.description.length > 240)
    errors.description = "Keep the description under 240 characters.";
  if (
    !Array.isArray(config.modules) ||
    config.modules.some((m) => !isModuleKey(String(m)))
  )
    errors.modules = "Choose supported modules only.";
  else if (!config.modules.includes("risk"))
    errors.modules = "Risk disclosure is required.";
  else if (config.moduleContent) {
    const contentError = validateModuleContent(
      normalizeModuleContent(config.moduleContent),
    );
    if (contentError) errors.modules = contentError;
  }
  return errors;
}
export function publishSite(
  site: Site,
  sites: Site[],
  now = new Date().toISOString(),
): Site {
  const errors = validateConfig(site.draft, sites, site.id);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return {
    ...site,
    sample: false,
    updatedAt: now,
    versions: [
      ...site.versions,
      {
        id: crypto.randomUUID(),
        number: site.versions.length + 1,
        createdAt: now,
        config: structuredClone(site.draft),
      },
    ],
  };
}
export function rollbackSite(
  site: Site,
  number: number,
  now = new Date().toISOString(),
): Site {
  const source = site.versions.find((v) => v.number === number);
  if (!source) throw new Error("Published version not found.");
  return {
    ...site,
    updatedAt: now,
    draft: structuredClone(source.config),
    versions: [
      ...site.versions,
      {
        id: crypto.randomUUID(),
        number: site.versions.length + 1,
        createdAt: now,
        config: structuredClone(source.config),
        restoredFrom: number,
      },
    ],
  };
}
export function initialStudio(): Studio {
  return {
    workspace: "My workspace",
    derivLinked: false,
    sites: [],
  };
}
export function normalizeConfig(config: Config): Config {
  let modules = normalizeModules(config.modules);
  if (config.theme === undefined) {
    if (!modules.includes("header")) modules.unshift("header");
    if (!modules.includes("hero")) modules.splice(1, 0, "hero");
    if (!modules.includes("footer")) modules.push("footer");
  }
  modules = [...modules.filter((key) => key !== "risk"), "risk"];
  return {
    ...config,
    modules,
    logo:
      config.logo &&
      config.logo.length <= MAX_LOGO_LENGTH &&
      LOGO_PATTERN.test(config.logo)
        ? config.logo
        : undefined,
    moduleContent: normalizeModuleContent(config.moduleContent),
  };
}

export function readStudio(raw: string): Studio {
  const data = JSON.parse(raw);
  if (
    !data ||
    typeof data.workspace !== "string" ||
    typeof data.derivLinked !== "boolean" ||
    !Array.isArray(data.sites)
  )
    throw new Error("Invalid workspace data");
  if (
    data.sites.some(
      (s: Site) =>
        !s.id ||
        !s.draft ||
        !Array.isArray(s.versions) ||
        Object.keys(
          validateConfig(normalizeConfig(s.draft), [], s.id, {
            allowReserved: true,
            allowLegacySlug: true,
          }),
        ).length ||
        s.versions.some(
          (v) =>
            !v.config ||
            Object.keys(
              validateConfig(normalizeConfig(v.config), [], s.id, {
                allowReserved: true,
                allowLegacySlug: true,
              }),
            ).length,
        ),
    )
  )
    throw new Error("Invalid site data");
  const studio = data as Studio;
  return {
    ...studio,
    sites: studio.sites.slice(0, 1).map((site) => ({
      ...site,
      draft: normalizeConfig(site.draft),
      versions: site.versions.map((version) => ({
        ...version,
        config: normalizeConfig(version.config),
      })),
    })),
  };
}
export const relativeTime = (date: string) => {
  const m = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 60000),
  );
  return m < 1
    ? "Just now"
    : m < 60
      ? `${m}m ago`
      : m < 1440
        ? `${Math.floor(m / 60)}h ago`
        : `${Math.floor(m / 1440)}d ago`;
};

/** Lift an accent for use as a foreground on ink surfaces. */
const channelLuminance = (value: number) => {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
};
const relativeLuminance = (hex: string) => {
  const channels = [1, 3, 5].map((offset) =>
    channelLuminance(parseInt(hex.slice(offset, offset + 2), 16)),
  );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const contrastOnInk = (hex: string) =>
  (relativeLuminance(hex) + 0.05) / (relativeLuminance("#141019") + 0.05);

/** Lift an accent until it clears 4.5:1 against the ink surface. */
export function accentOnDark(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  if (contrastOnInk(hex) >= 5) return hex;
  for (let amount = 0.05; amount <= 1; amount += 0.05) {
    const channels = [1, 3, 5].map((offset) =>
      Math.round(
        parseInt(hex.slice(offset, offset + 2), 16) * (1 - amount) +
          255 * amount,
      ),
    );
    const lifted = `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
    if (contrastOnInk(lifted) >= 5) return lifted;
  }
  return "#F3F2F2";
}

/** Pick accessible text against an arbitrary validated brand accent. */
export function accentInk(hex: string): "#0D000A" | "#FFFFFF" {
  const rgb = [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return luminance > 0.18 ? "#0D000A" : "#FFFFFF";
}
