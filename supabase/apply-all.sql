-- Jala Ride — initial database schema
-- Government-aligned, identity-verified fleet ride-hailing platform

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (extends Supabase auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  nin TEXT UNIQUE,
  nin_verified BOOLEAN DEFAULT FALSE,
  nin_verified_at TIMESTAMPTZ,
  profile_photo_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('rider', 'driver', 'admin', 'superadmin')),
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Jala Ride user profiles linked to Supabase Auth';

-- ---------------------------------------------------------------------------
-- Vehicles (created before drivers; assigned_driver_id added after drivers)
-- ---------------------------------------------------------------------------
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('economy', 'comfort', 'xl', 'moto')),
  vehicle_photo_url TEXT,
  purchase_price DECIMAL(15, 2) NOT NULL,
  annual_rate_percent DECIMAL(5, 2) NOT NULL,
  amortization_years INTEGER NOT NULL,
  weekly_remittance DECIMAL(15, 2) GENERATED ALWAYS AS (
    (purchase_price * (annual_rate_percent / 100) * amortization_years) / (amortization_years * 52)
  ) STORED,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'retired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.vehicles IS 'Jala Ride government fleet vehicles with auto-calculated weekly remittance';

-- ---------------------------------------------------------------------------
-- Riders
-- ---------------------------------------------------------------------------
CREATE TABLE public.riders (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_payment TEXT DEFAULT 'card',
  loyalty_points INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.riders(id),
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.riders IS 'Jala Ride rider accounts';

-- ---------------------------------------------------------------------------
-- Drivers (vehicle_id FK; circular ref resolved via vehicles.assigned_driver_id later)
-- ---------------------------------------------------------------------------
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id),
  license_number TEXT UNIQUE,
  license_expiry DATE,
  license_photo_url TEXT,
  dss_clearance_status TEXT NOT NULL DEFAULT 'pending' CHECK (dss_clearance_status IN ('pending', 'approved', 'rejected')),
  dss_clearance_date TIMESTAMPTZ,
  dss_clearance_doc_url TEXT,
  police_clearance_status TEXT NOT NULL DEFAULT 'pending' CHECK (police_clearance_status IN ('pending', 'approved', 'rejected')),
  police_clearance_date TIMESTAMPTZ,
  police_clearance_doc_url TEXT,
  account_status TEXT NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending', 'active', 'suspended', 'deactivated')),
  online_status BOOLEAN DEFAULT FALSE,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  rating DECIMAL(3, 2) DEFAULT 5.00,
  total_trips INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.drivers IS 'Jala Ride driver accounts with clearance and location tracking';

-- Resolve circular FK: vehicles.assigned_driver_id -> drivers.id
ALTER TABLE public.vehicles
  ADD COLUMN assigned_driver_id UUID REFERENCES public.drivers(id);

-- ---------------------------------------------------------------------------
-- Remittances (weekly driver payments)
-- ---------------------------------------------------------------------------
CREATE TABLE public.remittances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  amount_due DECIMAL(15, 2) NOT NULL,
  amount_paid DECIMAL(15, 2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  paystack_reference TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (driver_id, week_start)
);

COMMENT ON TABLE public.remittances IS 'Jala Ride weekly vehicle remittance records';

-- ---------------------------------------------------------------------------
-- Trips
-- ---------------------------------------------------------------------------
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES public.riders(id),
  driver_id UUID REFERENCES public.drivers(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested', 'driver_assigned', 'driver_en_route',
    'arrived', 'in_progress', 'completed', 'cancelled'
  )),
  category TEXT NOT NULL CHECK (category IN ('economy', 'comfort', 'xl', 'moto')),
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,
  estimated_fare DECIMAL(10, 2),
  actual_fare DECIMAL(10, 2),
  distance_km DECIMAL(8, 2),
  duration_minutes INTEGER,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  paystack_reference TEXT,
  rider_rating INTEGER CHECK (rider_rating BETWEEN 1 AND 5),
  driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
  rider_rating_comment TEXT,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  cancelled_by TEXT,
  cancellation_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.trips IS 'Jala Ride trip bookings and lifecycle';

-- ---------------------------------------------------------------------------
-- Driver documents
-- ---------------------------------------------------------------------------
CREATE TABLE public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  doc_type TEXT NOT NULL CHECK (doc_type IN (
    'nin_slip', 'license_front', 'license_back',
    'vehicle_registration', 'insurance', 'dss_clearance', 'police_clearance', 'profile_photo'
  )),
  file_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (driver_id, doc_type)
);

COMMENT ON TABLE public.driver_documents IS 'Jala Ride driver verification documents';

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'Jala Ride in-app notifications';

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.audit_logs IS 'Jala Ride admin audit trail';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_drivers_online ON public.drivers (online_status) WHERE online_status = TRUE;
CREATE INDEX idx_drivers_vehicle ON public.drivers (vehicle_id);
CREATE INDEX idx_vehicles_assigned_driver ON public.vehicles (assigned_driver_id);
CREATE INDEX idx_trips_rider ON public.trips (rider_id);
CREATE INDEX idx_trips_driver ON public.trips (driver_id);
CREATE INDEX idx_trips_status ON public.trips (status);
CREATE INDEX idx_trips_share_token ON public.trips (share_token);
CREATE INDEX idx_remittances_driver ON public.remittances (driver_id);
CREATE INDEX idx_remittances_status ON public.remittances (payment_status);
CREATE INDEX idx_notifications_user ON public.notifications (user_id);
CREATE INDEX idx_audit_logs_admin ON public.audit_logs (admin_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger (profiles)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
-- Jala Ride — Row Level Security policies

-- ---------------------------------------------------------------------------
-- Helper: resolve current user role
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_role() IS 'Jala Ride: returns the role of the authenticated user';

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remittances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles — own read/update; admin read all
-- ---------------------------------------------------------------------------
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- drivers — own read; admin read/write all
-- ---------------------------------------------------------------------------
CREATE POLICY "drivers_select_own"
  ON public.drivers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "drivers_select_admin"
  ON public.drivers FOR SELECT
  USING (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "drivers_insert_admin"
  ON public.drivers FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "drivers_update_own"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "drivers_update_admin"
  ON public.drivers FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "drivers_delete_admin"
  ON public.drivers FOR DELETE
  USING (public.get_user_role() IN ('admin', 'superadmin'));

-- ---------------------------------------------------------------------------
-- trips — rider own; driver assigned; admin all
-- ---------------------------------------------------------------------------
CREATE POLICY "trips_select_rider"
  ON public.trips FOR SELECT
  USING (auth.uid() = rider_id);

CREATE POLICY "trips_select_driver"
  ON public.trips FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "trips_select_admin"
  ON public.trips FOR SELECT
  USING (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "trips_insert_rider"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "trips_update_rider"
  ON public.trips FOR UPDATE
  USING (auth.uid() = rider_id)
  WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "trips_update_driver"
  ON public.trips FOR UPDATE
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "trips_update_admin"
  ON public.trips FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "trips_delete_admin"
  ON public.trips FOR DELETE
  USING (public.get_user_role() IN ('admin', 'superadmin'));

-- ---------------------------------------------------------------------------
-- remittances — driver own; admin all
-- ---------------------------------------------------------------------------
CREATE POLICY "remittances_select_driver"
  ON public.remittances FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "remittances_select_admin"
  ON public.remittances FOR SELECT
  USING (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "remittances_insert_admin"
  ON public.remittances FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "remittances_update_admin"
  ON public.remittances FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "remittances_delete_admin"
  ON public.remittances FOR DELETE
  USING (public.get_user_role() IN ('admin', 'superadmin'));

-- ---------------------------------------------------------------------------
-- vehicles — public read; admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "vehicles_select_public"
  ON public.vehicles FOR SELECT
  USING (TRUE);

CREATE POLICY "vehicles_insert_admin"
  ON public.vehicles FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "vehicles_update_admin"
  ON public.vehicles FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "vehicles_delete_admin"
  ON public.vehicles FOR DELETE
  USING (public.get_user_role() IN ('admin', 'superadmin'));

-- ---------------------------------------------------------------------------
-- riders — admin only
-- ---------------------------------------------------------------------------
CREATE POLICY "riders_select_admin"
  ON public.riders FOR SELECT
  USING (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "riders_insert_admin"
  ON public.riders FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "riders_update_admin"
  ON public.riders FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "riders_delete_admin"
  ON public.riders FOR DELETE
  USING (public.get_user_role() IN ('admin', 'superadmin'));

-- ---------------------------------------------------------------------------
-- driver_documents — admin only
-- ---------------------------------------------------------------------------
CREATE POLICY "driver_documents_select_admin"
  ON public.driver_documents FOR SELECT
  USING (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "driver_documents_insert_admin"
  ON public.driver_documents FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "driver_documents_update_admin"
  ON public.driver_documents FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "driver_documents_delete_admin"
  ON public.driver_documents FOR DELETE
  USING (public.get_user_role() IN ('admin', 'superadmin'));

-- ---------------------------------------------------------------------------
-- notifications — admin only
-- ---------------------------------------------------------------------------
CREATE POLICY "notifications_select_admin"
  ON public.notifications FOR SELECT
  USING (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "notifications_insert_admin"
  ON public.notifications FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "notifications_update_admin"
  ON public.notifications FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "notifications_delete_admin"
  ON public.notifications FOR DELETE
  USING (public.get_user_role() IN ('admin', 'superadmin'));

-- ---------------------------------------------------------------------------
-- audit_logs — admin only
-- ---------------------------------------------------------------------------
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  USING (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "audit_logs_insert_admin"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "audit_logs_update_admin"
  ON public.audit_logs FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "audit_logs_delete_admin"
  ON public.audit_logs FOR DELETE
  USING (public.get_user_role() IN ('admin', 'superadmin'));
-- Jala Ride — enable Supabase Realtime on key tables

ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- Jala Ride — auth helpers & push tokens

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Allow users to create their own profile row after Supabase Auth signup
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "riders_select_own"
  ON public.riders FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "riders_insert_own"
  ON public.riders FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "drivers_insert_own"
  ON public.drivers FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "driver_documents_select_own"
  ON public.driver_documents FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "driver_documents_insert_own"
  ON public.driver_documents FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-create profile row when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', NEW.id::text),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'rider'),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
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
