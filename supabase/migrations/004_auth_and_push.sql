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
