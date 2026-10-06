import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Calendar, Users, PlusCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Program {
  id: string;
  name: string;
  website: string;
  description: string;
}

const Programs = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      let query = supabase
        .from('programs')
        .select('*')
        .order('name');
      
      // Filter out System Admin for non-admins
      if (profile?.role !== 'admin_iii') {
           query = query.neq('name', 'System Admin');
      }

      const { data, error } = await query;

      if (error) throw error;
      setPrograms(data || []);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4">Our Programs</h1>
          <div className="w-24 h-1 bg-accent-gold mx-auto mb-6"></div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Discover the diverse range of academic competitions and programs that help our students 
            develop critical thinking, leadership skills, and excellence in their chosen fields.
          </p>
          
          {user && profile?.account_status === 'approved' && (
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => navigate('/select-programs')}
            >
              <PlusCircle className="w-5 h-5" />
              Manage My Programs
            </Button>
          )}
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading programs...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program) => (
              <Card key={program.id} className="h-full hover:shadow-lg transition-all duration-300 border-2 border-primary/10 hover:border-primary/30 cursor-pointer group">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-accent-gold transition-colors">
                      {program.name}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {program.description}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <a 
                      href={`/programs/${encodeURIComponent(program.name)}`}
                      className="inline-flex items-center text-primary hover:text-accent-gold transition-colors font-medium group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      View Program Details
                    </a>
                    <a 
                      href={program.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-accent-gold hover:text-primary transition-colors font-medium group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Official Website
                      <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Join a Program?</h2>
            <p className="text-lg mb-6">
              Each program offers unique opportunities for growth, learning, and competition. 
              Find the one that matches your interests and start your journey toward excellence.
            </p>
            <div className="text-accent-gold font-medium italic text-xl">
              "Egredere et vince" - Step forward and conquer
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Programs;