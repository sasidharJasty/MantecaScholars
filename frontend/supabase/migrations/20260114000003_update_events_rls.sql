-- Update events RLS to allow viewing by everyone and management by Team Leaders

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view events they have access to" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;

-- 1. View: Everyone can view events (matching programs policy)
CREATE POLICY "Everyone can view events" ON public.events FOR SELECT USING (true);

-- 2. Manage: Admins (via can_access_program) OR Team Leaders
CREATE POLICY "Admins and Team Leaders can manage events" ON public.events
  FOR ALL
  USING (
    can_access_program(auth.uid(), program_id) OR
    EXISTS (
      SELECT 1 FROM public.rosters
      WHERE user_id = auth.uid()
      AND program_id = events.program_id
      AND is_team_leader = true
    )
  );
