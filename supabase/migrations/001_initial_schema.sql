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
