# Admin Flagship — Changes Doc

Concrete changes for this app.  
Standards: `./REVAMP.md` · API source of truth: `../backendFlagship/REVAMP.md`

---

## Done (this pass)

### Environment & config
- [x] `VITE_API_BASE_URL` / `VITE_IMAGE_BASE_URL` via `src/configs/env.js` + `.env.example`
- [x] Package rename `goodpricewholesale-admin` → `flagship-admin`

### Auth & tokens
- [x] Dual-read `token` \| `accessToken`, `refresh_token` \| `refreshToken` (login + refresh)
- [x] Dual-send refresh/logout body `{ refresh_token, refreshToken }`
- [x] PrivateRoute requires user **and** access/refresh token
- [x] Forgot password path → `POST /auth/forgot-password` (backend alias kept for old path)

### Bugs / cleanup
- [x] Promo update → `PATCH /promo/update/:id` (backend endpoint added)
- [x] Removed empty `listingApi`
- [x] Removed unused reports endpoints
- [x] Removed dead `components/Sidebar` stub
- [x] Deduped routes: keep `/inqueries`, drop duplicate `/feedbacks`
- [x] Removed unused deps: `chart.js`, `react-chartjs-2`, `crypto-js`, `react-google-recaptcha`
- [x] Table dates dual-read `created_at` \| `createdAt`

### Backend support shipped with this pass
- Dual-emit access/refresh token fields on login/refresh
- `PATCH /promo/update/:id`
- `POST /auth/forgot-password` alias

---

## Still open (needs backend REST aliases)

- [ ] Remap User / Vessel / Package / Family RTK paths to plural REST (`/users`, `/vessels`, …)
- [ ] Remap remaining Apis (promo/service/incident/feedback/…) to REST plurals
- [ ] Payment-logs single response shape
- [ ] `adv_name` / `captain_name` dual-read on vessel edit forms
- [ ] Drop backend verb-path aliases after all clients migrate

---

## Out of scope
- Guest mode — mobile only
- `/profile` — membership + mobile
- Checkout HTML / deeplinks — membership + mobile
