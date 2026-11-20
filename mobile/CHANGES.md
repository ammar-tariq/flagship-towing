# Mobile Flagship — Changes Doc

Concrete progress against [`REVAMP.md`](./REVAMP.md).

---

## Structure (implemented)

```text
src/
  app/
    navigation/
    providers.tsx
  screens/*Screen/    # flat; UI + styles only
  components/         # shared UI; props colocated
  hooks/              # ALL hooks (no Controllers)
  api/                # typed RTK endpoints
  store/
  types/
    api/              # auth, user, common
    models/           # user, vessel, membership, family, service, content
    auth.ts
    navigation.ts
  lib/
  assets/
```

### Aliases
`@Screens`, `@Hooks`, `@Api`, `@Store`, `@Types`, `@Lib`, `@Utils`→lib, `@Components`, `@Assets`

### Auth
- Redux owns `mode: 'loggedOut' | 'guest' | 'user'`
- Screens/components use `useAuthMode()` only
- Nav / `baseQuery` may read Redux directly
- Deprecated `loginUser` removed — use `enterGuest` / `signOut`
- Dual-read tokens: `accessToken`/`token`, `refreshToken`/`refresh_token` (login + refresh + logout body)

### App primitives
- `AppText` only (legacy `components/Text` re-export removed)
- No `size` prop on `AppText` — font size via styles
- `AppScreen` / `AppScroll` / `AppFlatList`
- Wrappers + form screens use `AppScreen` / `AppScroll`

### API typing
All `authApi` / `userApi` endpoints declare request + response types under `types/api/*` + `types/models/*`.

---

## Also done earlier
- Payment deeplinks + membership refresh
- Dead file/asset cleanup
- Controllers → hooks; flatten screens; Utils → lib; delete `Interfaces/`

---

## Still open
- [ ] Backend emits `accessToken`/`refreshToken` (mobile already dual-reads)

---

## Related
- Backend: `../backendFlagship/REVAMP.md`
- Membership / admin: their `CHANGES.md`
