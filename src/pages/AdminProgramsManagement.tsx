import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, MessageSquare, Plus, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }
    
    // Only admin_i users should access this page
    if (profile.role !== 'admin_i') {
      navigate('/dashboard');
      return;
    }

    fetchPrograms();
  }, [user, profile, navigate]);

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true);

      // Fetch programs assigned to this admin
      const { data: assignments, error: assignmentsError } = await supabase
        .from('admin_assignments')
        .select('program_id')
        .eq('admin_id', user?.id);

      if (assignmentsError) throw assignmentsError;

      const programIds = assignments?.map(a => a.program_id) || [];

      if (programIds.length === 0) {
        setPrograms([]);
        return;
      }

      // Fetch program details
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .in('id', programIds)
        .order('name');

      if (programsError) throw programsError;

      // Fetch stats for each program
      const programsWithStats = await Promise.all(
        (programsData || []).map(async (program) => {
          const [
            { count: memberCount },
            { count: teamLeaderCount },
            { count: eventCount },
            { count: announcementCount }
          ] = await Promise.all([
            supabase.from('rosters').select('*', { count: 'exact', head: true }).eq('program_id', program.id),
            supabase.from('rosters').select('*', { count: 'exact', head: true }).eq('program_id', program.id).eq('is_team_leader', true),
            supabase.from('events').select('*', { count: 'exact', head: true }).eq('program_id', program.id),
            supabase.from('program_announcements').select('*', { count: 'exact', head: true }).eq('program_id', program.id)
          ]);

          return {
            ...program,
            memberCount: memberCount || 0,
            teamLeaderCount: teamLeaderCount || 0,
            eventCount: eventCount || 0,
            announcementCount: announcementCount || 0
          };
        })
      );

      setPrograms(programsWithStats);
    } catch (error: any) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Error",
        description: "Failed to load programs.",
        variant: "destructive"
      });
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProgram || !user) return;

    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          program_id: selectedProgram.id,
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          event_date: formData.get('event_date') as string,
          location: formData.get('location') as string,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully."
      });
      
      setEventDialogOpen(false);
      fetchPrograms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create event.",
        variant: "destructive"
      });
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProgram || !user) return;

    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase
        .from('program_announcements')
        .insert({
          program_id: selectedProgram.id,
          title: formData.get('title') as string,
          content: formData.get('content') as string,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement posted successfully."
      });
      
      setAnnouncementDialogOpen(false);
      fetchPrograms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to post announcement.",
        variant: "destructive"
      });
    }
  };

  if (loading || loadingPrograms) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading programs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">My Programs</h1>
          <p className="text-muted-foreground">
            Manage events, announcements, and rosters for your assigned programs.
          </p>
        </div>

        {programs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">You haven't been assigned to any programs yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {programs.map((program) => (
              <Card key={program.id} className="border-primary/10 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{program.name}</CardTitle>
                      {program.description && (
                        <CardDescription>{program.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">{program.memberCount}</div>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <Users className="w-6 h-6 text-accent-gold mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">{program.teamLeaderCount}</div>
                      <p className="text-xs text-muted-foreground">Team Leaders</p>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">{program.eventCount}</div>
                      <p className="text-xs text-muted-foreground">Events</p>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">{program.announcementCount}</div>
                      <p className="text-xs text-muted-foreground">Announcements</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Dialog open={eventDialogOpen && selectedProgram?.id === program.id} onOpenChange={setEventDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedProgram(program)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Event for {program.name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                          <div>
                            <Label htmlFor="title">Event Title</Label>
                            <Input id="title" name="title" required />
                          </div>
                          <div>
                            <Label htmlFor="event_date">Date & Time</Label>
                            <Input id="event_date" name="event_date" type="datetime-local" required />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" rows={3} />
                          </div>
                          <Button type="submit" className="w-full">Create Event</Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={announcementDialogOpen && selectedProgram?.id === program.id} onOpenChange={setAnnouncementDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedProgram(program)}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Post Announcement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Post Announcement for {program.name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                          <div>
                            <Label htmlFor="ann-title">Title</Label>
                            <Input id="ann-title" name="title" required />
                          </div>
                          <div>
                            <Label htmlFor="content">Message</Label>
                            <Textarea id="content" name="content" rows={5} required />
                          </div>
                          <Button type="submit" className="w-full">Post Announcement</Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" onClick={() => navigate(`/admin/programs/${program.id}/roster`)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Roster
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminProgramsManagement;
