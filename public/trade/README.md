# Shared demo trading workspace

Static, dependency-free demo SPA for the cPanel-hosted `trade.tradeintra.com`
subdomain. Upload the contents of this directory to the subdomain document root.

## Modes

- Demo only: simulated ticks, simulated balance, simulated contracts.
- No Deriv credentials, deposits, withdrawals, balances, or real orders.
- Deriv OAuth remains disabled until the OAuth application and API approval are
  available. The login button explains the current state.
- Query parameters brand the workspace: `name`, `site`, `accent` (six hex
  characters), and `theme` (`dark` or `light`).

Example:
`https://trade.tradeintra.com/?site=aurora&name=Aurora%20Markets&accent=B08D57&theme=light`

## cPanel checks

1. Create the `trade.tradeintra.com` subdomain and point its document root at a
   dedicated directory.
2. Upload `index.html`, `styles.css`, `app.js`, and `.htaccess`.
   The app loads preset XML from `https://tradeintra.com/deriv-presets/` in
   production, so keep that directory available on the main domain.
3. Confirm AutoSSL is active and HTTP redirects to HTTPS.
4. Confirm the files are served with the correct MIME types and that
   `/.htaccess` is honoured (no directory listing, noindex headers).
5. Confirm no Passenger/Node application is attached to this subdomain.
6. Load the demo on desktop and a 360px viewport, open the login notice, buy a
   demo contract, and reset the demo.
7. Record the host, PHP/Passenger version, upload path, and test date in the
   release record.

The current repository preview serves the same files at `/trade/` for local
verification. That is not a cPanel host certification.
