-- Add member_id and account_status to profiles
ALTER TABLE public.profiles 
ADD COLUMN member_id TEXT UNIQUE,
ADD COLUMN account_status TEXT DEFAULT 'pending' CHECK (account_status IN ('pending', 'approved', 'rejected'));

-- Create index for member_id lookups
CREATE INDEX idx_profiles_member_id ON public.profiles(member_id);

-- Create program_announcements table for admin posts
CREATE TABLE public.program_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on program_announcements
ALTER TABLE public.program_announcements ENABLE ROW LEVEL SECURITY;

-- Admins can manage announcements for their programs
CREATE POLICY "Admins can manage announcements"
ON public.program_announcements
FOR ALL
USING (can_access_program(auth.uid(), program_id));

-- Users can view announcements for their programs or targeted to them
CREATE POLICY "Users can view their announcements"
ON public.program_announcements
FOR SELECT
USING (
  can_access_program(auth.uid(), program_id) OR
  target_user_id = auth.uid() OR
  (target_user_id IS NULL AND EXISTS (
    SELECT 1 FROM public.rosters 
    WHERE user_id = auth.uid() AND program_id = program_announcements.program_id
  ))
);

-- Add trigger for updated_at
CREATE TRIGGER update_program_announcements_updated_at
BEFORE UPDATE ON public.program_announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user to set account_status to pending
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, account_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    'guest',
    'pending'
  );
  RETURN NEW;
END;
$$;

-- Update profiles RLS to only allow approved users to sign in
CREATE POLICY "Only approved users can authenticate"
ON public.profiles
FOR SELECT
USING (account_status = 'approved' OR auth.uid() = id);