# UI/UX Specification

## 1. Experience areas

1. Public marketing site.
2. Registration, verification, sign-in, recovery, 2FA.
3. Onboarding and Deriv linking (mock first).
4. Dashboard.
5. Template gallery and site creation.
6. Brand kit and module configuration.
7. Preview and publish.
8. Domain search, purchase, connection, DNS/SSL status, renewals.
9. Publish status and history.
10. XML bots, AI Bot Generator, AI Builder.
11. AI Signals and Telegram.
12. Marketplace/bot store (phase).
13. Commissions, earnings, payouts.
14. Announcements, support, settings, admin/Super Admin.

## 2. Navigation

Authenticated sidebar (reference-derived, adapted):

- Overview
- Sites
- Templates
- Domains
- Publish status
- XML Bots
- AI Bot Generator
- AI Builder
- AI Signals
- Marketplace
- Commissions
- Earnings
- Announcements
- Support
- Settings

Top-level actions:

- Create site
- Buy domain
- Connect domain
- Upgrade plan

Admin/Super Admin adds:

- Plans and entitlements
- Per-TLD domain markup
- Templates and modules
- Users and roles
- Support queue
- Audit log

## 3. Dashboard

Must show:

- account status and plan;
- Deriv link status (`Not linked`, `Mock linked`, `Live linked`);
- sites and their status;
- domains and expiry warnings;
- recent publishes;
- usage against limits;
- next action for a new user.

Empty state: “Launch your first Deriv site” with template preview and a short checklist.

## 4. Site creation wizard

Steps:

1. **Template** — preview the Deriv trading template, pages, and modules.
2. **Brand** — logo, favicon, name, colours, typography, hero copy, contact/social, risk disclaimer.
3. **Modules** — enable/configure compatible modules; show dependencies and plan requirements.
4. **Domain** — free subdomain or custom domain; availability/price; connect or buy.
5. **Review** — plan limits, required disclosures, what will be published.
6. **Publish** — status and live URL.

Rules:

- progress is saved as a draft;
- validation is field-level;
- unsaved changes are warned;
- publishing is a distinct action;
- no drag-and-drop page builder in the first release;
- required risk disclosure cannot be removed.

## 5. Brand kit

Controls:

- logo/favicon upload with preview and crop;
- brand name and short description;
- colour tokens with contrast warnings;
- typography preset;
- hero/CTA copy;
- about/contact/social links;
- risk disclaimer (default provided);
- section visibility toggles;
- layout preset.

Show a live preview and a “reset to template default” action with confirmation.

## 6. Domains

### Buy domain

- search input with debounce;
- results table: domain, status, registration, renewal, action;
- “taken” rows show alternatives;
- premium domains show a warning;
- checkout shows registrant contact form, term, price snapshot, renewal price, auto-renew, taxes;
- payment state is explicit;
- order timeline: paid → registering → active → DNS → SSL → live;
- failure shows next action and refund/credit status.

### Connect domain

- enter domain;
- show required records (A/CNAME/nameserver/TXT);
- copy buttons;
- verification status with retry;
- explain propagation delays;
- do not say “live” until verified.

### Domain list

- domain, site, type, status, expiry, auto-renew, actions;
- expiry warnings at 60/30/14/7/1 days;
- renew action;
- transfer-out instructions.

## 7. Publish status

- list of site publish events and control-plane releases;
- status chips: validating, published, failed; release: uploaded, migrating, active, rolled_back;
- hostname, DNS, and SSL status;
- redacted logs;
- rollback to a prior published config or release;
- failure summary and next step.

## 8. Bots and AI

### XML Bots

- upload, validate, scan;
- list with site assignment, version, compatibility label;
- rename/describe/tag;
- delete with confirmation.

### AI Bot Generator

- prompt or video link;
- quick templates;
- market/symbol/trade type/prediction;
- stake, martingale, recovery, TP/SL;
- credits and cost before generating;
- generate → verify → test → save;
- clear “Tradeintra-only” vs “standard DBot” label.

### AI Builder

- prompt, attachments, templates, community remix;
- generated app preview;
- credits balance;
- publish flow;
- isolated app badge.

### AI Signals

- order wizard: strategy, interval, Telegram, template, review;
- trial/paid status;
- delivery logs;
- pause/resume/cancel.

## 9. Commissions and earnings

- separate partner commission and app markup;
- date/site filters;
- totals, pending, paid;
- contract/trader breakdown;
- domain/AI/marketplace/referral categories;
- payout method and status;
- reconciliation note and export.

## 10. Forms

- label every input;
- show required fields;
- validate server-side;
- preserve safe input after errors;
- explain how to fix;
- prevent duplicate submissions;
- show saving status;
- warn before leaving unsaved changes.

## 11. States

Every data-driven page defines:

- initial/loading;
- empty;
- populated;
- validation error;
- API error;
- permission denied;
- offline/connection issue;
- saving;
- success;
- partial failure.

## 12. Responsive targets

Test at minimum:

- 360 px;
- 390 px;
- 768 px;
- 1024 px;
- 1440 px.

Core workflows must work with touch and keyboard.

## 13. Accessibility

- WCAG 2.2 AA target.
- Keyboard-operable controls.
- Visible focus.
- Correct labels and error associations.
- Sufficient contrast, especially yellow CTAs.
- Do not communicate status by colour alone.
- Provide text summaries for charts.
- Respect reduced motion.

## 14. Motion

Use motion to communicate state changes only. Avoid long animations that delay actions.

## 15. Copy rules

- Never claim Tradeintra executes trades.
- Never claim Deriv affiliation or endorsement.
- Never promise profits.
- Label simulated data.
- Label AI-generated content.
- Explain domain ownership and renewal clearly.
