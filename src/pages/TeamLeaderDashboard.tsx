import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Users, Calendar, MessageSquare, Plus, TrendingUp, Bell } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Program {
  id: string;
  name: string;
  description: string | null;
  memberCount?: number;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  program_id: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  program_id: string;
}

const TeamLeaderDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMembers: 0, upcomingEvents: 0, announcements: 0 });

  // Form states
  const [eventDialog, setEventDialog] = useState(false);
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', location: '', description: '' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', targetUser: '' });

  useEffect(() => {
    if (user) {
      fetchTeamLeaderPrograms();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProgram) {
      fetchProgramStats();
    }
  }, [selectedProgram]);

  const fetchTeamLeaderPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rosters')
        .select('program_id, programs(id, name, description)')
        .eq('user_id', user?.id)
        .eq('is_team_leader', true);

      if (error) throw error;

      const programsData = data?.map(r => ({
        id: (r.programs as any).id,
        name: (r.programs as any).name,
        description: (r.programs as any).description
      })) || [];

      setPrograms(programsData);
      if (programsData.length > 0) {
        setSelectedProgram(programsData[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Error",
        description: "Failed to load your programs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramStats = async () => {
    try {
      // Get member count
      const { count: memberCount } = await supabase
        .from('rosters')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', selectedProgram);

      // Get upcoming events count
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', selectedProgram)
        .gte('event_date', new Date().toISOString());

      // Get announcements count
      const { count: announcementsCount } = await supabase
        .from('program_announcements')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', selectedProgram);

      setStats({
        totalMembers: memberCount || 0,
        upcomingEvents: eventsCount || 0,
        announcements: announcementsCount || 0
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.date || !selectedProgram) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const eventDateTime = `${eventForm.date}T${eventForm.time || '00:00'}:00`;
      
      const { error } = await supabase
        .from('events')
        .insert({
          title: eventForm.title,
          event_date: eventDateTime,
          location: eventForm.location,
          description: eventForm.description,
          program_id: selectedProgram,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Event Created",
        description: "Your event has been created successfully."
      });

      setEventDialog(false);
      setEventForm({ title: '', date: '', time: '', location: '', description: '' });
      fetchProgramStats();
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event.",
        variant: "destructive"
      });
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content || !selectedProgram) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('program_announcements')
        .insert({
          title: announcementForm.title,
          content: announcementForm.content,
          program_id: selectedProgram,
          created_by: user?.id,
          target_user_id: announcementForm.targetUser || null
        });

      if (error) throw error;

      toast({
        title: "Announcement Posted",
        description: "Your announcement has been posted successfully."
      });

      setAnnouncementDialog(false);
      setAnnouncementForm({ title: '', content: '', targetUser: '' });
      fetchProgramStats();
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to create announcement.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardHeader>
              <CardTitle>No Programs Assigned</CardTitle>
              <CardDescription>You are not a team leader for any programs yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentProgram = programs.find(p => p.id === selectedProgram);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Header */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/20 to-primary/5 rounded-3xl blur-3xl -z-10"></div>
          <div className="relative bg-card/50 backdrop-blur-sm rounded-3xl p-8 border border-primary/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-accent-gold via-primary to-primary/60 bg-clip-text text-transparent mb-3">
                  Team Leader Dashboard
                </h1>
                <p className="text-lg text-muted-foreground">
                  Welcome, <span className="font-semibold text-foreground">{profile?.first_name}</span>
                </p>
              </div>
              <Badge className="bg-accent-gold text-accent-gold-foreground px-4 py-2 text-base shadow-lg">
                <Crown className="w-5 h-5 mr-2" />
                Team Leader
              </Badge>
            </div>

            {/* Program Selector */}
            <div className="flex items-center gap-4">
              <Label className="text-foreground font-semibold">Managing:</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programs.map(program => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground mt-1">Active members</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.upcomingEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Announcements</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.announcements}</div>
              <p className="text-xs text-muted-foreground mt-1">Total posts</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Event */}
          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Schedule Event
              </CardTitle>
              <CardDescription>Create a new event for {currentProgram?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={eventDialog} onOpenChange={setEventDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>Schedule an event for your team</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="event-title">Event Title *</Label>
                      <Input
                        id="event-title"
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        placeholder="Team Meeting"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event-date">Date *</Label>
                        <Input
                          id="event-date"
                          type="date"
                          value={eventForm.date}
                          onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-time">Time</Label>
                        <Input
                          id="event-time"
                          type="time"
                          value={eventForm.time}
                          onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="event-location">Location</Label>
                      <Input
                        id="event-location"
                        value={eventForm.location}
                        onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                        placeholder="Conference Room A"
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-description">Description</Label>
                      <Textarea
                        id="event-description"
                        value={eventForm.description}
                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        placeholder="Event details..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleCreateEvent} className="w-full">Create Event</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Post Announcement */}
          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                Post Announcement
              </CardTitle>
              <CardDescription>Share updates with your team</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={announcementDialog} onOpenChange={setAnnouncementDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    New Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                    <DialogDescription>Post a message to your team</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="announcement-title">Title *</Label>
                      <Input
                        id="announcement-title"
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                        placeholder="Important Update"
                      />
                    </div>
                    <div>
                      <Label htmlFor="announcement-content">Content *</Label>
                      <Textarea
                        id="announcement-content"
                        value={announcementForm.content}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                        placeholder="Share your message..."
                        rows={5}
                      />
                    </div>
                    <Button onClick={handleCreateAnnouncement} className="w-full">Post Announcement</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TeamLeaderDashboard;
