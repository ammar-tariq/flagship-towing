# Mobile Flagship — Codebase Revamp Guide

## Goals

- Simpler, consistent structure
- Clear naming and ownership
- Fully typed app + APIs
- Shared `App*` primitives with a single component contract
- Explicit auth modes (`loggedOut` | `guest` | `user`)
- Safe area handled centrally so screens stop managing insets

---

## 1. Target folder structure

```text
src/
  app/
    navigation/
      types.ts              # RootStackParamList, etc.
      ...
    providers.tsx           # Redux, SafeArea, Auth provider

  screens/                  # PascalCase + *Screen suffix
    LoginScreen/
      index.tsx             # UI only
      styles.ts
    SignupScreen/
    HomeScreen/
    AddVesselScreen/
    ...

  components/               # Shared UI only (PascalCase folders)
    AppText/
    AppButton/
    AppScroll/
    AppFlatList/
    AppScreen/
    WeatherUpdateCard/      # domain / functional names
    PhoneNumberInput/
    ...

  hooks/                    # All hooks (screen + shared) — not colocated in screens
    useLogin.ts
    useSignup.ts
    useAddVessel.ts
    useAuthMode.ts
    useRequireAuth.ts
    useToggle.ts
    ...

  api/                      # RTK Query endpoints
    auth.ts
    user.ts
    baseQuery.ts

  store/                    # Redux store + slices
    index.ts
    authSlice.ts            # or userSlice — owns mode, token, user

  types/                    # Shared contracts only
    api/
      auth.ts
      user.ts
      vessel.ts
      membership.ts
      common.ts
    models/
      user.ts
      vessel.ts
      membership.ts
      weather.ts
    navigation.ts
    auth.ts                 # AuthMode, etc.

  lib/                      # Pure helpers (replaces Utils / helpers / configs clutter)
    validators.ts
    formErrors.ts
    navigation.ts
    permissions.ts
    ...

  assets/
    Images/
    Fonts/
```

### Removed / replaced concepts

| Old | New |
|---|---|
| `Controllers/` | `hooks/` |
| `Screens/AuthScreens`, `Screens/AppScreens` | flat `screens/*Screen` |
| `Utils` + helpers + configs sprawl | `lib/` |
| `Interfaces/index.ts` god file | `types/` + colocated component props |
| Implicit guest (`loginUser(true)`, null profile) | explicit `mode` |

---

## 2. Naming conventions

| Kind | Convention | Example |
|---|---|---|
| Screen folder + component | PascalCase + `Screen` | `LoginScreen` |
| Screen hook | `use` + flow name (no `Controller`) | `useLogin` |
| App primitive | `App` + RN concept | `AppText`, `AppScroll` |
| Domain component | Functional name | `WeatherUpdateCard` |
| Props type | `ComponentNameProps` | `AppTextProps` |
| Folders | PascalCase for components/screens | `AppText/`, `LoginScreen/` |
| Route names | Short, no `Screen` suffix | `Login`, `Home` |

---

## 3. Screen rules

- `screens/LoginScreen/` contains **UI + styles only**
- Logic lives in `hooks/useLogin.ts`
- Screens import hooks from `hooks/`, not from sibling files
- Prefer `AppScreen` + `AppScroll` / `AppFlatList` over raw RN layout primitives
- No per-screen safe-area inset math for routine layout

```tsx
// screens/LoginScreen/index.tsx
import { useLogin } from '@/hooks/useLogin';
import { AppScreen } from '@/components/AppScreen';
import { AppScroll } from '@/components/AppScroll';
import { AppText } from '@/components/AppText';

export function LoginScreen() {
  const { ... } = useLogin();

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppScroll keyboardAware>
        <AppText weight="semibold" style={styles.title}>
          Sign In
        </AppText>
        {/* ... */}
      </AppScroll>
    </AppScreen>
  );
}
```

---

## 4. Component contract (`AppText` as the template)

Every RN wrapper follows the same pattern:

```tsx
import { Text as RNText, TextProps } from 'react-native';

export type AppTextProps = TextProps & {
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
};

export function AppText({
  style,
  weight = 'regular',
  children,
  ...rest
}: AppTextProps) {
  return (
    <RNText
      allowFontScaling={false}
      {...rest}
      style={[styles.text, styles[weight], style]}
    >
      {children}
    </RNText>
  );
}
```

### Contract checklist

1. Extend the RN prop type (`TextProps`, `ScrollViewProps`, etc.)
2. Destructure custom props; put the rest in `...rest`
3. Spread `{...rest}` so callers can override RN props (`numberOfLines`, etc.)
4. Compose `style={[base, variants, style]}` **after** the spread so styles merge correctly
5. **No `size` prop on `AppText`** — font size / line height stay in styles
6. `weight` maps to app font families
7. Domain components use functional names (not `App*`)
8. Props types live next to the component — not in `types/`

### Core primitives to build

| Component | Wraps | Notes |
|---|---|---|
| `AppText` | `Text` | `weight` → fontFamily; size via styles |
| `AppButton` | `Pressable` | `loading`, `secondary`, `disabled` |
| `AppScroll` | `ScrollView` (+ optional keyboard-aware) | Shared defaults |
| `AppFlatList` | `FlatList` | Shared defaults; generic `AppFlatList<T>` |
| `AppScreen` | `SafeAreaView` / screen shell | `edges` prop |

### `AppScroll` / `AppFlatList` defaults

- `showsVerticalScrollIndicator={false}`
- `keyboardShouldPersistTaps="handled"` (scroll)
- Optional `keyboardAware` for forms (replaces repeated `KeyboardAwareScrollView` setup)
- Do **not** bake safe-area padding into lists by default — that belongs on `AppScreen`

---

## 5. Safe area

- Keep `SafeAreaProvider` at the app root (already present)
- Do **not** wrap the entire app in one always-on `SafeAreaView` (breaks headers, tabs, maps, sheets)
- Screens use `AppScreen` with explicit `edges`

### Edge ownership

| Layout | Edges on screen |
|---|---|
| Auth (no header) | `['top', 'bottom']` |
| Stack with header | header owns top → often `['bottom']` or `[]` |
| Tab screens | tab bar owns bottom → often `['top']` or `[]` |
| Full-bleed (map, art) | `[]` |
| Sheets / modals | handle insets locally |

Remove routine `useSafeAreaInsets()` padding from screens as they migrate. Keep insets in chrome (tab bar, drawer, sheet frames).

---

## 6. Types

### `types/` owns shared contracts

```text
types/
  api/         # Request/Response per endpoint domain
  models/      # Shared entities (User, Vessel, ...)
  auth.ts      # AuthMode
  navigation.ts
```

### What stays out of `types/`

- Component props (`AppTextProps`) → next to component
- One-off form value types may live in the hook, or under `types/forms/` if preferred

### Rules

- Prefer `import type`
- No mega `Interfaces/index.ts`
- API types compose models; don’t duplicate `User` in five files
- Ban `any` on API bodies, styles, and `getState`

---

## 7. API typing (mandatory)

Every RTK endpoint must declare result + arg types:

```ts
import type { LoginRequest, LoginResponse } from '@/types/api/auth';

login: builder.mutation<LoginResponse, LoginRequest>({
  query: body => ({
    url: '/auth/login',
    method: 'POST',
    body,
  }),
}),

getProfile: builder.query<ProfileResponse, void>({
  query: () => '/user/my-profile',
}),
```

- Types mirror real JSON (including snake_case if that’s what the API returns)
- `prepareHeaders` / `baseQuery` use `RootState`, not `any`
- Hooks map form values → request types explicitly

---

## 8. Auth & guest

### Single source of truth

```ts
type AuthMode = 'loggedOut' | 'guest' | 'user';
```

Stored in Redux auth/user slice (along with `user`, `token`, `refreshToken` when applicable).

| Mode | Meaning |
|---|---|
| `loggedOut` | Auth stack |
| `guest` | In app, no token, gated actions |
| `user` | Authenticated member |

`mode` is enough. Derive helpers if useful; do not persist redundant flags:

```ts
const isLoggedIn = mode !== 'loggedOut';
const isGuest = mode === 'guest';
const isUser = mode === 'user';
```

### Actions

| Action | Result |
|---|---|
| `enterGuest()` | `mode: 'guest'`, clear tokens |
| Login success | `mode: 'user'`, set token + user |
| `signOut()` | `mode: 'loggedOut'`, clear session |
| Session expire | `mode: 'loggedOut'` (or force auth UI) |

### Consistent UI API: `useAuthMode()`

- Redux owns state
- Screens/components **only** use `useAuthMode()` (Context facade or hook over Redux — pick one and stick to it)
- Do not mix raw `useSelector(selectUserProfile) === null` guest checks with `useAuthMode`
- Navigator / `baseQuery` may read Redux directly

```ts
const { mode, enterGuest, requireAuth } = useAuthMode();

if (!requireAuth(() => navigate('Vessel'))) return;
```

### Replace legacy patterns

| Old | New |
|---|---|
| `dispatch(loginUser(true))` | `enterGuest()` |
| `profile === null` as guest | `mode === 'guest'` |
| `toggleUnAuth()` scattered | `requireAuth` / `promptLogin` via `useAuthMode` |

---

## 9. Hooks

- All hooks live in `hooks/`
- Screen hooks: `useLogin`, `useAddVessel`, …
- Shared hooks: `useToggle`, `useServerErrorShake`, `useAuthMode`, …
- No `Controllers/` folder
- Return explicitly typed results from hooks

---

## 10. Store

- Typed `RootState` + `AppDispatch`
- Use `useAppSelector` / `useAppDispatch`
- Auth slice owns `mode` + session fields
- Persist carefully: persist `mode` + tokens as needed; don’t persist stale ambiguous flags

---

## 11. Migration order

1. Freeze these rules as the team standard
2. Add `types/`, `AppText`, `AppScroll`, `AppFlatList`, `AppScreen`
3. Introduce auth `mode` + `useAuthMode` (migrate guest entry/gates)
4. Type RTK endpoints domain by domain
5. Move controllers → `hooks/`; flatten screens to `*Screen`
6. Route touched screens through `AppScreen` and strip inset hacks
7. Collapse Utils → `lib/`; delete empty Controllers / Interfaces
8. Rename `Text` → `AppText` (and siblings) in focused PRs

Prefer structure + typing moves first; avoid rewriting business logic in the same PR when possible.

---

## 12. Anti-patterns (ban list)

- Untyped `builder.mutation({ ... })`
- `any` for API payloads, styles, or `getState`
- Giant `Interfaces/index.ts`
- Screen logic left in the screen file (except trivial UI state)
- Guest detection via null profile / fake `isLoggedIn`
- Manual safe-area padding on every screen
- Mixing `useSelector` auth checks with `useAuthMode` in UI
- `App*` prefix on domain components
- Kebab-case component folders

---

## 13. Payment return: HTML pages + Open app

### Product decision

After Stripe Checkout, users land on **professional HTML success or failure pages** (branded, clear copy, payment summary). Those pages offer an **Open app** action. Opening the app must **refresh latest membership / subscription status** — the deeplink is a return path, not proof of payment by itself.

Do **not** skip the HTML page with an instant silent scheme redirect as the only UX.

### What happens today

1. App opens Stripe in InAppBrowser.
2. Stripe hits backend EJS pages (`/redirect/success`, `/redirect/cancel`) — basic copy, **no payment details**, **no Open app CTA**.
3. App learns success via FCM and/or polling `payment-status`.
4. `useDeepLinking` has marketing paths only; native `flagshiptowing` scheme is **not registered**.

### Target flow

```text
Stripe Checkout
  → GET /redirect/success | /redirect/cancel  (professional HTML)
       • status messaging
       • payment / membership summary (when available)
       • primary CTA: Open app
       • secondary: Continue on website (web checkouts)
  → user taps Open app
       → flagshiptowing://payment/success?session_id=…&vessel_id=…
       → or …/payment/cancel?session_id=…
  → app opens (cold start or resume; close InAppBrowser if still open)
  → fetch latest profile + vessels + payment-status / payment-logs
  → show in-app success or cancelled state from verified API data
```

### Deeplink contract (from HTML CTAs)

| URL | App behavior |
|---|---|
| `flagshiptowing://payment/success?session_id=&vessel_id=` | Close checkout browser if open; **invalidate + refetch** Vessel, Profile, PaymentLogs, Packages; poll/confirm `payment-status`; navigate to memberships / card / success UI |
| `flagshiptowing://payment/cancel?session_id=` | Close browser; stop verifying; optional toast; stay or return to Add Vessel / Memberships |
| Existing marketing links | Unchanged (`memberships`, `add-vessel`, `profile`, …) |

### App requirements when returning from payment HTML

1. Register `flagshiptowing` on iOS + Android.
2. Handle `payment/success` and `payment/cancel` in `useDeepLinking`.
3. On success path: **always** load fresh membership data (do not trust query params alone):
   - `GET` profile / membership fields
   - vessel list or `payment-status` for `vessel_id`
   - invalidate RTK tags: `Vessel`, `Profile`, `PaymentLogs`, `Packages`
4. Keep FCM + polling as **fallback** if the user never taps Open app and only dismisses the browser.
5. Optional: `InAppBrowser` can remain a normal open (user sees HTML); Open app CTA uses the scheme. `openAuth` is optional if it conflicts with showing the HTML page.

### Anti-patterns

- Bare “payment successful” page with no summary and no Open app
- Auto-jump to the app with no HTML confirmation screen
- Celebrating success in-app without refetching membership status
- Scheme parsing in JS without native registration

---

## 14. Quick reference

```text
UI primitives     → components/App*
Screens           → screens/LoginScreen (UI + styles)
Logic             → hooks/useLogin
API               → api/* + types/api/*
Domain models     → types/models/*
Auth              → store mode + useAuthMode()
Helpers           → lib/*
Safe area         → AppScreen edges
Payment return    → pro HTML → Open app → refresh membership status
```
