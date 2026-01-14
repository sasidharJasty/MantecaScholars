-- Fix missing columns causing 400 errors

-- 1. Fix Rosters table (is_muted, is_team_leader)
ALTER TABLE public.rosters ADD COLUMN IF NOT EXISTS is_team_leader BOOLEAN DEFAULT FALSE;
ALTER TABLE public.rosters ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

-- 2. Fix Chat Rooms table (is_locked)
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- 3. Fix Chat Messages table (sender_name, is_deleted, reply_to_id)
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL;

-- 4. Update 'sender_name' for existing messages if it's null
-- This is a best-effort update using profiles
DO $$
BEGIN
    UPDATE public.chat_messages
    SET sender_name = (
        SELECT (first_name || ' ' || last_name)
        FROM public.profiles
        WHERE profiles.id = chat_messages.sender_id
    )
    WHERE sender_name IS NULL;
END $$;
