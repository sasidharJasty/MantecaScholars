import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, Database, ArrowRight, Settings, Plus, Crown, Shield, UserCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  event_date: string;
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
        // Handled by auth flow logic usually, but fail-safe here
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
        .eq('user_id', user?.id || '');

      if (rostersError) throw rostersError;

      const programsList = rostersData?.map((r: any) => ({
        program_id: r.program_id,
        program_name: r.programs?.name || 'Unknown Program',
        program_website: r.programs?.website,
        is_team_leader: r.is_team_leader || false
      })) || [];

      setPrograms(programsList);

      // Fetch upcoming events for user's programs
      if (programsList.length > 0) {
          const programIds = programsList.map(p => p.program_id);
          const { data: eventsData } = await supabase
            .from('events')
            .select(`
                id, title, event_date,
                programs:program_id (name)
            `)
            .in('program_id', programIds)
            .gte('event_date', new Date().toISOString())
            .order('event_date', { ascending: true })
            .limit(5);
        
        const eventsList = eventsData?.map((e: any) => ({
            id: e.id,
            title: e.title,
            event_date: e.event_date,
            program_name: e.programs?.name
        })) || [];
        setEvents(eventsList);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Pending Approval View
  if (profile?.account_status !== 'approved') {
      return (
          <DashboardLayout>
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
                  <div className="bg-yellow-50 p-6 rounded-full border-2 border-yellow-200">
                      <Clock className="w-16 h-16 text-yellow-600" />
                  </div>
                  <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Pending Approval</h1>
                      <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                          Your account is currently waiting for administrator approval. You will receive access to the dashboard and programs once your registration is confirmed.
                      </p>
                  </div>
                  <div className="flex gap-4">
                      <Button variant="outline" onClick={() => navigate('/')}>Return to Home</Button>
                      <Button variant="ghost" onClick={() => navigate('/contact')}>Contact Support</Button>
                  </div>
              </div>
          </DashboardLayout>
      );
  }

  return (
    <DashboardLayout>
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                     <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.first_name}</h1>
                     <p className="text-muted-foreground">Here's what's happening in your programs.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {/* Programs Card */}
                 <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary" />
                            My Programs
                        </CardTitle>
                        <CardDescription>Programs you are currently enrolled in.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {programs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>You haven't joined any programs yet.</p>
                                <Button className="mt-4" onClick={() => navigate('/programs')}>Browse Programs</Button>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {programs.map(prog => (
                                    <div 
                                      key={prog.program_id} 
                                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                      onClick={() => navigate(`/program/${prog.program_id}`)}
                                    >
                                        <div>
                                            <h3 className="font-semibold">{prog.program_name}</h3>
                                            {prog.is_team_leader && (
                                                <Badge variant="secondary" className="mt-1 text-xs">
                                                    <Crown className="w-3 h-3 mr-1 text-yellow-500" />
                                                    Team Leader
                                                </Badge>
                                            )}
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                 </Card>

                 {/* Upcoming Events */}
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Upcoming Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {events.length === 0 ? (
                             <p className="text-sm text-muted-foreground text-center py-4">No upcoming events.</p>
                        ) : (
                            <div className="space-y-4">
                                {events.map(event => (
                                    <div key={event.id} className="flex flex-col space-y-1 border-b pb-3 last:border-0 last:pb-0">
                                        <span className="font-medium text-sm">{event.title}</span>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{new Date(event.event_date).toLocaleDateString()}</span>
                                            <span>{event.program_name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                 </Card>
            </div>
            
             {/* Admin Quick Links if Admin */}
             {['admin_i', 'admin_ii', 'admin_iii'].includes(profile?.role || '') && (
                 <div className="border-t pt-8">
                     <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-red-500" />
                        Admin Access
                     </h2>
                     <div className="grid gap-4 md:grid-cols-3">
                        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/admin')}>
                            <Database className="w-6 h-6" />
                            <span>Admin Dashboard</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/admin/programs')}>
                            <Settings className="w-6 h-6" />
                            <span>Manage Programs</span>
                        </Button>
                        {(profile?.role === 'admin_ii' || profile?.role === 'admin_iii') && (
                             <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate('/admin/approvals')}>
                                <UserCheck className="w-6 h-6" />
                                <span>Approvals</span>
                            </Button>
                        )}
                     </div>
                 </div>
             )}
        </div>
    </DashboardLayout>
  );
};

export default Dashboard;
