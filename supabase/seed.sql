-- Jala Ride — seed data for development and staging
-- Run after migrations: supabase db reset (local) or apply via SQL editor

-- ---------------------------------------------------------------------------
-- Sample government fleet vehicles (Nigerian market, NGN pricing)
-- weekly_remittance is auto-calculated by the generated column:
--   (purchase_price × annual_rate_percent% × amortization_years) ÷ (years × 52)
-- ---------------------------------------------------------------------------

INSERT INTO public.vehicles (
  plate_number,
  make,
  model,
  year,
  color,
  category,
  purchase_price,
  annual_rate_percent,
  amortization_years,
  status
) VALUES
  (
    'JA-234-ABA',
    'Toyota',
    'Corolla',
    2022,
    'White',
    'economy',
    10000000.00,
    40.00,
    4,
    'available'
  ),
  (
    'JA-567-LAG',
    'Toyota',
    'HiAce',
    2021,
    'Silver',
    'xl',
    18500000.00,
    40.00,
    5,
    'available'
  ),
  (
    'JA-891-ABJ',
    'Honda',
    'CG125',
    2023,
    'Red',
    'moto',
    2800000.00,
    35.00,
    3,
    'available'
  );

-- Expected weekly remittance values (generated column):
--   Corolla:  (₦10,000,000 × 40% × 4) ÷ (4 × 52) = ₦76,923.08/week
--   HiAce:    (₦18,500,000 × 40% × 5) ÷ (5 × 52) = ₦142,307.69/week
--   CG125:    (₦2,800,000 × 35% × 3) ÷ (3 × 52)  = ₦18,846.15/week

-- ---------------------------------------------------------------------------
-- Admin user setup (via Supabase Auth — do not insert directly into profiles)
-- ---------------------------------------------------------------------------
--
-- 1. Open Supabase Dashboard → Authentication → Users → Add user
--    - Email:    admin@jalaride.ng
--    - Phone:    +2348000000001
--    - Password: (choose a strong password for local dev)
--
-- 2. Copy the new user's UUID from the Auth users table.
--
-- 3. Insert the matching profile row (replace <ADMIN_USER_UUID>):
--
--    INSERT INTO public.profiles (id, full_name, phone, email, role, is_active, nin_verified)
--    VALUES (
--      '<ADMIN_USER_UUID>',
--      'Jala Ride Admin',
--      '+2348000000001',
--      'admin@jalaride.ng',
--      'admin',
--      TRUE,
--      TRUE
--    );
--
-- 4. For phone-auth admin login, enable Phone provider under
--    Authentication → Providers and confirm the test OTP flow.
--
-- 5. Service-role API routes (cron, webhooks, NIMC) bypass RLS — keep
--    SUPABASE_SERVICE_ROLE_KEY server-side only.
