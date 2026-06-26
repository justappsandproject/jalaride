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
