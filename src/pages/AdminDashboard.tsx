import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, Settings, Plus, Shield, Database, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DashboardStats {
  totalPrograms: number;
  totalUsers: number;
  totalEvents: number;
  assignedPrograms: number;
}

const AdminDashboard = () => {
  const { user, profile, loading, isAdmin } = useAuth();
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
      
      const { count: programsCount } = await supabase
        .from('programs')
        .select('*', { count: 'exact', head: true });

      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin_iii': return 'Super Admin (Level III)';
      case 'admin_ii': return 'Program Director (Level II)';
      case 'admin_i': return 'Program Manager (Level I)';
      default: return 'Admin';
    }
  };

  const getDashboardLink = (role: string) => {
    switch (role) {
      case 'admin_iii': return '/admin/level-iii';
      case 'admin_ii': return '/admin/level-ii';
      case 'admin_i': return '/admin/level-i';
      default: return '/dashboard';
    }
  };

  if (loading || loadingStats) {
      return (
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          </div>
        </DashboardLayout>
      );
  }

  return (
    <DashboardLayout>
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Portal</h1>
                   <p className="text-muted-foreground">
                     Welcome back, {profile?.first_name}. You are logged in as <span className="font-semibold text-foreground">{getRoleLabel(profile?.role || '')}</span>.
                   </p>
                </div>
                {profile && (
                    <Button onClick={() => navigate(getDashboardLink(profile.role))}>
                        Go to My Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                         <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold">{stats.totalUsers}</div>
                         <p className="text-xs text-muted-foreground">Registered accounts</p>
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <CardTitle className="text-sm font-medium">Programs</CardTitle>
                         <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold">{stats.totalPrograms}</div>
                         <p className="text-xs text-muted-foreground">Active programs</p>
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <CardTitle className="text-sm font-medium">Events</CardTitle>
                         <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold">{stats.totalEvents}</div>
                         <p className="text-xs text-muted-foreground">Scheduled events</p>
                    </CardContent>
                 </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button 
                            variant="outline" 
                            className="justify-start h-auto py-3" 
                            onClick={() => navigate('/admin/programs')}
                        >
                            <Database className="w-4 h-4 mr-2" />
                            <div className="flex flex-col items-start">
                                <span className="font-medium">Manage Programs</span>
                                <span className="text-xs text-muted-foreground">View and edit program details</span>
                            </div>
                        </Button>
                        
                        {(profile?.role === 'admin_ii' || profile?.role === 'admin_iii') && (
                            <Button 
                                variant="outline" 
                                className="justify-start h-auto py-3" 
                                onClick={() => navigate('/admin/approvals')}
                            >
                                <Users className="w-4 h-4 mr-2" />
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">User Approvals</span>
                                    <span className="text-xs text-muted-foreground">Review pending accounts</span>
                                </div>
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                         <CardTitle>System Overview</CardTitle>
                         <CardDescription>Your administrative reach and responsibilities.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-sm font-medium">Role Level</span>
                                <Badge>{profile?.role?.toUpperCase().replace('_', ' ')}</Badge>
                            </div>
                             <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-sm font-medium">Assigned Programs</span>
                                <span className="font-bold">{stats.assignedPrograms}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Permission Scope</span>
                                <span className="text-sm text-muted-foreground text-right">
                                    {profile?.role === 'admin_iii' ? 'Full System Access' : 
                                     profile?.role === 'admin_ii' ? 'Program & Approval Access' : 'Assigned Program Access'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
