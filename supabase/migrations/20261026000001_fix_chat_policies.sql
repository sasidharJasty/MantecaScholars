-- Fix missing policies for Chat Rooms to enable Lock/Unlock and lazy creation

-- 1. Allow creating chat rooms (INSERT)
-- This is needed because ProgramMain.tsx tries to lazily create a room if one doesn't exist.
-- We allow any member of the program or any admin to create the room.
CREATE POLICY "Users can create chat rooms for their programs"
ON public.chat_rooms
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rosters r 
    WHERE r.program_id = chat_rooms.program_id 
    AND r.user_id = auth.uid()
  ) OR 
  -- Check if user is an admin (using the helper function or direct role check)
  get_user_role(auth.uid()) IN ('admin_i', 'admin_ii', 'admin_iii') 
);

-- 2. Allow moderators to update chat rooms (UPDATE) - required for Lock/Unlock
CREATE POLICY "Moderators can update chat rooms"
ON public.chat_rooms
FOR UPDATE
USING (
  can_moderate_chat(auth.uid(), id)
);
