import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Users, ExternalLink, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Program {
  id: string;
  name: string;
  website: string;
  description: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  created_by: string;
}

interface RosterMember {
  id: string;
  position: string;
  joined_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const ProgramDetail = () => {
  const { programName } = useParams<{ programName: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [program, setProgram] = useState<Program | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    if (programName) {
      fetchProgramData(decodeURIComponent(programName));
    }
  }, [programName, user, profile]);

  const fetchProgramData = async (name: string) => {
    try {
      setLoading(true);

      // Fetch program details
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('name', name)
        .single();

      if (programError) throw programError;
      setProgram(programData);

      // Check if user can manage this program
      if (user && profile) {
        if (profile.role === 'admin_ii' || profile.role === 'admin_iii') {
          setCanManage(true);
        } else if (profile.role === 'admin_i') {
          const { data: assignment } = await supabase
            .from('admin_assignments')
            .select('id')
            .eq('admin_id', user.id)
            .eq('program_id', programData.id)
            .single();
          
          setCanManage(!!assignment);
        }
      }

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('program_id', programData.id)
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch roster
      const { data: rosterData, error: rosterError } = await supabase
        .from('rosters')
        .select(`
          id,
          position,
          joined_at,
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq('program_id', programData.id)
        .order('joined_at', { ascending: true });

      if (rosterError) throw rosterError;
      setRoster(rosterData || []);

    } catch (error: any) {
      console.error('Error fetching program data:', error);
      toast({
        title: "Error",
        description: "Program not found or failed to load program data.",
        variant: "destructive"
      });
      navigate('/programs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (firstName: string = '', lastName: string = '') => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading program details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">Program Not Found</h2>
            <p className="text-muted-foreground mb-4">The program you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/programs')}>
              Back to Programs
            </Button>
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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">{program.name}</h1>
              <p className="text-xl text-muted-foreground">{program.description}</p>
            </div>
            {canManage && (
              <Button onClick={() => navigate(`/admin/programs/${program.id}/manage`)}>
                Manage Program
              </Button>
            )}
          </div>
          
          <div className="flex gap-4">
            <a 
              href={program.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-accent-gold hover:text-primary transition-colors"
            >
              Visit Official Website
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="border-l-4 border-primary pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-primary">{event.title}</h4>
                            {event.description && (
                              <p className="text-muted-foreground text-sm mt-1">{event.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {formatDate(event.event_date)}
                              </div>
                              {event.location && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No upcoming events scheduled.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Roster */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Program Roster
                  <Badge variant="secondary" className="ml-2">
                    {roster.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {roster.length > 0 ? (
                  <div className="space-y-3">
                    {roster.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(member.profiles?.first_name, member.profiles?.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.profiles?.first_name} {member.profiles?.last_name}
                          </p>
                          {member.position && (
                            <p className="text-xs text-muted-foreground">{member.position}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No members in this program yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Program Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members:</span>
                  <Badge variant="secondary">{roster.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upcoming Events:</span>
                  <Badge variant="secondary">{events.length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProgramDetail;