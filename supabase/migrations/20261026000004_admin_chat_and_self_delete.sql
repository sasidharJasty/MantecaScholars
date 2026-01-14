-- 1. Create a "System" program for global admin chat if not exists
-- We need this because chat_rooms requires a NOT NULL program_id
DO $$
DECLARE
  sys_prog_id UUID;
BEGIN
  -- Try to find existing system program
  SELECT id INTO sys_prog_id FROM public.programs WHERE name = 'System Admin';
  
  -- If not found, create it
  IF sys_prog_id IS NULL THEN
    INSERT INTO public.programs (name, description, website)
    VALUES ('System Admin', 'Internal program for system administration', 'https://admin.internal')
    RETURNING id INTO sys_prog_id;
  END IF;

  -- Ensure the Admin Chat Room exists linked to this program
  IF NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE program_id = sys_prog_id) THEN
    INSERT INTO public.chat_rooms (program_id, name)
    VALUES (sys_prog_id, 'Admin HQ');
  END IF;
END $$;

-- 2. Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.chat_messages
FOR UPDATE
USING (
  sender_id = auth.uid()
);

-- 3. Update 'can_access_chat_room' to allow admins to access the 'System Admin' room
-- The existing function checks 'admin_ii', 'admin_iii' globally, but maybe not 'admin_i'.
-- Also standard 'admin_assignments' logic handles access if we assign admins effectively.
-- But for simplicity, let's just make sure all admins can access the System Admin program chat.

-- We override the function again to be sure
CREATE OR REPLACE FUNCTION public.can_access_chat_room(check_user_id UUID, check_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    JOIN public.rosters r ON r.program_id = cr.program_id
    WHERE cr.id = check_room_id AND r.user_id = check_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = check_user_id AND ur.role IN ('admin_i', 'admin_ii', 'admin_iii')
  ) OR EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    JOIN public.admin_assignments aa ON aa.program_id = cr.program_id
    WHERE cr.id = check_room_id AND aa.admin_id = check_user_id
  );
$$;
