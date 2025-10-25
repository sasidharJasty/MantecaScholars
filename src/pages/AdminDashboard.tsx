import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, Settings, Plus, Shield, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DashboardStats {
  totalPrograms: number;
  totalUsers: number;
  totalEvents: number;
  assignedPrograms: number;
}

const AdminDashboard = () => {
  const { user, profile, loading, isAdmin, canManagePrograms, canManageUsers } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPrograms: 0,
    totalUsers: 0,
    totalEvents: 0,
    assignedPrograms: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin())) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (user && profile && isAdmin()) {
      fetchStats();
    }
  }, [user, profile, loading, navigate, isAdmin]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      
      // Fetch programs count
      const { count: programsCount } = await supabase
        .from('programs')
        .select('*', { count: 'exact', head: true });

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch events count
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Fetch assigned programs count for Admin I users
      let assignedCount = 0;
      if (profile?.role === 'admin_i') {
        const { count } = await supabase
          .from('admin_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('admin_id', user?.id);
        assignedCount = count || 0;
      }

      setStats({
        totalPrograms: programsCount || 0,
        totalUsers: usersCount || 0,
        totalEvents: eventsCount || 0,
        assignedPrograms: assignedCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics.",
        variant: "destructive"
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin_iii': return 'bg-red-500';
      case 'admin_ii': return 'bg-orange-500';
      case 'admin_i': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin_iii': return 'Admin Level III';
      case 'admin_ii': return 'Admin Level II';
      case 'admin_i': return 'Admin Level I';
      default: return role;
    }
  };

  if (loading || loadingStats) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Header */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl blur-3xl -z-10"></div>
          <div className="relative bg-card/50 backdrop-blur-sm rounded-3xl p-8 border border-primary/10 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent mb-3">
                  Admin Dashboard
                </h1>
                <p className="text-lg text-muted-foreground">
                  Welcome back, <span className="font-semibold text-foreground">{profile?.first_name || profile?.email}</span>
                </p>
              </div>
              <Badge className={`${getRoleColor(profile?.role || '')} text-white px-4 py-2 text-base shadow-lg`}>
                <Shield className="w-5 h-5 mr-2" />
                {getRoleLabel(profile?.role || '')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Programs</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalPrograms}</div>
              <p className="text-xs text-muted-foreground mt-1">Active programs</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered members</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled events</p>
            </CardContent>
          </Card>

          {profile?.role === 'admin_i' && (
            <Card className="border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">My Programs</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.assignedPrograms}</div>
                <p className="text-xs text-muted-foreground mt-1">Assigned to you</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Program Management - Admin II/III only */}
          {canManagePrograms() && (
            <Card className="border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group hover:-translate-y-1" onClick={() => navigate('/admin/programs')}>
              <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                <CardTitle className="flex items-center text-xl group-hover:text-primary transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  Manage Programs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Add, edit, and remove programs from the system. Manage program details and assignments.
                </p>
                <Button className="w-full shadow-md hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Edit Programs
                </Button>
              </CardContent>
            </Card>
          )}

          {/* User Management - Admin III only */}
          {canManageUsers() && (
            <Card className="border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group hover:-translate-y-1" onClick={() => navigate('/admin/users')}>
              <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                <CardTitle className="flex items-center text-xl group-hover:text-primary transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  Manage Users
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Manage user accounts, roles, and program assignments for the system.
                </p>
                <Button className="w-full shadow-md hover:shadow-lg transition-all">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          )}

          {/* My Programs - Admin I only */}
          {profile?.role === 'admin_i' && (
            <Card className="border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group hover:-translate-y-1" onClick={() => navigate('/admin/my-programs')}>
              <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                <CardTitle className="flex items-center text-xl group-hover:text-primary transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  My Programs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Manage rosters, schedules, and events for your assigned programs.
                </p>
                <Button className="w-full shadow-md hover:shadow-lg transition-all">
                  <Calendar className="w-4 h-4 mr-2" />
                  View My Programs
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Events Calendar - All Admins */}
          <Card className="border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group hover:-translate-y-1" onClick={() => navigate('/admin/events')}>
            <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
              <CardTitle className="flex items-center text-xl group-hover:text-primary transition-colors">
                <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                Events Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                View and manage upcoming events and schedules across all programs.
              </p>
              <Button className="w-full shadow-md hover:shadow-lg transition-all">
                <Calendar className="w-4 h-4 mr-2" />
                View Calendar
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;