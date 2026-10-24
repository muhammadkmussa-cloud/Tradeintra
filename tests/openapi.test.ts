import { describe, expect, it } from "vitest";
import { GET } from "../app/openapi.json/route";

describe("public OpenAPI contract", () => {
  it("documents real studio paths and every operation has responses", async () => {
    const document = (await GET().json()) as {
      paths: Record<string, Record<string, { responses?: unknown }>>;
    };
    expect(document.paths["/api/studio/sites"]).toBeUndefined();
    expect(document.paths["/api/studio/billing"]).toBeUndefined();
    for (const path of Object.values(document.paths))
      for (const operation of Object.values(path))
        expect(operation.responses).toBeTruthy();
  });
});
