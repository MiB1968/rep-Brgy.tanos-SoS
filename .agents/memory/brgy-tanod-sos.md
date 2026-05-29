---
name: Brgy Tanod SOS setup
description: Key decisions and gotchas for the Brgy Tanod SOS emergency response system
---

# Brgy Tanod SOS — Key Decisions

## Auth pattern
JWT stored in localStorage (`brgy_token`, `brgy_user`). `lib/api-client-react/src/custom-fetch.ts` has a fallback that reads `localStorage.getItem("brgy_token")` and attaches it as `Authorization: Bearer` on every request. No `setAuthTokenGetter()` call needed from the frontend — it's always-on.

**Why:** Replit monorepo — no server-side sessions needed, simpler auth for a local-first emergency app.

## Tailwind v4 gotcha
Cannot `@apply dark` in the base layer — `dark` is a `@custom-variant`, not a utility class. Tailwind v4 will throw `Cannot apply unknown utility class 'dark'`. The fix is to just omit it; the dark theme is always-on via `:root` CSS vars.

## DB lib must be built before API typecheck
Run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck`. The `@workspace/db` package is composite and must emit declarations first, otherwise TS can't find `usersTable`, `alertsTable`, etc.

## Role promotion
New registrations default to `resident` role with `approved` status (tanods default to `pending`). To seed admin/superadmin, register normally then `UPDATE users SET role = 'admin' WHERE email = '...'` directly in the DB.

## react-leaflet default markers
Must delete `_getIconUrl` from `L.Icon.Default.prototype` before `mergeOptions` to fix the broken default marker icon in bundled builds.

## useListBroadcasts isActive param
The generated hook's `isActive` query param is typed as `boolean | undefined`, not `string`. Pass `{}` to get all broadcasts, or `{ isActive: true }` for active only.

## Route wrappers in wouter
Use `ComponentType` from React (not `() => JSX.Element`) for component props in ProtectedRoute/PublicRoute, and render as `<Component />` JSX (not `Component()`). Calling `Component()` directly breaks the Rules of Hooks order check.
