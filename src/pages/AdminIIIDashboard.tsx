import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Calendar, Settings, Shield, Database, 
  UserCheck, MessageCircle, Bell, TrendingUp, Crown, HelpCircle, Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import DirectMessages from '@/components/chat/DirectMessages';
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
  const { user, profile, loading, canManageUsers } = useAuth();
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
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navigation />
      
      <OnboardingDialog 
        open={showOnboarding} 
        onOpenChange={setShowOnboarding} 
        role="admin_iii" 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Header */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-primary/5 rounded-3xl blur-3xl -z-10"></div>
          <div className="relative bg-card/50 backdrop-blur-sm rounded-3xl p-8 border border-red-500/20 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 via-primary to-primary/60 bg-clip-text text-transparent mb-3">
                  System Control Center
                </h1>
                <p className="text-lg text-muted-foreground">
                  Full administrative access • <span className="font-semibold text-foreground">{profile?.first_name} {profile?.last_name}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowOnboarding(true)}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help Guide
                </Button>
                <Badge className="bg-red-500 text-white px-4 py-2 text-base shadow-lg">
                  <Crown className="w-5 h-5 mr-2" />
                  Admin Level III
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Database className="h-4 w-4" />
                Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrograms}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAdmins}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="management" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="management">System Management</TabsTrigger>
            <TabsTrigger value="users">User Control</TabsTrigger>
            <TabsTrigger value="chats">
              <Eye className="w-4 h-4 mr-2" />
              All Chats
            </TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="management" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-2xl hover:shadow-primary/20 transition-all cursor-pointer group hover:-translate-y-1" onClick={() => navigate('/admin/programs')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 group-hover:text-primary">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Settings className="w-5 h-5 text-primary" />
                    </div>
                    Manage All Programs
                  </CardTitle>
                  <CardDescription>Create, edit, and delete programs across the entire system</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Edit Programs</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-2xl hover:shadow-primary/20 transition-all cursor-pointer group hover:-translate-y-1" onClick={() => navigate('/admin/users')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 group-hover:text-primary">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    User Management
                  </CardTitle>
                  <CardDescription>Manage roles, permissions, and user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Manage Users</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-2xl hover:shadow-yellow-500/20 transition-all cursor-pointer group hover:-translate-y-1" onClick={() => navigate('/admin/approvals')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 group-hover:text-yellow-500">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <UserCheck className="w-5 h-5 text-yellow-500" />
                    </div>
                    Pending Approvals
                    {stats.pendingApprovals > 0 && (
                      <Badge className="bg-yellow-500">{stats.pendingApprovals}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Review and approve new user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant={stats.pendingApprovals > 0 ? "default" : "outline"}>
                    Review Applications
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    System Announcements
                  </CardTitle>
                  <CardDescription>Send announcements to all users or specific groups</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">Create Announcement</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    All Events
                  </CardTitle>
                  <CardDescription>View and manage events across all programs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">View Calendar</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    Admin Assignments
                  </CardTitle>
                  <CardDescription>Assign admins to programs and manage permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">Manage Assignments</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Quick User Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={() => navigate('/admin/users')} className="w-full">
                    <Shield className="w-4 h-4 mr-2" />
                    Manage Roles
                  </Button>
                  <Button onClick={() => navigate('/admin/approvals')} variant="outline" className="w-full">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Pending Approvals ({stats.pendingApprovals})
                  </Button>
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chats">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChatMonitor />
              <Card className="h-[500px] flex flex-col">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    Chat Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                    <Eye className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Monitor All Conversations</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    View messages across all program chats. You can see conversations in real-time and ensure appropriate communication.
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Active monitoring
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Full access
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DirectMessages />
              <Card className="h-[500px] flex flex-col items-center justify-center text-center p-6">
                <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Broadcast Messages</h3>
                <p className="text-muted-foreground mb-4">Send announcements to all users or specific groups</p>
                <Button>Create Broadcast</Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminIIIDashboard;
