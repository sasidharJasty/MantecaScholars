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
  UserCheck, MessageCircle, Bell, HelpCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import DirectMessages from '@/components/chat/DirectMessages';
import OnboardingDialog from '@/components/onboarding/OnboardingDialog';

interface DashboardStats {
  totalPrograms: number;
  totalUsers: number;
  totalEvents: number;
  pendingApprovals: number;
}

const AdminIIDashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPrograms: 0,
    totalUsers: 0,
    totalEvents: 0,
    pendingApprovals: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasSeenOnboarding && profile?.role === 'admin_ii') {
      setShowOnboarding(true);
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin_ii')) {
      toast({
        title: "Access Denied",
        description: "You need Admin II privileges to access this page.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (user && profile?.role === 'admin_ii') {
      fetchStats();
    }
  }, [user, profile, loading, navigate]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);

      const [programs, users, events, pending] = await Promise.all([
        supabase.from('programs').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'pending')
      ]);

      setStats({
        totalPrograms: programs.count || 0,
        totalUsers: users.count || 0,
        totalEvents: events.count || 0,
        pendingApprovals: pending.count || 0
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
        role="admin_ii" 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Header */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-primary/5 rounded-3xl blur-3xl -z-10"></div>
          <div className="relative bg-card/50 backdrop-blur-sm rounded-3xl p-8 border border-orange-500/20 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 via-primary to-primary/60 bg-clip-text text-transparent mb-3">
                  Board Member Dashboard
                </h1>
                <p className="text-lg text-muted-foreground">
                  Program management & approvals • <span className="font-semibold text-foreground">{profile?.first_name} {profile?.last_name}</span>
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
                <Badge className="bg-orange-500 text-white px-4 py-2 text-base shadow-lg">
                  <Shield className="w-5 h-5 mr-2" />
                  Admin Level II
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
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
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="management">Program Management</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
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
                    Manage Programs
                  </CardTitle>
                  <CardDescription>Create, edit, and manage all programs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Edit Programs</Button>
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
                  <CardDescription>Review and approve user registrations</CardDescription>
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
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    Events Calendar
                  </CardTitle>
                  <CardDescription>View and manage all program events</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">View Calendar</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    Announcements
                  </CardTitle>
                  <CardDescription>Send announcements to program members</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">Create Announcement</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    View Rosters
                  </CardTitle>
                  <CardDescription>See members enrolled in each program</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">View Rosters</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="approvals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  User Approvals
                </CardTitle>
                <CardDescription>Review pending user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/admin/approvals')} className="w-full">
                  Go to Approvals Page
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <DirectMessages />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminIIDashboard;
