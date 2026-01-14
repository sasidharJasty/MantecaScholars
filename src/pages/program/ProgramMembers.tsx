import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { RoleBadge } from '@/components/common/RoleBadge';
import { ArrowLeft, Search, Mail, Shield, ShieldOff, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Member {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  is_team_leader: boolean;
  is_muted: boolean;
  joined_at: string;
}

const ProgramMembers = () => {
  const { programId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [programName, setProgramName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = ['admin_i', 'admin_ii', 'admin_iii'].includes(profile?.role || '');

  useEffect(() => {
    if (programId && user) {
      fetchProgramDetails();
    }
  }, [programId, user]);

  const fetchProgramDetails = async () => {
    try {
      setLoading(true);

      // Fetch Program Name
      const { data: program } = await supabase
        .from('programs')
        .select('name')
        .eq('id', programId)
        .single();
      
      if (program) setProgramName(program.name);

      // Fetch Members
      const { data: rosterData, error } = await supabase
        .from('rosters')
        .select(`
          user_id,
          is_team_leader,
          is_muted,
          created_at,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('program_id', programId);

      if (error) throw error;

      // Fetch Global Roles for these users
      const userIds = rosterData.map(r => r.user_id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const roleMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

      const formattedMembers = rosterData.map((r: any) => ({
        user_id: r.user_id,
        first_name: r.profiles?.first_name || 'Unknown',
        last_name: r.profiles?.last_name || 'User',
        email: r.profiles?.email || '',
        role: roleMap.get(r.user_id) || 'student',
        is_team_leader: r.is_team_leader,
        is_muted: r.is_muted || false,
        joined_at: r.created_at
      }));

      // Sort: Team Leaders first, then Admins, then Students
      formattedMembers.sort((a, b) => {
        if (a.is_team_leader !== b.is_team_leader) return b.is_team_leader ? 1 : -1;
        return 0; // Simplified sort
      });

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamLeader = async (memberId: string, currentStatus: boolean, memberName: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('rosters')
        .update({ is_team_leader: !currentStatus })
        .eq('program_id', programId)
        .eq('user_id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${memberName}'s team leader status.`,
      });

      // Update local state
      setMembers(prev => prev.map(m => 
        m.user_id === memberId ? { ...m, is_team_leader: !currentStatus } : m
      ));

    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update team leader status.",
        variant: "destructive"
      });
    }
  };

  const toggleMute = async (memberId: string, currentStatus: boolean, memberName: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('rosters')
        .update({ is_muted: !currentStatus })
        .eq('program_id', programId)
        .eq('user_id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${memberName}'s mute status.`,
      });

      // Update local state
      setMembers(prev => prev.map(m => 
        m.user_id === memberId ? { ...m, is_muted: !currentStatus } : m
      ));

    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update mute status.",
        variant: "destructive"
      });
    }
  };

  const filteredMembers = members.filter(m => 
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
     return (
        <DashboardLayout>
            <div className="flex justify-center p-8">Loading members...</div>
        </DashboardLayout>
     );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/programs/${programId}`)} aria-label="Back to Program Dashboard">
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{programName} - Members</h1>
            <p className="text-muted-foreground">Directory of all participants in this program</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-background p-1">
             <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  placeholder="Search members..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search members"
                />
             </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <Card key={member.user_id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start p-4 gap-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/5 text-primary">
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                       <h3 className="font-semibold truncate">
                         {member.first_name} {member.last_name}
                       </h3>
                       {member.is_team_leader && (
                         <Badge variant="secondary" className="text-[10px] bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                           Team Leader
                         </Badge>
                       )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="w-3 h-3 mr-1.5" />
                          <span className="truncate">{member.email}</span>
                       </div>
                       <div className="mt-1">
                          <RoleBadge role={member.role} />
                       </div>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex flex-col gap-2">
                       <Button
                         variant="ghost"
                         size="icon"
                         title={member.is_team_leader ? "Remove Team Leader" : "Make Team Leader"}
                         aria-label={member.is_team_leader ? `Remove Team Leader status from ${member.first_name}` : `Promote ${member.first_name} to Team Leader`}
                         onClick={() => toggleTeamLeader(member.user_id, member.is_team_leader, `${member.first_name} ${member.last_name}`)}
                         className={member.is_team_leader ? "text-red-500 hover:text-red-700" : "text-muted-foreground hover:text-primary"}
                       >
                          {member.is_team_leader ? <ShieldOff className="h-4 w-4" aria-hidden="true" /> : <Shield className="h-4 w-4" aria-hidden="true" />}
                       </Button>                       
                       <Button
                         variant="ghost"
                         size="icon"
                         title={member.is_muted ? "Unmute Member" : "Mute Member"}
                         aria-label={member.is_muted ? `Unmute ${member.first_name}` : `Mute ${member.first_name}`}
                         onClick={() => toggleMute(member.user_id, member.is_muted, `${member.first_name} ${member.last_name}`)}
                         className={member.is_muted ? "text-destructive hover:text-destructive/80" : "text-muted-foreground hover:text-primary"}
                       >
                          {member.is_muted ? <MicOff className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
                       </Button>                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProgramMembers;
