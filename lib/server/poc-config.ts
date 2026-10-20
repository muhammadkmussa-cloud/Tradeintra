// Server-side POC configuration. No NEXT_PUBLIC credentials or provider calls.
export class PocConfigurationError extends Error {}
export type Environment = Record<string, string | undefined>;
export const tenantSlugs = ["aurora", "nova", "orbit"] as const;
export type TenantSlug = (typeof tenantSlugs)[number];
export const tenantAccounts: Record<TenantSlug, string> = {
  aurora: "10000000-0000-4000-8000-000000000001",
  nova: "10000000-0000-4000-8000-000000000002",
  orbit: "10000000-0000-4000-8000-000000000003",
};
export function assertMockOnly(env: Environment = process.env) {
  if (
    (env.DERIV_MODE && env.DERIV_MODE !== "mock") ||
    (!!env.FEATURE_LIVE_DERIV && env.FEATURE_LIVE_DERIV !== "false") ||
    (!!env.FEATURE_PAYMENT_AGENT && env.FEATURE_PAYMENT_AGENT !== "false")
  ) {
    throw new PocConfigurationError(
      "This POC supports mock Deriv only and cannot enable payment-agent features.",
    );
  }
}
export function isPocEnabled(env: Environment = process.env) {
  assertMockOnly(env);
  return env.POC_ENABLED === "true";
}
export function requirePoc(env: Environment = process.env) {
  if (!isPocEnabled(env))
    throw new PocConfigurationError(
      "Set POC_ENABLED=true only in an approved staging environment.",
    );
}
export function normalizeHostname(
  input: string | null | undefined,
): string | null {
  if (!input || input.length > 260 || /[\s/@\\?#,]/.test(input)) return null;
  const match = /^([a-z0-9.-]+)(?::([0-9]{1,5}))?$/i.exec(input);
  if (
    !match ||
    (match[2] && (Number(match[2]) < 1 || Number(match[2]) > 65535))
  )
    return null;
  const host = match[1].toLowerCase().replace(/\.$/, "");
  if (
    host.length > 253 ||
    !host
      .split(".")
      .every(
        (label) =>
          label.length >= 1 &&
          label.length <= 63 &&
          /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
      )
  )
    return null;
  return host;
}
export function getPocHosts(
  env: Environment = process.env,
): Record<string, TenantSlug> {
  if (!isPocEnabled(env)) return {};
  if (!env.POC_HOSTS)
    throw new PocConfigurationError(
      "POC_HOSTS must explicitly map approved staging hostnames to POC tenants.",
    );
  const raw: unknown = JSON.parse(env.POC_HOSTS);
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new PocConfigurationError("Invalid POC_HOSTS object.");
  const entries = Object.entries(raw);
  if (!entries.length || entries.length > 10)
    throw new PocConfigurationError(
      "Configure between 1 and 10 staging hosts.",
    );
  const hosts: Record<string, TenantSlug> = Object.create(null);
  for (const [hostname, slug] of entries) {
    if (
      normalizeHostname(hostname) !== hostname ||
      typeof slug !== "string" ||
      !tenantSlugs.includes(slug as TenantSlug)
    )
      throw new PocConfigurationError(
        "POC_HOSTS contains an invalid hostname or tenant. Use canonical lowercase hostnames without ports.",
      );
    hosts[hostname] = slug as TenantSlug;
  }
  return hosts;
}
export function getTenantForHost(
  host: string | null,
  env: Environment = process.env,
): TenantSlug | null {
  const hostname = normalizeHostname(host);
  return hostname ? (getPocHosts(env)[hostname] ?? null) : null;
}
export function safeDiagnosticError(error: unknown): string {
  if (error instanceof PocConfigurationError) return error.message;
  // Do not echo database errors, SQL parameters, paths, or connection strings.
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  return /^[A-Z0-9_]{2,32}$/.test(code)
    ? `Check failed (${code}). See the staging runbook.`
    : "Check failed. Verify staging configuration using the runbook; details are not logged to avoid exposing credentials.";
}
