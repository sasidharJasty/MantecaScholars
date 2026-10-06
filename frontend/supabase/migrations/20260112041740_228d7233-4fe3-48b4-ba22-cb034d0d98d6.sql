-- Create chat rooms table for program group chats
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(program_id)
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create direct messages table for admin/leader to member communication
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- Set replica identity for realtime
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- Helper function to check if user can access a chat room (is member of program)
CREATE OR REPLACE FUNCTION public.can_access_chat_room(check_user_id UUID, check_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    JOIN public.rosters r ON r.program_id = cr.program_id
    WHERE cr.id = check_room_id AND r.user_id = check_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = check_user_id AND ur.role IN ('admin_ii', 'admin_iii')
  ) OR EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    JOIN public.admin_assignments aa ON aa.program_id = cr.program_id
    WHERE cr.id = check_room_id AND aa.admin_id = check_user_id
  );
$$;

-- Helper function to check if user can moderate chat (team leader, admin)
CREATE OR REPLACE FUNCTION public.can_moderate_chat(check_user_id UUID, check_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    JOIN public.rosters r ON r.program_id = cr.program_id
    WHERE cr.id = check_room_id AND r.user_id = check_user_id AND r.is_team_leader = true
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = check_user_id AND ur.role IN ('admin_i', 'admin_ii', 'admin_iii')
  );
$$;

-- Chat Rooms Policies
CREATE POLICY "Users can view chat rooms for their programs"
ON public.chat_rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rosters r WHERE r.program_id = chat_rooms.program_id AND r.user_id = auth.uid()
  ) OR 
  get_user_role(auth.uid()) IN ('admin_ii', 'admin_iii') OR
  EXISTS (
    SELECT 1 FROM public.admin_assignments aa WHERE aa.program_id = chat_rooms.program_id AND aa.admin_id = auth.uid()
  )
);

-- Chat Messages Policies
CREATE POLICY "Users can view messages in their chat rooms"
ON public.chat_messages FOR SELECT
USING (can_access_chat_room(auth.uid(), room_id));

CREATE POLICY "Users can send messages to their chat rooms"
ON public.chat_messages FOR INSERT
WITH CHECK (
  can_access_chat_room(auth.uid(), room_id) AND
  sender_id = auth.uid()
);

CREATE POLICY "Moderators can update messages (pin/delete)"
ON public.chat_messages FOR UPDATE
USING (can_moderate_chat(auth.uid(), room_id));

-- Direct Messages Policies
CREATE POLICY "Users can view their direct messages"
ON public.direct_messages FOR SELECT
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send direct messages"
ON public.direct_messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can mark messages as read"
ON public.direct_messages FOR UPDATE
USING (recipient_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_chat_rooms_updated_at
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();