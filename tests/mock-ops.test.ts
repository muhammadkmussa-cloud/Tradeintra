import { describe, expect, it } from "vitest";
import {
  addAsset,
  addHostMapping,
  advanceDomain,
  assignBot,
  availableCredits,
  buyCredits,
  buyDomain,
  buyListing,
  cancelDeletion,
  cancelSubscription,
  changePlan,
  closeTicket,
  connectDomain,
  createAnnouncement,
  createBackup,
  createBot,
  createListing,
  createSignal,
  createTicket,
  deliverSignal,
  enqueueJob,
  initialMockState,
  isMockOpsEnabled,
  normalizeMockHostname,
  publishAnnouncement,
  readMockState,
  renewDomain,
  replyTicket,
  requestDeletion,
  requestPayout,
  restoreBackup,
  resumeSubscription,
  runJobs,
  searchDomains,
  sendEmail,
  setAutoRenew,
  setHostStatus,
  setSignalStatus,
  toggleTwoFactor,
  validateBot,
  verifyEmail,
  type MockState,
} from "../lib/mock-ops";

describe("development mock operations", () => {
  it("starts with deterministic, labelled development fixtures", () => {
    const state = initialMockState();
    expect(state.domains).toHaveLength(2);
    expect(state.planId).toBe("operator");
    expect(state.audit[0].action).toBe("mock.seed");
    expect(readMockState("not json")).toMatchObject({ planId: "operator" });
    const corrupt = readMockState(
      '{"domains":[],"tickets":[],"audit":null,"payouts":null,"hostMappings":null}',
    );
    expect(corrupt.audit).toEqual(expect.any(Array));
    expect(corrupt.payouts).toEqual(expect.any(Array));
    expect(corrupt.hostMappings).toEqual(expect.any(Array));
    expect(corrupt.planId).toBe("operator");
  });

  it("is development-only unless explicitly enabled for a built preview", () => {
    expect(isMockOpsEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isMockOpsEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(
      isMockOpsEnabled({
        NODE_ENV: "production",
        NEXT_PUBLIC_MOCK_OPS: "true",
      }),
    ).toBe(true);
  });

  it("normalizes safe mock hostnames and rejects malformed input", () => {
    expect(normalizeMockHostname(" HTTPS://Operator.Example/path ")).toBe(
      "operator.example",
    );
    expect(normalizeMockHostname("bad_host")).toBeNull();
    expect(normalizeMockHostname("")).toBeNull();
  });

  it("searches, buys, verifies, renews, and removes domains", () => {
    const state = initialMockState();
    const [result] = searchDomains("acme");
    expect(result.available).toBe(true);
    const bought = buyDomain(state, "acme.com", 1);
    expect(bought.orders[0].status).toBe("succeeded");
    expect(bought.domains[0].status).toBe("dns_pending");
    const dns = advanceDomain(bought, bought.domains[0].id);
    expect(dns.domains[0].status).toBe("ssl_pending");
    const active = advanceDomain(dns, dns.domains[0].id);
    expect(active.domains[0].status).toBe("active");
    const renewed = renewDomain(active, active.domains[0].id);
    expect(new Date(renewed.domains[0].expiresAt).getTime()).toBeGreaterThan(
      new Date(active.domains[0].expiresAt).getTime(),
    );
    const premium = searchDomains("capital.com")[0];
    expect(premium.registrationPrice).toBe(89);
    expect(buyDomain(state, "capital.com").domains[0].registrationPrice).toBe(
      89,
    );
    expect(searchDomains("acme.site")[1].name).not.toBe("acme.site");
    const duplicate = buyDomain(buyDomain(state, "acme.com"), "acme.com");
    expect(duplicate.domains.filter((d) => d.name === "acme.com")).toHaveLength(
      1,
    );
    const connected = connectDomain(state, "connected.example");
    expect(connected.domains[0].mode).toBe("connected");
    expect(
      setAutoRenew(connected, connected.domains[0].id, false).domains[0]
        .autoRenew,
    ).toBe(false);
  });

  it("handles plans, credits, cancellation, and payroll fixtures", () => {
    let state = initialMockState();
    state = changePlan(state, "scale");
    expect(state.planId).toBe("scale");
    state = cancelSubscription(state);
    expect(state.cancelAtPeriodEnd).toBe(true);
    state = resumeSubscription(state);
    expect(state.cancelAtPeriodEnd).toBe(false);
    state = buyCredits(state, 30, 4.99);
    expect(state.credits).toBe(70);
    expect(state.creditLedger[0].delta).toBe(30);
    const before = state.earnings.length;
    state = buyListing(state, state.listings[0].id);
    expect(state.earnings.length).toBe(before + 1);
    expect(state.listings[0].status).toBe("sold");
    state = requestPayout(state, 20, "mpesa");
    expect(state.payouts[0].status).toBe("requested");
    const beforeNegative = state.payouts.length;
    state = requestPayout(state, -50, "mpesa");
    expect(state.payouts).toHaveLength(beforeNegative);
  });

  it("runs support, bots, signals, marketplace, announcements, email, hosts, jobs, and deletion fixtures", () => {
    let state = initialMockState();
    state = createTicket(state, "Mock issue", "site", "A fixture ticket.");
    const ticket = state.tickets[0];
    expect(ticket.status).toBe("open");
    state = replyTicket(state, ticket.id, "We are checking.");
    expect(state.tickets[0].status).toBe("waiting");
    state = closeTicket(state, ticket.id);
    const closedMessages = state.tickets[0].messages.length;
    state = replyTicket(state, ticket.id, "Should not reopen");
    expect(state.tickets[0].status).toBe("closed");
    expect(state.tickets[0].messages).toHaveLength(closedMessages);

    state = createBot(state, "Test bot", "<xml><strategy /></xml>");
    const bot = state.bots[0];
    state = validateBot(state, bot.id);
    expect(state.bots[0].status).toBe("validated");
    state = assignBot(state, bot.id, "site-1");
    expect(state.bots[0].status).toBe("assigned");

    state = createSignal(state, "Test signal", "5m", "@test");
    const signal = state.signals[0];
    state = deliverSignal(state, signal.id);
    expect(state.signals[0].deliveries[0].status).toBe("sent");
    state = setSignalStatus(state, signal.id, "cancelled");
    const deliveries = state.signals[0].deliveries.length;
    state = deliverSignal(state, signal.id);
    expect(state.signals[0].deliveries).toHaveLength(deliveries);

    state = createListing(state, "Mock course", "course", 29);
    expect(state.listings[0].title).toBe("Mock course");

    state = createAnnouncement(state, "Notice", "Body", "all");
    const announcement = state.announcements[0];
    state = publishAnnouncement(state, announcement.id);
    expect(state.announcements[0].status).toBe("published");

    state = sendEmail(state, {
      to: "operator@example.test",
      subject: "Verify",
      body: "Token",
      kind: "verification",
    });
    expect(state.emails).toHaveLength(1);
    state = verifyEmail(state);
    expect(state.emailVerified).toBe(true);
    state = toggleTwoFactor(state);
    expect(state.twoFactorEnabled).toBe(true);

    state = addHostMapping(state, "operator.example", "site-1");
    const mapping = state.hostMappings[0];
    state = setHostStatus(state, mapping.id, "suspended");
    expect(state.hostMappings[0].status).toBe("suspended");

    state = enqueueJob(state, "cleanup");
    state = runJobs(state);
    expect(state.jobs.some((job) => job.status === "succeeded")).toBe(true);

    state = addAsset(state, "logo.svg", 2048, "image/svg+xml");
    expect(state.assets[0].name).toBe("logo.svg");
    state = createBackup(state);
    const backup = state.backups[0];
    state = restoreBackup(state, backup.id);
    expect(state.backups).toHaveLength(1);

    state = requestDeletion(state);
    expect(state.deletionRequestedAt).not.toBeNull();
    state = cancelDeletion(state);
    expect(state.deletionRequestedAt).toBeNull();
    expect(state.audit.length).toBeGreaterThan(10);
  });
});
