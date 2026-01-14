-- Update handle_new_user to include member_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, first_name, last_name, account_status, member_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    'pending',
    NULLIF(NEW.raw_user_meta_data ->> 'member_id', '')
  );
  
  -- Insert default guest role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'guest');
  
  RETURN NEW;
END;
$$;
