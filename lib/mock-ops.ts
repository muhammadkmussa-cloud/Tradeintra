export type MockPlanId = "free" | "operator" | "scale";
export type MockDomainStatus =
  | "quoted"
  | "registered"
  | "dns_pending"
  | "ssl_pending"
  | "active"
  | "expired"
  | "suspended";
export type MockDomain = {
  id: string;
  name: string;
  mode: "purchased" | "connected";
  status: MockDomainStatus;
  registrationPrice: number;
  renewalPrice: number;
  currency: "USD" | "KES";
  premium: boolean;
  autoRenew: boolean;
  expiresAt: string;
  siteId?: string;
  dnsVerified: boolean;
  ssl: "pending" | "issued" | "active" | "failed";
  createdAt: string;
};
export type MockDomainOrder = {
  id: string;
  domain: string;
  years: number;
  quotedPrice: number;
  finalPrice: number;
  status: "quoted" | "paid" | "submitted" | "succeeded" | "failed" | "refunded";
  provider: "namecheap-mock" | "manual";
  createdAt: string;
  note?: string;
};
export type MockTicket = {
  id: string;
  subject: string;
  category: "account" | "domain" | "site" | "billing" | "abuse";
  status: "open" | "waiting" | "closed";
  createdAt: string;
  messages: { author: "customer" | "support"; body: string; at: string }[];
};
export type MockBot = {
  id: string;
  name: string;
  xml: string;
  compatibility: "standard-dbot" | "tradeintra-only";
  status: "draft" | "validated" | "assigned" | "failed";
  siteId?: string;
  createdAt: string;
};
export type MockSignal = {
  id: string;
  name: string;
  interval: string;
  telegram: string;
  status: "draft" | "trial" | "active" | "paused" | "cancelled" | "expired";
  trialEndsAt: string;
  price: number;
  deliveries: { at: string; status: "sent" | "failed"; message: string }[];
};
export type MockListing = {
  id: string;
  title: string;
  kind: "bot" | "pdf" | "course" | "signal";
  price: number;
  seller: string;
  status: "draft" | "live" | "sold";
};
export type MockEarning = {
  id: string;
  source:
    | "partner"
    | "markup"
    | "domain"
    | "credits"
    | "marketplace"
    | "signals"
    | "referral";
  amount: number;
  status: "pending" | "available" | "paid";
  note: string;
  createdAt: string;
};
export type MockPayout = {
  id: string;
  amount: number;
  method: "mpesa" | "bank" | "crypto";
  status: "requested" | "review" | "paid";
  createdAt: string;
};
export type MockAnnouncement = {
  id: string;
  title: string;
  body: string;
  target: "all" | string;
  status: "draft" | "published";
  createdAt: string;
};
export type MockEmail = {
  id: string;
  to: string;
  subject: string;
  body: string;
  kind: "verification" | "reset" | "receipt" | "renewal";
  createdAt: string;
};
export type MockJob = {
  id: string;
  type: "domain-poll" | "email" | "renewal" | "publish" | "cleanup" | "signal";
  status: "queued" | "running" | "succeeded" | "failed" | "timed_out";
  attempts: number;
  runAfter: string;
  createdAt: string;
  note?: string;
};
export type MockHostMapping = {
  id: string;
  hostname: string;
  siteId: string;
  status: "pending" | "active" | "suspended";
  createdAt: string;
};
export type MockAsset = {
  id: string;
  name: string;
  size: number;
  type: string;
  at: string;
};
export type MockBackup = {
  id: string;
  at: string;
  note: string;
};
export type MockAudit = {
  id: string;
  action: string;
  detail: string;
  at: string;
};
export type MockState = {
  domains: MockDomain[];
  orders: MockDomainOrder[];
  planId: MockPlanId;
  subscription: "active" | "past_due" | "cancelled" | "expired";
  cancelAtPeriodEnd: boolean;
  renewsAt: string;
  credits: number;
  creditLedger: { id: string; delta: number; reason: string; at: string }[];
  tickets: MockTicket[];
  bots: MockBot[];
  signals: MockSignal[];
  listings: MockListing[];
  earnings: MockEarning[];
  payouts: MockPayout[];
  announcements: MockAnnouncement[];
  emails: MockEmail[];
  jobs: MockJob[];
  hostMappings: MockHostMapping[];
  assets: MockAsset[];
  backups: MockBackup[];
  audit: MockAudit[];
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  domainMarkupPercent: number;
  deletionRequestedAt: string | null;
};

export type MockSiteRef = { id: string; name: string; slug: string };

const now = () => new Date().toISOString();
const id = () =>
  globalThis.crypto?.randomUUID?.() ??
  `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const days = (count: number) =>
  new Date(Date.now() + count * 86400000).toISOString();

export const MOCK_OPS_KEY = "tradeintra-mock-ops-v1";
export const MOCK_PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: 0,
    limits: { sites: 1, domains: 0, storageMb: 100, aiCredits: 0 },
    features: [
      "One published site",
      "One free subdomain",
      "Core modules",
      "Tradeintra branding",
    ],
  },
  {
    id: "operator" as const,
    name: "Operator",
    price: 29,
    limits: { sites: 5, domains: 2, storageMb: 1024, aiCredits: 30 },
    features: [
      "Five sites",
      "Custom domain",
      "Premium modules",
      "Priority support",
    ],
  },
  {
    id: "scale" as const,
    name: "Scale",
    price: 99,
    limits: { sites: 20, domains: 10, storageMb: 5120, aiCredits: 150 },
    features: [
      "Twenty sites",
      "Ten domains",
      "Branding removal",
      "Priority support",
    ],
  },
];

const seedDomains: MockDomain[] = [
  {
    id: "dom-aurora",
    name: "aurora-markets.com",
    mode: "purchased",
    status: "active",
    registrationPrice: 12.5,
    renewalPrice: 14,
    currency: "USD",
    premium: false,
    autoRenew: true,
    expiresAt: days(320),
    dnsVerified: true,
    ssl: "active",
    createdAt: days(-400),
  },
  {
    id: "dom-nova",
    name: "nova-operator.example",
    mode: "connected",
    status: "dns_pending",
    registrationPrice: 0,
    renewalPrice: 0,
    currency: "USD",
    premium: false,
    autoRenew: false,
    expiresAt: days(180),
    dnsVerified: false,
    ssl: "pending",
    createdAt: days(-2),
  },
];

const seedTickets: MockTicket[] = [
  {
    id: "ticket-1",
    subject: "Custom domain verification",
    category: "domain",
    status: "waiting",
    createdAt: days(-1),
    messages: [
      {
        author: "customer",
        body: "My domain is attached but DNS still shows pending.",
        at: days(-1),
      },
      {
        author: "support",
        body: "The mock DNS check is queued. Use Verify to advance the development fixture.",
        at: days(-1),
      },
    ],
  },
];

const seedBots: MockBot[] = [
  {
    id: "bot-1",
    name: "Volatility breakout",
    xml: '<xml><strategy name="breakout" /></xml>',
    compatibility: "standard-dbot",
    status: "validated",
    createdAt: days(-3),
  },
];

const seedListings: MockListing[] = [
  {
    id: "listing-1",
    title: "Range reversal starter",
    kind: "bot",
    price: 19,
    seller: "Aurora Labs",
    status: "live",
  },
  {
    id: "listing-2",
    title: "Operator risk checklist",
    kind: "pdf",
    price: 9,
    seller: "Tradeintra",
    status: "live",
  },
];

const seedEarnings: MockEarning[] = [
  {
    id: "earn-1",
    source: "markup",
    amount: 42.18,
    status: "available",
    note: "Deriv app markup · mock",
    createdAt: days(-2),
  },
  {
    id: "earn-2",
    source: "domain",
    amount: 1.88,
    status: "pending",
    note: "Domain markup · mock",
    createdAt: days(-1),
  },
  {
    id: "earn-3",
    source: "marketplace",
    amount: 12.6,
    status: "available",
    note: "Marketplace sale · mock",
    createdAt: days(-4),
  },
];

const seedJobs: MockJob[] = [
  {
    id: "job-1",
    type: "renewal",
    status: "queued",
    attempts: 0,
    runAfter: now(),
    createdAt: days(-0.1),
  },
  {
    id: "job-2",
    type: "email",
    status: "succeeded",
    attempts: 1,
    runAfter: now(),
    createdAt: days(-1),
    note: "Verification email fixture",
  },
];

export function initialMockState(): MockState {
  return {
    domains: seedDomains,
    orders: [],
    planId: "operator",
    subscription: "active",
    cancelAtPeriodEnd: false,
    renewsAt: days(24),
    credits: 40,
    creditLedger: [
      { id: "credit-1", delta: 40, reason: "Development grant", at: days(-10) },
    ],
    tickets: seedTickets,
    bots: seedBots,
    signals: [],
    listings: seedListings,
    earnings: seedEarnings,
    payouts: [],
    announcements: [],
    emails: [],
    jobs: seedJobs,
    hostMappings: [],
    assets: [],
    backups: [],
    audit: [
      {
        id: "audit-1",
        action: "mock.seed",
        detail: "Development fixtures loaded",
        at: days(-10),
      },
    ],
    emailVerified: false,
    twoFactorEnabled: false,
    domainMarkupPercent: 15,
    deletionRequestedAt: null,
  };
}

const ARRAY_FIELDS = [
  "domains",
  "orders",
  "creditLedger",
  "tickets",
  "bots",
  "signals",
  "listings",
  "earnings",
  "payouts",
  "announcements",
  "emails",
  "jobs",
  "hostMappings",
  "assets",
  "backups",
  "audit",
] as const;

export function readMockState(raw: string | null): MockState {
  const base = initialMockState();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<MockState> | null;
    if (!parsed || typeof parsed !== "object") return base;
    const merged = { ...base, ...parsed } as MockState;
    for (const key of ARRAY_FIELDS) {
      if (!Array.isArray(merged[key])) {
        (merged as unknown as Record<string, unknown>)[key] = base[key];
      }
    }
    return merged;
  } catch {
    return base;
  }
}

function audit(state: MockState, action: string, detail: string): MockAudit[] {
  return [{ id: id(), action, detail, at: now() }, ...state.audit].slice(
    0,
    100,
  );
}

function domainPrice(domain: string) {
  return domain.endsWith(".io") ||
    domain.includes("bank") ||
    domain.includes("capital")
    ? 89
    : domain.endsWith(".site")
      ? 9.5
      : 12.5;
}

export function normalizeMockHostname(value: string): string | null {
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
  if (
    !/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(
      host,
    )
  )
    return null;
  return host;
}

export function searchDomains(
  query: string,
  owned: string[] = [],
): {
  name: string;
  available: boolean;
  registrationPrice: number;
  renewalPrice: number;
  premium: boolean;
}[] {
  const clean = query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "");
  if (!clean) return [];
  const base = clean.includes(".") ? clean : `${clean}.com`;
  const taken = new Set([
    "aurora-markets.com",
    "nova-operator.example",
    "deriv.com",
    "tradeintra.com",
    ...owned,
  ]);
  const premium =
    base.endsWith(".io") || base.includes("bank") || base.includes("capital");
  const baseName = base.replace(/\.[^.]+$/, "");
  const alternative = base.endsWith(".site")
    ? `${baseName}.com`
    : `${baseName}.site`;
  const result = (
    name: string,
    available: boolean,
    price: number,
    renewal: number,
    isPremium = false,
  ) => ({
    name,
    available,
    registrationPrice: price,
    renewalPrice: renewal,
    premium: isPremium,
  });
  return [
    result(
      base,
      !taken.has(base),
      domainPrice(base),
      premium ? 99 : 14,
      premium,
    ),
    result(alternative, !taken.has(alternative), domainPrice(alternative), 11),
  ];
}

export function quoteDomain(
  state: MockState,
  domain: string,
  years: number,
  provider: "namecheap-mock" | "manual" = "namecheap-mock",
): MockState {
  if (state.domains.some((existing) => existing.name === domain)) return state;
  const price = domainPrice(domain) * Math.max(1, years);
  const order: MockDomainOrder = {
    id: id(),
    domain,
    years,
    quotedPrice: price,
    finalPrice: price,
    status: "quoted",
    provider,
    createdAt: now(),
  };
  return {
    ...state,
    orders: [order, ...state.orders],
    audit: audit(state, "domain.quote", domain),
  };
}

export function buyDomain(
  state: MockState,
  domain: string,
  years = 1,
  siteId?: string,
): MockState {
  if (state.domains.some((existing) => existing.name === domain)) return state;
  const price = domainPrice(domain) * Math.max(1, years);
  const order: MockDomainOrder = {
    id: id(),
    domain,
    years,
    quotedPrice: price,
    finalPrice: price,
    status: "succeeded",
    provider: "namecheap-mock",
    createdAt: now(),
  };
  const record: MockDomain = {
    id: id(),
    name: domain,
    mode: "purchased",
    status: "dns_pending",
    registrationPrice: price,
    renewalPrice: price / Math.max(1, years),
    currency: "USD",
    premium: domain.endsWith(".io"),
    autoRenew: true,
    expiresAt: days(365 * years),
    siteId,
    dnsVerified: false,
    ssl: "pending",
    createdAt: now(),
  };
  return {
    ...state,
    domains: [record, ...state.domains],
    orders: [order, ...state.orders],
    earnings: [
      {
        id: id(),
        source: "domain",
        amount: +(price * 0.15).toFixed(2),
        status: "pending",
        note: `Markup · ${domain}`,
        createdAt: now(),
      },
      ...state.earnings,
    ],
    audit: audit(state, "domain.buy", domain),
  };
}

export function connectDomain(
  state: MockState,
  domain: string,
  siteId?: string,
): MockState {
  const record: MockDomain = {
    id: id(),
    name: domain,
    mode: "connected",
    status: "dns_pending",
    registrationPrice: 0,
    renewalPrice: 0,
    currency: "USD",
    premium: false,
    autoRenew: false,
    expiresAt: days(365),
    siteId,
    dnsVerified: false,
    ssl: "pending",
    createdAt: now(),
  };
  return {
    ...state,
    domains: [record, ...state.domains],
    audit: audit(state, "domain.connect", domain),
  };
}

export function advanceDomain(state: MockState, domainId: string): MockState {
  return {
    ...state,
    domains: state.domains.map((d) => {
      if (d.id !== domainId) return d;
      if (d.status === "dns_pending")
        return {
          ...d,
          status: "ssl_pending",
          dnsVerified: true,
          ssl: "issued",
        };
      if (d.status === "ssl_pending")
        return { ...d, status: "active", dnsVerified: true, ssl: "active" };
      return d;
    }),
    audit: audit(state, "domain.advance", domainId),
  };
}

export function renewDomain(state: MockState, domainId: string): MockState {
  return {
    ...state,
    domains: state.domains.map((d) =>
      d.id === domainId
        ? {
            ...d,
            expiresAt: new Date(
              new Date(d.expiresAt).getTime() + 365 * 86400000,
            ).toISOString(),
            status: "active",
          }
        : d,
    ),
    audit: audit(state, "domain.renew", domainId),
  };
}

export function removeDomain(state: MockState, domainId: string): MockState {
  return {
    ...state,
    domains: state.domains.filter((d) => d.id !== domainId),
    audit: audit(state, "domain.remove", domainId),
  };
}

export function setAutoRenew(
  state: MockState,
  domainId: string,
  autoRenew: boolean,
): MockState {
  return {
    ...state,
    domains: state.domains.map((d) =>
      d.id === domainId ? { ...d, autoRenew } : d,
    ),
  };
}

export function changePlan(state: MockState, planId: MockPlanId): MockState {
  return {
    ...state,
    planId,
    subscription: "active",
    cancelAtPeriodEnd: false,
    audit: audit(state, "billing.plan", planId),
  };
}

export function cancelSubscription(state: MockState): MockState {
  return {
    ...state,
    cancelAtPeriodEnd: true,
    audit: audit(state, "billing.cancel", "Cancels at period end"),
  };
}

export function resumeSubscription(state: MockState): MockState {
  return {
    ...state,
    cancelAtPeriodEnd: false,
    subscription: "active",
    audit: audit(state, "billing.resume", "Subscription resumed"),
  };
}

export function buyCredits(
  state: MockState,
  amount: number,
  price: number,
): MockState {
  return {
    ...state,
    credits: state.credits + amount,
    creditLedger: [
      { id: id(), delta: amount, reason: `Credit pack · $${price}`, at: now() },
      ...state.creditLedger,
    ],
    audit: audit(state, "billing.credits", `+${amount}`),
  };
}

export function spendCredits(
  state: MockState,
  amount: number,
  reason: string,
): MockState {
  if (state.credits < amount) return state;
  return {
    ...state,
    credits: state.credits - amount,
    creditLedger: [
      { id: id(), delta: -amount, reason, at: now() },
      ...state.creditLedger,
    ],
  };
}

export function createTicket(
  state: MockState,
  subject: string,
  category: MockTicket["category"],
  body: string,
): MockState {
  const ticket: MockTicket = {
    id: id(),
    subject,
    category,
    status: "open",
    createdAt: now(),
    messages: [{ author: "customer", body, at: now() }],
  };
  return {
    ...state,
    tickets: [ticket, ...state.tickets],
    audit: audit(state, "support.create", subject),
  };
}

export function replyTicket(
  state: MockState,
  ticketId: string,
  body: string,
): MockState {
  return {
    ...state,
    tickets: state.tickets.map((t) =>
      t.id === ticketId && t.status !== "closed"
        ? {
            ...t,
            status: "waiting",
            messages: [...t.messages, { author: "support", body, at: now() }],
          }
        : t,
    ),
  };
}

export function closeTicket(state: MockState, ticketId: string): MockState {
  return {
    ...state,
    tickets: state.tickets.map((t) =>
      t.id === ticketId ? { ...t, status: "closed" } : t,
    ),
  };
}

export function createBot(
  state: MockState,
  name: string,
  xml: string,
): MockState {
  const bot: MockBot = {
    id: id(),
    name,
    xml,
    compatibility: xml.includes("tradeintra")
      ? "tradeintra-only"
      : "standard-dbot",
    status: "draft",
    createdAt: now(),
  };
  return {
    ...state,
    bots: [bot, ...state.bots],
    audit: audit(state, "bot.create", name),
  };
}

export function validateBot(state: MockState, botId: string): MockState {
  return {
    ...state,
    bots: state.bots.map((b) => {
      if (b.id !== botId) return b;
      const valid = b.xml.includes("<xml") && b.xml.includes("strategy");
      return { ...b, status: valid ? "validated" : "failed" };
    }),
    audit: audit(state, "bot.validate", botId),
  };
}

export function assignBot(
  state: MockState,
  botId: string,
  siteId: string,
): MockState {
  return {
    ...state,
    bots: state.bots.map((b) =>
      b.id === botId ? { ...b, status: "assigned", siteId } : b,
    ),
    audit: audit(state, "bot.assign", botId),
  };
}

export function createSignal(
  state: MockState,
  name: string,
  interval: string,
  telegram: string,
): MockState {
  const signal: MockSignal = {
    id: id(),
    name,
    interval,
    telegram,
    status: "trial",
    trialEndsAt: days(1),
    price: 8.99,
    deliveries: [],
  };
  return {
    ...state,
    signals: [signal, ...state.signals],
    audit: audit(state, "signal.create", name),
  };
}

export function setSignalStatus(
  state: MockState,
  signalId: string,
  status: MockSignal["status"],
): MockState {
  return {
    ...state,
    signals: state.signals.map((s) =>
      s.id === signalId ? { ...s, status } : s,
    ),
  };
}

export function deliverSignal(state: MockState, signalId: string): MockState {
  return {
    ...state,
    signals: state.signals.map((s) =>
      s.id === signalId && ["trial", "active", "paused"].includes(s.status)
        ? {
            ...s,
            deliveries: [
              {
                at: now(),
                status: "sent",
                message: `${s.name} · ${s.interval} · mock signal`,
              },
              ...s.deliveries,
            ],
          }
        : s,
    ),
    audit: audit(state, "signal.deliver", signalId),
  };
}

export function createListing(
  state: MockState,
  title: string,
  kind: MockListing["kind"],
  price: number,
): MockState {
  const safeTitle = title.trim();
  if (!safeTitle) return state;
  const listing: MockListing = {
    id: id(),
    title: safeTitle,
    kind,
    price: Number.isFinite(price) ? Math.max(0, price) : 0,
    seller: "My workspace",
    status: "live",
  };
  return {
    ...state,
    listings: [listing, ...state.listings],
    audit: audit(state, "marketplace.list", title),
  };
}

export function buyListing(state: MockState, listingId: string): MockState {
  const listing = state.listings.find((l) => l.id === listingId);
  if (!listing) return state;
  return {
    ...state,
    listings: state.listings.map((l) =>
      l.id === listingId ? { ...l, status: "sold" } : l,
    ),
    earnings: [
      {
        id: id(),
        source: "marketplace",
        amount: +(listing.price * 0.85).toFixed(2),
        status: "pending",
        note: `Sale · ${listing.title}`,
        createdAt: now(),
      },
      ...state.earnings,
    ],
    audit: audit(state, "marketplace.buy", listing.title),
  };
}

export function requestPayout(
  state: MockState,
  amount: number,
  method: MockPayout["method"],
): MockState {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  if (safeAmount <= 0) return state;
  const payout: MockPayout = {
    id: id(),
    amount: safeAmount,
    method,
    status: "requested",
    createdAt: now(),
  };
  return {
    ...state,
    payouts: [payout, ...state.payouts],
    audit: audit(state, "earnings.payout", `${method} ${amount}`),
  };
}

export function createAnnouncement(
  state: MockState,
  title: string,
  body: string,
  target: string,
): MockState {
  const announcement: MockAnnouncement = {
    id: id(),
    title,
    body,
    target,
    status: "draft",
    createdAt: now(),
  };
  return {
    ...state,
    announcements: [announcement, ...state.announcements],
    audit: audit(state, "announcement.create", title),
  };
}

export function publishAnnouncement(
  state: MockState,
  announcementId: string,
): MockState {
  return {
    ...state,
    announcements: state.announcements.map((a) =>
      a.id === announcementId ? { ...a, status: "published" } : a,
    ),
  };
}

export function sendEmail(
  state: MockState,
  email: Omit<MockEmail, "id" | "createdAt">,
): MockState {
  return {
    ...state,
    emails: [{ ...email, id: id(), createdAt: now() }, ...state.emails],
    jobs: [
      {
        id: id(),
        type: "email",
        status: "succeeded",
        attempts: 1,
        runAfter: now(),
        createdAt: now(),
        note: email.subject,
      },
      ...state.jobs,
    ],
  };
}

export function verifyEmail(state: MockState): MockState {
  return {
    ...state,
    emailVerified: true,
    audit: audit(state, "auth.email.verify", "Mock verification completed"),
  };
}

export function toggleTwoFactor(state: MockState): MockState {
  return {
    ...state,
    twoFactorEnabled: !state.twoFactorEnabled,
    audit: audit(
      state,
      "auth.2fa",
      state.twoFactorEnabled ? "disabled" : "enabled",
    ),
  };
}

export function requestDeletion(state: MockState): MockState {
  return {
    ...state,
    deletionRequestedAt: now(),
    audit: audit(state, "account.deletion.request", "30-day grace period"),
  };
}

export function cancelDeletion(state: MockState): MockState {
  return {
    ...state,
    deletionRequestedAt: null,
    audit: audit(state, "account.deletion.cancel", "Deletion cancelled"),
  };
}

export function addHostMapping(
  state: MockState,
  hostname: string,
  siteId: string,
): MockState {
  const mapping: MockHostMapping = {
    id: id(),
    hostname,
    siteId,
    status: "active",
    createdAt: now(),
  };
  return {
    ...state,
    hostMappings: [mapping, ...state.hostMappings],
    audit: audit(state, "host.activate", hostname),
  };
}

export function setHostStatus(
  state: MockState,
  mappingId: string,
  status: MockHostMapping["status"],
): MockState {
  return {
    ...state,
    hostMappings: state.hostMappings.map((m) =>
      m.id === mappingId ? { ...m, status } : m,
    ),
  };
}

export function enqueueJob(state: MockState, type: MockJob["type"]): MockState {
  return {
    ...state,
    jobs: [
      {
        id: id(),
        type,
        status: "queued",
        attempts: 0,
        runAfter: now(),
        createdAt: now(),
      },
      ...state.jobs,
    ],
  };
}

export function runJobs(state: MockState): MockState {
  let processed = 0;
  const jobs = state.jobs.map((job) => {
    if (job.status !== "queued" || processed >= 3) return job;
    processed += 1;
    return {
      ...job,
      status: "succeeded" as const,
      attempts: job.attempts + 1,
      note: "Mock cron tick",
    };
  });
  return {
    ...state,
    jobs,
    audit: audit(state, "jobs.tick", `${processed} job(s) processed`),
  };
}

export function addAsset(
  state: MockState,
  name: string,
  size: number,
  type: string,
): MockState {
  return {
    ...state,
    assets: [{ id: id(), name, size, type, at: now() }, ...state.assets],
    audit: audit(state, "storage.upload", name),
  };
}

export function createBackup(state: MockState): MockState {
  return {
    ...state,
    backups: [
      { id: id(), at: now(), note: "Mock database + storage snapshot" },
      ...state.backups,
    ],
    audit: audit(state, "backup.create", "Mock snapshot"),
  };
}

export function restoreBackup(state: MockState, backupId: string): MockState {
  return {
    ...state,
    audit: audit(state, "backup.restore", backupId),
  };
}

export function setDomainMarkup(state: MockState, percent: number): MockState {
  return {
    ...state,
    domainMarkupPercent: Math.max(0, Math.min(100, percent)),
    audit: audit(state, "admin.markup", `${percent}%`),
  };
}

export function availableCredits(state: MockState) {
  return state.earnings
    .filter((e) => e.status === "available")
    .reduce((sum, e) => sum + e.amount, 0);
}

export function isMockOpsEnabled(env: {
  NODE_ENV?: string;
  NEXT_PUBLIC_MOCK_OPS?: string;
}) {
  return env.NODE_ENV !== "production" || env.NEXT_PUBLIC_MOCK_OPS === "true";
}

export function mockOpsEnabled() {
  return isMockOpsEnabled({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_MOCK_OPS: process.env.NEXT_PUBLIC_MOCK_OPS,
  });
}
