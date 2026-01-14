import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, Database, ClipboardCheck, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DashboardStats {
  totalPrograms: number;
  assignedPrograms: number;
}

const AdminIDashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPrograms: 0,
    assignedPrograms: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin_i')) {
      toast({
        title: "Access Denied",
        description: "You need Admin Level I privileges to access this page.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (user && profile?.role === 'admin_i') {
      fetchStats();
    }
  }, [user, profile, loading, navigate]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      
      const { count: programsCount } = await supabase
        .from('programs')
        .select('*', { count: 'exact', head: true });

      const { count: assignedCount } = await supabase
        .from('admin_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', user?.id);

      setStats({
        totalPrograms: programsCount || 0,
        assignedPrograms: assignedCount || 0
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Level I Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your assigned programs and view system overview
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Programs</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assignedPrograms}</div>
              <p className="text-xs text-muted-foreground">
                Programs under your supervision
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrograms}</div>
              <p className="text-xs text-muted-foreground">
                Active programs in system
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/admin/my-programs')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                My Programs
              </CardTitle>
              <CardDescription>
                View and manage details for programs you're assigned to.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full group">
                Go to My Programs 
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminIDashboard;
