import { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Send, Edit, Save, Plus, Lock, Unlock, Trash2, Ban, X, Reply, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { RoleBadge } from '@/components/common/RoleBadge';
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

interface ProgramDetails {
  id: string;
  name: string;
  info_content: string | null;
}

interface Message {
  id: string;
  content: string;
  sender_name: string;
  created_at: string;
  sender_id: string;
  is_deleted: boolean;
  reply_to_id?: string | null;
}

interface ProgramMember {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const ProgramMain = () => {
  const { programId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [program, setProgram] = useState<ProgramDetails | null>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedInfo, setEditedInfo] = useState('');
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Reply & Mention State
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [chatMembers, setChatMembers] = useState<ProgramMember[]>([]);
  const [showMemberlist, setShowMemberlist] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = ['admin_i', 'admin_ii', 'admin_iii'].includes(profile?.role || '');
  // Also check if they are a team leader for THIS program
  const [isTeamLeader, setIsTeamLeader] = useState(false);

  useEffect(() => {
    if (programId && user) {
      fetchProgramData();
      fetchChatRoom();
      checkUserStatus();
      fetchChatMembers();
    }
  }, [programId, user]);

  const fetchChatMembers = async () => {
      const { data } = await supabase
        .from('rosters')
        .select(`
            user_id,
            profiles:user_id (
                first_name,
                last_name,
                email
            )
        `)
        .eq('program_id', programId);
      
      if (data) {
          const formatted = data.map((d: any) => ({
              user_id: d.user_id,
              first_name: d.profiles?.first_name || '',
              last_name: d.profiles?.last_name || '',
              email: d.profiles?.email || ''
          }));
          setChatMembers(formatted);
      }
  };

  const checkUserStatus = async () => {
    const { data } = await supabase
        .from('rosters')
        .select('is_team_leader, is_muted')
        .eq('program_id', programId)
        .eq('user_id', user?.id)
        .single();
    
    if (data) {
        setIsTeamLeader(data.is_team_leader || false);
        setIsMuted(data.is_muted || false);
    }
  };

  const [senderRoles, setSenderRoles] = useState<Record<string, { role: string; isTeamLeader: boolean }>>({});

  useEffect(() => {
    const newSenderIds = messages
        .map(m => m.sender_id)
        .filter(id => id && !senderRoles[id]);
    
    if (newSenderIds.length > 0) {
        fetchSenderRoles([...new Set(newSenderIds)]);
    }
  }, [messages]);

  const fetchSenderRoles = async (userIds: string[]) => {
      if (!programId) return;
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, role')
        .in('id', userIds);
      
      const { data: rosterData } = await supabase
        .from('rosters')
        .select('user_id, is_team_leader')
        .eq('program_id', programId)
        .in('user_id', userIds);

      const newRoles: Record<string, { role: string; isTeamLeader: boolean }> = {};
      
      userIds.forEach(id => {
          const profile = profilesData?.find(p => p.id === id);
          const roster = rosterData?.find(r => r.user_id === id);
          newRoles[id] = {
              role: profile?.role || 'guest',
              isTeamLeader: roster?.is_team_leader || false
          };
      });

      setSenderRoles(prev => ({ ...prev, ...newRoles }));
  };

  const getPermissionLevel = (role: string, paramIsTeamLeader: boolean) => {
      if (['admin_i', 'admin_ii', 'admin_iii'].includes(role)) return 3;
      if (paramIsTeamLeader) return 2;
      return 1;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchProgramData = async () => {
    const { data } = await supabase
      .from('programs')
      .select('id, name, info_content')
      .eq('id', programId)
      .single();
    
    if (data) {
      setProgram(data);
      setEditedInfo(data.info_content || '');
    }
  };

  const fetchChatRoom = async () => {
    // Find room for this program
    let { data: rooms } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('program_id', programId)
      .limit(1);

    let currentRoomId = rooms && rooms.length > 0 ? rooms[0].id : null;
    let lockedStatus = rooms && rooms.length > 0 ? rooms[0].is_locked : false;

    // Create room if not exists
    if (!currentRoomId) {
      console.log('No chat room found, creating one...');
      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({ 
            program_id: programId, 
            name: 'General Chat' 
        })
        .select()
        .single();
      
      if (newRoom) {
          currentRoomId = newRoom.id;
          lockedStatus = false;
      }
      if (error) console.error("Failed to create room", error);
    }

    if (currentRoomId) {
      setRoomId(currentRoomId);
      setIsLocked(lockedStatus);
      fetchMessages(currentRoomId);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`room:${currentRoomId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages', 
          filter: `room_id=eq.${currentRoomId}` 
        }, (payload) => {
          setMessages(current => [...current, payload.new as Message]);
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chat_messages', 
          filter: `room_id=eq.${currentRoomId}` 
        }, (payload) => {
             // Handle message deletion/update updates
             setMessages(current => current.map(msg => 
                 msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
             ));
        })
        .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'chat_messages', 
          filter: `room_id=eq.${currentRoomId}` 
        }, (payload) => {
             setMessages(current => current.filter(msg => msg.id !== payload.old.id));
        })
        .subscribe();

      // Subscribe to Room Updates (Lock/Unlock)
      const roomChannel = supabase
        .channel(`room_meta:${currentRoomId}`)
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'chat_rooms', 
            filter: `id=eq.${currentRoomId}` 
        }, (payload) => {
            setIsLocked(payload.new.is_locked);
        })
        .subscribe();

      return () => { 
          supabase.removeChannel(channel); 
          supabase.removeChannel(roomChannel);
      };
    }
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
    
    if (isMuted) {
        toast({ title: "Muted", description: "You are muted in this chat.", variant: "destructive" });
        return;
    }

    if (isLocked && !isAdmin && !isTeamLeader) {
        toast({ title: "Chat Locked", description: "This chat is currently locked.", variant: "destructive" });
        return;
    }

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
      setShowMemberlist(false);
    }
  };

  const insertMention = (name: string) => {
      setNewMessage(prev => prev + `@${name} `);
      setShowMemberlist(false);
      inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setNewMessage(val);
      if (val.endsWith('@')) {
          setShowMemberlist(true);
      } else if (val.includes(' ') && showMemberlist) {
          // crude check to close list if we typed a space after @
          // Better regex logic could be used but this is simple "trigger" behavior
      }
  };

  const handleUpdateInfo = async () => {
    if (!program) return;
    
    const { error } = await supabase
      .from('programs')
      .update({ info_content: editedInfo })
      .eq('id', program.id);

    if (error) {
       toast({ title: "Error", description: "Failed to update info", variant: "destructive" });
    } else {
       toast({ title: "Success", description: "Program information updated" });
       setProgram({ ...program, info_content: editedInfo });
       setIsEditingInfo(false);
    }
  };

  const toggleChatLock = async () => {
      if (!roomId) return;
      const { error } = await supabase.from('chat_rooms').update({ is_locked: !isLocked }).eq('id', roomId);
      if (error) {
          toast({ title: "Error", description: "Failed to update chat status", variant: "destructive" });
      } else {
          toast({ title: isLocked ? "Chat Unlocked" : "Chat Locked", description: `The chat has been ${isLocked ? 'unlocked' : 'locked'}.` });
          setIsLocked(!isLocked);
      }
  };

  const deleteMessage = async (messageId: string) => {
      const msg = messages.find(m => m.id === messageId);
      if (!msg) return;

      let role = '';
      if (msg.sender_id === user?.id) {
          role = profile?.role || '';
      } else {
          role = senderRoles[msg.sender_id]?.role || '';
      }

      if (role === 'admin_iii' && msg.sender_id === user?.id) {
           // Admin III hard deletes their OWN messages
           const { error } = await supabase.from('chat_messages').delete().eq('id', messageId);
           if (error) {
               toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
           } else {
               setMessages(current => current.filter(m => m.id !== messageId));
           }
      } else {
          // Soft delete for everyone else or deleting others' messages
          const { error } = await supabase.from('chat_messages').update({ is_deleted: true, content: '[Message Deleted]' }).eq('id', messageId);
          if (error) {
              toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
          } else {
               // Optimistic update
               setMessages(current => current.map(m => m.id === messageId ? { ...m, is_deleted: true, content: '[Message Deleted]' } : m));
          }
      }
  };

  const canEditInfo = isAdmin || isTeamLeader;
  const canModerate = isAdmin || isTeamLeader;

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
        <div className="flex items-center justify-between shrink-0">
          <div>
             <h1 className="text-2xl font-bold">{program?.name || 'Loading...'}</h1>
             <p className="text-muted-foreground text-sm">Program Dashboard {isLocked && <Badge variant="destructive" className="ml-2">Chat Locked</Badge>}</p>
          </div>
          <div className="flex gap-2">
            {canModerate && (
                 <Button variant={isLocked ? "default" : "secondary"} size="sm" onClick={toggleChatLock} aria-label={isLocked ? "Unlock Chat" : "Lock Chat"}>
                    {isLocked ? <Unlock className="w-4 h-4 mr-2" aria-hidden="true" /> : <Lock className="w-4 h-4 mr-2" aria-hidden="true" />}
                    {isLocked ? "Unlock Chat" : "Lock Chat"}
                 </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/programs/${programId}/members`)} aria-label="View Program Members">
                <Users className="w-4 h-4 mr-2" aria-hidden="true" />
                View Members
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
           {/* Left: Info Board */}
           <Card className="lg:col-span-1 flex flex-col min-h-0">
              <CardHeader className="flex flex-row items-center justify-between shrink-0">
                 <CardTitle className="text-lg">Information Board</CardTitle>
                 {canEditInfo && !isEditingInfo && (
                   <Button variant="ghost" size="sm" onClick={() => { setEditedInfo(program?.info_content || ''); setIsEditingInfo(true); }} aria-label="Edit Information">
                     <Edit className="w-4 h-4" aria-hidden="true" />
                   </Button>
                 )}
                 {isEditingInfo && (
                   <div className="flex gap-2">
                     <Button variant="ghost" size="sm" onClick={() => setIsEditingInfo(false)}>Cancel</Button>
                     <Button size="sm" onClick={handleUpdateInfo}>Save</Button>
                   </div>
                 )}
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                 {isEditingInfo ? (
                   <Textarea 
                     className="min-h-[300px] h-full" 
                     value={editedInfo} 
                     onChange={(e) => setEditedInfo(e.target.value)} 
                     placeholder="Write important program information, announcements, or resources here..."
                     aria-label="Edit program information"
                   />
                 ) : (
                   <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                     {program?.info_content || <span className="text-muted-foreground italic">No information posted yet.</span>}
                   </div>
                 )}
              </CardContent>
           </Card>

           {/* Right: Chat */}
           <Card className="lg:col-span-2 flex flex-col min-h-0">
              <CardHeader className="py-3 border-b shrink-0 flex flex-row items-center justify-between">
                 <CardTitle className="text-lg flex items-center gap-2">
                    Program Chat
                    <Badge variant={isLocked ? "destructive" : "outline"} className="font-normal text-xs">
                        {isLocked ? "Locked" : "Live"}
                    </Badge>
                 </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 min-h-0 relative">
                 <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4" role="log" aria-live="polite" aria-label="Program Chat">
                       {messages.map((msg) => {
                         const isMe = msg.sender_id === user?.id;
                         const senderInfo = senderRoles[msg.sender_id];
                         const senderLevel = senderInfo ? getPermissionLevel(senderInfo.role, senderInfo.isTeamLeader) : 1;
                         const myLevel = getPermissionLevel(profile?.role || 'guest', isTeamLeader);
                         const canDelete = isMe || (myLevel > senderLevel);
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
                                 <span className="text-xs font-medium text-foreground">{senderInfo ? `${msg.sender_name} (${senderInfo.role === 'student' && senderInfo.isTeamLeader ? 'Team Leader' : senderInfo.role})` : msg.sender_name}</span>
                                 <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>

                              <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                  {/* Message Bubble */}
                                  <div className={`px-4 py-2 rounded-lg max-w-[80%] text-sm ${
                                    isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
                                  } ${msg.is_deleted ? 'opacity-50 italic' : ''}`}>
                                    {msg.content}
                                  </div>

                                  {/* Controls Container */}
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

                                        {/* Delete Button (Red X) */}
                                        {canDelete && (
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
                 <div className="p-4 border-t mt-auto shrink-0 relative">
                    {/* Member Suggestion List */}
                    {showMemberlist && (
                        <Card className="absolute bottom-[90px] left-4 w-64 max-h-48 overflow-auto z-50 shadow-lg border-2">
                            <CardHeader className="p-2 py-1 bg-muted/30"><CardTitle className="text-xs">Mention Member</CardTitle></CardHeader>
                            {chatMembers.map((member) => (
                                <div 
                                    key={member.user_id} 
                                    className="p-2 hover:bg-accent cursor-pointer text-sm transition-colors border-b last:border-0"
                                    onClick={() => insertMention(`${member.first_name} ${member.last_name}`)}
                                >
                                    {member.first_name} {member.last_name}
                                </div>
                            ))}
                        </Card>
                    )}

                    {/* Replying Banner */}
                    {replyingTo && (
                        <div className="flex items-center justify-between bg-muted/80 p-2 rounded mb-2 text-sm border-l-4 border-primary">
                            <span>Replying to <strong>{replyingTo.sender_name}</strong>: {replyingTo.content.substring(0, 50)}...</span>
                            <button onClick={() => setReplyingTo(null)}><X className="w-4 h-4" aria-label="Cancel reply" /></button>
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex gap-2">
                       <Input 
                         ref={inputRef}
                         value={newMessage}
                         onChange={handleInputChange}
                         placeholder={isLocked ? "Chat is locked by admin" : (isMuted ? "You have been muted" : "Type a message... (@ to mention)")}
                         disabled={(!isAdmin && !isTeamLeader && isLocked) || isMuted}
                         className="flex-1"
                         aria-label="Message Input"
                       />
                       <Button type="submit" size="icon" disabled={!newMessage.trim() || (!isAdmin && !isTeamLeader && isLocked) || isMuted} aria-label="Send Message">
                          <Send className="w-4 h-4" aria-hidden="true" />
                       </Button>
                    </form>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProgramMain;
