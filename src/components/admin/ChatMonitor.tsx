import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChatRoom {
  id: string;
  name: string;
  program_id: string;
  message_count: number;
  last_activity: string | null;
}

interface Message {
  id: string;
  content: string;
  sender_name: string;
  created_at: string;
}

const ChatMonitor = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom);
    }
  }, [selectedRoom]);

  const fetchChatRooms = async () => {
    try {
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('name');

      if (error) throw error;

      // Get message counts for each room
      const roomsWithCounts = await Promise.all(
        (rooms || []).map(async (room) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('created_at')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...room,
            message_count: count || 0,
            last_activity: lastMsg?.created_at || null
          };
        })
      );

      setChatRooms(roomsWithCounts);
      if (roomsWithCounts.length > 0 && !selectedRoom) {
        setSelectedRoom(roomsWithCounts[0].id);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`]) || []);

      const formattedMessages = messagesData?.map(m => ({
        id: m.id,
        content: m.is_deleted ? '[Deleted]' : m.content,
        sender_name: profileMap.get(m.sender_id) || 'Unknown',
        created_at: m.created_at
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  if (loading) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Chat Monitor
          </CardTitle>
          <Badge variant="outline">{chatRooms.length} Rooms</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <div className="p-3 border-b bg-muted/30">
          <Select value={selectedRoom || undefined} onValueChange={setSelectedRoom}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a chat room" />
            </SelectTrigger>
            <SelectContent>
              {chatRooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{room.name}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {room.message_count} msgs
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages in this chat yet</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{msg.sender_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{msg.content}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Room Stats */}
        {selectedRoom && (
          <div className="p-3 border-t bg-muted/30">
            {(() => {
              const room = chatRooms.find(r => r.id === selectedRoom);
              return (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total Messages: <span className="font-medium text-foreground">{room?.message_count || 0}</span>
                  </span>
                  {room?.last_activity && (
                    <span className="text-muted-foreground">
                      Last activity: {new Date(room.last_activity).toLocaleDateString()}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatMonitor;
