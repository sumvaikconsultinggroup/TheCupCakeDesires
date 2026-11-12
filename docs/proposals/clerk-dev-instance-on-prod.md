# Proposal: Clerk development instance loading on production

Status: owner action required. This repo change does **not** edit Clerk, auth code, middleware, env, or `vercel.json`.

## Evidence (production HTML, Nov 2026)

Live storefront pages (including `/`) embed Clerk's **development** browser bundle and a **test** publishable key:

- Script host: `https://flowing-stud-70.clerk.accounts.dev/.../clerk.browser.js`
- Publishable key prefix only: `pk_test_` (no `pk_live_` observed in the HTML)
- CSP in production responses also allows `https://*.clerk.accounts.dev`

A production site should load `*.clerk.accounts.com` (or the custom Clerk production domain) with a `pk_live_` publishable key. The `*.clerk.accounts.dev` host and `pk_test_` prefix mean the deployed Vercel project is pointed at a Clerk **development** application.

## Crawl, performance, and security impact

- **Crawl waste:** Googlebot and other bots still download the Clerk JS bundle (and related handshake traffic) on public HTML even when middleware skips Clerk for known crawler UAs. That competes with HTML budget when crawl rates are already low.
- **Performance:** Extra third-party JS on every storefront page (LCP / main-thread). Development instances also do a "dev browser" handshake that can 307 unknown clients to `*.clerk.accounts.dev`.
- **Security / correctness:** Test keys on a public shop mean auth is not the production Clerk app. Session hardening, bot protection, and production audit logs will not match what customers use in live checkout and accounts.

Related robots note (safe, already handled in code without touching Clerk): disallow URLs that carry `__clerk_handshake=` so crawlers do not treat handshake URLs as content. Do **not** disallow `/_next` or CSS/JS needed for rendering.

## Exact change for the owner (Clerk dashboard + Vercel env)

Do this in Clerk and Vercel only. Do not commit secrets.

1. In [Clerk Dashboard](https://dashboard.clerk.com), open (or create) the **Production** instance for The Cupcake Desire.
2. Copy the **Production** publishable key (`pk_live_...`) and the **Production** secret key (`sk_live_...`).
3. In Vercel > Project > Settings > Environment Variables, set for **Production**:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_...` (not `pk_test_`)
   - `CLERK_SECRET_KEY` = `sk_live_...` (not `sk_test_`)
   - Keep existing path vars if already correct: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`, and the fallback redirect URLs to `/`.
4. Confirm the Production instance Domains list includes `thecupcakedesire.com.au` (and `www` if used).
5. Redeploy Production. Verify page source no longer references `clerk.accounts.dev` or `pk_test_`.
6. Optional follow-up (still owner-owned): scope Clerk loading to auth/account/checkout routes only so public marketing HTML does not ship the Clerk bundle. That is a code change; keep it out of crawl-waste PRs that must not touch auth.

## Fonts note (same root layout as Clerk / GTM)

`src/app/layout.tsx` loads **seven** `next/font/google` families and applies **Poppins** via `poppins.className` on `<html>`, while storefront CSS is Inter / Fraunces / Caveat. Production CSS references dozens of `.woff2` files (Poppins, Roboto, Antonio, JetBrains Mono, plus the bake fonts).

Changing fonts means editing that root layout file, which also mounts `ClerkProvider` and GTM/gtag. To keep auth untouched in crawl-waste work, **do not** ship the font trim in the same PR as Clerk-adjacent layout edits unless the owner explicitly wants it.

Recommended owner follow-up (separate change):

1. Keep only Inter, Fraunces, and Caveat (latin subset) on the storefront root layout; use `inter.className` instead of Poppins on `<html>`.
2. Load Antonio / Roboto / Poppins / JetBrains Mono only from `src/app/admin/layout.tsx` (or a legacy layout) where those faces are still referenced.
3. Re-measure home, one product URL, and `/cupcake-delivery/clayton-south` resource counts after the trim.

## Out of scope here

- No edits to Clerk components, `middleware.js`, auth providers, or env files in this proposal's accompanying crawl-waste PR.
- No merge of this proposal until the owner rotates keys and confirms production Clerk.
