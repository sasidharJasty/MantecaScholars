import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Calendar, Settings, Shield, Database, 
  MessageCircle, Bell, Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import DirectMessages from '@/components/chat/DirectMessages';
import ProgramChat from '@/components/chat/ProgramChat';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Program {
  id: string;
  name: string;
  member_count: number;
  event_count: number;
}

const AdminIDashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin_i')) {
      toast({
        title: "Access Denied",
        description: "You need Admin I privileges to access this page.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (user && profile?.role === 'admin_i') {
      fetchAssignedPrograms();
    }
  }, [user, profile, loading, navigate]);

  const fetchAssignedPrograms = async () => {
    try {
      setLoadingPrograms(true);

      // Get programs assigned to this admin
      const { data: assignments, error } = await supabase
        .from('admin_assignments')
        .select(`
          program_id,
          programs:program_id (
            id,
            name
          )
        `)
        .eq('admin_id', user?.id);

      if (error) throw error;

      const programIds = assignments?.map(a => a.program_id) || [];

      // Get member counts and event counts for each program
      const programsWithStats = await Promise.all(
        (assignments || []).map(async (a: any) => {
          const [rosterCount, eventCount] = await Promise.all([
            supabase
              .from('rosters')
              .select('*', { count: 'exact', head: true })
              .eq('program_id', a.program_id),
            supabase
              .from('events')
              .select('*', { count: 'exact', head: true })
              .eq('program_id', a.program_id)
          ]);

          return {
            id: a.programs?.id,
            name: a.programs?.name || 'Unknown',
            member_count: rosterCount.count || 0,
            event_count: eventCount.count || 0
          };
        })
      );

      setPrograms(programsWithStats);
      if (programsWithStats.length > 0) {
        setSelectedProgram(programsWithStats[0]);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Error",
        description: "Failed to load assigned programs.",
        variant: "destructive"
      });
    } finally {
      setLoadingPrograms(false);
    }
  };

  if (loading || loadingPrograms) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <Database className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Programs Assigned</h2>
          <p className="text-muted-foreground">Contact a board member to get assigned to programs.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Header */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-primary/5 rounded-3xl blur-3xl -z-10"></div>
          <div className="relative bg-card/50 backdrop-blur-sm rounded-3xl p-8 border border-yellow-500/20 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-500 via-primary to-primary/60 bg-clip-text text-transparent mb-3">
                  Program Coordinator
                </h1>
                <p className="text-lg text-muted-foreground">
                  Managing {programs.length} program{programs.length > 1 ? 's' : ''} • <span className="font-semibold text-foreground">{profile?.first_name} {profile?.last_name}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Select
                  value={selectedProgram?.id}
                  onValueChange={(value) => setSelectedProgram(programs.find(p => p.id === value) || null)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge className="bg-yellow-500 text-white px-4 py-2 text-base shadow-lg">
                  <Shield className="w-5 h-5 mr-2" />
                  Admin Level I
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {selectedProgram && (
          <>
            {/* Stats for Selected Program */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Current Program</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{selectedProgram.name}</div>
                </CardContent>
              </Card>

              <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedProgram.member_count}</div>
                </CardContent>
              </Card>

              <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedProgram.event_count}</div>
                </CardContent>
              </Card>

              <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    My Programs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{programs.length}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="management" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="management">Program Management</TabsTrigger>
                <TabsTrigger value="chat">Program Chat</TabsTrigger>
                <TabsTrigger value="messages">Direct Messages</TabsTrigger>
              </TabsList>

              <TabsContent value="management" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="hover:shadow-2xl hover:shadow-primary/20 transition-all cursor-pointer group hover:-translate-y-1" onClick={() => navigate('/admin/my-programs')}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 group-hover:text-primary">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        Manage Roster
                      </CardTitle>
                      <CardDescription>View and manage program members</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">View Members</Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        Schedule Event
                      </CardTitle>
                      <CardDescription>Create new events for your program</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        New Event
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Bell className="w-5 h-5 text-primary" />
                        </div>
                        Post Announcement
                      </CardTitle>
                      <CardDescription>Send announcements to program members</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        New Announcement
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="chat">
                <ProgramChat 
                  programId={selectedProgram.id} 
                  programName={selectedProgram.name}
                  canModerate={true}
                />
              </TabsContent>

              <TabsContent value="messages">
                <DirectMessages />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminIDashboard;
