import { randomUUID } from "node:crypto";
import type { StudioDb, StudioTrx } from "./studio/types";
import { adminScope, scope } from "./studio/database";
import { StudioError } from "./studio/types";

export type DomainQuote = {
  name: string;
  tld: string;
  available: boolean;
  registrationPrice: number;
  renewalPrice: number;
  currency: "USD" | "KES";
  premium: boolean;
};

const TAKEN = new Set([
  "aurora-markets.com",
  "nova-operator.example",
  "deriv.com",
  "tradeintra.com",
]);

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

function tldFor(name: string, rules: string[]) {
  return rules
    .filter((tld) => name.endsWith(tld))
    .sort((a, b) => b.length - a.length)[0];
}

export async function domainPriceRules(db: StudioDb) {
  return db
    .selectFrom("domain_price_rules")
    .selectAll()
    .orderBy("tld")
    .execute();
}

export async function quoteDomain(
  db: StudioDb,
  name: string,
  years = 1,
): Promise<DomainQuote> {
  const clean = normalizeDomain(name);
  const rules = await domainPriceRules(db);
  const tld = tldFor(
    clean,
    rules.map((rule) => rule.tld),
  );
  if (!tld)
    throw new StudioError(
      422,
      "This TLD is not in the current domain catalog.",
      "UNSUPPORTED_TLD",
    );
  const rule = rules.find((item) => item.tld === tld)!;
  const markup = 1 + Number(rule.markup_percent) / 100;
  const premium =
    tld === ".io" || clean.includes("bank") || clean.includes("capital");
  const registrationPrice =
    Number(rule.registration_price) * markup * Math.max(1, years);
  const renewalPrice = Number(rule.renewal_price) * markup;
  return {
    name: clean,
    tld,
    available: !TAKEN.has(clean),
    registrationPrice: +registrationPrice.toFixed(2),
    renewalPrice: +renewalPrice.toFixed(2),
    currency: rule.currency,
    premium,
  };
}

export async function searchDomains(
  db: StudioDb,
  query: string,
  owned: string[] = [],
) {
  const clean = normalizeDomain(query).replace(/[^a-z0-9.-]/g, "");
  if (!clean) return [];
  const base = clean.includes(".") ? clean : `${clean}.com`;
  const rules = await domainPriceRules(db);
  const candidates = [base];
  const baseName = base.replace(/\.[^.]+$/, "");
  const alternative = base.endsWith(".site")
    ? `${baseName}.com`
    : `${baseName}.site`;
  if (alternative !== base) candidates.push(alternative);
  const taken = new Set([...TAKEN, ...owned]);
  const results: DomainQuote[] = [];
  for (const candidate of candidates) {
    try {
      const quote = await quoteDomain(db, candidate, 1);
      results.push({
        ...quote,
        available: quote.available && !taken.has(candidate),
      });
    } catch {
      // Unsupported alternatives are omitted rather than fabricated.
    }
  }
  return results;
}

async function requireSite(tx: StudioTrx, account: string, siteId: string) {
  const site = await tx
    .selectFrom("sites")
    .select("id")
    .where("account_id", "=", account)
    .where("id", "=", siteId)
    .where("archived", "=", false)
    .executeTakeFirst();
  if (!site) throw new StudioError(404, "Site not found.", "NOT_FOUND");
}

export async function buyDomain(
  db: StudioDb,
  account: string,
  siteId: string,
  name: string,
  years: number,
  idempotencyKey: string,
) {
  const quote = await quoteDomain(db, name, years);
  if (!quote.available)
    throw new StudioError(
      409,
      "This domain is not available in the mock catalog.",
      "DOMAIN_UNAVAILABLE",
    );
  return scope(db, account, async (tx) => {
    await requireSite(tx, account, siteId);
    const duplicateOrder = await tx
      .selectFrom("domain_orders")
      .select("id")
      .where("account_id", "=", account)
      .where("idempotency_key", "=", idempotencyKey)
      .executeTakeFirst();
    if (duplicateOrder) return listDomainsTx(tx, account);
    const existing = await tx
      .selectFrom("domains")
      .select("id")
      .where("name", "=", quote.name)
      .executeTakeFirst();
    if (existing)
      throw new StudioError(
        409,
        "This domain is already in your account.",
        "DOMAIN_OWNED",
      );
    const now = new Date();
    const expires = new Date(
      now.getTime() + 365 * Math.max(1, years) * 86400000,
    );
    await tx
      .insertInto("domain_orders")
      .values({
        id: randomUUID(),
        account_id: account,
        domain: quote.name,
        years,
        quoted_price: String(quote.registrationPrice),
        final_price: String(quote.registrationPrice),
        status: "succeeded",
        provider: "mock",
        idempotency_key: idempotencyKey,
        note: "Mock Namecheap purchase; no provider call.",
      })
      .execute();
    await tx
      .insertInto("domains")
      .values({
        id: randomUUID(),
        account_id: account,
        site_id: siteId,
        name: quote.name,
        mode: "purchased",
        status: "dns_pending",
        registration_price: String(quote.registrationPrice),
        renewal_price: String(quote.renewalPrice),
        currency: quote.currency,
        premium: quote.premium,
        auto_renew: true,
        expires_at: expires,
        dns_verified: false,
        ssl_status: "pending",
      })
      .execute();
    return listDomainsTx(tx, account);
  });
}

export async function connectDomain(
  db: StudioDb,
  account: string,
  siteId: string,
  name: string,
) {
  const clean = normalizeDomain(name);
  if (
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
      clean,
    )
  )
    throw new StudioError(422, "Enter a canonical domain.", "INVALID_DOMAIN");
  return scope(db, account, async (tx) => {
    await requireSite(tx, account, siteId);
    const existing = await tx
      .selectFrom("domains")
      .select("id")
      .where("name", "=", clean)
      .executeTakeFirst();
    if (existing)
      throw new StudioError(
        409,
        "This domain is already attached.",
        "DOMAIN_OWNED",
      );
    await tx
      .insertInto("domains")
      .values({
        id: randomUUID(),
        account_id: account,
        site_id: siteId,
        name: clean,
        mode: "connected",
        status: "dns_pending",
        registration_price: "0",
        renewal_price: "0",
        currency: "USD",
        premium: false,
        auto_renew: false,
        expires_at: new Date(Date.now() + 365 * 86400000),
        dns_verified: false,
        ssl_status: "pending",
      })
      .execute();
    return listDomainsTx(tx, account);
  });
}

function listDomainsTx(tx: StudioTrx, account: string) {
  return tx
    .selectFrom("domains")
    .selectAll()
    .where("account_id", "=", account)
    .orderBy("created_at", "desc")
    .execute();
}

export async function listDomains(db: StudioDb, account: string) {
  return scope(db, account, (tx) => listDomainsTx(tx, account));
}

export async function advanceDomain(
  db: StudioDb,
  account: string,
  domainId: string,
) {
  return scope(db, account, async (tx) => {
    const domain = await tx
      .selectFrom("domains")
      .selectAll()
      .where("account_id", "=", account)
      .where("id", "=", domainId)
      .forUpdate()
      .executeTakeFirst();
    if (!domain) throw new StudioError(404, "Domain not found.", "NOT_FOUND");
    if (domain.status === "dns_pending")
      await tx
        .updateTable("domains")
        .set({
          status: "ssl_pending",
          dns_verified: true,
          ssl_status: "issued",
        })
        .where("account_id", "=", account)
        .where("id", "=", domainId)
        .execute();
    else if (domain.status === "ssl_pending")
      await tx
        .updateTable("domains")
        .set({ status: "active", dns_verified: true, ssl_status: "active" })
        .where("account_id", "=", account)
        .where("id", "=", domainId)
        .execute();
    return listDomainsTx(tx, account);
  });
}

export async function renewDomain(
  db: StudioDb,
  account: string,
  domainId: string,
  years = 1,
) {
  return scope(db, account, async (tx) => {
    const domain = await tx
      .selectFrom("domains")
      .select(["expires_at", "renewal_price"])
      .where("account_id", "=", account)
      .where("id", "=", domainId)
      .forUpdate()
      .executeTakeFirst();
    if (!domain) throw new StudioError(404, "Domain not found.", "NOT_FOUND");
    await tx
      .updateTable("domains")
      .set({
        expires_at: new Date(
          new Date(domain.expires_at).getTime() +
            365 * Math.max(1, years) * 86400000,
        ),
        status: "active",
      })
      .where("account_id", "=", account)
      .where("id", "=", domainId)
      .execute();
    return listDomainsTx(tx, account);
  });
}

export async function removeDomain(
  db: StudioDb,
  account: string,
  domainId: string,
) {
  return scope(db, account, async (tx) => {
    await tx
      .deleteFrom("domains")
      .where("account_id", "=", account)
      .where("id", "=", domainId)
      .execute();
    return listDomainsTx(tx, account);
  });
}

export async function listDomainOrders(db: StudioDb, account: string) {
  return scope(db, account, (tx) =>
    tx
      .selectFrom("domain_orders")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .execute(),
  );
}

export async function recordCommission(
  db: StudioDb,
  account: string,
  siteId: string | null,
  period: string,
  grossCommission: number,
  status: "estimated" | "imported" | "settled" | "reversed" = "imported",
  providerReference?: string,
) {
  const safeGross = Math.max(0, grossCommission);
  const platformShare = +(safeGross * 0.15).toFixed(2);
  return scope(db, account, async (tx) => {
    await tx
      .insertInto("commission_entries")
      .values({
        id: randomUUID(),
        account_id: account,
        site_id: siteId,
        period,
        gross_commission: String(safeGross),
        platform_share: String(platformShare),
        status,
        provider_reference: providerReference ?? null,
      })
      .execute();
    const entries = await tx
      .selectFrom("commission_entries")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .execute();
    return {
      entries,
      gross: entries.reduce(
        (sum, row) => sum + Number(row.gross_commission),
        0,
      ),
      platformShare: entries.reduce(
        (sum, row) => sum + Number(row.platform_share),
        0,
      ),
      estimated: entries
        .filter((row) => row.status === "estimated")
        .reduce((sum, row) => sum + Number(row.platform_share), 0),
      settled: entries
        .filter((row) => row.status === "settled")
        .reduce((sum, row) => sum + Number(row.platform_share), 0),
    };
  });
}

export async function listAllCommissions(db: StudioDb) {
  return adminScope(db, (tx) =>
    tx
      .selectFrom("commission_entries")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute(),
  );
}

export async function commissionSummary(db: StudioDb, account: string) {
  return scope(db, account, async (tx) => {
    const rows = await tx
      .selectFrom("commission_entries")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .execute();
    return {
      entries: rows,
      gross: rows.reduce((sum, row) => sum + Number(row.gross_commission), 0),
      platformShare: rows.reduce(
        (sum, row) => sum + Number(row.platform_share),
        0,
      ),
      estimated: rows
        .filter((row) => row.status === "estimated")
        .reduce((sum, row) => sum + Number(row.platform_share), 0),
      settled: rows
        .filter((row) => row.status === "settled")
        .reduce((sum, row) => sum + Number(row.platform_share), 0),
    };
  });
}
