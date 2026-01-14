import { useRef, useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, Trash2, Shield, Lock, X, Reply, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Message {
  id: string;
  content: string;
  sender_name: string;
  created_at: string;
  sender_id: string;
  is_deleted: boolean;
  reply_to_id?: string | null;
}

const AdminChat = () => {
  const { user, profile, isAdmin } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Mention State
  const [chatMembers, setChatMembers] = useState<{ id: string, name: string }[]>([]);
  const [showMemberlist, setShowMemberlist] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
     if (!profile) return; // Wait for profile to load
     if (!isAdmin()) {
         return; 
     }
     fetchAdminRoom();
     fetchChatMembers();
  }, [user, profile]);

  const fetchChatMembers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['admin_i', 'admin_ii', 'admin_iii']);
      
      if (data) {
          setChatMembers(data.map(d => ({
              id: d.id, 
              name: `${d.first_name} ${d.last_name}`
          })));
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setNewMessage(val);
      
      const cursorPos = e.target.selectionStart || 0;
      setCursorPosition(cursorPos);

      const lastAt = val.lastIndexOf('@', cursorPos - 1);
      if (lastAt !== -1) {
          const query = val.substring(lastAt + 1, cursorPos);
          // Only show popup if we are just starting to type a name (no spaces yet)
          if (!query.includes(' ')) {
              setMentionQuery(query);
              setShowMemberlist(true);
              return;
          }
      }
      setShowMemberlist(false);
  };

  const insertMention = (name: string) => {
      const lastAt = newMessage.lastIndexOf('@', cursorPosition - 1);
      if (lastAt !== -1) {
          const before = newMessage.substring(0, lastAt);
          const after = newMessage.substring(cursorPosition);
          const newText = `${before}@${name} ${after}`;
          setNewMessage(newText);
          setShowMemberlist(false);
          // Reset cursor/focus would require more complex logic with Input refs, usually just focusing is enough
          setTimeout(() => inputRef.current?.focus(), 0);
      }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchAdminRoom = async () => {
    try {
        // 1. Find the System Admin program first
        let { data: program } = await supabase.from('programs').select('id').eq('name', 'System Admin').maybeSingle();
        
        if (!program) {
            // Attempt to create it if it doesn't exist
            console.log("System Admin program missing, attempting to create...");
            const { data: newProgram, error: createError } = await supabase
                .from('programs')
                .insert({ 
                    name: 'System Admin', 
                    description: 'Internal program for system administration',
                    website: 'https://admin.internal'
                })
                .select('id')
                .single();
            
            if (createError) {
                console.error("Failed to create System Admin program:", createError);
                toast({ 
                    title: "Initialization Error", 
                    description: "System Admin program is missing and could not be created automatically. Please contact an Administrator Level III.", 
                    variant: "destructive" 
                });
                return;
            }
            program = newProgram;
        }

        // 2. Find the chat room
        let { data: room } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('program_id', program.id)
        .maybeSingle();

        if (!room) {
            console.log("Admin HQ room missing, attempting to create...");
             const { data: newRoom, error: roomError } = await supabase
                .from('chat_rooms')
                .insert({ 
                    program_id: program.id, 
                    name: 'Admin HQ' 
                })
                .select('id')
                .single();
            
            if (roomError) {
                console.error("Failed to create Admin HQ room:", roomError);
                toast({ 
                    title: "Initialization Error", 
                    description: "Failed to initialize Admin HQ chat room.", 
                    variant: "destructive" 
                });
                return;
            }
            room = newRoom;
        }

        if (room) {
            setRoomId(room.id);
            fetchMessages(room.id);
            subscribeToMessages(room.id);
        }
    } catch (err) {
        console.error("Unexpected error in fetchAdminRoom:", err);
    }
  };

  const subscribeToMessages = (id: string) => {
      const channel = supabase
        .channel(`admin_room:${id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages', 
          filter: `room_id=eq.${id}` 
        }, (payload) => {
          setMessages(current => [...current, payload.new as Message]);
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chat_messages', 
          filter: `room_id=eq.${id}` 
        }, (payload) => {
             setMessages(current => current.map(msg => 
                 msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
             ));
        })
        .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'chat_messages', 
          filter: `room_id=eq.${id}` 
        }, (payload) => {
             setMessages(current => current.filter(msg => msg.id !== payload.old.id));
        })
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
  };

  const fetchMessages = async (id: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, content, sender_name, created_at, sender_id, is_deleted, reply_to_id')
      .eq('room_id', id)
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (data) setMessages(data as Message[]);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !roomId || !profile) return;
    
    const msg = {
      room_id: roomId,
      content: newMessage.trim(),
      sender_id: user?.id,
      sender_name: `${profile.first_name} ${profile.last_name}`,
      is_deleted: false,
      reply_to_id: replyingTo?.id || null
    };

    const { error } = await supabase.from('chat_messages').insert(msg);
    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } else {
      setNewMessage('');
      setReplyingTo(null);
    }
  };

  const deleteMessage = async (messageId: string) => {
      // Admin III hard deletes their own messages
      if (profile?.role === 'admin_iii') {
          const { error } = await supabase.from('chat_messages').delete().eq('id', messageId);
          if (error) {
              toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
          } else {
              setMessages(current => current.filter(m => m.id !== messageId));
          }
      } else {
          // Others soft delete
          const { error } = await supabase.from('chat_messages').update({ is_deleted: true, content: '[Message Deleted]' }).eq('id', messageId);
          if (error) {
              toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
          }
      }
  };

  if (!isAdmin()) {
      return (
          <DashboardLayout>
              <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
                  <Lock className="w-16 h-16 text-muted-foreground" />
                  <h1 className="text-2xl font-bold">Access Denied</h1>
                  <p className="text-muted-foreground">This area is restricted to administrators only.</p>
              </div>
          </DashboardLayout>
      )
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin HQ</h1>
            <Badge variant="outline" className="ml-2"> confidential</Badge>
        </div>

           <Card className="flex flex-col flex-1 min-h-0 border-primary/20">
              <CardHeader className="py-3 border-b shrink-0 bg-muted/30">
                 <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Secure Communication Channel</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3" /> End-to-End Encrypted (Simulated)
                    </span>
                 </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 min-h-0 relative">
                 <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4" role="log" aria-live="polite" aria-label="Chat messages">
                       {messages.map((msg) => {
                         const isMe = msg.sender_id === user?.id;
                         const replyToMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                         
                         return (
                           <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative mb-2`}>
                              {/* Reply Context */}
                              {replyToMsg && (
                                  <div className={`text-xs text-muted-foreground bg-muted/30 p-1 rounded px-2 mb-1 border-l-2 border-primary/50 max-w-[80%]`}>
                                      <span className="font-semibold">{replyToMsg.sender_name}</span>: {replyToMsg.content.substring(0, 30)}{replyToMsg.content.length > 30 ? '...' : ''}
                                  </div>
                              )}

                              <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                 <span className="text-xs font-bold text-primary">{msg.sender_name}</span>
                                 <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>

                              <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                  <div className={`px-4 py-2 rounded-lg max-w-[80%] text-sm ${
                                    isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
                                  } ${msg.is_deleted ? 'opacity-50 italic' : ''}`}>
                                    {msg.content}
                                  </div>

                                  {!msg.is_deleted && (
                                    <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                        {/* Reply Button */}
                                        <button 
                                            title="Reply" 
                                            onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }} 
                                            className="text-muted-foreground hover:text-primary p-1"
                                            aria-label={`Reply to ${msg.sender_name}`}
                                        >
                                            <Reply className="w-4 h-4" />
                                        </button>

                                        {/* Delete Button (Red X for Admin own messages) */}
                                        {isMe && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <button 
                                                        title="Delete" 
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        aria-label="Delete message"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will hide the message content permanently.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteMessage(msg.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                  )}
                              </div>
                           </div>
                         );
                       })}
                    </div>
                 </ScrollArea>
                 <div className="p-4 border-t mt-auto shrink-0 bg-muted/10 relative">
                     {/* Replying Banner */}
                    {replyingTo && (
                        <div className="flex items-center justify-between bg-muted/80 p-2 rounded mb-2 text-sm border-l-4 border-primary">
                            <span>Replying to <strong>{replyingTo.sender_name}</strong>: {replyingTo.content.substring(0, 50)}...</span>
                            <button onClick={() => setReplyingTo(null)}><X className="w-4 h-4" aria-label="Cancel reply" /></button>
                        </div>
                    )}
                    {/* Mention Suggestions */}
                    {showMemberlist && (
                        <div className="absolute bottom-16 left-4 z-50 bg-background border rounded-lg shadow-lg w-64 max-h-48 overflow-y-auto p-1">
                            {chatMembers
                                .filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                                .map(member => (
                                    <button
                                        key={member.id}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded flex items-center gap-2"
                                        onClick={() => insertMention(member.name)}
                                    >
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                                            {member.name.substring(0,2).toUpperCase()}
                                        </div>
                                        {member.name}
                                    </button>
                                ))
                            }
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                       <Input 
                         ref={inputRef}
                         value={newMessage}
                         onChange={handleInputChange}
                         onKeyDown={(e) => { if (e.key === 'Escape') setShowMemberlist(false); }}
                         placeholder="Type a secure message to other admins (@ to mention)..."
                         className="flex-1"
                         aria-label="Message input"
                       />
                       <Button type="submit" size="icon" disabled={!newMessage.trim()} aria-label="Send message">
                          <Send className="w-4 h-4" aria-hidden="true" />
                       </Button>
                    </form>
                 </div>
              </CardContent>
           </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminChat;
