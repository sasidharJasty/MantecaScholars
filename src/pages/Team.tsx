import { useEffect, useState } from 'react';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, ChevronDown, ChevronUp, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { defaultTeamPageContent, fetchSiteContent, isTeamPageContent, TeamMember } from '@/lib/siteContent';

const TeamMemberCard = ({ member }: { member: TeamMember }) => {
  const isCreator = member.name === 'Sasidhar Jasty';

  return (
    <div className="relative group hover:z-50 h-full">
        <Card className="h-full backdrop-blur-sm bg-card/80 border-primary/10 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-visible relative">
        <CardHeader className="pb-2">
            <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full transition-colors flex items-center justify-center bg-gradient-to-br from-primary to-primary/60 text-primary-foreground`}>
                {isCreator ? <Code className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                {member.name}
                {isCreator && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal tracking-wide bg-primary/10 text-primary hover:bg-primary/20">
                        Dev
                    </Badge>
                )}
                </CardTitle>
                <p className="text-sm font-medium text-primary">
                {member.title}
                </p>
            </div>
            </div>
        </CardHeader>
        <CardContent>
            {member.email && (
            <div className="my-2">
                <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                <Mail className="w-4 h-4" />
                {member.email}
                </a>
            </div>
            )}

            {/* Roles: Absolute positioned to avoid layout shift */}
            {member.roles && member.roles.length > 0 && (
            <div className="absolute left-0 right-0 top-[95%] pt-2 px-0 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
                <div className="bg-popover border border-primary/10 shadow-lg rounded-b-lg p-4 -mt-1 mx-[-1px]">
                    <div className="space-y-2">
                        {member.roles.map((role, idx) => (
                        <p key={idx} className="text-sm text-foreground bg-accent/50 p-2 rounded text-[13px] border-l-2 border-primary/30">
                            {role}
                        </p>
                        ))}
                    </div>
                </div>
            </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
};

const Team = () => {
  const [showMoreUndersecretary, setShowMoreUndersecretary] = useState(false);
  const [teamContent, setTeamContent] = useState(defaultTeamPageContent);

  useEffect(() => {
    let mounted = true;

    const loadTeamContent = async () => {
      const content = await fetchSiteContent('team_page', defaultTeamPageContent, isTeamPageContent);
      if (mounted) {
        setTeamContent(content);
      }
    };

    loadTeamContent();

    return () => {
      mounted = false;
    };
  }, []);

  const {
    boardMembers,
    programCoordinators,
    undersecretariat,
    undersecretariatHidden,
    undersecretariatWithSahithi,
    administrativeSupport,
  } = teamContent;

  const undersecretariatVisible = showMoreUndersecretary
    ? [...undersecretariat, ...undersecretariatWithSahithi, ...undersecretariatHidden]
    : [...undersecretariat, ...undersecretariatWithSahithi];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navigation />

      <main className="container mx-auto px-4 py-10">
        {/* Hero Section */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent mb-4">
            Our Team
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Meet the dedicated individuals who make Manteca Scholars possible. Our team works tirelessly to empower students through academic competition.
          </p>
        </div>

        <Tabs defaultValue="board" className="mb-12">
          <TabsList className="sticky top-3 z-30 w-full h-auto grid grid-cols-2 md:grid-cols-4 gap-2 p-2 bg-card/95 backdrop-blur border border-primary/10 rounded-xl mb-4">
            <TabsTrigger value="board" className="text-xs md:text-sm">Board ({boardMembers.length})</TabsTrigger>
            <TabsTrigger value="coordinators" className="text-xs md:text-sm">Coordinators ({programCoordinators.length})</TabsTrigger>
            <TabsTrigger value="undersecretariat" className="text-xs md:text-sm">Undersecretariat ({undersecretariatVisible.length})</TabsTrigger>
            <TabsTrigger value="support" className="text-xs md:text-sm">Support ({administrativeSupport.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <div className="h-7 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
                Board of Directors and Coordinators
              </h2>
              <ScrollArea className="h-[64vh] pr-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-3">
                  {boardMembers.map((member, idx) => (
                    <TeamMemberCard key={idx} member={member} />
                  ))}
                </div>
              </ScrollArea>
            </section>
          </TabsContent>

          <TabsContent value="coordinators">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <div className="h-7 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
                Program Coordinators
              </h2>
              <ScrollArea className="h-[64vh] pr-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-3">
                  {programCoordinators.map((member, idx) => (
                    <TeamMemberCard key={idx} member={member} />
                  ))}
                </div>
              </ScrollArea>
            </section>
          </TabsContent>

          <TabsContent value="undersecretariat">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <div className="h-7 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
                Undersecretariat
              </h2>
              <ScrollArea className="h-[60vh] pr-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-3">
                  {undersecretariatVisible.map((member, idx) => (
                    <TeamMemberCard key={idx} member={member} />
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-5 text-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowMoreUndersecretary(!showMoreUndersecretary)}
                  className="text-primary"
                >
                  {showMoreUndersecretary ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show More
                    </>
                  )}
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="support">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <div className="h-7 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
                Administrative Support
              </h2>
              <ScrollArea className="h-[64vh] pr-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-3">
                  {administrativeSupport.map((member, idx) => (
                    <TeamMemberCard key={idx} member={member} />
                  ))}
                </div>
              </ScrollArea>
            </section>
          </TabsContent>
        </Tabs>

        {/* Join CTA */}
        <section className="text-center py-16 bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl">
          <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're always looking for passionate individuals to help guide our scholars to success. 
            Whether as a mentor, volunteer, or supporter, your contribution makes a difference.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
            <a href="/contact">Get Involved</a>
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Team;
