export type ModuleKey =
  | "announcement"
  | "header"
  | "ticker"
  | "hero"
  | "trust"
  | "cta"
  | "testimonials"
  | "stats"
  | "chart"
  | "watchlist"
  | "about"
  | "faq"
  | "risk"
  | "footer"
  | "trade"
  | "features"
  | "workspace"
  | "strategies"
  | "steps"
  | "access"
  | "markets"
  | "terminal";

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};
export type Stat = { value: string; label: string; note?: string };
export type Faq = { question: string; answer: string };
export type Feature = { title: string; description: string };
export type Step = { title: string; description: string };
export type ModuleContent = {
  announcement: {
    text: string;
    linkLabel: string;
    linkHref: string;
  };
  ticker: string[];
  testimonials: Testimonial[];
  stats: Stat[];
  faq: Faq[];
  features: Feature[];
  steps: Step[];
  trade: { label: string; href: string };
  about: { text: string };
};

export const MODULE_DEFINITIONS: {
  key: ModuleKey;
  name: string;
  category: "Landing" | "Trust" | "Markets" | "Platform" | "Legal";
  description: string;
}[] = [
  {
    key: "announcement",
    name: "Top message",
    category: "Landing",
    description: "A short message at the very top of the page.",
  },
  {
    key: "header",
    name: "Logo and menu",
    category: "Landing",
    description: "Your logo, site name, and simple navigation.",
  },
  {
    key: "ticker",
    name: "Moving labels",
    category: "Markets",
    description: "A scrolling strip of short market or brand labels.",
  },
  {
    key: "hero",
    name: "Main banner",
    category: "Landing",
    description: "The big title, short sentence, and main buttons.",
  },
  {
    key: "trust",
    name: "Trust labels",
    category: "Trust",
    description: "Small factual labels that build confidence.",
  },
  {
    key: "cta",
    name: "Call-to-action",
    category: "Landing",
    description: "A clear invitation to open the demo.",
  },
  {
    key: "testimonials",
    name: "Quotes",
    category: "Trust",
    description: "Real quotes, names, and roles you have permission to use.",
  },
  {
    key: "stats",
    name: "Numbers",
    category: "Trust",
    description: "A few simple facts or figures.",
  },
  {
    key: "chart",
    name: "Chart",
    category: "Markets",
    description: "An illustrative chart surface. No performance claim.",
  },
  {
    key: "watchlist",
    name: "Market list",
    category: "Markets",
    description: "A compact list of markets or instruments.",
  },
  {
    key: "about",
    name: "About",
    category: "Platform",
    description: "A short paragraph about the site.",
  },
  {
    key: "faq",
    name: "Common questions",
    category: "Platform",
    description: "Operator-entered questions and answers.",
  },
  {
    key: "risk",
    name: "Risk warning",
    category: "Legal",
    description: "Required trading-risk language.",
  },
  {
    key: "footer",
    name: "Footer",
    category: "Legal",
    description: "Brand, legal links, and Deriv disclosure.",
  },
  {
    key: "trade",
    name: "Trading button",
    category: "Platform",
    description: "The button that opens the demo workspace.",
  },
  {
    key: "features",
    name: "Feature cards",
    category: "Platform",
    description: "Four operator-entered product capabilities.",
  },
  {
    key: "workspace",
    name: "Product preview",
    category: "Platform",
    description: "A look at the chart, markets, and trading screen.",
  },
  {
    key: "strategies",
    name: "Strategy presets",
    category: "Platform",
    description: "Ready-made Deriv strategies with risk labels.",
  },
  {
    key: "steps",
    name: "Steps",
    category: "Landing",
    description: "Three operator-entered onboarding steps.",
  },
  {
    key: "access",
    name: "Pricing and access",
    category: "Trust",
    description: "How access works and what it costs.",
  },
];

export const DEFAULT_MODULES: ModuleKey[] = [
  "announcement",
  "header",
  "ticker",
  "hero",
  "trust",
  "features",
  "workspace",
  "strategies",
  "steps",
  "stats",
  "testimonials",
  "access",
  "cta",
  "about",
  "faq",
  "trade",
  "footer",
  "risk",
];

export const defaultModuleContent: ModuleContent = {
  announcement: {
    text: "A focused studio for the brand behind your market presence.",
    linkLabel: "See the story",
    linkHref: "#about",
  },
  ticker: [
    "VOL 10",
    "VOL 25",
    "VOL 50",
    "VOL 75",
    "VOL 100",
    "VOL 100 (1S)",
    "BULL MARKET",
    "BEAR MARKET",
  ],
  testimonials: [],
  stats: [],
  faq: [
    {
      question: "Is this a live trading site?",
      answer:
        "No. This is a demo-only brand site. No real orders, deposits, or withdrawals are enabled.",
    },
    {
      question: "Who is it for?",
      answer:
        "Independent operators who want a clear, branded market surface before connecting approved infrastructure.",
    },
    {
      question: "What happens when I open trading?",
      answer:
        "The shared demo workspace opens with simulated prices and a demo balance. Nothing is sent to Deriv.",
    },
    {
      question: "Is Tradeintra a broker?",
      answer:
        "No. Tradeintra does not execute trades, hold funds, or provide investment advice.",
    },
  ],
  features: [
    {
      title: "Market workspace",
      description:
        "Chart, watchlist, and order ticket in one calm simulated surface.",
    },
    {
      title: "Deriv preset library",
      description:
        "Review MIT-licensed DBot starting points before anything runs.",
    },
    {
      title: "Risk controls",
      description:
        "Stake, stop-loss, and session limits stay visible around the demo.",
    },
    {
      title: "Your brand",
      description:
        "One active site with your name, accent, theme, and launch link.",
    },
  ],
  steps: [
    {
      title: "Brand it",
      description: "Choose the name, accent, theme, and the modules you need.",
    },
    {
      title: "Review the demo",
      description:
        "Open the shared workspace with simulated prices and demo balance.",
    },
    {
      title: "Prepare launch",
      description:
        "Publish a versioned snapshot. Live trading waits for the legal and Deriv gates.",
    },
  ],
  trade: {
    label: "Open demo trading",
    href: "/trade",
  },
  about: {
    text: "An independent operator site. Trading happens on Deriv, in the visitor’s own account.",
  },
};

const ALIASES: Partial<Record<string, ModuleKey>> = Object.freeze({
  markets: "watchlist",
  terminal: "chart",
});
const ALLOWED = new Set(MODULE_DEFINITIONS.map((module) => module.key));

export function isModuleKey(value: string): value is ModuleKey {
  return (
    ALLOWED.has(value as ModuleKey) ||
    (Object.hasOwn(ALIASES, value) && !!ALIASES[value])
  );
}

export function normalizeModules(value: unknown): ModuleKey[] {
  if (!Array.isArray(value)) return [...DEFAULT_MODULES];
  const normalized: ModuleKey[] = [];
  const hadLegacy = value.some((item) =>
    ["markets", "terminal"].includes(String(item)),
  );
  for (const item of value) {
    const raw = String(item);
    const key = Object.hasOwn(ALIASES, raw) ? (ALIASES[raw] as ModuleKey) : raw;
    if (ALLOWED.has(key as ModuleKey) && !normalized.includes(key as ModuleKey))
      normalized.push(key as ModuleKey);
  }
  if (!normalized.length) return [...DEFAULT_MODULES];
  if (hadLegacy) {
    if (!normalized.includes("header")) normalized.unshift("header");
    if (!normalized.includes("hero")) normalized.splice(1, 0, "hero");
    if (!normalized.includes("footer")) normalized.push("footer");
  }
  return [...normalized.filter((key) => key !== "risk"), "risk" as ModuleKey];
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function safeHref(value: unknown, max: number) {
  const href = text(value, max).trim();
  if (!href) return "";
  if (href.startsWith("#")) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    return new URL(href).protocol === "https:" ? href : "";
  } catch {
    return "";
  }
}

export function normalizeModuleContent(value: unknown): ModuleContent {
  const input = value && typeof value === "object" ? value : {};
  const data = input as Record<string, unknown>;
  const announcement =
    data.announcement && typeof data.announcement === "object"
      ? (data.announcement as Record<string, unknown>)
      : {};
  const trade =
    data.trade && typeof data.trade === "object"
      ? (data.trade as Record<string, unknown>)
      : {};
  const about =
    data.about && typeof data.about === "object"
      ? (data.about as Record<string, unknown>)
      : {};
  return {
    announcement: {
      text:
        typeof announcement.text === "string"
          ? text(announcement.text, 180)
          : defaultModuleContent.announcement.text,
      linkLabel:
        typeof announcement.linkLabel === "string"
          ? text(announcement.linkLabel, 40)
          : defaultModuleContent.announcement.linkLabel,
      linkHref:
        typeof announcement.linkHref === "string"
          ? safeHref(announcement.linkHref, 200)
          : defaultModuleContent.announcement.linkHref,
    },
    ticker: Array.isArray(data.ticker)
      ? data.ticker
          .map((item) => text(item, 40).trim())
          .filter(
            (item, index, items) =>
              Boolean(item) && items.indexOf(item) === index,
          )
          .slice(0, 12)
      : [...defaultModuleContent.ticker],
    testimonials: Array.isArray(data.testimonials)
      ? data.testimonials
          .map((item) => {
            const row = (
              item && typeof item === "object" ? item : {}
            ) as Record<string, unknown>;
            return {
              quote: text(row.quote, 400).trim(),
              name: text(row.name, 80).trim(),
              role: text(row.role, 80).trim(),
            };
          })
          .filter((item) => item.quote && item.name)
          .slice(0, 12)
      : [],
    stats: Array.isArray(data.stats)
      ? data.stats
          .map((item) => {
            const row = (
              item && typeof item === "object" ? item : {}
            ) as Record<string, unknown>;
            return {
              value: text(row.value, 30).trim(),
              label: text(row.label, 60).trim(),
              note: text(row.note, 100).trim() || undefined,
            };
          })
          .filter((item) => item.value && item.label)
          .slice(0, 8)
      : [],
    faq: Array.isArray(data.faq)
      ? data.faq
          .map((item) => {
            const row = (
              item && typeof item === "object" ? item : {}
            ) as Record<string, unknown>;
            return {
              question: text(row.question, 180).trim(),
              answer: text(row.answer, 800).trim(),
            };
          })
          .filter((item) => item.question && item.answer)
          .slice(0, 12)
      : [],
    features: Array.isArray(data.features)
      ? data.features
          .map((item) => {
            const row = (
              item && typeof item === "object" ? item : {}
            ) as Record<string, unknown>;
            return {
              title: text(row.title, 60).trim(),
              description: text(row.description, 180).trim(),
            };
          })
          .filter((item) => item.title && item.description)
          .slice(0, 6)
      : defaultModuleContent.features.map((item) => ({ ...item })),
    steps: Array.isArray(data.steps)
      ? data.steps
          .map((item) => {
            const row = (
              item && typeof item === "object" ? item : {}
            ) as Record<string, unknown>;
            return {
              title: text(row.title, 60).trim(),
              description: text(row.description, 180).trim(),
            };
          })
          .filter((item) => item.title && item.description)
          .slice(0, 5)
      : defaultModuleContent.steps.map((item) => ({ ...item })),
    trade: {
      label:
        typeof trade.label === "string"
          ? text(trade.label, 40)
          : defaultModuleContent.trade.label,
      href: safeHref(trade.href, 200) || defaultModuleContent.trade.href,
    },
    about: {
      text:
        typeof about.text === "string"
          ? text(about.text, 800)
          : defaultModuleContent.about.text,
    },
  };
}

export function validateModuleContent(content: ModuleContent) {
  if (content.testimonials.some((item) => item.quote.length > 400))
    return "Testimonials must be under 400 characters.";
  if (content.stats.some((item) => item.value.length > 30))
    return "Stat values must be under 30 characters.";
  if (content.faq.some((item) => item.answer.length > 800))
    return "FAQ answers must be under 800 characters.";
  if (content.features.some((item) => item.description.length > 180))
    return "Feature descriptions must be under 180 characters.";
  if (content.steps.some((item) => item.description.length > 180))
    return "Step descriptions must be under 180 characters.";
  return null;
}
