import { describe, expect, it } from "vitest";
import {
  defaultConfig,
  initialStudio,
  publishSite,
  readStudio,
  rollbackSite,
  slugify,
  validateConfig,
  RISK,
  accentInk,
  accentOnDark,
} from "../lib/studio";
import { publishedConfigSchema } from "../lib/server/studio/input";

describe("workspace and configuration", () => {
  it("starts with two explicitly labeled sample drafts and no fabricated activity", () => {
    const s = initialStudio();
    expect(s.sites).toHaveLength(2);
    expect(s.sites.every((x) => x.sample && x.versions.length === 0)).toBe(
      true,
    );
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
    const state = initialStudio();
    state.sites[0].draft.slug = "billing";
    state.sites[1].draft.slug = "legacy--slug";
    expect(() => readStudio(JSON.stringify(state))).not.toThrow();
  });
  it("rejects reserved and duplicate subdomains", () => {
    const s = initialStudio();
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
        { ...initialStudio().sites[0].draft, modules: ["orders" as never] },
        [],
      ),
    ).toHaveProperty("modules");
  });
  it("roundtrips local storage and rejects invalid data", () => {
    const state = initialStudio();
    expect(readStudio(JSON.stringify(state))).toEqual(state);
    expect(() => readStudio("{")).toThrow();
    expect(() => readStudio('{"sites":[]}')).toThrow();
    expect(() =>
      readStudio(JSON.stringify({ ...state, sites: [{ id: "x" }] })),
    ).toThrow();
  });
  it("keeps mandatory risk disclosure outside editable configuration", () => {
    expect(RISK).toContain("does not execute trades");
    expect(defaultConfig).not.toHaveProperty("risk");
  });
});
describe("immutable publishing", () => {
  it("publishes a deep copy without mutating draft, history, or original site", () => {
    const state = initialStudio();
    const original = state.sites[0];
    const site = publishSite(original, state.sites, "2026-10-20T12:00:00.000Z");
    expect(original.versions).toHaveLength(0);
    expect(site.versions).toHaveLength(1);
    site.draft.name = "Changed";
    site.draft.modules.pop();
    expect(site.versions[0].config.name).toBe("Aurora Markets");
    expect(site.versions[0].config.modules).toHaveLength(3);
    expect(site.sample).toBe(false);
  });
  it("refuses invalid configurations at publish time", () => {
    const state = initialStudio();
    expect(() =>
      publishSite({ ...state.sites[0], draft: defaultConfig }, state.sites),
    ).toThrow();
  });
  it("restores an older configuration as a new immutable version", () => {
    const state = initialStudio();
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
    expect(() => rollbackSite(initialStudio().sites[0], 5)).toThrow(
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
    }
    expect(accentOnDark("not-a-color")).toBe("not-a-color");
    expect(accentOnDark("#B08D57")).toBe("#B08D57");
    expect(accentOnDark("#FEDD00")).toBe("#FEDD00");
  });
});
