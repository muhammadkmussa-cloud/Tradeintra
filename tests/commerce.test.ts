import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getStudioDb, scope } from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import { authenticate } from "../lib/server/studio/auth";
import { defaultConfig } from "../lib/studio";
import {
  advanceDomain,
  buyDomain,
  commissionSummary,
  connectDomain,
  listDomainOrders,
  listDomains,
  quoteDomain,
  recordCommission,
  removeDomain,
  renewDomain,
  listTransferRequests,
  requestTransfer,
  searchDomains,
  updateDomainPriceRule,
} from "../lib/server/commerce";

let db: StudioDb;
let directory: string;
let actor: Actor;
let siteId: string;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-commerce-"));
  process.env.STUDIO_DB_MODE = "local";
  process.env.STUDIO_ENV = "local";
  process.env.STUDIO_DATA_DIR = directory;
  db = await getStudioDb();
  actor = (
    await authenticate(db, "commerce@example.test", "CommercePass1", true, {
      fullName: "Commerce Operator",
    })
  ).actor;
  siteId = randomUUID();
  await scope(db, actor.id, (tx) =>
    tx
      .insertInto("sites")
      .values({
        account_id: actor.id,
        id: siteId,
        draft: { ...defaultConfig, name: "Commerce", slug: "commerce-site" },
        published_version: null,
        archived: false,
      })
      .execute(),
  );
}, 30000);

afterAll(async () => {
  await db?.destroy();
  await rm(directory, { recursive: true, force: true });
  delete process.env.STUDIO_DB_MODE;
  delete process.env.STUDIO_ENV;
  delete process.env.STUDIO_DATA_DIR;
});

describe("domain and commission lifecycle", () => {
  it("quotes, searches, buys, verifies, renews, and removes a domain", async () => {
    const quote = await quoteDomain(db, "acme.com", 1);
    expect(quote.registrationPrice).toBe(14.37);
    expect(quote.renewalPrice).toBe(16.1);
    const results = await searchDomains(db, "acme");
    expect(results[0]).toMatchObject({ name: "acme.com", available: true });
    const bought = await buyDomain(
      db,
      actor.id,
      siteId,
      "acme.com",
      1,
      "buy-acme-1",
    );
    expect(bought).toHaveLength(1);
    expect(bought[0].status).toBe("dns_pending");
    expect(bought[0].verification_token).toMatch(/^tradeintra-/);
    const orders = await listDomainOrders(db, actor.id);
    expect(orders[0]).toMatchObject({
      domain: "acme.com",
      status: "succeeded",
    });
    const dns = await advanceDomain(db, actor.id, bought[0].id);
    expect(dns[0]).toMatchObject({ status: "ssl_pending", dns_verified: true });
    const active = await advanceDomain(db, actor.id, bought[0].id);
    expect(active[0]).toMatchObject({ status: "active", ssl_status: "active" });
    const renewed = await renewDomain(db, actor.id, bought[0].id);
    expect(new Date(renewed[0].expires_at).getTime()).toBeGreaterThan(
      new Date(active[0].expires_at!).getTime(),
    );
    const connected = await connectDomain(
      db,
      actor.id,
      siteId,
      "connected.example",
    );
    expect(
      connected.some((domain) => domain.name === "connected.example"),
    ).toBe(true);
    const remaining = await removeDomain(db, actor.id, bought[0].id);
    expect(remaining.some((domain) => domain.name === "acme.com")).toBe(false);
  });

  it("updates admin domain price rules without bypassing markup", async () => {
    const rule = await updateDomainPriceRule(db, ".com", 10, 12, 20);
    expect(rule).toMatchObject({
      tld: ".com",
      registration_price: "10.00",
      renewal_price: "12.00",
      markup_percent: "20.00",
    });
    const quote = await quoteDomain(db, "updated.com", 1);
    expect(quote.registrationPrice).toBe(12);
    expect(quote.renewalPrice).toBe(14.4);
    await expect(
      buyDomain(
        db,
        actor.id,
        siteId,
        "price-change.com",
        1,
        "price-change",
        undefined,
        1,
      ),
    ).rejects.toMatchObject({ status: 409, code: "PRICE_CHANGED" });
  });

  it("queues manual transfer-in and transfer-out requests", async () => {
    await connectDomain(db, actor.id, siteId, "transfer-out.example");
    const out = await requestTransfer(
      db,
      actor.id,
      "out",
      "transfer-out.example",
      "Unlock and release",
      "EPP-123",
    );
    expect(out).toMatchObject({
      direction: "out",
      status: "requested",
      domain_name: "transfer-out.example",
    });
    const inbound = await requestTransfer(
      db,
      actor.id,
      "in",
      "transfer-in.example",
      "Move from current registrar",
      "EPP-456",
    );
    expect(inbound.direction).toBe("in");
    const requests = await listTransferRequests(db, actor.id);
    expect(requests).toHaveLength(2);
  });

  it("requires a registrant contact for live registration", async () => {
    process.env.NAMECHEAP_MODE = "sandbox";
    await expect(
      buyDomain(
        db,
        actor.id,
        siteId,
        "live-contact-required.com",
        1,
        "live-contact-key",
      ),
    ).rejects.toMatchObject({ status: 422, code: "CONTACT_REQUIRED" });
    delete process.env.NAMECHEAP_MODE;
  });

  it("is idempotent and computes the 15% commission share", async () => {
    const first = await buyDomain(
      db,
      actor.id,
      siteId,
      "idempotent.com",
      1,
      "same-key",
    );
    const second = await buyDomain(
      db,
      actor.id,
      siteId,
      "idempotent.com",
      1,
      "same-key",
    );
    expect(
      second.filter((domain) => domain.name === "idempotent.com"),
    ).toHaveLength(
      first.filter((domain) => domain.name === "idempotent.com").length,
    );
    const summary = await recordCommission(
      db,
      actor.id,
      siteId,
      "2026-10",
      100,
      "imported",
      "deriv-ref",
    );
    expect(summary.gross).toBe(100);
    expect(summary.platformShare).toBe(15);
    expect(summary.entries[0].status).toBe("imported");
    const listed = await listDomains(db, actor.id);
    expect(listed.length).toBeGreaterThanOrEqual(2);
    expect(await commissionSummary(db, actor.id)).toMatchObject({
      gross: 100,
      platformShare: 15,
    });
  });
});
