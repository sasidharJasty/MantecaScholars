-- Fix Admin Chat Access definitively
-- Ensure System Admin program exists and is accessible
DO $$
DECLARE
  sys_prog_id UUID;
BEGIN
  SELECT id INTO sys_prog_id FROM public.programs WHERE name = 'System Admin';
  
  IF sys_prog_id IS NULL THEN
    INSERT INTO public.programs (name, description, website)
    VALUES ('System Admin', 'Internal program for system administration', 'https://admin.internal')
    RETURNING id INTO sys_prog_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE program_id = sys_prog_id) THEN
    INSERT INTO public.chat_rooms (program_id, name)
    VALUES (sys_prog_id, 'Admin HQ');
  END IF;
END $$;

-- Drop ANY existing policy that might conflict or be too restrictive
DROP POLICY IF EXISTS "Everyone can view programs" ON public.programs;

-- Recreate standard policy + explicit admin access
CREATE POLICY "Everyone can view programs" ON public.programs FOR SELECT USING (true);

-- Ensure admins can INSERT programs (needed for the auto-create logic in typescript to work for Level 2/3)
-- This matches existing but good to be sure
DROP POLICY IF EXISTS "Admin II/III can manage programs" ON public.programs;
CREATE POLICY "Admin II/III can manage programs" ON public.programs 
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin_ii', 'admin_iii'));
