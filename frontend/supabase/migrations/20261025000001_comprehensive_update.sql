-- 1. Add information content column to programs table
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS info_content TEXT;

-- 2. Add sender_name to chat_messages to simplify chat logic & improve performance
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- 3. Policy to allow Team Leaders to update their program's info
-- Drop if exists to be safe
DROP POLICY IF EXISTS "Team Leaders can update program info" ON public.programs;

CREATE POLICY "Team Leaders can update program info" ON public.programs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.rosters 
    WHERE rosters.program_id = programs.id 
    AND rosters.user_id = auth.uid() 
    AND rosters.is_team_leader = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rosters 
    WHERE rosters.program_id = programs.id 
    AND rosters.user_id = auth.uid() 
    AND rosters.is_team_leader = true
  )
);

-- 4. Policies to allow Users to Join/Leave Programs (Manage their own roster)
-- This enables the "Select Programs" / "Manage My Programs" functionality
DROP POLICY IF EXISTS "Users can join programs" ON public.rosters;
CREATE POLICY "Users can join programs" ON public.rosters
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave programs" ON public.rosters;
CREATE POLICY "Users can leave programs" ON public.rosters
FOR DELETE
USING (auth.uid() = user_id);

-- 5. Helper function and trigger to ensure a Chat Room exists for every program
CREATE OR REPLACE FUNCTION public.handle_new_program_chat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_rooms (program_id, name)
  VALUES (NEW.id, 'General Chat');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_program_created_chat ON public.programs;
CREATE TRIGGER on_program_created_chat
  AFTER INSERT ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_program_chat();

-- 6. Backfill: Ensure existing programs have at least one chat room
INSERT INTO public.chat_rooms (program_id, name)
SELECT id, 'General Chat' FROM public.programs
WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE program_id = programs.id);
