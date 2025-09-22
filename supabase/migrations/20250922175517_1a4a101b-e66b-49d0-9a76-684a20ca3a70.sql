-- Fix security issues by setting search_path for functions
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION can_access_program(user_id UUID, prog_id UUID)
RETURNS BOOLEAN AS $$
  SELECT 
    CASE 
      WHEN get_user_role(user_id) IN ('admin_ii', 'admin_iii') THEN TRUE
      WHEN get_user_role(user_id) = 'admin_i' THEN 
        EXISTS (SELECT 1 FROM public.admin_assignments WHERE admin_id = user_id AND program_id = prog_id)
      ELSE FALSE
    END;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;