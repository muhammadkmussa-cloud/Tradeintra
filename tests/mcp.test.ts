import { describe, expect, it } from "vitest";
import { handleMcpRequest } from "../lib/server/mcp";

describe("public read-only MCP", () => {
  it("initializes with tools capability", () => {
    const response = handleMcpRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {},
    }) as { result: { protocolVersion: string; capabilities: unknown } };
    expect(response.result.protocolVersion).toBe("2025-06-18");
    expect(response.result.capabilities).toBeTruthy();
  });

  it("lists only the three public tools", () => {
    const response = handleMcpRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    }) as { result: { tools: { name: string }[] } };
    expect(response.result.tools.map((tool) => tool.name)).toEqual([
      "tradeintra_pricing",
      "tradeintra_status",
      "tradeintra_boundaries",
    ]);
  });

  it("returns public pricing without account data", () => {
    const response = handleMcpRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "tradeintra_pricing", arguments: {} },
    }) as {
      result: { content: { text: string }[] };
    };
    const body = JSON.parse(response.result.content[0].text);
    expect(body.signal.priceUsd).toBe(8.99);
    expect(body.credits.packs).toHaveLength(3);
    expect(JSON.stringify(body)).not.toContain("@example");
  });

  it("rejects unknown methods and tools", () => {
    const method = handleMcpRequest({
      jsonrpc: "2.0",
      id: 4,
      method: "unknown",
    }) as { error: { code: number } };
    expect(method.error.code).toBe(-32601);
    const tool = handleMcpRequest({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: { name: "delete_account", arguments: {} },
    }) as { error: { code: number } };
    expect(tool.error.code).toBe(-32602);
  });

  it("does not reply to any notification", () => {
    expect(
      handleMcpRequest({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    ).toBeNull();
    expect(
      handleMcpRequest({
        jsonrpc: "2.0",
        method: "notifications/cancelled",
        params: { requestId: 1 },
      }),
    ).toBeNull();
    expect(handleMcpRequest({ jsonrpc: "2.0", method: "ping" })).toBeNull();
  });

  it("preserves zero ids and rejects an empty batch", () => {
    const response = handleMcpRequest({
      jsonrpc: "2.0",
      id: 0,
      method: "ping",
    }) as { id: number };
    expect(response.id).toBe(0);
    const empty = handleMcpRequest([]) as { error: { code: number } };
    expect(empty.error.code).toBe(-32600);
  });

  it("negotiates a supported protocol version", () => {
    const response = handleMcpRequest({
      jsonrpc: "2.0",
      id: 6,
      method: "initialize",
      params: { protocolVersion: "2025-03-26" },
    }) as { result: { protocolVersion: string } };
    expect(response.result.protocolVersion).toBe("2025-03-26");
  });
});
