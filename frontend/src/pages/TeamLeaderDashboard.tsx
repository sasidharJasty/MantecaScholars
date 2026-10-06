import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, Crown, Megaphone, Plus, ClipboardCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Program {
  id: string;
  name: string;
  description: string | null;
  memberCount?: number;
}

const TeamLeaderDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }
        fetchTeamLeaderPrograms();
    }, [user, navigate]);

    const fetchTeamLeaderPrograms = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('rosters')
                .select('program_id, programs(id, name, description)')
                .eq('user_id', user?.id || '')
                .eq('is_team_leader', true);

            if (error) throw error;

            const programsData = data?.map(r => ({
                id: (r.programs as any).id,
                name: (r.programs as any).name,
                description: (r.programs as any).description
            })) || [];

            setPrograms(programsData);
            if (programsData.length > 0) {
                setSelectedProgram(programsData[0].id);
            }
        } catch (error: any) {
            console.error('Error fetching programs:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (programs.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <Crown className="w-16 h-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Team Leadership Roles</h2>
                    <p className="text-muted-foreground max-w-md">
                        You have not been assigned as a team leader for any programs yet.
                    </p>
                    <Button className="mt-4" onClick={() => navigate('/dashboard')}>
                        Return to Dashboard
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Team Leader Dashboard</h1>
                        <p className="text-muted-foreground">Manage your team, events, and announcements</p>
                    </div>
                    <div className="w-full md:w-[250px]">
                        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Program" />
                            </SelectTrigger>
                            <SelectContent>
                                {programs.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                             <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold">--</div>
                             <p className="text-xs text-muted-foreground">Active members</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                             <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold">--</div>
                             <p className="text-xs text-muted-foreground">Scheduled in next 30 days</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">Reports</CardTitle>
                             <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold">--</div>
                             <p className="text-xs text-muted-foreground">Pending items</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Management Actions */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-primary" />
                                Announcements
                             </CardTitle>
                             <CardDescription>Post updates for your team members</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button className="w-full" variant="secondary">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Announcement
                             </Button>
                        </CardContent>
                    </Card>

                    <Card>
                         <CardHeader>
                             <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                Event Management
                             </CardTitle>
                             <CardDescription>Schedule and manage program activities</CardDescription>
                         </CardHeader>
                        <CardContent>
                             <Button className="w-full" variant="secondary">
                                <Plus className="w-4 h-4 mr-2" />
                                Schedule Event
                             </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TeamLeaderDashboard;
