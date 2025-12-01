import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Check, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Program {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
}

const ProgramSelection = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchPrograms();
  }, [user, navigate]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);

      // Fetch all programs
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .order('name');

      if (programsError) throw programsError;

      // Fetch user's current program assignments
      const { data: rostersData, error: rostersError } = await supabase
        .from('rosters')
        .select('program_id')
        .eq('user_id', user?.id);

      if (rostersError) throw rostersError;

      setPrograms(programsData || []);
      setSelectedPrograms(new Set(rostersData?.map(r => r.program_id) || []));
    } catch (error: any) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Error",
        description: "Failed to load programs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProgram = (programId: string) => {
    const newSelected = new Set(selectedPrograms);
    if (newSelected.has(programId)) {
      newSelected.delete(programId);
    } else {
      newSelected.add(programId);
    }
    setSelectedPrograms(newSelected);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Get current assignments
      const { data: currentRosters, error: fetchError } = await supabase
        .from('rosters')
        .select('program_id')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching current rosters:', fetchError);
        throw fetchError;
      }

      const currentProgramIds = new Set(currentRosters?.map(r => r.program_id) || []);

      // Programs to add
      const toAdd = Array.from(selectedPrograms).filter(id => !currentProgramIds.has(id));
      
      // Programs to remove
      const toRemove = Array.from(currentProgramIds).filter(id => !selectedPrograms.has(id));

      // Add new programs
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('rosters')
          .insert(toAdd.map(program_id => ({
            user_id: user.id,
            program_id,
            is_team_leader: false
          })));

        if (insertError) {
          console.error('Error inserting rosters:', insertError);
          throw insertError;
        }
      }

      // Remove unselected programs
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('rosters')
          .delete()
          .eq('user_id', user.id)
          .in('program_id', toRemove);

        if (deleteError) {
          console.error('Error deleting rosters:', deleteError);
          throw deleteError;
        }
      }

      toast({
        title: "Success",
        description: "Your program selections have been saved."
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving programs:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save program selections.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navigation />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Select Your Programs</h1>
          <p className="text-muted-foreground">
            Choose the programs you'd like to be part of. You can update these selections at any time.
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          {programs.map((program) => {
            const isSelected = selectedPrograms.has(program.id);
            
            return (
              <Card 
                key={program.id}
                className={`border-2 transition-all cursor-pointer hover:shadow-lg ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
                onClick={() => handleToggleProgram(program.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => handleToggleProgram(program.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {program.name}
                        {isSelected && (
                          <Badge className="bg-primary text-primary-foreground">
                            <Check className="w-3 h-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </CardTitle>
                      {program.description && (
                        <CardDescription className="mt-2">
                          {program.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {program.website && (
                  <CardContent>
                    <a 
                      href={program.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Learn more →
                    </a>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || selectedPrograms.size === 0}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Selection
              </>
            )}
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProgramSelection;
