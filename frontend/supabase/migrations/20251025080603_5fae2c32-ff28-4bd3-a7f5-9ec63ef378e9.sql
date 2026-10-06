-- Add position/role tracking to rosters for team leaders
ALTER TABLE public.rosters ADD COLUMN IF NOT EXISTS is_team_leader BOOLEAN DEFAULT FALSE;

-- Update RLS policies to allow team leaders to view their program rosters
DROP POLICY IF EXISTS "Users can view rosters they have access to" ON public.rosters;

CREATE POLICY "Users can view rosters they have access to"
ON public.rosters
FOR SELECT
USING (
  can_access_program(auth.uid(), program_id) 
  OR auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.rosters r 
    WHERE r.user_id = auth.uid() 
    AND r.program_id = rosters.program_id 
    AND r.is_team_leader = TRUE
  )
);

-- Allow team leaders to manage their program rosters
CREATE POLICY "Team leaders can manage their program rosters"
ON public.rosters
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.rosters r 
    WHERE r.user_id = auth.uid() 
    AND r.program_id = rosters.program_id 
    AND r.is_team_leader = TRUE
  )
);

-- Update profiles RLS to allow admins to update user profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id OR get_user_role(auth.uid()) = ANY(ARRAY['admin_ii'::user_role, 'admin_iii'::user_role]));

-- Allow admins to view all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Approved users can view profiles"
ON public.profiles
FOR SELECT
USING (
  account_status = 'approved' 
  OR auth.uid() = id 
  OR get_user_role(auth.uid()) = ANY(ARRAY['admin_ii'::user_role, 'admin_iii'::user_role])
);

-- Create announcement read tracking
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.program_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can track their own announcement reads"
ON public.announcement_reads
FOR ALL
USING (auth.uid() = user_id);