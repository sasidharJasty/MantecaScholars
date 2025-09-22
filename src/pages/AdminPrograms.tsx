import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Edit, ExternalLink, Users, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Program {
  id: string;
  name: string;
  website: string;
  description: string;
  created_at: string;
}

interface ProgramStats {
  [key: string]: {
    members: number;
    events: number;
  };
}

const AdminPrograms = () => {
  const { user, profile, loading, canManagePrograms } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [stats, setStats] = useState<ProgramStats>({});
  const [loadingData, setLoadingData] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    description: ''
  });

  useEffect(() => {
    if (!loading && (!user || !canManagePrograms())) {
      toast({
        title: "Access Denied",
        description: "You need Admin Level II or III privileges to access this page.",
        variant: "destructive"
      });
      navigate('/admin');
      return;
    }

    if (user && profile && canManagePrograms()) {
      fetchPrograms();
    }
  }, [user, profile, loading, navigate, canManagePrograms]);

  const fetchPrograms = async () => {
    try {
      setLoadingData(true);
      
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .order('name');

      if (programsError) throw programsError;
      setPrograms(programsData || []);

      // Fetch stats for each program
      const statsData: ProgramStats = {};
      
      for (const program of programsData || []) {
        // Get member count
        const { count: memberCount } = await supabase
          .from('rosters')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', program.id);

        // Get event count
        const { count: eventCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', program.id);

        statsData[program.id] = {
          members: memberCount || 0,
          events: eventCount || 0
        };
      }
      
      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Error",
        description: "Failed to load programs.",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddProgram = async () => {
    if (!formData.name || !formData.website) {
      toast({
        title: "Validation Error",
        description: "Name and website are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('programs')
        .insert({
          name: formData.name,
          website: formData.website,
          description: formData.description
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Program added successfully."
      });

      setIsAddDialogOpen(false);
      setFormData({ name: '', website: '', description: '' });
      fetchPrograms();
    } catch (error: any) {
      console.error('Error adding program:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add program.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProgram = async () => {
    if (!editingProgram || !formData.name || !formData.website) {
      toast({
        title: "Validation Error",
        description: "Name and website are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('programs')
        .update({
          name: formData.name,
          website: formData.website,
          description: formData.description
        })
        .eq('id', editingProgram.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Program updated successfully."
      });

      setEditingProgram(null);
      setFormData({ name: '', website: '', description: '' });
      fetchPrograms();
    } catch (error: any) {
      console.error('Error updating program:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update program.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProgram = async (programId: string, programName: string) => {
    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${programName} has been deleted along with all associated data.`
      });

      fetchPrograms();
    } catch (error: any) {
      console.error('Error deleting program:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete program.",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      website: program.website,
      description: program.description
    });
  };

  const resetForm = () => {
    setFormData({ name: '', website: '', description: '' });
    setEditingProgram(null);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading programs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Manage Programs</h1>
            <p className="text-muted-foreground">
              Add, edit, and remove programs from the system.
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Program
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Program</DialogTitle>
                <DialogDescription>
                  Create a new academic program. This will automatically create rosters and schedules.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Program Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., World Scholars Cup"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="website">Official Website *</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the program..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleAddProgram}>Add Program</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <Card key={program.id} className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{program.name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {stats[program.id]?.members || 0} members
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {stats[program.id]?.events || 0} events
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {program.description}
                </p>
                
                <div className="flex flex-col gap-2">
                  <a
                    href={program.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-accent-gold hover:text-primary transition-colors"
                  >
                    Visit Website
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                  
                  <div className="flex gap-2 mt-2">
                    <Dialog open={editingProgram?.id === program.id} onOpenChange={(open) => {
                      if (!open) setEditingProgram(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(program)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Program</DialogTitle>
                          <DialogDescription>
                            Update the program details.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-name">Program Name *</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-website">Official Website *</Label>
                            <Input
                              id="edit-website"
                              type="url"
                              value={formData.website}
                              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {
                            setEditingProgram(null);
                            resetForm();
                          }}>
                            Cancel
                          </Button>
                          <Button onClick={handleUpdateProgram}>Update Program</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Program</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{program.name}"? This will permanently remove:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>The program from the public website</li>
                              <li>All member rosters ({stats[program.id]?.members || 0} members)</li>
                              <li>All scheduled events ({stats[program.id]?.events || 0} events)</li>
                              <li>All admin assignments for this program</li>
                            </ul>
                            <p className="mt-2 font-semibold text-destructive">
                              This action cannot be undone.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProgram(program.id, program.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Program
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {programs.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No programs found</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first program.</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Program
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminPrograms;