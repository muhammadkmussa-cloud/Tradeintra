# ADR 0015: Google OAuth with the Existing Custom Session Model

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

Users must sign in with email/password or Google. The MVP already has scrypt password hashes, hashed session tokens, HttpOnly cookies, account-scoped RLS, and a client workspace. Migrating to Auth.js would add dependencies without removing the need for these account and tenant controls.

## Decision

Keep the existing session and account model. Add Google as an external identity provider:

- OAuth 2.0/OIDC authorization-code flow with `state` and PKCE.
- Exchange the code server-side; validate the ID token issuer, audience, expiry, and nonce.
- Link or create an `auth_identities` row for provider `google`.
- Treat a Google-verified email as verified.
- Create the same DB session and cookie used by email/password sign-in.
- Never send provider tokens to the browser or store them in tenant configuration.

Email/password accounts must verify their email before dashboard, site creation, or credits. Google accounts are verified by the provider.

## Consequences

- One session model, one account model, one tenant boundary.
- OAuth code, token exchange, and identity linking must be tested separately.
- Live Google sign-in remains gated until client ID, secret, redirect URI, and authorized origins are supplied.

## Revisit trigger

A future identity requirement (SAML, SCIM, teams, enterprise SSO) makes Auth.js or a dedicated identity provider preferable.
