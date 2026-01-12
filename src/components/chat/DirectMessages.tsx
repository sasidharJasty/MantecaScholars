import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, ArrowLeft, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DirectMessage {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  user_id: string;
  user_name: string;
  user_initials: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface DirectMessagesProps {
  preselectedUserId?: string;
}

const DirectMessages = ({ preselectedUserId }: DirectMessagesProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; initials: string } | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; initials: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (preselectedUserId && user) {
      selectUserById(preselectedUserId);
    }
  }, [preselectedUserId, user]);

  useEffect(() => {
    if (selectedUser && user) {
      fetchMessages(selectedUser.id);
      markAsRead(selectedUser.id);
    }
  }, [selectedUser, user]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('direct-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages'
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage;
          if (newMsg.sender_id === user?.id || newMsg.recipient_id === user?.id) {
            if (selectedUser && (newMsg.sender_id === selectedUser.id || newMsg.recipient_id === selectedUser.id)) {
              setMessages(prev => [...prev, newMsg]);
              if (newMsg.recipient_id === user?.id) {
                markAsRead(selectedUser.id);
              }
              setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchConversations = async () => {
    try {
      // Get all direct messages involving the user
      const { data: allMessages, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, DirectMessage[]>();
      allMessages?.forEach(msg => {
        const partnerId = msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id;
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, []);
        }
        conversationMap.get(partnerId)!.push(msg);
      });

      // Get partner profiles
      const partnerIds = Array.from(conversationMap.keys());
      if (partnerIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', partnerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const convos: Conversation[] = partnerIds.map(partnerId => {
        const msgs = conversationMap.get(partnerId)!;
        const lastMsg = msgs[0];
        const unread = msgs.filter(m => m.recipient_id === user?.id && !m.is_read).length;
        const partner = profileMap.get(partnerId);
        const name = `${partner?.first_name || ''} ${partner?.last_name || ''}`.trim() || 'Unknown';
        
        return {
          user_id: partnerId,
          user_name: name,
          user_initials: `${partner?.first_name?.[0] || ''}${partner?.last_name?.[0] || ''}` || '?',
          last_message: lastMsg.content,
          last_message_time: lastMsg.created_at,
          unread_count: unread
        };
      });

      setConversations(convos.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      ));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectUserById = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', userId)
        .single();

      if (profile) {
        setSelectedUser({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}` || '?'
        });
      }
    } catch (error) {
      console.error('Error selecting user:', error);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markAsRead = async (partnerId: string) => {
    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', partnerId)
        .eq('recipient_id', user?.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .neq('id', user?.id)
        .limit(10);

      if (error) throw error;

      setSearchResults(data?.map(p => ({
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
        initials: `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}` || '?'
      })) || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedUser.id,
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

  if (loading) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </Card>
    );
  }

  if (selectedUser) {
    return (
      <Card className="h-[500px] flex flex-col">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback>{selectedUser.initials}</AvatarFallback>
            </Avatar>
            {selectedUser.name}
          </CardTitle>
        </CardHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender_id === user?.id ? 'flex-row-reverse' : ''}`}
              >
                <div className={`max-w-[70%] ${message.sender_id === user?.id ? 'text-right' : ''}`}>
                  <div className={`rounded-lg px-3 py-2 ${
                    message.sender_id === user?.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.content}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
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
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Direct Messages
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            className="pl-9"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-auto">
            {searchResults.map(result => (
              <button
                key={result.id}
                onClick={() => {
                  setSelectedUser(result);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{result.initials}</AvatarFallback>
                </Avatar>
                <span>{result.name}</span>
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground">Search for a user to start chatting</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((convo) => (
              <button
                key={convo.user_id}
                onClick={() => setSelectedUser({
                  id: convo.user_id,
                  name: convo.user_name,
                  initials: convo.user_initials
                })}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{convo.user_initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{convo.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(convo.last_message_time).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{convo.last_message}</p>
                </div>
                {convo.unread_count > 0 && (
                  <Badge className="bg-primary">{convo.unread_count}</Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default DirectMessages;
