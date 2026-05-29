# Brgy Tanod S.O.S

A real-time emergency response system for Philippine Barangays — connecting residents to Barangay Tanod safety officers during emergencies.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000/8080)
- `pnpm --filter @workspace/sos-app run dev` — run the frontend (port 20161)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, JWT auth (bcryptjs + jsonwebtoken)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + TailwindCSS v4 + shadcn/ui + TanStack Query + Wouter
- Map: react-leaflet (CartoDB dark tiles)
- Charts: recharts
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas
- `lib/db/src/schema/` — Drizzle table definitions (one file per entity)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/requireAuth.ts` — JWT auth middleware
- `artifacts/sos-app/src/pages/` — all frontend pages
- `artifacts/sos-app/src/components/` — layout + role dashboards

## Architecture decisions

- JWT stored in localStorage (`brgy_token`, `brgy_user`) — no session cookies
- `lib/api-client-react/src/custom-fetch.ts` auto-attaches Bearer token from localStorage
- Role-based access: resident / tanod / admin / superadmin
- Residents auto-approved on register; tanods start as `pending`
- All routes prefixed with `/api` (handled by shared reverse proxy)
- Tailwind v4 dark-only theme — no toggle, military command center aesthetic

## Product

- **Residents**: SOS button (2s hold-to-activate), alert status tracker, broadcasts
- **Tanods**: On/off duty toggle, patrol map presence, respond to active alerts
- **Admins**: Stats dashboard, user approval, shifts, broadcasts, tanod performance metrics
- **All roles**: Live patrol map (react-leaflet), incident reports, chat on alert detail

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Superadmin | super@brgy.ph | super123 |
| Admin | admin@brgy.ph | admin123 |
| Tanod | tanod@brgy.ph | tanod123 |
| Resident | resident@brgy.ph | resident123 |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` before checking API server types — the db lib must be built first
- Tailwind v4: cannot use `@apply dark` in base layer — dark is a custom variant, not a utility class
- `useListBroadcasts` `isActive` param expects boolean not string — pass `{}` to get all
- react-leaflet: must delete `_getIconUrl` from `L.Icon.Default.prototype` to fix default markers

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
