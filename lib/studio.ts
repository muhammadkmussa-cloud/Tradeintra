export const STORAGE_KEY = "tradeintra-studio-v1";
export const RISK =
  "Trading involves significant risk and may result in the loss of your capital. This is a mock demonstration, not investment advice. Tradeintra is independent of Deriv and does not execute trades or hold funds.";
export type ModuleKey = "markets" | "terminal" | "about";
export type Config = {
  name: string;
  slug: string;
  color: string;
  headline: string;
  description: string;
  modules: ModuleKey[];
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
  color: "#B5A0EA",
  headline: "Your markets. Your next move.",
  description:
    "A clear, focused space to explore the markets. Built around you.",
  modules: ["markets", "terminal", "about"],
};
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
export function validateConfig(
  config: Config,
  sites: Site[],
  ownId?: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!config.name.trim() || config.name.length > 60)
    errors.name = "Enter a site name between 1 and 60 characters.";
  if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(config.slug))
    errors.slug =
      "Use 3–40 lowercase letters, numbers, or hyphens. Start and end with a letter or number.";
  if (
    ["www", "app", "admin", "api", "mail", "support", "tradeintra"].includes(
      config.slug,
    )
  )
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
  if (config.description.length > 240)
    errors.description = "Keep the description under 240 characters.";
  if (
    !Array.isArray(config.modules) ||
    config.modules.some((m) => !["markets", "terminal", "about"].includes(m))
  )
    errors.modules = "Choose supported modules only.";
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
  const now = new Date().toISOString();
  return {
    workspace: "My workspace",
    derivLinked: false,
    sites: [
      {
        id: "sample-aurora",
        sample: true,
        createdAt: now,
        updatedAt: now,
        draft: {
          ...structuredClone(defaultConfig),
          name: "Aurora Markets",
          slug: "aurora-markets",
          color: "#B9A4EB",
        },
        versions: [],
      },
      {
        id: "sample-nova",
        sample: true,
        createdAt: now,
        updatedAt: now,
        draft: {
          ...structuredClone(defaultConfig),
          name: "Nova Trading",
          slug: "nova-trading",
          color: "#A5C6B8",
          headline: "A fresh perspective on the markets.",
        },
        versions: [],
      },
    ],
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
        Object.keys(validateConfig(s.draft, [], s.id)).length ||
        s.versions.some(
          (v) =>
            !v.config || Object.keys(validateConfig(v.config, [], s.id)).length,
        ),
    )
  )
    throw new Error("Invalid site data");
  return data as Studio;
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

/** Pick accessible text against an arbitrary validated brand accent. */
export function accentInk(hex: string): "#0D000A" | "#FFFFFF" {
  const rgb = [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return luminance > 0.18 ? "#0D000A" : "#FFFFFF";
}
