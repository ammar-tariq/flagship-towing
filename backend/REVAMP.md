# Backend Flagship — Codebase Revamp Guide

Cross-platform consumers of this API:

| App | Role |
|---|---|
| `mobileFlagship` | Member app (React Native) |
| `membershipFlagship` | Public signup + member portal (static HTML/JS) |
| `adminFlagship` | Admin / ops (Vite + React + RTK Query) |

Mobile structural revamp: see `../mobileFlagship/REVAMP.md`.

---

## Goals

- Simple module layout (no god controllers/helpers)
- REST routes: resource + HTTP method (not `/user/get`)
- Consistent Bearer access + rotating refresh tokens
- Lean schemas: every key has a real consumer (or is server-only)
- One API vocabulary across mobile, membership web, and admin
- Remove dead routes, unused libraries, and dual/ambiguous contracts

---

## 1. Target folder structure

Prefer **domain modules** over giant top-level `controllers/` + `helpers/` dumps.

```text
src/
  app.js                    # or keep root app.js thin
  modules/
    auth/
      auth.routes.js
      auth.controller.js    # HTTP only
      auth.service.js       # login, signup, refresh, logout, OTP
    profile/                # "me" — member self-service
      profile.routes.js
      profile.controller.js
      profile.service.js
    users/                  # admin user CRUD
      users.routes.js
      users.controller.js
      users.service.js
    vessels/
    membership/             # packages, subscribe, payment logs
    family/                 # authorized users
    feedback/
    incidents/
    notifications/
    representatives/
    promo/
    weather/
    wallet/
    general/                # uploads, content, boating-locations, app-settings

  shared/
    middleware/
      auth.middleware.js
      rateLimit.middleware.js
      error.middleware.js
    lib/                    # thin external wrappers
      token.js
      stripe.client.js
      email.js
      weather.client.js
      encryption.js
    constants/
      roles.js
      errors.js
      statuses.js
    models/                 # or models next to modules
    utils/                  # tiny pure helpers only
```

### Layer rules

| Layer | Does | Does not |
|---|---|---|
| **route** | path, method, auth, rate limit, upload | business logic |
| **controller** | parse req → call service → send res | Stripe, long DB, email |
| **service** | use-cases | Express `req`/`res` |
| **model** | schema / persistence | HTTP |
| **lib** | SDK wrappers (Stripe, mail, weather) | domain policy |

**File size target:** ~150–250 lines. Over ~300 → split by use-case.

### Split today’s monsters

| Current | Split into |
|---|---|
| `user.controller.js` (~1160) | `profile.*`, `users.*` (admin), import/export services |
| `helpers/stripe.js` (~700) | `lib/stripe.client.js`, `membership.service`, `billing.service`, `stripe.webhook.js` |
| `helpers/weatherService.js` (~1000) | `lib/weather.client.js`, `weather.service.js`, config for service areas |
| `helpers/` (vague) | `shared/lib/` + module `*.service.js` |

---

## 2. Route conventions

### Principles

1. **Path = resource**, **method = action**
2. **Plural** collections: `/users`, `/vessels`, `/packages`
3. **kebab-case** URL segments: `/forgot-password`, `/boating-locations`
4. **No** `/get`, `/create`, `/update`, `/delete` in paths
5. **`/profile`** = logged-in member (“myself”)
6. **`/users`** = admin (and privileged) user management
7. **`/auth`** = credentials + tokens only

### Self vs admin

| Audience | Paths |
|---|---|
| Member (mobile / membership portal) | `/profile`, `/vessels`, `/family`, … |
| Admin | `/users`, `/users/:id`, status toggles, import/export |

### Auth

```text
POST   /auth/signup
POST   /auth/login
POST   /auth/social-login
POST   /auth/forgot-password          # rename from forget-password
POST   /auth/verify-otp
POST   /auth/reset-password
POST   /auth/refresh
POST   /auth/logout                   # single logout (drop /user/logout)
```

### Profile (me)

```text
GET    /profile
PATCH  /profile
POST   /profile/change-password
GET    /profile/home                  # if still needed; else fold into GET /profile
```

### Users (admin)

```text
GET    /users
GET    /users/:id
POST   /users
PATCH  /users/:id
DELETE /users/:id
PATCH  /users/:id/status
GET    /users/export
POST   /users/import
GET    /users/check-email             # public helper for membership signup
POST   /users/website-signup          # rename from create-form-user (see §6)
```

### Vessels

```text
GET    /vessels
GET    /vessels/:id
POST   /vessels                       # price / package id in body (not only URL)
PATCH  /vessels/:id
DELETE /vessels/:id
GET    /vessels/:id/payment-status
```

### Other resources (same pattern)

```text
GET|POST         /packages
GET|PATCH|DELETE /packages/:id
GET              /packages/:id/payment-logs   # or GET /payment-logs?user=
GET|POST         /family
GET|PATCH|DELETE /family/:id
...
```

### Old → new map (compat)

Keep temporary aliases during migration so mobile, membership, and admin don’t break together.

| Old | New |
|---|---|
| `GET /user/my-profile` | `GET /profile` |
| `PUT /user/update` | `PATCH /profile` |
| `GET /user/get` | `GET /users` |
| `GET /user/get/:id` | `GET /users/:id` |
| `POST /user/create` | `POST /users` |
| `DELETE /user/delete/:id` | `DELETE /users/:id` |
| `POST /user/change-password` | `POST /profile/change-password` |
| `POST /user/logout` | `POST /auth/logout` |
| `POST /user/create-form-user` | `POST /users/website-signup` |
| `GET /vessel/get` | `GET /vessels` |
| `POST /vessel/create/:priceId` | `POST /vessels` (body includes price id) |
| `POST /auth/forget-password` | `POST /auth/forgot-password` |

Mount table: every `*.routes.js` must be registered in the router index — or deleted.

---

## 3. Auth tokens (Bearer + refresh)

### Already in place (keep and tighten)

- Short-lived JWT **access** token
- Opaque **refresh** token, hashed in DB, rotatable
- `token_version` to invalidate access JWTs
- Rate limits on login / OTP / refresh

### Contract (pick one casing and freeze)

Prefer consistent JSON (align all clients in the same migration):

```ts
// Login / refresh success
{
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;       // seconds
  data: UserPublic;        // no password / lock fields
}
```

**Migration note:** clients today expect `token` + `refresh_token`. Either:

- Phase 1: send **both** (`token` and `accessToken`), or  
- Phase 2: switch all three apps together.

### Rules

1. Protected routes: `Authorization: Bearer <accessToken>`
2. Middleware must require the `Bearer` scheme (not only `split(' ')[1]`)
3. Refresh: `POST /auth/refresh` body `{ refreshToken }` — **never** in `Authorization`
4. Rotate refresh on each use; revoke on logout
5. One logout endpoint under `/auth`
6. Guest on mobile is **not** a fake JWT unless product requires it — see mobile `AuthMode` (`loggedOut` | `guest` | `user`); guest APIs use public/optional auth clearly

### Align with mobile

Mobile revamp uses `mode: 'loggedOut' | 'guest' | 'user'`. Backend should not treat “logged in with null user” as a special token type. Guest browsing = no Bearer; gated actions require `user` mode + access token.

---

## 4. Dead code & unused libraries

### Remove or relocate (backend `package.json`)

| Package | Action |
|---|---|
| `archiver` | Remove if still unused |
| `node-fetch` | Remove (Node 20 has global `fetch`) |
| `uuid` | Remove if unused |
| `http` / `https` npm packages | Remove — use Node builtins |
| `nodemon` | Move to `devDependencies` |
| `exceljs` + `xlsx` | Keep one long-term |

### Dead / orphan backend code

| Item | Issue |
|---|---|
| `routes/guest.route.js` | Not mounted; **no** `guest.controller` — delete or finish |
| `routes/conversation.route.js` | Not mounted — delete or wire deliberately |
| Dual logout | `/auth/logout` vs `/user/logout` — keep auth only |

### Client-side debt (track when changing APIs)

**adminFlagship**

- Promo update incorrectly posts to `/promo/create`
- Empty `listingApi`; unused `/user/reports`
- Services UI route commented but `/service/*` still used for incidents
- Unused deps: `chart.js`, `react-chartjs-2`, `crypto-js`, `react-google-recaptcha`

**membershipFlagship**

- `deleteFamily` defined, unused
- Hardcoded staging `API_BASE` (also admin)
- README stale vs portal + `advName` wiring

Add `depcheck` / knip + “orphan route” check in CI when feasible.

---

## 5. Schemas & cross-platform keys

### Principles

1. Every schema field is **persisted for a reason**: write path + read path, or clearly **server-only**
2. **One casing** in DB + API JSON (prefer **snake_case**; rename `advName` → `adv_name`, `captainName` → `captain_name`)
3. **DTO ≠ document** — never return password, `token_version`, lock fields
4. Computed fields (`membership_status`) live in services/DTOs, not as fake required schema fields
5. Inventory fields against **mobile + membership + admin** before deleting

### User model

| Field | Keep? | Consumers |
|---|---|---|
| `first_name`, `last_name`, `email`, `phone`, `picture` | Yes | All clients |
| `password` | Server-only | Auth |
| `role`, `active` | Yes | Admin + authz |
| `stripe_customer_id` | Yes | Billing |
| `device_ids` | Yes | Push (mobile) |
| `auth_provider`, `provider_id` | Yes | Social / sheet |
| `website_signup_pending` | Yes, server (+ check-email booleans) | Membership signup resume |
| `token_version`, `failed_login_attempts`, `lock_until` | Server-only | Auth security |
| `dev` | Yes | Stripe test mode per user / settings |
| `representative` | Yes | Admin / partners |

Remove leftover hooks that reference non-schema concepts (e.g. user `VENDOR` / `status` in `pre('findOneAndUpdate')` if still present).

### Vessel model

| Field | Keep? | Consumers |
|---|---|---|
| Core identity / mailing / contact / boat specs (`make`, `boat_model`, …) | Yes | Mobile, membership portal, admin |
| `primary_boating_location` | Yes | All + export filters |
| `advName` / `captainName` | Yes → rename snake | Mobile, membership, signup |
| `images` | Yes | Mobile (portal may send `[]`) |
| `owner_agreement` / `marina_agreement` | Narrow | Mobile (verify marina still required) |
| `engine_make`, `horse_power`, `no_of_engines`, `legacy_member_id` | Yes if sheet import stays | Admin import — not membership/mobile forms |
| `offline_membership_*` | Yes | Import, wallet, mobile card, payment logs |

### Field inventory process (per model)

| Field | DB | API in | API out | Mobile | Membership | Admin | Decision |
|---|---|---|---|---|---|---|---|
| … | | | | | | | keep / server-only / deprecate / delete |

---

## 6. Dual vessel contracts (membership)

Today:

| Flow | Endpoint | Shape |
|---|---|---|
| Public signup | `POST /user/create-form-user` | Nested **camelCase** (`firstName`, `boat.manufacturer`, …) |
| Portal / mobile create | `POST /vessel/create/:priceId` | Flat **snake_case** |

**Decision required (pick one):**

**A. Official adapter (recommended short-term)**  
Keep `POST /users/website-signup` as a documented camelCase → schema mapper. Freeze the contract; don’t add a third shape.

**B. Unify**  
Public signup also sends flat snake_case (or all clients move to one OpenAPI schema).

Also fix while touching this:

- `address.line2` must map into `mailing_address` consistently
- `memberships[].productId` is a Stripe **price** id — rename to `priceId` in the public contract
- Dates: pick `created_at` **or** `createdAt` in API responses (not both)

---

## 7. Response & error shape

One success / error helper for all modules:

```ts
// success
{ success: true, message?: string, data?: T, ...tokens? }

// error
{ success: false, message: string, code?: string, errors?: FieldError[] }
```

- Central `error.middleware.js` — controllers `next(err)`
- Validation per module (not 200-line inline handlers)
- Admin vs member serializers can differ but must be explicit allowlists (`pickFields` / DTO mappers)

---

## 8. Client impact checklist

When changing routes or token field names, update in lockstep (or use aliases):

| Client | Touch points |
|---|---|
| **mobile** | RTK `Services/*`, `baseQueryWithReauth`, secure token keys |
| **membership** | `js/flagship-api.js`, `index.html` hardcoded URLs, signin/user/add-vessel scripts |
| **admin** | `redux/Apis/*`, `baseQueryWithReauth`, login controller token keys |

Shared expectations today:

- Base path: `/{APP_NAME}/v1/api`
- Access header: `Authorization: Bearer <token>`
- Refresh body: `{ refresh_token }` (migrate to `refreshToken` with dual-read)

---

## 9. Migration order

1. Freeze this doc as the standard  
2. Dead code pass (orphan routes, unused npm deps)  
3. Introduce `services/` + split worst files **without** renaming routes yet  
4. Token middleware hardening (`Bearer` required); optional dual token field names  
5. Add new REST routes **alongside** old aliases  
6. Migrate mobile → membership → admin (or all behind feature flag)  
7. Schema casing renames + field inventory deletions  
8. Decide website-signup adapter (A vs B)  
9. Remove aliases and verb paths  
10. Align OpenAPI / shared types with mobile `types/api/*`

Prefer structure + typing/contracts first; avoid rewriting Stripe/weather business logic in the same PR as route renames.

---

## 10. Anti-patterns (ban list)

- `/resource/get`, `/resource/create`, `/resource/delete/:id`
- God files (`helpers/stripe.js`-style dumping grounds)
- Business logic in controllers
- Returning full Mongoose documents to clients
- Mixed camel/snake on the same resource without an explicit adapter
- Second logout under `/user`
- Mounting routes that reference missing controllers
- Untyped / undocumented third payload shapes for the same use-case
- Guest JWT unless product explicitly needs it

---

## 11. Quick reference

```text
Auth          → /auth/* + Bearer access + body refresh
Me            → /profile
Admin users   → /users
Resources     → plural path + GET/POST/PATCH/DELETE
Code          → modules/*/ (routes → controller → service)
Shared I/O    → shared/lib, shared/middleware, shared/constants
Schemas       → inventory vs mobile + membership + admin
Compat        → aliases until all three clients migrate
```

---

## 12. Payment result pages & Open app

### Product decision

Stripe always returns to **professional HTML success / failure pages**. Pages show useful **payment / membership info** and a clear **Open app** (and web continue) CTA. The app then loads **latest subscription / membership status**. Webhook remains the activation source of truth.

### Current

```text
success_url → {API}/redirect/success?session_id={CHECKOUT_SESSION_ID}
cancel_url  → {API}/redirect/cancel?session_id={CHECKOUT_SESSION_ID}
```

EJS pages are basic (message only). No payment summary. No Open app button.

### Target HTML pages

**Success** (`views/checkout-success.ejs` — redesign)

- Brand header, clear success (or “processing”) state
- Payment summary when Stripe session allows, e.g.:
  - Plan / product name
  - Amount + currency + interval
  - Payment status (`paid` / processing)
  - Vessel id or registration (from metadata / DB if loaded)
  - Customer email
  - Session id (small / support reference)
- Primary CTA: **Open app** → `flagshiptowing://payment/success?session_id=…&vessel_id=…`
- Secondary CTA (web / `source=web`): **Go to member portal** → membership `user.html` (or thank-you)
- If verification failed but session exists: “We’re confirming your payment…” + same CTAs

**Cancel / fail** (`views/checkout-cancel.ejs` — redesign)

- Clear cancelled / not charged messaging
- Optional session reference
- Primary CTA: **Open app** → `flagshiptowing://payment/cancel?session_id=…`
- Secondary: **Try again** → memberships / signup URL as appropriate for `source`

Shared layout: Flagship branding, Nunito (or brand fonts), mobile-friendly, accessible buttons (not only auto-redirect).

### Data for the HTML summary

Expand `verifyCheckoutSessionPaid` / redirect controller to pass a view model into EJS, e.g.:

```js
{
  verified: boolean,
  status: 'paid' | 'processing' | 'cancelled',
  session_id,
  vessel_id,
  customer_email,
  amount_total,      // from session
  currency,
  plan_name,         // from line items / price product
  interval,          // if subscription
  source: 'app' | 'web' | 'admin',
  app_deep_link,     // built server-side
  portal_url,        // for web CTA
}
```

Retrieve session with enough expansions (`line_items`, product names) to populate the summary. Never show secrets (no raw Stripe keys; no full card data).

### Stripe URLs

```text
success_url: {API}/redirect/success?session_id={CHECKOUT_SESSION_ID}
cancel_url:  {API}/redirect/cancel?session_id={CHECKOUT_SESSION_ID}
```

`source` can come from Checkout `metadata.source` (`app` | `web`) when rendering CTAs — no need to rely only on query if metadata is set at session create.

### App side (after Open app)

See `../mobileFlagship/REVAMP.md` §13: deeplink → refetch profile / vessels / payment-status → UI from **API**, not from HTML.

---

## 13. Related docs

- Mobile app structure / payment HTML → Open app: `../mobileFlagship/REVAMP.md`
- Membership web migration: `../membershipFlagship/REVAMP.md`, `../membershipFlagship/CHANGES.md`
- Wallet setup (existing): `./WALLET_SETUP_GUIDE.md`
