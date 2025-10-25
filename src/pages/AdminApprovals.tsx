import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PendingUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  member_id: string | null;
  created_at: string;
}

interface UserApproval {
  userId: string;
  role: 'student' | 'admin_i' | 'admin_ii' | 'admin_iii';
}

const AdminApprovals = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-background via-accent/10 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-primary mb-2">Account Approvals</h1>
              <p className="text-muted-foreground">
                Review and approve pending account requests
              </p>
            </div>

            {pendingUsers.length === 0 ? (
              <Card className="shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="w-16 h-16 text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    All Caught Up!
                  </h3>
                  <p className="text-muted-foreground">
                    There are no pending account requests at this time.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <Card key={user.id} className="shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-accent-gold" />
                            {user.first_name} {user.last_name}
                          </CardTitle>
                          <CardDescription>{user.email}</CardDescription>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 space-y-3">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Member ID:</span>{' '}
                          {user.member_id || 'Not provided'}
                        </p>
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            Assign Role
                          </label>
                          <Select
                            value={selectedRoles[user.id] || 'student'}
                            onValueChange={(value) => 
                              setSelectedRoles(prev => ({ ...prev, [user.id]: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="admin_i">Admin Level I</SelectItem>
                              <SelectItem value="admin_ii">Admin Level II</SelectItem>
                              <SelectItem value="admin_iii">Admin Level III</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApproval(user.id, true)}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleApproval(user.id, false)}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminApprovals;
