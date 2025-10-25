import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, Settings, CheckCircle, Crown } from 'lucide-react';
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

      // Fetch all approved users with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, member_id')
        .eq('account_status', 'approved')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
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

      // Fetch all programs
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('id, name')
        .order('name');

      if (programsError) throw programsError;
      setPrograms(programsData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load users data.",
        variant: "destructive"
      });
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
      case 'admin_iii': return 'bg-red-500';
      case 'admin_ii': return 'bg-orange-500';
      case 'admin_i': return 'bg-yellow-500';
      case 'student': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin_iii': return 'Admin III';
      case 'admin_ii': return 'Admin II';
      case 'admin_i': return 'Admin I';
      case 'student': return 'Student';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage user roles and program assignments</p>
        </div>

        <div className="grid gap-4">
          {users.map((usr) => (
            <Card key={usr.id} className="border-primary/10 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {usr.first_name?.charAt(0) || usr.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {usr.first_name} {usr.last_name}
                        <Badge className={`${getRoleBadgeColor(usr.role)} text-white`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {getRoleLabel(usr.role)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{usr.email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={usr.role}
                      onValueChange={(value) => handleRoleChange(usr.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
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
                        <Button variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Manage Programs
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Manage Programs for {usr.first_name} {usr.last_name}</DialogTitle>
                          <DialogDescription>
                            Assign programs and set team leader status
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          {programs.map((program) => {
                            const assignment = userPrograms.find(up => up.program_id === program.id);
                            const isAssigned = !!assignment;
                            const isTeamLeader = assignment?.is_team_leader || false;

                            return (
                              <div key={program.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={isAssigned}
                                    onCheckedChange={() => handleProgramToggle(program.id, isAssigned)}
                                  />
                                  <div>
                                    <p className="font-medium">{program.name}</p>
                                    {isAssigned && isTeamLeader && (
                                      <Badge variant="secondary" className="mt-1">
                                        <Crown className="w-3 h-3 mr-1" />
                                        Team Leader
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {isAssigned && (
                                  <Button
                                    variant={isTeamLeader ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleTeamLeaderToggle(program.id, isTeamLeader)}
                                  >
                                    <Crown className="w-4 h-4 mr-2" />
                                    {isTeamLeader ? 'Remove' : 'Make'} Team Leader
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminUsers;
