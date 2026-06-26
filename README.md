# Jala Ride

Nigeria's identity-verified, government-fleet ride-hailing platform. Full monorepo for web (marketing + admin + API), mobile rider/driver apps, and Supabase backend.

## Structure

| Directory | Stack | Purpose |
|-----------|-------|---------|
| `web/` | Next.js 14, Supabase, Tailwind | Marketing site, admin portal, API routes |
| `rider-app/` | Expo SDK 54, Redux Toolkit | Rider app (NIN onboarding, immersive ride card) |
| `driver-app/` | Expo SDK 54, Redux Toolkit | Driver app (clearance workflow, remittance) |
| `supabase/` | Postgres migrations | Schema, RLS, Realtime, seed data |
| `backend/` | Fastify, Prisma (legacy) | Legacy REST API — being replaced by Supabase + `web/api` |
| `frontend/` | TypeScript | Shared HTTP client (`@jala-ride/shared`) |

## Brand

- Primary green: `#1B6B3A`
- Accent gold: `#D4A017`
- Background dark: `#0A1628`

## Quick start

### 1. Environment

```bash
cp .env.example .env
# Fill in Supabase, Google Maps, Paystack keys
```

### 2. Database (Supabase)

Run migrations in order from `supabase/migrations/`:

1. `001_initial_schema.sql`
2. `002_rls_policies.sql`
3. `003_realtime.sql`
4. `seed.sql`

### 3. Web (marketing + admin + API)

```bash
cd web
npm install
npm run dev
```

- Marketing: http://localhost:3000
- Admin: http://localhost:3000/admin
- Public trip tracking: http://localhost:3000/track/{token}

### 4. Mobile apps

```bash
cd rider-app   # or driver-app
npm install
npx expo start
```

EAS builds: `eas build --profile preview` (requires `eas.json` and Expo account).

## API routes (`web/src/app/api/`)

| Route | Purpose |
|-------|---------|
| `POST /api/nimc/verify` | NIN verification (sandbox stub) |
| `POST /api/clearance/dss` | DSS clearance webhook |
| `POST /api/clearance/police` | Police clearance webhook |
| `POST /api/trips/estimate` | Fare estimation |
| `POST /api/trips/dispatch` | Driver dispatch |
| `GET /api/trips/share/[token]` | Public trip share data |
| `POST /api/payments/initialize` | Paystack init |
| `POST /api/payments/verify` | Paystack verify |
| `POST /api/notifications/send` | Expo push notifications |
| `GET /api/cron/generate-remittances` | Monday remittance cron |

## Weekly remittance formula

```
weekly_remittance = (purchase_price × annual_rate% × amortization_years) ÷ (amortization_years × 52)
```

Implemented as a Postgres generated column on `vehicles.weekly_remittance`.

## Success criteria checklist

- [ ] Zero "Trivexa" references in source files
- [ ] Supabase migrations applied; `weekly_remittance` calculates correctly
- [ ] Admin portal requires admin role
- [ ] Rider immersive ride card shows driver photo background + share link
- [ ] Driver remittance screen shows formula breakdown
- [ ] EAS build config present for both apps
