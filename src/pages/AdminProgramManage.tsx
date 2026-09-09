import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Shield, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Program {
  id: string;
  name: string;
  description: string | null;
}

interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

interface Assignment {
  id: string;
  admin_id: string;
}

const AdminProgramManage = () => {
  const { programId } = useParams<{ programId: string }>();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin_iii')) {
      toast({
        title: 'Access Denied',
        description: 'Only Admin Level III can assign program leads.',
        variant: 'destructive',
      });
      navigate('/admin');
      return;
    }

    if (user && profile?.role === 'admin_iii' && programId) {
      fetchData();
    }
  }, [loading, user, profile, programId, navigate]);

  const fetchData = async () => {
    if (!programId) return;

    try {
      setLoadingData(true);
      const [{ data: programData, error: programError }, { data: profiles, error: profilesError }, { data: currentAssignments, error: assignmentsError }] = await Promise.all([
        supabase.from('programs').select('id, name, description').eq('id', programId).single(),
        supabase.from('profiles').select('id, email, first_name, last_name').eq('account_status', 'approved'),
        supabase.from('admin_assignments').select('id, admin_id').eq('program_id', programId),
      ]);

      if (programError) throw programError;
      if (profilesError) throw profilesError;
      if (assignmentsError) throw assignmentsError;

      const adminUsers = await Promise.all((profiles || []).map(async (candidate) => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', candidate.id)
          .single();

        return roleData?.role === 'admin_i' || roleData?.role === 'admin_ii'
          ? { ...candidate, role: roleData.role }
          : null;
      }));

      setProgram(programData);
      setAdmins(adminUsers.filter((candidate): candidate is AdminUser => candidate !== null));
      setAssignments(currentAssignments || []);
    } catch (error) {
      console.error('Error loading program leads:', error);
      toast({ title: 'Error', description: 'Failed to load program leads.', variant: 'destructive' });
    } finally {
      setLoadingData(false);
    }
  };

  const toggleLead = async (admin: AdminUser, assigned: boolean) => {
    if (!programId) return;

    try {
      setSavingUserId(admin.id);
      if (assigned) {
        const assignment = assignments.find((item) => item.admin_id === admin.id);
        if (!assignment) return;
        const { error } = await supabase.from('admin_assignments').delete().eq('id', assignment.id);
        if (error) throw error;
        setAssignments((current) => current.filter((item) => item.id !== assignment.id));
        toast({ title: 'Lead Removed', description: `${admin.first_name || admin.email} is no longer assigned to this program.` });
      } else {
        const { data, error } = await supabase.from('admin_assignments').insert({
          admin_id: admin.id,
          program_id: programId,
          assigned_by: user?.id,
        });
        if (error) throw error;
        const created = Array.isArray(data) ? data[0] : data;
        if (created?.id) setAssignments((current) => [...current, { id: created.id, admin_id: admin.id }]);
        else await fetchData();
        toast({ title: 'Lead Assigned', description: `${admin.first_name || admin.email} is now assigned to this program.` });
      }
    } catch (error) {
      console.error('Error updating program lead:', error);
      toast({ title: 'Error', description: 'Failed to update program lead.', variant: 'destructive' });
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading || loadingData) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/admin/programs')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Programs
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Assign Program Leads</h1>
          <p className="text-muted-foreground">Choose Admin I and Admin II users who manage {program?.name || 'this program'}.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> {program?.name}</CardTitle>
            <CardDescription>{program?.description || 'No description provided.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {admins.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">No Admin I or Admin II users are available.</div>
            ) : admins.map((admin) => {
              const assigned = assignments.some((item) => item.admin_id === admin.id);
              const name = `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.email;
              return (
                <div key={admin.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={assigned} disabled={savingUserId === admin.id} onCheckedChange={() => toggleLead(admin, assigned)} />
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  <Badge variant={assigned ? 'default' : 'outline'}>{admin.role.replace('_', ' ').toUpperCase()}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="w-4 h-4" /> Admin III access is global and is not listed as a program assignment.</p>
      </div>
    </DashboardLayout>
  );
};

export default AdminProgramManage;
