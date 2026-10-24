import { studioMode } from "./studio/database";
import { domainMode } from "./providers/domain";
import { emailMode } from "./providers/email";
import { paymentMode } from "./providers/payments";
import { telegramMode } from "./providers/telegram";

type JsonRpcId = string | number | null;
type Request = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
};

const tools = [
  {
    name: "tradeintra_pricing",
    description:
      "Read the public preset, domain, commission, signal, and marketplace pricing rules.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "tradeintra_status",
    description:
      "Read provider configuration modes. Does not expose secrets or account data.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "tradeintra_boundaries",
    description:
      "Read the public safety and operating boundaries of the platform.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
] as const;

const pricing = {
  botPresets: {
    count: 9,
    licence: "MIT",
    source: "deriv-com/trading-bot-template",
  },
  domainMarkupPercent: 15,
  derivCommissionPlatformPercent: 15,
  marketplacePlatformPercent: 15,
  signal: { trialHours: 24, priceUsd: 8.99, periodDays: 30 },
};

function safeMode(read: () => string) {
  try {
    return read();
  } catch {
    return "unavailable";
  }
}

function status() {
  return {
    studio: safeMode(studioMode),
    email: safeMode(emailMode),
    domains: safeMode(domainMode),
    payments: safeMode(paymentMode),
    telegram: safeMode(telegramMode),
  };
}

const boundaries = [
  "Tradeintra does not execute trades or hold customer funds.",
  "The public MCP endpoint is read-only and exposes no account data.",
  "Provider secrets, tokens, passwords, and registrar contacts are never returned.",
  "Payouts require Finance review and are not executed by the public API.",
  "Mock modes are not production acceptance.",
  "This is a development preview.",
];

function result(id: JsonRpcId, value: unknown) {
  return { jsonrpc: "2.0", id, result: value };
}
function error(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function callTool(name: string) {
  const payload =
    name === "tradeintra_pricing"
      ? pricing
      : name === "tradeintra_status"
        ? status()
        : name === "tradeintra_boundaries"
          ? { boundaries }
          : null;
  if (!payload) return null;
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    isError: false,
  };
}

function validId(id: unknown): id is string | number | null {
  return id === null || typeof id === "string" || typeof id === "number";
}

function handleOne(request: Request) {
  const hasId = Object.prototype.hasOwnProperty.call(request, "id");
  if (!hasId) return null;
  if (
    request.jsonrpc !== "2.0" ||
    !validId(request.id) ||
    typeof request.method !== "string" ||
    !request.method
  )
    return error(
      validId(request.id) ? request.id : null,
      -32600,
      "Invalid JSON-RPC request.",
    );
  const id = request.id;
  if (request.method === "initialize") {
    const supported = ["2024-11-05", "2025-03-26", "2025-06-18"];
    const requested = String(request.params?.protocolVersion ?? "");
    return result(id, {
      protocolVersion: supported.includes(requested)
        ? requested
        : supported[supported.length - 1],
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "tradeintra-public", version: "0.1.0" },
      instructions:
        "Read-only public pricing, provider mode, and safety-boundary tools. No account data or writes.",
    });
  }
  if (request.method === "ping") return result(id, {});
  if (request.method === "tools/list") return result(id, { tools });
  if (request.method === "tools/call") {
    const name = String(request.params?.name ?? "");
    if (!tools.some((tool) => tool.name === name))
      return error(id, -32602, "Unknown tool.");
    return result(id, callTool(name));
  }
  return error(id, -32601, "Method not found.");
}

export function handleMcpRequest(payload: unknown) {
  if (Array.isArray(payload)) {
    if (!payload.length) return error(null, -32600, "Invalid request.");
    if (payload.length > 50) return error(null, -32600, "Batch too large.");
    const responses = payload
      .map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? handleOne(item as Request)
          : error(null, -32600, "Invalid request."),
      )
      .filter((response) => response !== null);
    return responses.length ? responses : null;
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return error(null, -32600, "Invalid request.");
  return handleOne(payload as Request);
}
