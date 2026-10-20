# ADR 0004: Template + Brand Kit + Modules (No Free-Form Builder)

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

The owner wants a ready-made Deriv trading site that customers can brand and configure, not a blank-canvas drag-and-drop website builder. Customers still need meaningful customization and reusable features.

## Decision

Launch with:

- one polished Deriv trading template;
- a brand kit (logo, favicon, colours, typography, copy, links, risk disclaimer);
- a versioned module registry (auth, dashboard, records, forms, search, uploads, notifications, reports, themes, trading-specific modules);
- preview, publish, and rollback.

No arbitrary HTML/JavaScript/server code in curated sites. No free-form drag-and-drop page builder in the first release.

## Alternatives

- Full visual page builder: more flexibility, much higher complexity and abuse surface.
- Fixed site with no customization: too limited for branding.
- AI-only site generation: less predictable, harder to support.

## Consequences

- Faster, safer MVP with a consistent quality bar.
- Customers can brand and configure without breaking layout or security.
- Template/module versioning is required.
- Less layout freedom than a general builder.

## Security/privacy implications

- Configuration is structured JSON, validated against schemas.
- Required risk disclosures cannot be removed.
- Uploads are scanned and tenant-scoped.
- Modules cannot bypass entitlements or tenant isolation.

## Revisit trigger

Customer research shows a strong need for layout flexibility; add approved layout presets or a constrained builder later.
