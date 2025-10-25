import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, GraduationCap, Bell, Crown, TrendingUp } from 'lucide-react';
import Footer from '@/components/ui/footer';
import { toast } from '@/hooks/use-toast';

interface ProgramInfo {
  program_id: string;
  program_name: string;
  program_website: string | null;
  is_team_leader: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  program_name: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  program_name: string;
}

interface Stats {
  totalPrograms: number;
  upcomingEvents: number;
  unreadAnnouncements: number;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<ProgramInfo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<Stats>({ totalPrograms: 0, upcomingEvents: 0, unreadAnnouncements: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile?.account_status !== 'approved') {
      navigate('/');
      toast({
        title: "Account Pending",
        description: "Your account is pending approval by an administrator.",
        variant: "destructive"
      });
      return;
    }

    fetchDashboardData();
  }, [user, profile, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's programs
      const { data: rostersData, error: rostersError } = await supabase
        .from('rosters')
        .select(`
          program_id,
          programs:program_id (
            name,
            website
          )
        `)
        .eq('user_id', user!.id);

      if (rostersError) throw rostersError;

      const programsList = rostersData?.map((r: any) => ({
        program_id: r.program_id,
        program_name: r.programs?.name || 'Unknown Program',
        program_website: r.programs?.website,
        is_team_leader: r.is_team_leader || false
      })) || [];

      setPrograms(programsList);

      // Fetch upcoming events for user's programs
      const programIds = programsList.map(p => p.program_id);
      
      if (programIds.length > 0) {
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            event_date,
            location,
            program_id,
            programs:program_id (
              name
            )
          `)
          .in('program_id', programIds)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(5);

        if (eventsError) throw eventsError;

        const eventsList = eventsData?.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          event_date: e.event_date,
          location: e.location,
          program_name: e.programs?.name || 'Unknown Program'
        })) || [];

        setEvents(eventsList);

        // Fetch announcements
        const { data: announcementsData, error: announcementsError } = await supabase
          .from('program_announcements')
          .select(`
            id,
            title,
            content,
            created_at,
            program_id,
            programs:program_id (name)
          `)
          .in('program_id', programIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (announcementsError) throw announcementsError;

        const announcementsList = announcementsData?.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          created_at: a.created_at,
          program_name: a.programs?.name || 'Unknown Program'
        })) || [];

        setAnnouncements(announcementsList);

        // Set stats
        setStats({
          totalPrograms: programsList.length,
          upcomingEvents: eventsList.length,
          unreadAnnouncements: announcementsList.length
        });
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Hero Header */}
            <div className="mb-12 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl blur-3xl -z-10"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-3xl p-8 border border-primary/10 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent mb-3">
                      Welcome back, {profile?.first_name || 'Scholar'}!
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      Member ID: <span className="font-semibold text-foreground bg-primary/10 px-3 py-1 rounded-full">{profile?.member_id || 'Not assigned'}</span>
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-bold text-white">{profile?.first_name?.charAt(0) || 'S'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Programs</CardTitle>
                  <GraduationCap className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPrograms}</div>
                  <p className="text-xs text-muted-foreground">Enrolled programs</p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                  <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
                  <p className="text-xs text-muted-foreground">Events scheduled</p>
                </CardContent>
              </Card>

              <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                  <Bell className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.unreadAnnouncements}</div>
                  <p className="text-xs text-muted-foreground">Recent updates</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <Card className="shadow-2xl border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-primary/20 transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <GraduationCap className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">My Programs</CardTitle>
                  </div>
                  <CardDescription>Programs you're enrolled in</CardDescription>
                </CardHeader>
                <CardContent>
                  {programs.length > 0 ? (
                    <div className="space-y-3">
                      {programs.map((program) => (
                        <div
                          key={program.program_id}
                          className="p-3 bg-accent rounded-lg border border-border hover:bg-accent/80 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">{program.program_name}</h3>
                            {program.is_team_leader && (
                              <Badge variant="secondary" className="bg-primary/10">
                                <Crown className="w-3 h-3 mr-1" />
                                Team Leader
                              </Badge>
                            )}
                          </div>
                          {program.program_website && (
                            <a
                              href={program.program_website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:text-primary-hover"
                            >
                              Visit website →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">You are not enrolled in any programs yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-2xl border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-primary/20 transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Profile Information</CardTitle>
                  </div>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                      <dd className="text-foreground">{profile?.first_name} {profile?.last_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                      <dd className="text-foreground">{profile?.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Member ID</dt>
                      <dd className="text-foreground">{profile?.member_id || 'Not assigned'}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="shadow-2xl border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-primary/20 transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Upcoming Events</CardTitle>
                  </div>
                  <CardDescription>Your schedule for the coming days</CardDescription>
                </CardHeader>
                <CardContent>
                {events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 bg-accent rounded-lg border border-border hover:bg-accent/80 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.event_date).toLocaleDateString()}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-primary">{event.program_name}</span>
                          {event.location && (
                            <span className="text-muted-foreground">{event.location}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No upcoming events scheduled.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-2xl border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-primary/20 transition-all duration-300">
              <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Announcements</CardTitle>
                </div>
                <CardDescription>Latest updates from your programs</CardDescription>
              </CardHeader>
              <CardContent>
                {announcements.length > 0 ? (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className="p-4 bg-accent rounded-lg border border-border hover:bg-accent/80 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                          <span className="text-xs text-muted-foreground">
                            {new Date(announcement.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{announcement.content}</p>
                        <span className="text-xs text-primary">{announcement.program_name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No recent announcements.</p>
                )}
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
