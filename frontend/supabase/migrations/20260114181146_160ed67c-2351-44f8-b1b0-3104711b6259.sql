-- Initialize chat rooms for all programs
INSERT INTO public.chat_rooms (program_id, name)
SELECT id, name || ' Chat' FROM public.programs
ON CONFLICT (program_id) DO NOTHING;