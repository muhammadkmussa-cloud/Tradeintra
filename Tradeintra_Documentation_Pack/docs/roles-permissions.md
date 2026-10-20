# Roles and Permissions

## Principles

- Deny by default.
- Enforce permissions on the backend for every protected operation.
- Do not rely on hidden buttons or client-side route guards.
- Scope every request to the authenticated account and resource.
- Treat subdomains as routing, not security.
- Audit privileged actions.

## Roles

| Role | Purpose | Default access |
|---|---|---|
| Visitor | Unauthenticated | Marketing, pricing, legal pages, sign-in/register |
| User | Customer/operator | Own sites, bots, domains, publishes, billing |
| Support | Customer support | Read limited account/site data; manage tickets; no secrets |
| Finance | Payment/domain reconciliation | Read transactions; create pending finance requests; no payout execution |
| Super Admin | Platform owner | Plans, markup, templates, modules, users, audit |
| Service | Internal job/worker identity | Only the resource/job it owns |
| End-user | Visitor to a customer site | Only that site's permitted features |

Do not implement every role until required. Start with User, Support, Super Admin, and Service.

## Ownership model

- Each site, bot, domain order, and publish record belongs to one account.
- Domain ownership is split:
  - Tradeintra controls the registrar account/team;
  - the customer is the registrant contact;
  - transfer-out follows the domain policy.
- A site can be attached to one primary domain and one platform subdomain.
- An account cannot attach another account's domain.

## Permission matrix

| Action | Visitor | User | Support | Finance | Super Admin |
|---|---:|---:|---:|---:|---:|
| View marketing | Yes | Yes | Yes | Yes | Yes |
| Create account | Yes | — | — | — | — |
| Link Deriv (mock/live) | No | Own account | No | No | No |
| Create/edit site | No | Own | No | No | Controlled |
| Publish/rollback | No | Own + entitlement | No | No | Controlled |
| Buy domain | No | Own account | No | No | Controlled |
| Connect domain | No | Own | No | No | Controlled |
| View domain contacts | No | Own | Masked | Billing only | Audited |
| Configure per-TLD markup | No | No | No | No | Yes |
| View publish/release logs | No | Own | Limited | No | Controlled |
| Manage bots | No | Own | No | No | Controlled |
| Create signals | No | Own | No | No | Controlled |
| View commissions | No | Own | Limited | Yes | Yes |
| Execute payout | No | No | No | No | No |
| Manage plans/templates | No | No | No | No | Yes |
| View audit log | No | No | Limited | Limited | Yes |
| Delete account | No | Own, with grace | Assisted | No | Controlled |

“Controlled” means an explicit, audited admin action, not a blanket permission.

## Deriv linking

- One Deriv account per Tradeintra account at launch.
- Linking requires explicit confirmation because it is intended to be permanent.
- Tokens are never displayed after linking.
- Unlink/revoke requires a support/admin process and audit.
- Mock links are visibly labelled and cannot be used for live orders.

## Domain permissions

- Users can search and buy domains for their own account.
- Support can view masked status but not full registrant contact data.
- Finance can view order/payment records for reconciliation.
- Super Admin can configure markup and resolve stuck orders.
- No role can silently transfer a domain between accounts.

## Service identities

- Workers receive short-lived, scoped credentials.
- A worker re-checks ownership and entitlement before sensitive actions.
- Jobs cannot operate on a resource from another tenant.
- Service tokens cannot approve payouts or change pricing.

## MCP scopes (proposed, phase 3)

| Scope | Capability |
|---|---|
| `support` | Read users/sites/tickets/commissions; manage tickets |
| `operations` | Update allowlisted site config; trigger publishes |
| `finance_request` | Create pending finance requests only |
| `marketing` | Draft/send capped campaigns and announcements |
| `admin` | Audited admin writes; still no payout execution |

Every MCP call is authenticated, scoped, rate-limited, and audited.

## Authorization rules

1. Every lookup is scoped by account and resource.
2. Check access on read, create, update, delete, export, logs, billing, publish, and release.
3. Re-check ownership when starting and completing jobs.
4. Do not expose secrets in responses or logs.
5. Audit privileged access.
6. Test cross-tenant access attempts.
7. Define ownership transfer, account closure, collaborator removal, and deletion before implementing them.
