import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, Settings, Crown, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  member_id: string | null;
  role: string;
}

interface Program {
  id: string;
  name: string;
}

interface UserProgram {
  program_id: string;
  is_team_leader: boolean;
}

const AdminUsers = () => {
  const { user, canManageUsers } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !canManageUsers()) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate, canManageUsers]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, member_id')
        .eq('account_status', 'approved')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .single();

          return {
            ...profile,
            role: roleData?.role || 'student'
          };
        })
      );

      setUsers(usersWithRoles);

      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('id, name')
        .order('name');

      if (programsError) throw programsError;
      setPrograms(programsData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPrograms = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('rosters')
        .select('program_id, is_team_leader')
        .eq('user_id', userId);

      if (error) throw error;
      setUserPrograms(data || []);
    } catch (error: any) {
      console.error('Error fetching user programs:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: "User role has been updated successfully."
      });

      fetchData();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive"
      });
    }
  };

  const handleProgramToggle = async (programId: string, isAssigned: boolean) => {
    if (!selectedUser) return;

    try {
      if (isAssigned) {
        const { error } = await supabase
          .from('rosters')
          .delete()
          .eq('user_id', selectedUser.id)
          .eq('program_id', programId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rosters')
          .insert({
            user_id: selectedUser.id,
            program_id: programId,
            is_team_leader: false
          });

        if (error) throw error;
      }

      toast({
        title: isAssigned ? "Program Removed" : "Program Assigned",
        description: `User has been ${isAssigned ? 'removed from' : 'assigned to'} the program.`
      });

      fetchUserPrograms(selectedUser.id);
    } catch (error: any) {
      console.error('Error toggling program:', error);
      toast({
        title: "Error",
        description: "Failed to update program assignment.",
        variant: "destructive"
      });
    }
  };

  const handleTeamLeaderToggle = async (programId: string, isTeamLeader: boolean) => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('rosters')
        .update({ is_team_leader: !isTeamLeader })
        .eq('user_id', selectedUser.id)
        .eq('program_id', programId);

      if (error) throw error;

      toast({
        title: "Team Leader Status Updated",
        description: `User ${!isTeamLeader ? 'is now' : 'is no longer'} a team leader for this program.`
      });

      fetchUserPrograms(selectedUser.id);
    } catch (error: any) {
      console.error('Error updating team leader status:', error);
      toast({
        title: "Error",
        description: "Failed to update team leader status.",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin_iii': return 'bg-red-500 hover:bg-red-600';
      case 'admin_ii': return 'bg-orange-500 hover:bg-orange-600';
      case 'admin_i': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'student': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500';
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
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
           <h1 className="text-3xl font-bold tracking-tight text-primary">User Management</h1>
            <p className="text-muted-foreground">
              Manage user roles and assign programs
            </p>
        </div>

        <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
                placeholder="Search users..." 
                className="max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((usr) => (
            <Card key={usr.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-semibold text-primary">
                        {usr.first_name?.charAt(0) || usr.email.charAt(0).toUpperCase()}
                    </span>
                 </div>
                 <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold truncate">
                         {usr.first_name} {usr.last_name}
                    </CardTitle>
                    <CardDescription className="truncate">{usr.email}</CardDescription>
                 </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 pt-4">
                 <div className="flex items-center justify-between">
                     <Badge className={`${getRoleBadgeColor(usr.role)} text-white border-0`}>
                        {usr.role.replace('_', ' ').toUpperCase()}
                     </Badge>
                     <span className="text-xs text-muted-foreground">
                        ID: {usr.member_id || 'N/A'}
                     </span>
                 </div>

                 <div className="mt-auto space-y-2">
                    <Select
                      value={usr.role}
                      onValueChange={(value) => handleRoleChange(usr.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin_i">Admin Level I</SelectItem>
                        <SelectItem value="admin_ii">Admin Level II</SelectItem>
                        <SelectItem value="admin_iii">Admin Level III</SelectItem>
                      </SelectContent>
                    </Select>

                    <Dialog open={dialogOpen && selectedUser?.id === usr.id} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (open) {
                        setSelectedUser(usr);
                        fetchUserPrograms(usr.id);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Settings className="w-4 h-4 mr-2" />
                          Programs
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Manage Programs - {usr.first_name} {usr.last_name}</DialogTitle>
                          <DialogDescription>
                            Assign programs and manage team leader status
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 mt-4">
                          {programs.map((program) => {
                            const assignment = userPrograms.find(up => up.program_id === program.id);
                            const isAssigned = !!assignment;
                            const isTeamLeader = assignment?.is_team_leader || false;

                            return (
                              <div key={program.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={isAssigned}
                                    onCheckedChange={() => handleProgramToggle(program.id, isAssigned)}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">{program.name}</span>
                                    {isAssigned && isTeamLeader && (
                                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                                        <Crown className="w-3 h-3" /> Team Leader
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isAssigned && (
                                  <Button
                                    variant={isTeamLeader ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => handleTeamLeaderToggle(program.id, isTeamLeader)}
                                    className="h-8 text-xs"
                                  >
                                    {isTeamLeader ? 'Remove Leader' : 'Make Leader'}
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
