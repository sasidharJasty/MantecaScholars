import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Plus, Clock, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  created_by: string;
}

interface ProgramEventsProps {
  programId: string;
  canManage: boolean;
}

const ProgramEvents = ({ programId, canManage }: ProgramEventsProps) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    time: '12:00'
  });

  useEffect(() => {
    if (programId) {
      fetchEvents();
    }
  }, [programId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('program_id', programId)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      time: '12:00'
    });
    setDate(new Date());
    setSelectedEvent(null);
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !date || !user) {
      toast({ title: "Error", description: "Title and Date are required", variant: "destructive" });
      return;
    }

    try {
      // Combine date and time
      const dateTime = new Date(date);
      const [hours, minutes] = formData.time.split(':').map(Number);
      dateTime.setHours(hours, minutes);

      const eventData = {
        program_id: programId,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        event_date: dateTime.toISOString(),
        created_by: user.id
      };

      if (selectedEvent) {
          // Update
          const { error } = await supabase
            .from('events')
            .update(eventData)
            .eq('id', selectedEvent.id);
          
          if (error) throw error;
          toast({ title: "Success", description: "Event updated successfully" });
      } else {
          // Create
          const { error } = await supabase
            .from('events')
            .insert(eventData);

          if (error) throw error;
          toast({ title: "Success", description: "Event created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Event deleted" });
      fetchEvents();
      setIsDetailOpen(false);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (event: Event) => {
      const d = new Date(event.event_date);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      
      setFormData({
          title: event.title,
          description: event.description || '',
          location: event.location || '',
          time: timeStr
      });
      setDate(d);
      setSelectedEvent(event);
      setIsDetailOpen(false);
      setIsDialogOpen(true);
  };

  // Group events by month/upcoming
  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="font-semibold text-lg">Schedule</h3>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
                <DialogDescription>Schedule an event for this program.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Event Title</label>
                    <Input 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. Weekly Meeting"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Time</label>
                        <Input 
                            type="time" 
                            value={formData.time} 
                            onChange={(e) => setFormData({...formData, time: e.target.value})}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input 
                        value={formData.location} 
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="Room 101 or Zoom Link"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Details about the event..."
                    />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateEvent}>{selectedEvent ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="space-y-4 pb-4">
            {upcomingEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    No upcoming events scheduled.
                </div>
            )}
            
            {upcomingEvents.map((event) => (
                <div 
                    key={event.id} 
                    className="flex flex-col border rounded-lg p-3 hover:bg-accent/50 cursor-pointer transition-colors relative group"
                    onClick={() => { setSelectedEvent(event); setIsDetailOpen(true); }}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-primary">{event.title}</div>
                        <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                            {format(new Date(event.event_date), "MMM d")}
                        </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3" /> 
                        {format(new Date(event.event_date), "h:mm a")}
                    </div>
                    {event.location && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                        </div>
                    )}
                    <ChevronRight className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50" />
                </div>
            ))}

            {pastEvents.length > 0 && (
                <>
                    <h4 className="font-semibold text-sm text-muted-foreground mt-6 mb-2 uppercase tracking-wide">Past Events</h4>
                    {pastEvents.slice(0, 5).map((event) => (
                        <div 
                            key={event.id} 
                            className="flex flex-col border rounded-lg p-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer text-sm"
                            onClick={() => { setSelectedEvent(event); setIsDetailOpen(true); }}
                        >
                             <div className="flex justify-between">
                                <span className="font-medium">{event.title}</span>
                                <span className="text-muted-foreground">{format(new Date(event.event_date), "MMM d, yyyy")}</span>
                             </div>
                        </div>
                    ))}
                </>
            )}
          </div>
      </ScrollArea>

      {/* Event Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    {selectedEvent?.title}
                    <Badge variant={new Date(selectedEvent?.event_date || '').getTime() < Date.now() ? "secondary" : "default"}>
                        {new Date(selectedEvent?.event_date || '').getTime() < Date.now() ? "Past" : "Upcoming"}
                    </Badge>
                </DialogTitle>
                <DialogDescription>Event Details</DialogDescription>
            </DialogHeader>
            
            {selectedEvent && (
                <div className="space-y-4 py-2">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            {format(new Date(selectedEvent.event_date), "EEEE, MMMM d, yyyy")}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {format(new Date(selectedEvent.event_date), "h:mm a")}
                        </div>
                     </div>
                     
                     {selectedEvent.location && (
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{selectedEvent.location}</span>
                        </div>
                     )}

                     {selectedEvent.description && (
                         <div className="p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap">
                             {selectedEvent.description}
                         </div>
                     )}
                </div>
            )}

            <DialogFooter className="flex gap-2 sm:justify-between">
                {canManage && selectedEvent && (
                    <div className="flex gap-2">
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteEvent(selectedEvent.id)}>Delete</Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedEvent)}>Edit</Button>
                    </div>
                )}
                <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgramEvents;
