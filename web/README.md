# Membership Flagship

Static membership portal + public signup for Flagship Towing.

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Public multi-step membership signup → Stripe |
| `signin.html` | Portal login / forgot password / OTP / reset |
| `user.html` | Member dashboard (profile, vessels, family, payments) |
| `add-vessel.html` | Add vessel + checkout (`source: "web"`) |
| `add-authorized-user.html` | Add authorized (family) user |

## Scripts

Shared client: `js/flagship-api.js` (`window.FlagshipAPI`).

API base and Maps key come from `membershipFlagship/.env` (`VITE_API_BASE_URL`, `VITE_GOOGLE_MAPS_KEY`) and are injected at `yarn dev` / `yarn build`. Do not hardcode URLs in HTML or JS.

## Local preview

```bash
yarn install
# see vite.*.config.js for portal / preview servers
```

## Related docs

- [`REVAMP.md`](./REVAMP.md) / [`CHANGES.md`](./CHANGES.md)
- Backend: `../backendFlagship/REVAMP.md`
- Mobile: `../mobileFlagship/REVAMP.md`
