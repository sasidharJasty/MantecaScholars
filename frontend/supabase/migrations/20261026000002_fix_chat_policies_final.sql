-- Fix missing policies for Chat Rooms to enable Lock/Unlock and lazy creation

-- 1. Ensure helper function for moderation exists and is consistent
CREATE OR REPLACE FUNCTION public.can_moderate_chat(check_user_id UUID, check_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    JOIN public.rosters r ON r.program_id = cr.program_id
    WHERE cr.id = check_room_id AND r.user_id = check_user_id AND r.is_team_leader = true
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = check_user_id AND ur.role IN ('admin_i', 'admin_ii', 'admin_iii')
  );
$$;

-- 2. Allow creating chat rooms (INSERT)
DROP POLICY IF EXISTS "Users can create chat rooms for their programs" ON public.chat_rooms;
CREATE POLICY "Users can create chat rooms for their programs"
ON public.chat_rooms
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rosters r 
    WHERE r.program_id = chat_rooms.program_id 
    AND r.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin_i', 'admin_ii', 'admin_iii')
  )
);

-- 3. Allow moderators to update chat rooms (UPDATE) - required for Lock/Unlock
DROP POLICY IF EXISTS "Moderators can update chat rooms" ON public.chat_rooms;
CREATE POLICY "Moderators can update chat rooms"
ON public.chat_rooms
FOR UPDATE
USING (
  can_moderate_chat(auth.uid(), id)
);
