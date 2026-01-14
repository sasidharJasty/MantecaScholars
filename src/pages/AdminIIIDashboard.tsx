import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Calendar, Settings, Shield, Database, 
  UserCheck, MessageCircle, HeartHandshake, TrendingUp, Crown, HelpCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ChatMonitor from '@/components/admin/ChatMonitor';
import OnboardingDialog from '@/components/onboarding/OnboardingDialog';

interface DashboardStats {
  totalPrograms: number;
  totalUsers: number;
  totalEvents: number;
  pendingApprovals: number;
  totalAdmins: number;
  totalStudents: number;
}

const AdminIIIDashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPrograms: 0,
    totalUsers: 0,
    totalEvents: 0,
    pendingApprovals: 0,
    totalAdmins: 0,
    totalStudents: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasSeenOnboarding && profile?.role === 'admin_iii') {
      setShowOnboarding(true);
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin_iii')) {
      toast({
        title: "Access Denied",
        description: "You need Admin III privileges to access this page.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (user && profile?.role === 'admin_iii') {
      fetchStats();
    }
  }, [user, profile, loading, navigate]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);

      const [programs, users, events, pending, roles] = await Promise.all([
        supabase.from('programs').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'pending'),
        supabase.from('user_roles').select('role')
      ]);

      const adminCount = roles.data?.filter(r => ['admin_i', 'admin_ii', 'admin_iii'].includes(r.role)).length || 0;
      const studentCount = roles.data?.filter(r => r.role === 'student').length || 0;

      setStats({
        totalPrograms: programs.count || 0,
        totalUsers: users.count || 0,
        totalEvents: events.count || 0,
        pendingApprovals: pending.count || 0,
        totalAdmins: adminCount,
        totalStudents: studentCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <OnboardingDialog open={showOnboarding} onOpenChange={setShowOnboarding} />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Level III Dashboard</h1>
            <p className="text-muted-foreground">
              Complete control over the platform, users, and programs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/approvals')}>
              <UserCheck className="w-4 h-4 mr-2" />
              Approvals
              {stats.pendingApprovals > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {stats.pendingApprovals}
                </Badge>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowOnboarding(true)}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </Button>
            <Button>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalStudents} students, {stats.totalAdmins} admins
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrograms}</div>
              <p className="text-xs text-muted-foreground">
                Current active programs
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">
                New user signups
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                Events across all programs
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="management" className="space-y-4">
          <TabsList>
            <TabsTrigger value="management">User Management</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="management" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/admin/users')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-red-500" />
                    Role Management
                  </CardTitle>
                  <CardDescription>
                    Promote users to admins, assign team leaders, and manage permissions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Manage Roles</Button>
                </CardContent>
              </Card>

              <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/admin/programs')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Program Control
                  </CardTitle>
                  <CardDescription>
                    Create new programs, archive old ones, and assign program directors.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="secondary">Configure Programs</Button>
                </CardContent>
              </Card>

              <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/admin/approvals')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-green-500" />
                    User Approvals
                  </CardTitle>
                  <CardDescription>
                    Review pending account requests and verify new member identities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                   <Button className="w-full" variant="outline">View Requests</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <ChatMonitor />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-blue-500" />
                     Live Activity
                  </CardTitle>
                  <CardDescription>
                    Real-time view of system usage and engagement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between text-sm">
                        <span>Active Sessions</span>
                        <Badge variant="outline">Calculating...</Badge>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span>Messages Today</span>
                        <Badge variant="outline">Calculating...</Badge>
                     </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>
                        Overview of system performance and database status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center space-x-2 text-green-500">
                        <HeartHandshake className="h-5 w-5" />
                        <span>System is Operational</span>
                     </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminIIIDashboard;
