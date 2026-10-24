import { describe, expect, it } from "vitest";
import {
  defaultConfig,
  initialStudio,
  publishSite,
  readStudio,
  rollbackSite,
  slugify,
  validateConfig,
  normalizeConfig,
  RISK,
  accentInk,
  accentOnDark,
} from "../lib/studio";
import { publishedConfigSchema } from "../lib/server/studio/input";
import {
  DEFAULT_MODULES,
  MODULE_DEFINITIONS,
  defaultModuleContent,
  normalizeModuleContent,
  normalizeModules,
} from "../lib/studio-modules";

function demoState() {
  const now = new Date().toISOString();
  const state = initialStudio();
  return {
    ...state,
    sites: [
      {
        id: "demo-site",
        sample: true,
        createdAt: now,
        updatedAt: now,
        draft: {
          ...defaultConfig,
          modules: [...defaultConfig.modules],
          moduleContent: structuredClone(defaultConfig.moduleContent),
          name: "Aurora Markets",
          slug: "aurora-markets",
          color: "#B08D57",
        },
        versions: [],
      },
    ],
  };
}

describe("workspace and configuration", () => {
  it("starts with no fabricated sites or activity", () => {
    const s = initialStudio();
    expect(s.sites).toHaveLength(0);
    expect(s.derivLinked).toBe(false);
  });
  it("creates URL-safe slugs", () => {
    expect(slugify("  My Brand / Markets!  ")).toBe("my-brand-markets");
    expect(slugify("a".repeat(80))).toHaveLength(40);
    expect(slugify(`${"a".repeat(39)}-b`)).toBe("a".repeat(39));
  });
  it("requires a name, headline, safe accent, and valid subdomain", () => {
    expect(
      validateConfig(
        {
          ...defaultConfig,
          color: "javascript:alert(1)",
          slug: "-bad-",
          headline: "",
        },
        [],
      ),
    ).toHaveProperty("name");
    expect(
      validateConfig({ ...defaultConfig, color: "bad" }, []),
    ).toHaveProperty("color");
    expect(validateConfig({ ...defaultConfig, slug: "a" }, [])).toHaveProperty(
      "slug",
    );
    expect(
      validateConfig({ ...defaultConfig, slug: "a--b" }, []),
    ).toHaveProperty("slug");
    expect(
      validateConfig({ ...defaultConfig, slug: "abc", headline: "" }, []),
    ).toHaveProperty("headline");
  });
  it("reads legacy reserved and consecutive-hyphen slugs without discarding stored workspaces", () => {
    const reserved = demoState();
    reserved.sites[0].draft.slug = "billing";
    expect(() => readStudio(JSON.stringify(reserved))).not.toThrow();
    const legacy = demoState();
    legacy.sites[0].draft.slug = "legacy--slug";
    expect(() => readStudio(JSON.stringify(legacy))).not.toThrow();
  });
  it("rejects reserved and duplicate subdomains", () => {
    const s = demoState();
    for (const slug of ["admin", "billing", "preview", "www", "tradeintra"])
      expect(validateConfig({ ...s.sites[0].draft, slug }, [])).toHaveProperty(
        "slug",
      );
    expect(validateConfig(s.sites[0].draft, s.sites)).toHaveProperty("slug");
    expect(validateConfig(s.sites[0].draft, s.sites, s.sites[0].id)).toEqual(
      {},
    );
  });
  it("rejects unsupported modules", () => {
    expect(
      validateConfig(
        { ...demoState().sites[0].draft, modules: ["orders" as never] },
        [],
      ),
    ).toHaveProperty("modules");
  });
  it("roundtrips local storage and rejects invalid data", () => {
    const state = demoState();
    expect(readStudio(JSON.stringify(state))).toEqual(state);
    expect(() => readStudio("{")).toThrow();
    expect(() => readStudio('{"sites":[]}')).toThrow();
    expect(() =>
      readStudio(JSON.stringify({ ...state, sites: [{ id: "x" }] })),
    ).toThrow();
  });
  it("reduces legacy multi-site storage to the first active site", () => {
    const first = demoState().sites[0];
    const raw = JSON.stringify({
      ...initialStudio(),
      sites: [
        first,
        {
          ...first,
          id: "legacy-2",
          draft: { ...first.draft, name: "Legacy 2", slug: "legacy-2" },
        },
      ],
    });
    const loaded = readStudio(raw);
    expect(loaded.sites).toHaveLength(1);
    expect(loaded.sites[0].id).toBe(first.id);
  });
  it("keeps mandatory risk disclosure outside editable configuration", () => {
    expect(RISK).toContain("does not execute trades");
    expect(defaultConfig).not.toHaveProperty("risk");
  });
});
describe("immutable publishing", () => {
  it("publishes a deep copy without mutating draft, history, or original site", () => {
    const state = demoState();
    const original = state.sites[0];
    const site = publishSite(original, state.sites, "2026-10-20T12:00:00.000Z");
    expect(original.versions).toHaveLength(0);
    expect(site.versions).toHaveLength(1);
    site.draft.name = "Changed";
    site.draft.modules.pop();
    expect(site.versions[0].config.name).toBe("Aurora Markets");
    expect(site.versions[0].config.modules).toHaveLength(18);
    expect(site.sample).toBe(false);
  });
  it("refuses invalid configurations at publish time", () => {
    const state = demoState();
    expect(() =>
      publishSite({ ...state.sites[0], draft: defaultConfig }, state.sites),
    ).toThrow();
  });
  it("restores an older configuration as a new immutable version", () => {
    const state = demoState();
    let site = publishSite(state.sites[0], state.sites);
    site.draft = { ...site.draft, name: "Second brand" };
    site = publishSite(site, state.sites);
    const restored = rollbackSite(site, 1);
    expect(restored.versions).toHaveLength(3);
    expect(restored.versions[2].restoredFrom).toBe(1);
    expect(restored.draft.name).toBe("Aurora Markets");
    expect(restored.versions[1].config.name).toBe("Second brand");
    restored.draft.name = "Different";
    expect(restored.versions[2].config.name).toBe("Aurora Markets");
    expect(site.versions).toHaveLength(2);
  });
  it("rejects nonexistent rollback versions", () => {
    expect(() => rollbackSite(demoState().sites[0], 5)).toThrow(
      "Published version not found",
    );
  });
});

describe("published configuration reads", () => {
  it("keeps legacy consecutive-hyphen slugs readable without relaxing writes", () => {
    const legacy = { ...defaultConfig, name: "Legacy", slug: "legacy--slug" };
    expect(publishedConfigSchema.safeParse(legacy).success).toBe(true);
    expect(() =>
      publishedConfigSchema.parse({ ...legacy, slug: "-bad-" }),
    ).toThrow();
  });
});

describe("custom brand accent contrast", () => {
  it("uses light ink on dark accents and dark ink on light accents", () => {
    expect(accentInk("#000000")).toBe("#FFFFFF");
    expect(accentInk("#FFFFFF")).toBe("#0D000A");
    expect(accentInk("#FEDD00")).toBe("#0D000A");
  });
  it("lifts accents for use on ink surfaces", () => {
    const luminance = (hex: string) => {
      const channels = [1, 3, 5]
        .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const contrast = (a: string, b: string) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    for (const color of [
      "#B08D57",
      "#2F6B4F",
      "#8C2F2F",
      "#FEDD00",
      "#315A7D",
    ]) {
      const lifted = accentOnDark(color);
      expect(lifted).toMatch(/^#[0-9a-f]{6}$/i);
      expect(contrast(lifted, "#141019")).toBeGreaterThanOrEqual(4.5);
      expect(contrast(lifted, "#201b26")).toBeGreaterThanOrEqual(4.5);
    }
    expect(accentOnDark("not-a-color")).toBe("not-a-color");
    expect(accentOnDark("#B08D57")).toBe("#B08D57");
    expect(accentOnDark("#FEDD00")).toBe("#FEDD00");
  });
});

describe("module registry and published payload", () => {
  it("registers twenty modules while keeping the existing default set stable", () => {
    expect(MODULE_DEFINITIONS).toHaveLength(20);
    expect(new Set(MODULE_DEFINITIONS.map((module) => module.key)).size).toBe(
      20,
    );
    expect(DEFAULT_MODULES).toHaveLength(18);
    expect(DEFAULT_MODULES).toContain("features");
    expect(DEFAULT_MODULES).toContain("workspace");
    expect(DEFAULT_MODULES).not.toContain("chart");
  });

  it("normalizes the new capability and step content", () => {
    const content = normalizeModuleContent({
      features: [
        { title: " Risk ", description: " Clear controls " },
        { title: "", description: "hidden" },
      ],
      steps: [{ title: " One ", description: " Start here " }],
    });
    expect(content.features).toEqual([
      { title: "Risk", description: "Clear controls" },
    ]);
    expect(content.steps).toEqual([
      { title: "One", description: "Start here" },
    ]);
    expect(
      normalizeModuleContent({ ticker: ["VOL 10", "VOL 10", "VOL 75"] }).ticker,
    ).toEqual(["VOL 10", "VOL 75"]);
    expect(defaultModuleContent.features).toHaveLength(4);
    expect(defaultModuleContent.steps).toHaveLength(3);
    expect(defaultModuleContent.announcement.linkHref).toBe("#about");
  });

  it("accepts the expanded module payload at the server boundary", () => {
    const modules = MODULE_DEFINITIONS.map((module) => module.key);
    expect(modules).toHaveLength(20);
    const parsed = publishedConfigSchema.parse({
      ...defaultConfig,
      name: "Aurora",
      slug: "aurora-markets",
      modules,
    });
    expect(parsed.modules).toHaveLength(20);
    expect(
      publishedConfigSchema.safeParse({
        ...defaultConfig,
        name: "Aurora",
        slug: "aurora-markets",
        modules: [...modules, "features"],
      }).success,
    ).toBe(false);
  });

  it("normalizes legacy module aliases and always keeps risk disclosure", () => {
    expect(normalizeModules(["markets", "terminal", "about"])).toEqual([
      "header",
      "hero",
      "watchlist",
      "chart",
      "about",
      "footer",
      "risk",
    ]);
    const normalized = normalizeConfig({
      ...defaultConfig,
      modules: ["markets", "terminal", "about"],
    });
    expect(normalized.modules).toContain("watchlist");
    expect(normalized.modules).toContain("chart");
    expect(normalized.modules).toContain("risk");
  });

  it("rejects prototype keys as unsupported modules", () => {
    for (const key of ["__proto__", "constructor", "toString"]) {
      expect(
        publishedConfigSchema.safeParse({
          ...defaultConfig,
          name: "Aurora",
          slug: "aurora-markets",
          modules: [key],
        }).success,
      ).toBe(false);
    }
  });

  it("repairs an about-only legacy site with chrome and a hero", () => {
    const normalized = normalizeConfig({
      ...defaultConfig,
      theme: undefined,
      modules: ["about"],
    });
    expect(normalized.modules).toEqual([
      "header",
      "hero",
      "about",
      "footer",
      "risk",
    ]);
  });

  it("rejects unsupported modules and adds risk on the server boundary", () => {
    expect(
      publishedConfigSchema.safeParse({
        ...defaultConfig,
        name: "Aurora",
        slug: "aurora-markets",
        modules: ["bogus"],
      }).success,
    ).toBe(false);
    const parsed = publishedConfigSchema.parse({
      ...defaultConfig,
      name: "Aurora",
      slug: "aurora-markets",
      modules: ["about"],
    });
    expect(parsed.modules).toEqual(["about", "risk"]);
  });

  it("accepts and normalizes operator content without fake rows", () => {
    const content = normalizeModuleContent({
      testimonials: [{ quote: " Clear ", name: " Ada ", role: " Trader " }],
      stats: [],
      faq: [],
      ticker: [" V100 ", ""],
    });
    expect(content.testimonials).toEqual([
      { quote: "Clear", name: "Ada", role: "Trader" },
    ]);
    expect(content.stats).toEqual([]);
    expect(content.faq).toEqual([]);
    expect(content.ticker).toEqual(["V100"]);
  });

  it("reads legacy three-module workspaces and adds risk disclosure", () => {
    const state = demoState();
    state.sites[0].draft = {
      ...state.sites[0].draft,
      modules: ["markets", "terminal", "about"] as never,
    };
    const parsed = readStudio(JSON.stringify(state));
    expect(parsed.sites[0].draft.modules).toEqual([
      "header",
      "hero",
      "watchlist",
      "chart",
      "about",
      "footer",
      "risk",
    ]);
  });

  it("rejects unsafe links in operator content", () => {
    const content = normalizeModuleContent({
      announcement: { linkHref: "javascript:alert(1)" },
      trade: { href: "http://insecure.example" },
    });
    expect(content.announcement.linkHref).toBe("");
    expect(content.trade.href).toBe(defaultModuleContent.trade.href);
    expect(
      normalizeModuleContent({ trade: { href: "https://example.com/trade" } })
        .trade.href,
    ).toBe("https://example.com/trade");
  });

  it("accepts a safe logo and rejects unsafe or oversized logos", () => {
    const logo = "data:image/png;base64,iVBORw0KGgo=";
    expect(
      publishedConfigSchema.safeParse({
        ...defaultConfig,
        name: "Aurora",
        slug: "aurora-markets",
        logo,
      }).success,
    ).toBe(true);
    expect(
      publishedConfigSchema.safeParse({
        ...defaultConfig,
        name: "Aurora",
        slug: "aurora-markets",
        logo: "data:image/svg+xml;base64,PHN2Zz4=",
      }).success,
    ).toBe(false);
    expect(
      publishedConfigSchema.safeParse({
        ...defaultConfig,
        name: "Aurora",
        slug: "aurora-markets",
        logo: `data:image/png;base64,${"a".repeat(200_000)}`,
      }).success,
    ).toBe(false);
  });

  it("accepts the published site theme", () => {
    expect(
      publishedConfigSchema.safeParse({
        ...defaultConfig,
        name: "Aurora",
        slug: "aurora-markets",
        theme: "light",
      }).success,
    ).toBe(true);
  });
});
