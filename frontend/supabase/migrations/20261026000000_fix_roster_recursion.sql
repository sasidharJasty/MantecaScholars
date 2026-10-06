-- Fix infinite recursion in rosters policies by using a SECURITY DEFINER function

-- 1. Create helper function to check if a user is a team leader in a program
-- This function runs with the privileges of the creator (postgres/admin), bypassing RLS
CREATE OR REPLACE FUNCTION public.is_team_leader_of_program(user_uuid UUID, program_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.rosters 
    WHERE user_id = user_uuid 
    AND program_id = program_uuid 
    AND is_team_leader = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "Users can view rosters they have access to" ON public.rosters;
DROP POLICY IF EXISTS "Team leaders can manage their program rosters" ON public.rosters;

-- 3. Recreate "Users can view rosters they have access to"
CREATE POLICY "Users can view rosters they have access to"
ON public.rosters
FOR SELECT
USING (
  can_access_program(auth.uid(), program_id) 
  OR auth.uid() = user_id
  OR public.is_team_leader_of_program(auth.uid(), program_id)
);

-- 4. Recreate "Team leaders can manage their program rosters"
CREATE POLICY "Team leaders can manage their program rosters"
ON public.rosters
FOR ALL
USING (
  public.is_team_leader_of_program(auth.uid(), program_id)
);
