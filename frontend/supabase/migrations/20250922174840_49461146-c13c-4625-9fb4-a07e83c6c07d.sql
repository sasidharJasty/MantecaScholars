-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin_i', 'admin_ii', 'admin_iii', 'student', 'guest');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role user_role DEFAULT 'guest',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create programs table
CREATE TABLE public.programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  website TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rosters table
CREATE TABLE public.rosters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  position TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, user_id)
);

-- Create events table for schedules
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin assignments table
CREATE TABLE public.admin_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_id, program_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_assignments ENABLE ROW LEVEL SECURITY;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user can access program
CREATE OR REPLACE FUNCTION can_access_program(user_id UUID, prog_id UUID)
RETURNS BOOLEAN AS $$
  SELECT 
    CASE 
      WHEN get_user_role(user_id) IN ('admin_ii', 'admin_iii') THEN TRUE
      WHEN get_user_role(user_id) = 'admin_i' THEN 
        EXISTS (SELECT 1 FROM public.admin_assignments WHERE admin_id = user_id AND program_id = prog_id)
      ELSE FALSE
    END;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- RLS Policies for programs
CREATE POLICY "Everyone can view programs" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Admin II/III can manage programs" ON public.programs 
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin_ii', 'admin_iii'));

-- RLS Policies for rosters
CREATE POLICY "Users can view rosters they have access to" ON public.rosters 
  FOR SELECT USING (can_access_program(auth.uid(), program_id) OR auth.uid() = user_id);
CREATE POLICY "Admins can manage rosters" ON public.rosters 
  FOR ALL USING (can_access_program(auth.uid(), program_id));

-- RLS Policies for events
CREATE POLICY "Users can view events they have access to" ON public.events 
  FOR SELECT USING (can_access_program(auth.uid(), program_id));
CREATE POLICY "Admins can manage events" ON public.events 
  FOR ALL USING (can_access_program(auth.uid(), program_id));

-- RLS Policies for admin assignments
CREATE POLICY "Admin II/III can view all assignments" ON public.admin_assignments 
  FOR SELECT USING (get_user_role(auth.uid()) IN ('admin_ii', 'admin_iii'));
CREATE POLICY "Admin II/III can manage assignments" ON public.admin_assignments 
  FOR ALL USING (get_user_role(auth.uid()) IN ('admin_ii', 'admin_iii'));

-- Insert existing programs
INSERT INTO public.programs (name, website, description) VALUES
('World Scholars Cup', 'https://www.worldscholarscup.org/', 'An international academic program that brings together students from around the world to discuss and debate current issues.'),
('Speech and Debate', 'https://www.speechanddebate.org/', 'Developing critical thinking and communication skills through competitive speech and debate tournaments.'),
('Mock Trial', 'https://www.constitutionalrights.org/', 'Students learn about the legal system by participating in mock courtroom proceedings.'),
('Science Olympiad', 'https://www.soinc.org/', 'Science competition that emphasizes hands-on learning and real-world problem solving.'),
('Quiz Bowl', 'https://www.naqt.com/', 'Academic competition featuring questions from various subjects including literature, science, and history.'),
('Model UN', 'https://www.nmun.org/', 'Students simulate United Nations committees to learn about diplomacy and international relations.'),
('Skills USA', 'https://www.skillsusa.org/', 'Career and technical education organization helping students develop technical and leadership skills.'),
('UNICEF Club', 'https://www.unicefusa.org/', 'Students advocate for children''s rights and participate in humanitarian service projects.'),
('Women in STEM', 'https://www.womeninstem.org/', 'Empowering young women to pursue careers in science, technology, engineering, and mathematics.'),
('Scholastic Art and Writing', 'https://www.artandwriting.org/', 'Recognizing creative teenagers through the nation''s longest-running writing and art competition.'),
('AMSA (American Medical Students Association)', 'https://www.amsa.org/', 'Preparing students for careers in medicine through education and advocacy.'),
('Brain Bee', 'https://www.brainfacts.org/', 'Neuroscience competition that motivates students to learn about the brain and neuroscience careers.');

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    'guest'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();