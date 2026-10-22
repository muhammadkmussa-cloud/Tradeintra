import { randomUUID } from "node:crypto";
import type { StudioDb, StudioTrx } from "./studio/types";
import { adminScope, scope } from "./studio/database";
import { StudioError } from "./studio/types";
import {
  domainMode,
  domainProvider,
  type RegistrantContact,
} from "./providers/domain";
import { encryptSecret } from "./secrets";
import { auditTx } from "./audit";
import { issueInvoiceTx } from "./invoices";
import { resolveTxt } from "node:dns/promises";
import { connect as tlsConnect } from "node:tls";

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

export async function updateDomainPriceRule(
  db: StudioDb,
  tld: string,
  registrationPrice: number,
  renewalPrice: number,
  markupPercent: number,
) {
  const clean = tld.trim().toLowerCase();
  if (!/^\.[a-z0-9-]{2,}$/.test(clean))
    throw new StudioError(422, "Enter a TLD such as .com.", "VALIDATION");
  if (
    !Number.isFinite(registrationPrice) ||
    !Number.isFinite(renewalPrice) ||
    !Number.isFinite(markupPercent) ||
    registrationPrice < 0 ||
    renewalPrice < 0 ||
    markupPercent < 0 ||
    markupPercent > 100
  )
    throw new StudioError(422, "Enter valid price rules.", "VALIDATION");
  return adminScope(db, async (tx) => {
    const updated = await tx
      .updateTable("domain_price_rules")
      .set({
        registration_price: String(registrationPrice),
        renewal_price: String(renewalPrice),
        markup_percent: String(markupPercent),
        last_verified_at: new Date(),
      })
      .where("tld", "=", clean)
      .executeTakeFirst();
    if (!updated.numUpdatedRows)
      throw new StudioError(404, "TLD rule not found.", "NOT_FOUND");
    return tx
      .selectFrom("domain_price_rules")
      .selectAll()
      .where("tld", "=", clean)
      .executeTakeFirst();
  });
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
  const live = domainMode() !== "mock";
  const provider = live ? domainProvider() : null;
  const results: DomainQuote[] = [];
  for (const candidate of candidates) {
    try {
      const quote = await quoteDomain(db, candidate, 1);
      const registrar = provider ? await provider.search(candidate) : null;
      results.push({
        ...quote,
        available:
          (registrar?.available ?? quote.available) && !taken.has(candidate),
      });
    } catch {
      // Unsupported/unavailable alternatives are omitted.
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
  contact?: RegistrantContact,
  expectedPrice?: number,
) {
  const quote = await quoteDomain(db, name, years);
  if (
    expectedPrice !== undefined &&
    Number.isFinite(expectedPrice) &&
    Math.abs(quote.registrationPrice - expectedPrice) > 0.009
  )
    throw new StudioError(
      409,
      `The registration price changed to ${quote.currency} ${quote.registrationPrice.toFixed(2)}. Review and confirm again.`,
      "PRICE_CHANGED",
    );
  if (!quote.available)
    throw new StudioError(
      409,
      "This domain is not available in the current domain catalog.",
      "DOMAIN_UNAVAILABLE",
    );
  const mode = domainMode();
  if (mode !== "mock" && !contact)
    throw new StudioError(
      422,
      "Registrant contact is required for a live domain registration.",
      "CONTACT_REQUIRED",
    );
  const provider = domainProvider();
  const registrar = await provider.purchase(
    quote.name,
    years,
    idempotencyKey,
    contact,
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
        status: mode === "mock" ? "succeeded" : "submitted",
        provider: mode === "mock" ? "mock" : "namecheap",
        idempotency_key: idempotencyKey,
        note:
          mode === "mock"
            ? "Mock Namecheap purchase; no provider call."
            : `Namecheap order ${registrar.providerOrderId}`,
      })
      .execute();
    if (contact)
      await tx
        .insertInto("domain_contacts")
        .values({
          id: randomUUID(),
          account_id: account,
          domain_name: quote.name,
          encrypted_contact: encryptSecret(JSON.stringify(contact)),
        })
        .onConflict((oc) =>
          oc.columns(["account_id", "domain_name"]).doUpdateSet({
            encrypted_contact: encryptSecret(JSON.stringify(contact)),
          }),
        )
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
        verification_token: `tradeintra-${randomUUID()}`,
      })
      .execute();
    await issueInvoiceTx(
      tx,
      account,
      "domain",
      quote.name,
      `${quote.name} registration · ${years} year${years === 1 ? "" : "s"}`,
      quote.registrationPrice,
      quote.currency,
    );
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
        verification_token: `tradeintra-${randomUUID()}`,
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

export async function listAllTransferRequests(db: StudioDb) {
  return adminScope(db, (tx) =>
    tx
      .selectFrom("domain_transfer_requests")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute(),
  );
}

export async function setTransferStatus(
  db: StudioDb,
  id: string,
  status: "requested" | "approved" | "rejected" | "completed",
) {
  return adminScope(db, async (tx) => {
    const result = await tx
      .updateTable("domain_transfer_requests")
      .set({ status, updated_at: new Date() })
      .where("id", "=", id)
      .executeTakeFirst();
    if (!result.numUpdatedRows)
      throw new StudioError(404, "Transfer request not found.", "NOT_FOUND");
    return tx
      .selectFrom("domain_transfer_requests")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  });
}

export async function listTransferRequests(db: StudioDb, account: string) {
  return scope(db, account, (tx) =>
    tx
      .selectFrom("domain_transfer_requests")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .execute(),
  );
}

export async function requestTransfer(
  db: StudioDb,
  account: string,
  direction: "in" | "out",
  name: string,
  note: string,
  authCode: string,
) {
  const clean = normalizeDomain(name);
  if (
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
      clean,
    )
  )
    throw new StudioError(422, "Enter a canonical domain.", "INVALID_DOMAIN");
  return scope(db, account, async (tx) => {
    if (direction === "out") {
      const owned = await tx
        .selectFrom("domains")
        .select("id")
        .where("account_id", "=", account)
        .where("name", "=", clean)
        .executeTakeFirst();
      if (!owned)
        throw new StudioError(
          404,
          "Only your own domain can transfer out.",
          "NOT_FOUND",
        );
    } else {
      const owned = await tx
        .selectFrom("domains")
        .select("id")
        .where("name", "=", clean)
        .executeTakeFirst();
      if (owned)
        throw new StudioError(
          409,
          "This domain is already managed here.",
          "DOMAIN_OWNED",
        );
    }
    const request = {
      id: randomUUID(),
      account_id: account,
      direction,
      domain_name: clean,
      note: note.trim() || null,
      encrypted_auth_code: authCode.trim()
        ? encryptSecret(authCode.trim())
        : null,
      status: "requested" as const,
    };
    await tx.insertInto("domain_transfer_requests").values(request).execute();
    await auditTx(
      tx,
      account,
      account,
      "domain.transfer.request",
      `${direction} ${clean}`,
    );
    return tx
      .selectFrom("domain_transfer_requests")
      .selectAll()
      .where("id", "=", request.id)
      .executeTakeFirstOrThrow();
  });
}

export async function listDomains(db: StudioDb, account: string) {
  return scope(db, account, (tx) => listDomainsTx(tx, account));
}

async function checkDns(domain: {
  name: string;
  verification_token: string | null;
}) {
  if (domainMode() === "mock") return { ok: true as const };
  if (!domain.verification_token)
    return { ok: false as const, error: "Verification token is missing." };
  try {
    const records = await resolveTxt(`_tradeintra.${domain.name}`);
    const values = records.map((parts) => parts.join(""));
    return values.includes(domain.verification_token)
      ? { ok: true as const }
      : {
          ok: false as const,
          error: `Add TXT record _tradeintra.${domain.name} = ${domain.verification_token}`,
        };
  } catch {
    return {
      ok: false as const,
      error: `TXT record _tradeintra.${domain.name} was not found.`,
    };
  }
}

async function checkTls(name: string) {
  if (domainMode() === "mock") return { ok: true as const };
  return new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
    const socket = tlsConnect(
      {
        host: name,
        port: 443,
        servername: name,
        rejectUnauthorized: true,
        timeout: 8000,
      },
      () => {
        const authorized = socket.authorized;
        socket.end();
        resolve(
          authorized
            ? { ok: true }
            : { ok: false, error: "TLS certificate is not trusted." },
        );
      },
    );
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, error: "TLS check timed out." });
    });
    socket.on("error", () => {
      resolve({ ok: false, error: "TLS certificate could not be verified." });
    });
  });
}

export async function verifyDomain(
  db: StudioDb,
  account: string,
  domainId: string,
) {
  const domain = await scope(db, account, (tx) =>
    tx
      .selectFrom("domains")
      .selectAll()
      .where("account_id", "=", account)
      .where("id", "=", domainId)
      .executeTakeFirst(),
  );
  if (!domain) throw new StudioError(404, "Domain not found.", "NOT_FOUND");
  let error: string | null = null;
  if (domain.status === "dns_pending") {
    const result = await checkDns(domain);
    if (!result.ok) error = result.error;
  } else if (domain.status === "ssl_pending") {
    const result = await checkTls(domain.name);
    if (!result.ok) error = result.error;
  } else {
    throw new StudioError(
      409,
      "This domain needs no verification.",
      "INVALID_STATE",
    );
  }
  return scope(db, account, async (tx) => {
    if (error) {
      await tx
        .updateTable("domains")
        .set({
          last_checked_at: new Date(),
          verification_error: error,
        })
        .where("account_id", "=", account)
        .where("id", "=", domainId)
        .execute();
      throw new StudioError(422, error, "VERIFICATION_FAILED");
    }
    if (domain.status === "dns_pending")
      await tx
        .updateTable("domains")
        .set({
          status: "ssl_pending",
          dns_verified: true,
          ssl_status: "issued",
          last_checked_at: new Date(),
          verification_error: null,
        })
        .where("account_id", "=", account)
        .where("id", "=", domainId)
        .execute();
    else
      await tx
        .updateTable("domains")
        .set({
          status: "active",
          dns_verified: true,
          ssl_status: "active",
          last_checked_at: new Date(),
          verification_error: null,
        })
        .where("account_id", "=", account)
        .where("id", "=", domainId)
        .execute();
    return listDomainsTx(tx, account);
  });
}

export const advanceDomain = verifyDomain;

export async function renewDomain(
  db: StudioDb,
  account: string,
  domainId: string,
  years = 1,
) {
  return scope(db, account, async (tx) => {
    const domain = await tx
      .selectFrom("domains")
      .select(["name", "mode", "expires_at", "renewal_price"])
      .where("account_id", "=", account)
      .where("id", "=", domainId)
      .forUpdate()
      .executeTakeFirst();
    if (!domain) throw new StudioError(404, "Domain not found.", "NOT_FOUND");
    if (domain.mode === "purchased" && domainMode() !== "mock")
      await domainProvider().renew(domain.name, years);
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
    const domain = await tx
      .selectFrom("domains")
      .select(["name", "mode"])
      .where("account_id", "=", account)
      .where("id", "=", domainId)
      .executeTakeFirst();
    if (!domain) throw new StudioError(404, "Domain not found.", "NOT_FOUND");
    if (domain.mode === "purchased" && domainMode() !== "mock")
      await domainProvider().remove(domain.name);
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
