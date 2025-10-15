import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, GraduationCap } from 'lucide-react';
import Footer from '@/components/ui/footer';
import { toast } from '@/hooks/use-toast';

interface ProgramInfo {
  program_id: string;
  program_name: string;
  program_website: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  program_name: string;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<ProgramInfo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
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
        program_website: r.programs?.website
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
      <div className="min-h-screen bg-gradient-to-b from-background via-accent/10 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-primary mb-2">
                Welcome, {profile?.first_name || 'Scholar'}!
              </h1>
              <p className="text-muted-foreground">
                Member ID: <span className="font-medium text-foreground">{profile?.member_id || 'Not assigned'}</span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-6 h-6 text-primary" />
                    <CardTitle>My Programs</CardTitle>
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
                          <h3 className="font-semibold text-foreground">{program.program_name}</h3>
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

              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Users className="w-6 h-6 text-primary" />
                    <CardTitle>Profile Information</CardTitle>
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

            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-6 h-6 text-primary" />
                  <CardTitle>Upcoming Events</CardTitle>
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
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
