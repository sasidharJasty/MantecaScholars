-- Add information content column to programs table
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS info_content TEXT;

-- Drop the policy if it exists to avoid conflicts when re-running
DROP POLICY IF EXISTS "Team Leaders can update program info" ON public.programs;

-- Policy to allow Team Leaders to update their program's info
-- Note: 'is_team_leader' column assumed to exist on 'rosters' from previous migrations
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
