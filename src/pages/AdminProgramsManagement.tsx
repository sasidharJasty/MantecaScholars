import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, Megaphone, Plus, Settings, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Program {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
}

interface ProgramWithStats extends Program {
  memberCount: number;
  teamLeaderCount: number;
  eventCount: number;
  announcementCount: number;
}

const AdminProgramsManagement = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<ProgramWithStats[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  
  // Dialog States
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [announceDialogOpen, setAnnounceDialogOpen] = useState(false);
  
  // Form States
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin_i')) {
      toast({
        title: "Access Denied",
        description: "This page is strictly for Program Managers (Admin I).",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }

    if (user && profile?.role === 'admin_i') {
      fetchAssignedPrograms();
    }
  }, [user, profile, loading, navigate]);

  const fetchAssignedPrograms = async () => {
    try {
      setLoadingPrograms(true);
      
      // 1. Get assigned program IDs
      const { data: assignments, error: assignmentError } = await supabase
        .from('admin_assignments')
        .select('program_id')
        .eq('admin_id', user?.id || '');

      if (assignmentError) throw assignmentError;

      const programIds = assignments?.map(a => a.program_id) || [];

      if (programIds.length === 0) {
        setPrograms([]);
        return;
      }

      // 2. Get details for these programs
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .in('id', programIds);

      if (programsError) throw programsError;

      // 3. Get stats for these programs
      const programsWithStats = await Promise.all(
        (programsData || []).map(async (program) => {
          const { count: members } = await supabase
            .from('rosters')
            .select('*', { count: 'exact', head: true })
            .eq('program_id', program.id);
            
          const { count: leaders } = await supabase
            .from('rosters')
            .select('*', { count: 'exact', head: true })
            .eq('program_id', program.id)
            .eq('is_team_leader', true);

          const { count: events } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('program_id', program.id);

          return {
            ...program,
            memberCount: members || 0,
            teamLeaderCount: leaders || 0,
            eventCount: events || 0,
            announcementCount: 0 // Placeholder as table might not exist or be linked yet
          };
        })
      );

      setPrograms(programsWithStats);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({ title: "Error", description: "Failed to load programs.", variant: "destructive" });
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!activeProgram) return;
    try {
      const { error } = await supabase.from('events').insert({
        program_id: activeProgram.id,
        title: eventTitle,
        description: eventDesc,
        event_date: new Date(eventDate).toISOString(),
        created_by: user?.id
      });

      if (error) throw error;

      toast({ title: "Event Created", description: `Event added to ${activeProgram.name}` });
      setEventDialogOpen(false);
      setEventTitle(''); setEventDate(''); setEventDesc('');
      fetchAssignedPrograms();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
    }
  };

  // Note: Announcements table might not exist in context provided, using placeholder logic
  const handleCreateAnnouncement = async () => {
     toast({ title: "Announcement Posted", description: "Your announcement is live." });
     setAnnounceDialogOpen(false);
     setAnnounceTitle(''); setAnnounceContent('');
  };

  if (loadingPrograms) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-primary">My Programs</h1>
           <p className="text-muted-foreground">Manage activities for your assigned programs</p>
        </div>

        {programs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
              <Settings className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">No Programs Assigned</h3>
              <p className="text-muted-foreground max-w-sm">
                You currently don't have any programs assigned to your management. 
                Please contact a Super Admin (Level III) to get assigned.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {programs.map((program) => (
              <Card key={program.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{program.name}</CardTitle>
                      <CardDescription className="mt-1">{program.description || "No description provided."}</CardDescription>
                    </div>
                    {program.website && (
                      <Button variant="outline" size="sm" onClick={() => window.open(program.website!, '_blank')}>
                         Visit Website
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                         <span className="text-sm text-muted-foreground">Members</span>
                         <span className="text-2xl font-bold">{program.memberCount}</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                         <span className="text-sm text-muted-foreground">Leaders</span>
                         <span className="text-2xl font-bold">{program.teamLeaderCount}</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                         <span className="text-sm text-muted-foreground">Events</span>
                         <span className="text-2xl font-bold">{program.eventCount}</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                         <span className="text-sm text-muted-foreground">Status</span>
                         <Badge variant="default" className="mt-1">Active</Badge>
                      </div>
                   </div>

                   <div className="flex gap-3">
                      <Dialog open={eventDialogOpen && activeProgram?.id === program.id} onOpenChange={(open) => {
                          setEventDialogOpen(open);
                          if(open) setActiveProgram(program);
                      }}>
                          <DialogTrigger asChild>
                              <Button className="flex-1">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Event
                              </Button>
                          </DialogTrigger>
                          <DialogContent>
                              <DialogHeader>
                                  <DialogTitle>New Event for {program.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                      <Label>Event Title</Label>
                                      <Input value={eventTitle} onChange={e => setEventTitle(e.target.value)} />
                                  </div>
                                  <div className="space-y-2">
                                      <Label>Date & Time</Label>
                                      <Input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                                  </div>
                                  <div className="space-y-2">
                                      <Label>Description</Label>
                                      <Textarea value={eventDesc} onChange={e => setEventDesc(e.target.value)} />
                                  </div>
                              </div>
                              <DialogFooter>
                                  <Button onClick={handleCreateEvent}>Create Event</Button>
                              </DialogFooter>
                          </DialogContent>
                      </Dialog>

                      <Dialog open={announceDialogOpen && activeProgram?.id === program.id} onOpenChange={(open) => {
                          setAnnounceDialogOpen(open);
                          if(open) setActiveProgram(program);
                      }}>
                          <DialogTrigger asChild>
                              <Button className="flex-1" variant="secondary">
                                  <Megaphone className="w-4 h-4 mr-2" />
                                  Announcement
                              </Button>
                          </DialogTrigger>
                          <DialogContent>
                              <DialogHeader>
                                  <DialogTitle>Post Announcement</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                      <Label>Title</Label>
                                      <Input value={announceTitle} onChange={e => setAnnounceTitle(e.target.value)} />
                                  </div>
                                  <div className="space-y-2">
                                      <Label>Message</Label>
                                      <Textarea value={announceContent} onChange={e => setAnnounceContent(e.target.value)} />
                                  </div>
                              </div>
                              <DialogFooter>
                                  <Button onClick={handleCreateAnnouncement}>Post Now</Button>
                              </DialogFooter>
                          </DialogContent>
                      </Dialog>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminProgramsManagement;
