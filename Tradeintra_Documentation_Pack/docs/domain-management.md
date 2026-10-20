# Domain and Subdomain Management

**Status:** Owner-confirmed. Namecheap is the registrar. Production API access and IPv4 whitelisting are unconfirmed. Implementation has not started.

## 1. Goals

Customers must be able to:

- publish on a free `slug.tradeintra.com` subdomain;
- check whether a custom domain is available;
- see registration and renewal prices;
- buy a domain inside Tradeintra;
- connect a domain they already own;
- see DNS, SSL, and verification status;
- renew or let a domain expire under a clear policy.

Customers must never need to leave Tradeintra for normal domain management.

## 2. Domain types

| Type               | Example                    | Cost                    | Owner                                 |
| ------------------ | -------------------------- | ----------------------- | ------------------------------------- |
| Platform subdomain | `myshop.tradeintra.com`    | Free plan, fair use     | Tradeintra                            |
| Purchased domain   | `myshop.com`               | Registrar cost + markup | Tradeintra account + customer contact |
| Connected domain   | `myshop.com` already owned | No registration fee     | Customer                              |
| Custom subdomain   | `app.myshop.com`           | Depends on parent       | Customer                              |

## 3. Free subdomains

- Format: `https://<slug>.tradeintra.com`.
- Slug rules: 3–40 characters, lowercase letters, numbers, hyphens; start/end alphanumeric; no consecutive hyphens.
- Reserved names: `www`, `app`, `api`, `admin`, `support`, `billing`, `status`, `docs`, `mail`, `smtp`, `ftp`, `cdn`, `assets`, `static`, `preview`, `staging`, `dev`, `test`, `tradeintra`, `by-host`, and Super Admin-defined names.
- Unique at the database level.
- Free plan: one published application, one subdomain, selected modules, basic branding, Tradeintra branding, fair-use limits.
- Subdomain remains available while the account complies with the terms.
- Abusive/impersonating names can be reclaimed.

## 4. Namecheap API integration

### 4.1 Service boundary

`DomainProvider` interface:

```
search(query) -> DomainQuote[]
price(domain, years) -> Price
purchase(order) -> RegistrarOrder
orderStatus(orderId) -> Status
renew(domain, years) -> RegistrarOrder
transferIn(domain, authCode) -> RegistrarOrder
setNameservers(domain, nameservers) -> Status
setDns(domain, records) -> Status
remove(domain) -> Status
```

Implementations:

- `NamecheapDomainProvider` — sandbox first, production after approval.
- `ManualDomainProvider` — support-assisted fallback.

### 4.2 Namecheap API requirements

- API user, API key, username, and client IP must be configured.
- Production API access requires approval.
- **IPv4 whitelisting is required**; the API does not work reliably from a changing IP.
- Any account-balance or minimum-funding requirement must be confirmed with Namecheap support before launch.
- Use the sandbox environment for development if available.
- Store credentials in cPanel environment variables, never in source or logs.

### 4.3 Search, price, and purchase

1. Customer searches a domain.
2. Tradeintra checks availability through Namecheap.
3. Show registration and renewal prices.
4. Re-check price immediately before purchase.
5. Customer pays.
6. Tradeintra creates the domain through Namecheap.
7. Domain is connected to the customer application.
8. DNS/SSL are verified.
9. Customer sees live status.

### 4.4 Pricing fallback

If the API does not return retail prices:

- Use a Super Admin-managed price table per TLD.
- Store `registration_price`, `renewal_price`, `currency`, and `last_verified_at`.
- Display a clear “price verified at” date.
- Reconcile with the actual Namecheap charge.
- If the final charge differs, require customer confirmation before registering.

## 5. Markup

- Base price = Namecheap registration/renewal cost.
- Default markup = **15%**, configurable per TLD by Super Admin.
- Show registration and renewal separately.
- Store a price snapshot with every order.
- Do not let customers configure the retail markup.
- Registrar fees are generally non-refundable after success.
- Refund or credit if Tradeintra fails to deliver a paid registration.

## 6. Registrant ownership

Tradeintra’s Namecheap account holds the registration; the customer supplies the registrant contact.

Terms must define:

- registrant/account holder;
- transfer-out process;
- renewal responsibility;
- account closure/non-payment;
- disputes, trademark claims, and abuse;
- that registration does not create trademark rights.

Recommended default: Tradeintra account holder + customer registrant contact; transfer-out allowed after the ICANN 60-day lock and payment of outstanding fees. Legal review required.

## 7. DNS and SSL

### 7.1 Purchased through Namecheap

- Use Namecheap DNS or cPanel DNS.
- Attach the domain as an addon domain in cPanel.
- Point its document root to the shared runtime.
- Issue SSL via cPanel AutoSSL.
- Status: `registered → dns_pending → ssl_pending → active`.

### 7.2 Connected external domain

- Customer updates DNS at their registrar:
  - A record to the Stellar Plus server IP, or
  - nameservers to Namecheap/cPanel DNS.
- Verify ownership/configuration.
- Add addon domain in cPanel.
- Issue SSL.
- Status: `pending_verification → dns_pending → ssl_pending → active`.

### 7.3 Wildcard subdomains

- Create `*` subdomain in cPanel with document root `_wildcard_` or the shared runtime root.
- Ensure `*.tradeintra.com` A record points to the Stellar Plus IP.
- Test whether the cPanel Node.js app receives wildcard hostnames.
- Test AutoSSL for wildcard; if unavailable, purchase and install a Namecheap wildcard certificate.
- Verify renewal behavior.
- Do not declare subdomain publishing production-ready until HTTPS works for multiple subdomains.

## 8. Renewals and expiry

- Auto-renew is explicit at purchase.
- Reminders at 60, 30, 14, 7, and 1 days.
- Retry failed renewal charges.
- Keep the site live as long as registrar policy allows.
- Publish a grace/redemption policy.
- Do not delete customer data solely because a domain expired.
- Record renewal attempts, outcomes, and fees.

## 9. Abuse and trademark

- Block domains containing `deriv` or `binary` where required.
- Screen for phishing, impersonation, and trademark abuse.
- Provide an abuse-report path.
- Do not allow domains that impersonate Tradeintra, Deriv, or a regulated entity.
- Keep evidence and appeal records.

## 10. Data protection

- Registrant contacts are personal data.
- Encrypt at rest; restrict access to billing/support roles.
- Share only required fields with Namecheap.
- Honour access/correction/deletion requests subject to registrar/ICANN retention.
- Never log full contact data.

## 11. Acceptance criteria

- [ ] Availability, registration price, and renewal price are shown.
- [ ] Price is re-checked before purchase.
- [ ] Successful purchase creates domain/order/audit records.
- [ ] Failed purchase refunds/credits.
- [ ] Duplicate requests do not duplicate registrations.
- [ ] Domain is assigned only to the correct tenant.
- [ ] DNS and SSL are verified before “live”.
- [ ] Wildcard subdomains work over HTTPS.
- [ ] Renewal reminders/retries are observable.
- [ ] Registrant data is encrypted and masked.
- [ ] Manual fallback is documented and tested.
