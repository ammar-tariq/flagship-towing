# Membership Flagship — Revamp Guide

Membership site changes are listed concretely in **[`CHANGES.md`](./CHANGES.md)**.  
Backend API standard: **[`../backendFlagship/REVAMP.md`](../backendFlagship/REVAMP.md)**.  
Mobile (same member vessel contract for portal add-vessel): **[`../mobileFlagship/REVAMP.md`](../mobileFlagship/REVAMP.md)**.

---

## Goals

- Align portal + public signup with REST paths (`/profile`, `/vessels`, `/users/website-signup`)
- One API base URL; signup uses the shared client
- Keep the **website signup camelCase adapter** until backend unifies (no third payload shape)
- Portal add-vessel stays aligned with **mobile** flat snake_case vessel create
- Clean dead helpers and stale README

---

## Stack (current)

- Static HTML + vanilla JS (not React)
- Vite + Tailwind for CSS / preview
- Portal: `js/flagship-api.js` + page scripts
- Public signup: mostly inline in `index.html` (should move onto shared API helper)

---

## What changes (summary)

1. **Paths** — `/user/my-profile` → `/profile`; vessel/package/family verb paths → REST
2. **Tokens** — dual-read then `accessToken` / `refreshToken`
3. **Create vessel** — price id moves from URL param to body when backend switches
4. **Signup** — `/users/website-signup`; optional `priceId` rename; line2 mailing fix (backend)
5. **Config / cleanup** — single `API_BASE`; remove or wire `deleteFamily`; fix README

Full tables and checklists: [`CHANGES.md`](./CHANGES.md).

---

## What does not change

- Public signup remains anonymous
- Portal login `source: "user"`, `device_id: "web"`
- Nested camel signup body **until** an explicit unify project
- No guest-mode product on this site (mobile-only)

---

## Migration order

1. Backend aliases on; dual token fields if needed
2. Portal paths + shared `API_BASE` ([`CHANGES.md`](./CHANGES.md))
3. Public signup paths + shared fetch helper
4. Field renames (`adv_name`, `priceId`) with dual support
5. Drop aliases after mobile + admin + membership all migrated

---

## Testing focus

- [ ] Public signup: check-email, resume signup, create → Stripe redirect
- [ ] Packages + boating locations load on signup
- [ ] Sign in / forgot password / OTP / reset
- [ ] Dashboard: profile, vessels, family, incidents, payment logs
- [ ] Add vessel → Stripe
- [ ] Add authorized user
- [ ] Token refresh after access expiry
- [ ] Staging and prod base URLs
