# Data Retention, Export, and Deletion Policy — Design Notes

This is a technical planning aid, not a published privacy policy or legal opinion.

## 1. Categories

Define retention separately for:

- account/profile data;
- linked Deriv identifiers and tokens;
- site configurations and version history;
- brand assets and bot files;
- releases/artifacts;
- domain records and registrant contacts;
- domain orders and renewal records;
- publish/release logs;
- payment/subscription records;
- commission/earnings/payout records;
- support conversations;
- security/audit events;
- analytics;
- backups.

For each: purpose, retention period, deletion trigger, access control, backup treatment, and legal/contractual constraints.

## 2. Proposed defaults (to be approved)

| Category | Proposed retention |
|---|---|
| Account/profile | Active account + 30 days after deletion |
| Deriv tokens | Until revoked/link removed; revoke immediately on deletion |
| Site configs/assets | Active + 30 days after deletion, unless export requested |
| Domain records | Life of domain + 7 years for financial records |
| Registrant contacts | Life of domain + required registrar retention |
| Payment/transaction records | 7 years |
| Publish/release logs | 30–90 days (redacted) |
| Audit events | 1–7 years depending on sensitivity |
| Support tickets | 2 years |
| Backups | 30–90 days rolling, with restore tests |

Reference-observed DForge policy: account data deleted/anonymised within 30 days; payment records kept 7 years; server/security logs up to 12 months. Use only as a comparison, not as Tradeintra policy.

## 3. Deletion workflow questions

- Does deleting a site immediately remove the public hostname/route?
- Is there a recovery/grace period?
- Are assets, logs, and releases removed or retained temporarily?
- How are queued jobs cancelled?
- What happens to domain registrations and renewals?
- What happens to billing/audit records that must be retained?
- How are backups aged out?
- Can a customer export configuration/assets?
- What happens when an account owner leaves?
- How are Deriv tokens revoked?
- How are subdomains released/reserved?

## 4. Domain-specific constraints

- Domain registrations cannot be deleted like a row; they expire or transfer.
- Registrar/ICANN retention may require contact data.
- Financial records for domain sales must be retained.
- A deleted account must not lose the ability to transfer a domain before expiry.

## 5. Rules

- Do not promise immediate deletion from all backups.
- Do not delete financial/audit records required by law.
- Log deletion requests and outcomes.
- Verify deletion across DB, local storage, cache, and releases.
- Obtain legal review for target markets.
