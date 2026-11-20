# Admin Flagship — Revamp Guide

Admin app changes are listed concretely in **[`CHANGES.md`](./CHANGES.md)**.  
Backend API standard: **[`../backendFlagship/REVAMP.md`](../backendFlagship/REVAMP.md)**.  
Mobile (member app): **[`../mobileFlagship/REVAMP.md`](../mobileFlagship/REVAMP.md)**.

---

## Goals

- Track backend REST + token contract without breaking ops workflows
- Fix known client bugs (promo update, dead APIs)
- Env-based config; remove unused dependencies and dead Redux slices
- Keep admin on `/users/*` (never confuse with member `/profile`)

---

## Stack (current)

- Vite + React + Redux Toolkit / RTK Query
- Bearer access + refresh via `baseQueryWithReauth`
- Feature pages under `src/pages/*`, APIs under `src/redux/Apis/*`

---

## What changes (summary)

1. **Paths** — verb URLs (`/user/get`) → REST (`/users`)
2. **Tokens** — standardize on `accessToken` / `refreshToken` (dual-read during cutover)
3. **Bugs** — promo update path; payment-logs dual shape handling
4. **Cleanup** — Listing API, reports, unused npm packages, duplicate routes
5. **Config** — env-based `BASE_URL`

Full tables and checklists: [`CHANGES.md`](./CHANGES.md).

---

## What does not change

- Admin login `source: "admin"`
- Role model (`admin` / `superAdmin`) and RestrictAccess behavior on backend
- Snake_case domain fields unless backend renames with a dual-key window
- Family API as “authorized users” product language in the UI

---

## Migration order

1. Ship behind backend **aliases** (old + new paths work)
2. Apply [`CHANGES.md`](./CHANGES.md) checklist in admin
3. Verify users, vessels, packages, payment logs, family approve/reject, import/export
4. Backend removes aliases after admin + mobile + membership are migrated

---

## Testing focus

- [ ] Login / refresh / logout
- [ ] Users list, detail, status, create/edit, export, sheet import
- [ ] Vessel edit under user
- [ ] Packages CRUD + payment logs (global + per user)
- [ ] Authorized user requests approve/reject
- [ ] Promo create **and** update
- [ ] Feedbacks resolve
- [ ] App settings (`stripe_dev`)
