import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { DERIV_BOT_PRESETS } from "../lib/deriv-bot-presets";

describe("Deriv preset library", () => {
  it("ships every listed preset as a Deriv DBot XML document", async () => {
    expect(DERIV_BOT_PRESETS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(DERIV_BOT_PRESETS.map((preset) => preset.id)).size).toBe(
      DERIV_BOT_PRESETS.length,
    );
    for (const preset of DERIV_BOT_PRESETS) {
      const xml = await readFile(`public${preset.file}`, "utf8");
      expect(xml.trimStart().startsWith("<xml")).toBe(true);
      expect(/<block[\s>]/.test(xml) || /<strategy[\s/>]/.test(xml)).toBe(true);
      expect(xml).not.toMatch(/<script|javascript:/i);
    }
  });

  it("includes MIT attribution and risk copy", async () => {
    const source = await readFile("public/deriv-presets/SOURCE.md", "utf8");
    expect(source).toContain("MIT");
    expect(source).toContain("not affiliated");
    for (const preset of DERIV_BOT_PRESETS) {
      expect(preset.risk.length).toBeGreaterThan(20);
    }
  });
});
