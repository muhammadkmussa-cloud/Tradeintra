# Application Builder and Module System

**Status:** Owner-confirmed direction. This is a **template + brand kit + module configuration** system, not a free-form page builder or arbitrary code editor.

## 1. Product model

Customers launch a ready-made application, not a blank canvas.

```
Template
  + Brand kit
  + Enabled/configured modules
  + Domain choice
  + Publish
= Live application
```

Customers can:

- choose a template;
- upload a logo/favicon;
- set brand name, colours, typography, and copy;
- enable, disable, and configure compatible modules;
- preview;
- choose a free subdomain or custom domain;
- publish;
- update and republish.

Customers cannot:

- drag and drop arbitrary page layouts in the first release;
- inject arbitrary HTML, JavaScript, or server code into curated template sites;
- remove required legal/risk disclosures;
- access another tenant’s configuration or data.

## 2. Template vs module

| Concept | Definition |
|---|---|
| **Template** | A complete starting application design and page structure. |
| **Module** | A reusable capability with configuration, permissions, data rules, and rendering. |

One polished template launches first: a **Deriv trading site**. DBot, SmartTrader, AirRun-style experiences are later templates, after research and the core platform are stable.

## 3. First template: Deriv trading site

Proposed pages and areas:

- landing/hero with brand and risk disclosure;
- markets/watchlist;
- trading terminal (mock mode first);
- bot library / bot detail;
- signals / Telegram subscription;
- pricing/plans;
- about/contact;
- legal: terms, privacy, risk disclosure;
- account/sign-in (Deriv OAuth in live mode);
- optional announcements and marketplace.

The template must work with mock Deriv data and clearly label it.

## 4. Brand kit

Required controls:

- logo and favicon upload;
- brand name and short description;
- primary, secondary, and accent colours;
- typography preset;
- hero headline/subheadline and CTA labels;
- about text and contact details;
- social links;
- risk disclaimer text (with a required default);
- theme preset (light/dark, radius, spacing);
- section visibility toggles for approved sections;
- layout preset (for example, “terminal-first” vs “landing-first”) where supported.

Constraints:

- validate contrast and file type/size;
- no arbitrary CSS/HTML;
- required disclosures cannot be disabled;
- uploads are scanned and served from a controlled asset domain;
- brand assets are tenant-scoped.

## 5. Module catalog (launch priorities)

| Module | Purpose | Launch priority |
|---|---|---|
| Authentication and roles | Sign-in, sessions, roles | P0 |
| Dashboard/navigation | Tenant app shell | P0 |
| Records/CRUD | Tenant-scoped data tables | P0 |
| Forms and validation | Data entry | P0 |
| Search/filter/pagination | List usability | P0 |
| File uploads | Logos, documents, bot files | P0 |
| Notifications | In-app/email events | P1 |
| Reports/analytics | Usage and business metrics | P1 |
| Responsive themes | Mobile/desktop layouts | P0 |
| Deriv account linking | OAuth/PAT, mock first | P0 (mock) |
| Market data | Ticks/symbols, public permitted data | P1 |
| Trading terminal | Proposal/buy/sell, live gated | P2 / gated |
| XML bots | Upload, validate, store, run | P1 |
| AI Bot Generator | Plain-English/video → XML | P3 / bounded jobs |
| Bot store/marketplace | Sell/download bots and digital products | Deferred |
| AI signals/Telegram | Scheduled signal delivery | P3 / deferred |
| Announcements | Tenant site announcements | P1 |
| Billing/entitlements | Plans, credits, domains | P0 |
| Support | Tickets/Telegram/email | P1 |
| Audit log | Sensitive actions | P1 |

Modules are versioned. A site configuration records the module version so that publishing is reproducible.

## 6. Frontend state and interaction

- **Zustand:** draft brand kit, selected modules, wizard step, unsaved-change state, preview toggles.
- **TanStack Query:** server data, mutations, cache invalidation, loading/error states.
- **shadcn/ui + Tailwind:** dashboard and admin components.
- **Framer Motion:** restrained transitions; respect reduced-motion.
- Server state is never duplicated in Zustand as a second source of truth.

## 7. Module contract

Each module defines:

- `key` and display name;
- version and compatibility range;
- configuration JSON Schema;
- required permissions;
- required data tables/collections;
- server-side handlers/APIs;
- UI slots/pages it can render into;
- dependencies on other modules;
- migration behaviour between versions;
- plan entitlement;
- whether it is safe in mock mode;
- whether it is allowed in generated apps.

The platform validates the full site configuration against the template schema and all enabled module schemas before preview or publish.

## 8. Configuration model

Example:

```json
{
  "schema_version": 1,
  "template": "deriv-trading-v1",
  "brand": {
    "name": "Acme Markets",
    "logo_asset_id": "asset_123",
    "colors": { "primary": "#FEDD00", "surface": "#0D000A" },
    "typography": "plus-jakarta-sans",
    "risk_disclaimer": "Trading involves risk..."
  },
  "modules": [
    { "key": "auth", "version": 1, "enabled": true, "config": {} },
    { "key": "market-data", "version": 1, "enabled": true, "config": { "symbols": ["1HZ100V"] } },
    { "key": "bots", "version": 1, "enabled": true, "config": { "allow_uploads": true } }
  ],
  "domain": { "type": "subdomain", "value": "acme" }
}
```

Rules:

- unknown keys are rejected;
- required fields are validated;
- module versions must be compatible with the template;
- configuration cannot contain secrets;
- configuration cannot contain executable code;
- every published version is immutable;
- the current draft can be edited, but publishing creates a new version.

## 9. Preview and publish

### Preview

- Renders the draft configuration.
- Uses mock data unless a safe demo connection is available.
- Shows validation errors and missing prerequisites.
- Is never indexed or presented as live.

### Publish

1. Validate configuration and entitlements.
2. Confirm domain is active and SSL is ready.
3. Create an immutable configuration version.
4. Mark it published.
5. Invalidate tenant caches.
6. Record the publish event.
7. Show the live URL only after verification.

Rollback restores a previous published version; it does not delete history.

## 10. AI Builder boundary

Arbitrary AI-generated applications are **deferred** (`ADR 0014`). Stellar Plus cannot safely run unrestricted generated code or per-customer processes. AI may later assist with **configuration** only, producing validated module/brand settings. It must not generate executable tenant code in v1.

## 11. Extensibility rules

- Add modules without changing existing site configurations.
- Keep module schemas backward-compatible or provide migrations.
- Never silently ignore an unsupported module; show a clear error.
- Never let a module read another tenant’s data.
- Never let a module bypass entitlement checks.
- Keep template and module rendering deterministic from configuration.

## 12. Acceptance criteria

- [ ] Customer selects the Deriv trading template.
- [ ] Customer changes logo, colours, typography, copy, and required disclosures.
- [ ] Customer enables and configures at least three modules.
- [ ] Invalid configuration is rejected with field-level guidance.
- [ ] Preview matches the draft.
- [ ] Publish creates an immutable version and a live site.
- [ ] Rollback restores a prior version.
- [ ] Tenant A cannot see Tenant B’s assets, config, or data.
- [ ] Required risk disclosure cannot be removed.
- [ ] Mock data is visibly labelled.
