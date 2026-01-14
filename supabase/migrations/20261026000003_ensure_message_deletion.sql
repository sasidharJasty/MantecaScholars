-- Ensure chat message deletion works for admins

-- 1. Ensure the is_deleted flag exists on messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 2. Drop the update policy to ensure a clean slate
DROP POLICY IF EXISTS "Moderators can update messages (pin/delete)" ON public.chat_messages;

-- 3. Recreate the policy allowing admins/team leaders to soft-delete messages
-- Note: We use the secure can_moderate_chat function we defined earlier
CREATE POLICY "Moderators can update messages (pin/delete)"
ON public.chat_messages
FOR UPDATE
USING (
  can_moderate_chat(auth.uid(), room_id)
);
