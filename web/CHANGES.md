# Membership Flagship — Changes Doc

Concrete changes for this app.  
Standards: `./REVAMP.md` · API source of truth: `../backendFlagship/REVAMP.md`

---

## Done (this pass)

### Environment & config
- [x] `VITE_API_BASE_URL` from `.env` injected into `js/flagship-api.js` (no hardcoded API URLs / `FLAGSHIP_CONFIG`)
- [x] Public signup uses `FlagshipAPI` (no duplicated full URLs in `index.html`)
- [x] README rewritten for portal + signup

### Auth & tokens
- [x] Dual-read `token` \| `accessToken`, `refresh_token` \| `refreshToken`
- [x] Dual-send refresh/logout body
- [x] `forgot-password` path (backend alias)
- [x] Sign-in stores via `pickAccessToken` / `pickRefreshToken`

### Payload / cleanup
- [x] Portal add-vessel dual-write `advName`/`adv_name`, `captainName`/`captain_name`
- [x] Public signup boat payload dual-write same referral fields
- [x] Removed unused `deleteFamily` helper
- [x] Portal `source: "web"` on add-vessel (already)
- [x] `user.html?payment=` return handling (already)

---

## Still open (needs backend REST aliases)

- [ ] Portal: `/profile`, `/vessels`, `/packages`, `/family`, `/incidents`
- [ ] Portal: `POST /vessels` with price in body
- [ ] Signup: `/users/check-email`, `/users/website-signup`
- [ ] Date field consistency everywhere in `user.js`
- [ ] Drop reliance on backend verb-path aliases after deploy

---

## After payment (web + app)

| Change | Status |
|---|---|
| Professional HTML success/cancel | Backend done |
| Open app deeplink CTA | Backend + mobile done |
| Portal `?payment=` refresh | Done |
| Vessel `source: "web"` | Done |

Set backend `MEMBERSHIP_PORTAL_URL` for portal CTA.
