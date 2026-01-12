import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Pin, Trash2, MoreVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_initials: string;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  is_moderator: boolean;
}

interface ProgramChatProps {
  programId: string;
  programName: string;
  canModerate: boolean;
}

const ProgramChat = ({ programId, programName, canModerate }: ProgramChatProps) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
  }, [programId]);

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          // Fetch sender info
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', newMsg.sender_id)
            .single();

          // Check if sender is moderator
          const { data: senderRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', newMsg.sender_id)
            .single();

          const { data: isTeamLeader } = await supabase
            .from('rosters')
            .select('is_team_leader')
            .eq('user_id', newMsg.sender_id)
            .eq('program_id', programId)
            .single();

          const isMod = ['admin_i', 'admin_ii', 'admin_iii'].includes(senderRole?.role) || isTeamLeader?.is_team_leader;

          setMessages(prev => [...prev, {
            id: newMsg.id,
            content: newMsg.content,
            sender_id: newMsg.sender_id,
            sender_name: `${senderProfile?.first_name || ''} ${senderProfile?.last_name || ''}`.trim() || 'Unknown',
            sender_initials: `${senderProfile?.first_name?.[0] || ''}${senderProfile?.last_name?.[0] || ''}` || '?',
            is_pinned: newMsg.is_pinned,
            is_deleted: newMsg.is_deleted,
            created_at: newMsg.created_at,
            is_moderator: isMod
          }]);
          
          // Scroll to bottom
          setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const updated = payload.new as any;
          setMessages(prev => prev.map(msg => 
            msg.id === updated.id 
              ? { ...msg, is_pinned: updated.is_pinned, is_deleted: updated.is_deleted }
              : msg
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, programId]);

  const initializeChat = async () => {
    try {
      setLoading(true);

      // Get or create chat room for this program
      let { data: room } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('program_id', programId)
        .single();

      if (!room) {
        // Room doesn't exist yet, it will be created by admin
        setLoading(false);
        return;
      }

      setRoomId(room.id);

      // Fetch existing messages
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch sender profiles for all messages
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', senderIds);

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', senderIds);

      const { data: teamLeaders } = await supabase
        .from('rosters')
        .select('user_id, is_team_leader')
        .eq('program_id', programId)
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      const leaderMap = new Map(teamLeaders?.map(t => [t.user_id, t.is_team_leader]) || []);

      const formattedMessages: ChatMessage[] = messagesData?.map(m => {
        const sender = profileMap.get(m.sender_id);
        const role = roleMap.get(m.sender_id);
        const isLeader = leaderMap.get(m.sender_id);
        return {
          id: m.id,
          content: m.content,
          sender_id: m.sender_id,
          sender_name: `${sender?.first_name || ''} ${sender?.last_name || ''}`.trim() || 'Unknown',
          sender_initials: `${sender?.first_name?.[0] || ''}${sender?.last_name?.[0] || ''}` || '?',
          is_pinned: m.is_pinned,
          is_deleted: m.is_deleted,
          created_at: m.created_at,
          is_moderator: ['admin_i', 'admin_ii', 'admin_iii'].includes(role) || isLeader
        };
      }) || [];

      setMessages(formattedMessages);

      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      console.error('Error initializing chat:', error);
      toast({
        title: "Error",
        description: "Failed to load chat.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !roomId || !user) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const togglePin = async (messageId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_pinned: !currentPinned })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pin message.",
        variant: "destructive"
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_deleted: true, deleted_by: user?.id })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message.",
        variant: "destructive"
      });
    }
  };

  const pinnedMessages = messages.filter(m => m.is_pinned && !m.is_deleted);

  if (loading) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </Card>
    );
  }

  if (!roomId) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <p className="text-muted-foreground">Chat room not available for this program.</p>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          💬 {programName} Chat
          {pinnedMessages.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              <Pin className="w-3 h-3 mr-1" />
              {pinnedMessages.length} pinned
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 bg-primary/5 border-b">
          <p className="text-xs text-muted-foreground mb-1">📌 Pinned Messages</p>
          {pinnedMessages.slice(0, 2).map(msg => (
            <p key={msg.id} className="text-sm truncate">
              <span className="font-medium">{msg.sender_name}:</span> {msg.content}
            </p>
          ))}
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.filter(m => !m.is_deleted).map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender_id === user?.id ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className={message.is_moderator ? 'bg-primary text-primary-foreground' : ''}>
                  {message.sender_initials}
                </AvatarFallback>
              </Avatar>
              <div className={`max-w-[70%] ${message.sender_id === user?.id ? 'text-right' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {message.sender_name}
                  </span>
                  {message.is_moderator && (
                    <Badge variant="outline" className="text-xs">Mod</Badge>
                  )}
                  {message.is_pinned && (
                    <Pin className="w-3 h-3 text-primary" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {canModerate && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => togglePin(message.id, message.is_pinned)}>
                          <Pin className="w-4 h-4 mr-2" />
                          {message.is_pinned ? 'Unpin' : 'Pin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteMessage(message.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className={`rounded-lg px-3 py-2 ${
                  message.sender_id === user?.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <CardContent className="pt-2 pb-4 border-t">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProgramChat;
