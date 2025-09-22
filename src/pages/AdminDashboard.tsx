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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {profile?.first_name || profile?.email}
              </p>
            </div>
            <Badge className={`${getRoleColor(profile?.role || '')} text-white`}>
              <Shield className="w-4 h-4 mr-1" />
              {getRoleLabel(profile?.role || '')}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrograms}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>

          {profile?.role === 'admin_i' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Programs</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.assignedPrograms}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Program Management - Admin II/III only */}
          {canManagePrograms() && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/programs')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Manage Programs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Add, edit, and remove programs from the system. Manage program details and assignments.
                </p>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Edit Programs
                </Button>
              </CardContent>
            </Card>
          )}

          {/* User Management - Admin III only */}
          {canManageUsers() && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/users')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Manage Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Manage user accounts, roles, and program assignments for the system.
                </p>
                <Button className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          )}

          {/* My Programs - Admin I only */}
          {profile?.role === 'admin_i' && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/my-programs')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  My Programs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Manage rosters, schedules, and events for your assigned programs.
                </p>
                <Button className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  View My Programs
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Events Calendar - All Admins */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/events')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Events Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View and manage upcoming events and schedules across all programs.
              </p>
              <Button className="w-full">
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