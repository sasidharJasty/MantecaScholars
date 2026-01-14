import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Shield, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge'; // Added Badge import

interface PendingUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  member_id: string | null;
  created_at: string;
}

const AdminApprovals = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/');
      return;
    }

    fetchPendingUsers();
  }, [user, navigate]);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "Failed to load pending account requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, approved: boolean) => {
    if (!approved) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ account_status: 'rejected' })
          .eq('id', userId);

        if (error) throw error;

        toast({
          title: "Account Rejected",
          description: "The account has been rejected."
        });

        fetchPendingUsers();
      } catch (error: any) {
        console.error('Error rejecting account:', error);
        toast({
          title: "Error",
          description: "Failed to reject account.",
          variant: "destructive"
        });
      }
      return;
    }

    const role = selectedRoles[userId] || 'student';

    try {
      // Update account status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ account_status: 'approved' })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: role as any })
        .eq('user_id', userId);

      if (roleError) throw roleError;

      toast({
        title: "Account Approved",
        description: `User has been approved as ${role.replace('_', ' ').toUpperCase()}.`,
      });

      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error approving account:', error);
      toast({
        title: "Error",
        description: "Failed to approve account.",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = pendingUsers.filter(user => 
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
           <h1 className="text-3xl font-bold tracking-tight text-primary">Pending Approvals</h1>
            <p className="text-muted-foreground">
              Review and manage new account requests
            </p>
        </div>

        <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
                placeholder="Search by name or email..." 
                className="max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg">
             {searchTerm ? (
                <p>No requests found matching "{searchTerm}"</p>
             ) : (
                <>
                    <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">There are no pending account requests at this time.</p>
                </>
             )}
          </div>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((user) => (
                    <Card key={user.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                             <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg flex items-center">
                                       {user.first_name} {user.last_name}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(user.created_at).toLocaleDateString()}
                                </Badge>
                             </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            <div className="text-sm border rounded-md p-2 bg-muted/50">
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Membership Details</span>
                                Member ID: {user.member_id || 'Not provided'}
                            </div>

                            <div className="mt-auto space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Assign Role</label>
                                    <Select
                                        value={selectedRoles[user.id] || 'student'}
                                        onValueChange={(value) => 
                                           setSelectedRoles(prev => ({ ...prev, [user.id]: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="student">Student</SelectItem>
                                            <SelectItem value="admin_i">Admin Level I</SelectItem>
                                            <SelectItem value="admin_ii">Admin Level II</SelectItem>
                                            <SelectItem value="admin_iii">Admin Level III</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                     <Button
                                        onClick={() => handleApproval(user.id, false)}
                                        variant="outline"
                                        className="text-destructive hover:bg-destructive/10"
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => handleApproval(user.id, true)}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminApprovals;
